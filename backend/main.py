import os
import json
import urllib.request
import urllib.error
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from dotenv import load_dotenv
from pydantic import BaseModel

import models, schemas
from database import engine, get_db, SessionLocal

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

models.Base.metadata.create_all(bind=engine)

def _extract_gu_name(addr: str) -> Optional[str]:
    if not addr:
        return None
    parts = addr.split()
    for part in parts:
        if part.endswith("구"):
            return part
    return None

def _seed_attractions_from_json():
    db = SessionLocal()
    try:
        if db.query(models.Location).first():
            return

        json_path = os.path.join(
            os.path.dirname(__file__),
            "..",
            "ssafy_frontend",
            "public",
            "data",
            "서울_관광지.json"
        )

        if not os.path.exists(json_path):
            return

        with open(json_path, encoding="utf-8") as f:
            payload = json.load(f)

        for item in payload.get("items", []):
            db.add(models.Location(
                content_id=str(item.get("contentid", "")),
                name=item.get("title", ""),
                category="관광지",
                gu_name=_extract_gu_name(item.get("addr1", "")),
                address=item.get("addr1", ""),
                mapx=item.get("mapx", ""),
                mapy=item.get("mapy", ""),
                description=item.get("firstimage2", "")
            ))

        db.commit()
    finally:
        db.close()

_seed_attractions_from_json()

app = FastAPI(title="LocalHub REST API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/posts", response_model=schemas.PostDetailResponse, status_code=status.HTTP_201_CREATED)
def create_post(post: schemas.PostCreate, db: Session = Depends(get_db)):
    db_post = models.Post(
        title=post.title,
        content=post.content,
        password=post.password
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@app.get("/api/posts", response_model=List[schemas.PostListResponse])
def read_posts(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.id.desc()).offset(skip).limit(limit).all()
    result = []
    for p in posts:
        p.comment_count = len(p.comments)
        result.append(p)
    return result

@app.get("/api/posts/{post_id}", response_model=schemas.PostDetailResponse)
def read_post(post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    db_post.views += 1
    db.commit()
    db.refresh(db_post)
    return db_post

@app.post("/api/comments", response_model=schemas.CommentResponse, status_code=status.HTTP_201_CREATED, tags=["Comments"])
def create_comment(comment: schemas.CommentCreate, post_id: int, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")

    db_comment = models.Comment(
        post_id=post_id,
        content=comment.content,
        password=comment.password
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    return db_comment

@app.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Comments"])
def delete_comment(comment_id: int, request: schemas.PostDeleteRequest, db: Session = Depends(get_db)):
    db_comment = db.query(models.Comment).filter(models.Comment.id == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
    if db_comment.password != request.password:
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    db.delete(db_comment)
    db.commit()
    return

@app.get("/api/attractions", response_model=List[schemas.AttractionListResponse])
def read_attractions(
    keyword: Optional[str] = None,
    gu: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(models.Location)

    if keyword:
        kw = f"%{keyword}%"
        query = query.filter(
            or_(
                models.Location.name.like(kw),
                models.Location.address.like(kw),
                models.Location.description.like(kw),
            )
        )

    if gu:
        query = query.filter(models.Location.gu_name == gu)

    if category:
        query = query.filter(models.Location.category == category)

    attractions = query.order_by(models.Location.id.asc()).offset(skip).limit(limit).all()
    return attractions

@app.get("/api/attractions/{attraction_id}", response_model=schemas.AttractionDetailResponse)
def read_attraction(attraction_id: int, db: Session = Depends(get_db)):
    attraction = db.query(models.Location).filter(models.Location.id == attraction_id).first()
    if not attraction:
        raise HTTPException(status_code=404, detail="관광지를 찾을 수 없습니다.")
    return attraction

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

@app.post("/api/chat")
def chat(req: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return {
            "reply": "GEMINI_API_KEY가 설정되지 않았습니다.",
            "sources": []
        }

    contents = []

    for msg in req.history or []:
        role = "model" if msg.get("role") in {"assistant", "model"} else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg.get("text", "")}]
        })

    contents.append({
        "role": "user",
        "parts": [{"text": req.message}]
    })

    payload = {
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 8000
        }
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    data = json.dumps(payload).encode("utf-8")

    try:
        request = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))

        text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        return {
            "reply": text or "응답을 생성하지 못했습니다.",
            "sources": []
        }

    except Exception as e:
        return {
            "reply": f"AI 응답 실패: {e}",
            "sources": []
        }