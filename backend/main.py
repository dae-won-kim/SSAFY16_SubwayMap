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

def _get_weather_info(city: str = "서울") -> str:
    try:
        city_map = {
            "서울": {"lat": 37.5665, "lon": 126.9780},
            "부산": {"lat": 35.1796, "lon": 129.0756},
            "대구": {"lat": 35.8714, "lon": 128.6014},
            "인천": {"lat": 37.4563, "lon": 126.7052},
            "광주": {"lat": 35.1595, "lon": 126.8526},
            "대전": {"lat": 36.3504, "lon": 127.3845},
            "울산": {"lat": 35.5384, "lon": 129.3114},
            "제주": {"lat": 33.4996, "lon": 126.5312},
        }

        coords = city_map.get(city, city_map["서울"])
        lat = coords["lat"]
        lon = coords["lon"]

        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,weather_code,precipitation_probability"
            f"&timezone=Asia%2FSeoul"
        )

        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))

        current = data.get("current", {})
        temp = current.get("temperature_2m")
        precipitation = current.get("precipitation_probability")
        weather_code = current.get("weather_code")

        weather_text = _weather_code_to_text(weather_code)
        return (
            f"{city} 현재 날씨: {weather_text}, "
            f"기온 {temp}°C, 강수 확률 {precipitation}%"
        )
    except Exception:
        return f"{city}의 날씨 정보를 가져오지 못했습니다."
    
def _weather_code_to_text(code):
    weather_map = {
        0: "맑음",
        1: "대체로 맑음",
        2: "부분적으로 흐림",
        3: "흐림",
        45: "안개",
        48: "서리 안개",
        51: "가벼운 이슬비",
        53: "보통 이슬비",
        55: "강한 이슬비",
        61: "가벼운 비",
        63: "보통 비",
        65: "강한 비",
        71: "가벼운 눈",
        73: "보통 눈",
        75: "강한 눈",
        80: "소나기",
        81: "강한 소나기",
        82: "매우 강한 소나기",
        95: "천둥번개",
        96: "천둥번개/우박",
        99: "강한 우박",
    }
    return weather_map.get(code, "알 수 없음")

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

@app.put("/api/posts/{post_id}", response_model=schemas.PostDetailResponse)
def update_post(post_id: int, post: schemas.PostUpdate, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if db_post.password != post.password:
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    db_post.title = post.title
    db_post.content = post.content
    db.commit()
    db.refresh(db_post)
    return db_post

@app.delete("/api/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, request: schemas.PostDeleteRequest, db: Session = Depends(get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if db_post.password != request.password:
        raise HTTPException(status_code=403, detail="비밀번호가 일치하지 않습니다.")

    db.delete(db_post)
    db.commit()
    return

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

    # 1. 사용자의 질문에서 도시와 날씨 키워드 분석
    user_message = req.message
    weather_context = ""
    
    # 간단한 키워드 매칭 방식 (서울, 부산 등 도시가 언급되고 날씨를 물어볼 때)
    cities = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "제주"]
    target_city = None
    
    for city in cities:
        if city in user_message:
            target_city = city
            break
            
    # 도시가 언급되지 않았더라도 "날씨"를 물어보면 기본값인 "서울"로 설정
    if "날씨" in user_message or "비" in user_message or "눈" in user_message or "기온" in user_message:
        if not target_city:
            target_city = "서울"  # 기본값
            
        # 2. 날씨 정보 조회 실행
        weather_context = _get_weather_info(target_city)

    # 3. Gemini 전송용 메시지 구성
    contents = []

    # 이전 대화 기록(History) 추가
    for msg in req.history or []:
        role = "model" if msg.get("role") in {"assistant", "model"} else "user"
        contents.append({
            "role": role,
            "parts": [{"text": msg.get("text", "")}]
        })

    # 날씨 정보가 조회되었다면, 기상 상황을 분석하여 실내/실외 추천 가이드라인을 동적으로 주입
    final_user_text = user_message
    if weather_context:
        final_user_text = (
            f"[시스템 참고 정보: 실시간 날씨 및 기상 상황]\n"
            f"{weather_context}\n\n"
            f"[AI 행동 지침 (기상 맞춤형 장소 추천)]\n"
            f"1. 위 제공된 실시간 날씨(기온, 강수 확률, 날씨 상태)를 면밀히 분석하세요.\n"
            f"2. 날씨 상태에 맞는 최적의 관광 활동을 제안하세요:\n"
            f"   - 비, 눈이 오거나 강수 확률이 높거나, 혹한/폭염인 경우: 미술관, 박물관, 복합 쇼핑몰, 실내 카페 등 '쾌적한 실내 장소' 위주로 추천 목록과 동선을 제안하세요.\n"
            f"   - 날씨가 맑고 온화하며 선선한 경우: 공원, 고궁, 루프탑, 야외 거리, 하이킹 경로 등 '실외 야외 활동'을 적극 권장하세요.\n"
            f"3. 추천할 때는 '오늘 서울 날씨가 흐리고 비가 오고 있으니 실내 데이트 코스를 추천해 드릴게요!'와 같이 오늘 날씨를 친절하게 언급하며 이유를 설명하세요.\n"
            f"4. 사용자가 특정 자치구(예: 마포구, 강남구 등)를 지정해 질문했다면, 해당 지역 내의 장소들을 우선적으로 연상하여 추천해 주세요.\n\n"
            f"사용자 질문: {user_message}"
        )

    # 최종 질문 추가
    contents.append({
        "role": "user",
        "parts": [{"text": final_user_text}]
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