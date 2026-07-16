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
    # 중앙화: import_locations 모듈을 사용해 시드 작업을 위임
    db = SessionLocal()
    try:
        if db.query(models.Location).first():
            return
    finally:
        db.close()

    # import inside function to avoid circular import on module load
    try:
        import importlib
        if __package__:
            importlib.import_module(f"{__package__}.import_locations").main()
        else:
            import import_locations
            import_locations.main()
    except Exception as e:
        print(f"seed via import_locations failed: {e}")



app = FastAPI(title="LocalHub REST API Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def _on_startup_seed():
    try:
        _seed_attractions_from_json()
    except Exception as e:
        print(f"seed_on_startup failed: {e}")

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
        raise HTTPException(status_code=404, detail="장소를 찾을 수 없습니다.")
    return attraction

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None

@app.post("/api/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    import math
    import re

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return {
            "reply": "OPENAI_API_KEY가 설정되지 않았습니다.",
            "sources": []
        }

    SUBWAY_STATIONS = {
        "홍대입구": (37.5571, 126.9236),
        "강남": (37.4979, 127.0276),
        "잠실": (37.5133, 127.1001),
        "명동": (37.5609, 126.9863),
        "서울역": (37.5546, 126.9706),
        "여의도": (37.5216, 126.9242),
        "신촌": (37.5552, 126.9369),
        "종로3가": (37.5716, 126.9918),
        "이태원": (37.5344, 126.9943),
        "동대문": (37.5718, 127.0111),
        "혜화": (37.5822, 127.0018),
        "안국": (37.5765, 126.9854),
        "시청": (37.5657, 126.9769),
        "건대입구": (37.5404, 127.0692),
        "성수": (37.5446, 127.0559),
        "삼성": (37.5088, 127.0631),
        "신도림": (37.5089, 126.8913),
        "고속터미널": (37.5045, 127.0049),
        "잠실새내": (37.5116, 127.0861),
        "용산": (37.5298, 126.9648),
        "합정": (37.5494, 126.9138),
        "망원": (37.5560, 126.9015),
        "상수": (37.5477, 126.9229),
        "광화문": (37.5715, 126.9764),
        "경복궁": (37.5758, 126.9736),
        "서대문": (37.5658, 126.9666),
        "충정로": (37.5599, 126.9637),
        "을지로입구": (37.5660, 126.9826),
        "을지로3가": (37.5663, 126.9910),
        "을지로4가": (37.5666, 126.9980),
        "동대문역사문화공원": (37.5651, 127.0079),
        "사당": (37.4765, 126.9816),
        "교대": (37.4934, 127.0141),
        "양재": (37.4841, 127.0346),
        "압구정": (37.5271, 127.0284),
        "신사": (37.5164, 127.0204),
        "청담": (37.5191, 127.0527),
        "학동": (37.5144, 127.0368),
        "역삼": (37.5006, 127.0365),
        "선릉": (37.5045, 127.0490),
        "한티": (37.4962, 127.0529),
        "도곡": (37.4910, 127.0555),
        "대치": (37.4946, 127.0632),
        "수서": (37.4874, 127.1014),
        "가락시장": (37.4929, 127.1183),
        "오금": (37.5031, 127.1281),
        "올림픽공원": (37.5161, 127.1309),
        "천호": (37.5386, 127.1234),
        "강동": (37.5358, 127.1321),
        "길동": (37.5378, 127.1402),
        "굽은다리": (37.5455, 127.1429),
        "명일": (37.5513, 127.1447),
        "고덕": (37.5550, 127.1541),
        "상일동": (37.5562, 127.1670),
        "방이": (37.5086, 127.1264),
        "개롱": (37.4981, 127.1348),
        "거여": (37.4931, 127.1438),
        "마천": (37.4975, 127.1499),
        "석촌": (37.5054, 127.1070),
        "송파": (37.4997, 127.1121),
        "문정": (37.4859, 127.1225),
        "장지": (37.4787, 127.1263),
        "복정": (37.4700, 127.1267),
        "태릉입구": (37.6180, 127.0751),
        "석계": (37.6154, 127.0655),
        "신내": (37.6129, 127.1032),
        "상봉": (37.5956, 127.0852),
        "망우": (37.5995, 127.0919),
        "양원": (37.6067, 127.1079),
        "구리": (37.6034, 127.1438),
        "도농": (37.6087, 127.1648),
        "양정": (37.6053, 127.2023),
        "덕소": (37.5852, 127.2082),
        "도심": (37.5794, 127.2185),
        "팔당": (37.5473, 127.2437),
        "운길산": (37.5548, 127.3102),
        "양수": (37.5463, 127.3242),
        "신원": (37.5255, 127.3739),
        "국수": (37.5160, 127.3990),
        "아신": (37.5137, 127.4475),
        "오빈": (37.5064, 127.4795),
        "양평": (37.4929, 127.4918),
        "원덕": (37.4705, 127.5230),
        "용문": (37.4820, 127.5929),
        "지평": (37.4646, 127.6293),
        "아차산": (37.5458, 127.0797),
        "군자": (37.5573, 127.0700),
        "장한평": (37.5614, 127.0647),
        "답십리": (37.5667, 127.0527),
        "마장": (37.5661, 127.0429),
        "왕십리": (37.5615, 127.0382),
        "행당": (37.5573, 127.0294),
        "신금호": (37.5545, 127.0203),
        "청구": (37.5574, 127.0135),
        "약수": (37.5543, 127.0108),
        "금호": (37.5484, 127.0157),
        "옥수": (37.5417, 127.0177),
        "응봉": (37.5501, 127.0345),
        "한남": (37.5292, 127.0093),
        "서빙고": (37.5197, 126.9885),
        "이촌": (37.5222, 126.9735),
        "효창공원앞": (37.5392, 126.9613),
        "공덕": (37.5432, 126.9515),
        "애오개": (37.5537, 126.9566),
    }

    def haversine_distance(lat1, lon1, lat2, lon2):
        r = 6371.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2.0) ** 2
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return r * c

    query_text = req.message

    # 장소/관광지 정보 탐색을 요청하는 질문인지 의도 판단
    intent_keywords = [
        "추천", "가볼", "갈만한", "놀거리", "볼거리", "명소", "맛집", "관광", "어디", "위치", 
        "코스", "갈래", "찾아", "가고", "안내", "정보", "소개", "근처", "주변", "역", "구", "동"
    ]
    
    is_location_query = False
    
    # 1. 지하철역 감지 시도
    station_match = re.search(r'([가-힣a-zA-Z0-9]+)역', query_text)
    detected_station = None
    if station_match:
        detected_station = station_match.group(1)
        is_location_query = True
    else:
        for key in SUBWAY_STATIONS.keys():
            if key in query_text:
                detected_station = key
                is_location_query = True
                break

    # 2. 자치구 감지 시도
    gu_match = re.search(r'([가-힣]+구)', query_text)
    if gu_match:
        is_location_query = True

    # 3. 장소 탐색 관련 의도 키워드 검사
    if not is_location_query:
        for keyword in intent_keywords:
            if keyword in query_text:
                is_location_query = True
                break

    station_coords = None
    if detected_station:
        clean_name = detected_station.replace("역", "")
        if clean_name in SUBWAY_STATIONS:
            station_coords = SUBWAY_STATIONS[clean_name]
        else:
            for key, coords in SUBWAY_STATIONS.items():
                if key in clean_name or clean_name in key:
                    station_coords = coords
                    break

    # --- 카테고리 키워드 감지 및 우선 카테고리 설정 ---
    preferred_category = None
    category_keywords = {
        "레포츠": "레포츠",
        "레저": "레포츠",
        "운동": "레포츠",
        "헬스": "레포츠",
        "헬스장": "레포츠",
        "필라테스": "레포츠",
        "요가": "레포츠",
        "수영": "레포츠",
        "클라이밍": "레포츠",
        "쇼핑": "쇼핑",
        "숙박": "숙박",
        "호텔": "숙박",
        "문화": "문화시설",
        "문화시설": "문화시설",
        "축제": "축제공연행사",
        "공연": "축제공연행사",
        "행사": "축제공연행사",
        "여행코스": "여행코스",
        "코스": "여행코스"
    }
    for k, v in category_keywords.items():
        if k in query_text:
            preferred_category = v
            is_location_query = True
            break
    # ----------------------------------------------------

    matched_locations = []

    # 장소/관광지 정보 탐색 의도가 있는 경우에만 DB 조회 진행
    if is_location_query:
        if station_coords:
            station_lat, station_lng = station_coords
            all_q = db.query(models.Location)
            if preferred_category:
                all_q = all_q.filter(models.Location.category == preferred_category)
            all_locations = all_q.all()

            # 점점 반경을 넓혀서 근처 장소를 찾음(1.5km -> 3km -> 5km)
            radii = [1.5, 3.0, 5.0]
            found = False
            for radius in radii:
                matched_locations = []
                for loc in all_locations:
                    try:
                        loc_lat = float(loc.mapy)
                        loc_lng = float(loc.mapx)
                        dist = haversine_distance(station_lat, station_lng, loc_lat, loc_lng)
                        if dist <= radius:
                            matched_locations.append((loc, dist))
                    except (ValueError, TypeError):
                        continue
                if matched_locations:
                    matched_locations.sort(key=lambda x: x[1])
                    matched_locations = [x[0] for x in matched_locations[:3]]
                    found = True
                    break

            # 반경 내에 아무것도 없으면 matched_locations는 빈 상태
            # (후속 로직에서 gu/keyword 기반 검색으로 넘어감)
            # 만약 반경 내에 없고 preferred_category가 지정된 상태라면
            # 1) 역 이름이 주소에 포함된 레코드를 우선 찾아보고
            # 2) 그래도 없으면 같은 카테고리에서 임의로 상위 3개를 반환
            if not found and preferred_category and detected_station:
                try:
                    station_word = detected_station.replace("역", "")
                    station_q = db.query(models.Location).filter(models.Location.category == preferred_category).filter(
                        or_(
                            models.Location.address.like(f"%{station_word}%"),
                            models.Location.gu_name.like(f"%{station_word}%")
                        )
                    ).limit(3)
                    matched_locations = station_q.all()
                    if matched_locations:
                        # matched_locations currently are Location objects
                        found = True
                    else:
                        # 마지막 수단: 카테고리 내 상위 3개(좌표 무관)
                        matched_locations = db.query(models.Location).filter(models.Location.category == preferred_category).limit(3).all()
                        if matched_locations:
                            found = True
                except Exception:
                    pass

        if not matched_locations:
            if gu_match:
                gu_keyword = gu_match.group(1)
                matched_q = db.query(models.Location).filter(
                    models.Location.gu_name.like(f"%{gu_keyword}%")
                )
                if preferred_category:
                    matched_q = matched_q.filter(models.Location.category == preferred_category)
                matched_locations = matched_q.limit(3).all()

            if not matched_locations:
                words = [w for w in re.sub(r'[^\w\s]', '', query_text).split() if len(w) >= 2]
                exclude_words = [
                    '서울', '서울특별시', '관광지', '여행', '코스', '근처', '주변', 
                    '알려', '추천', '가볼', '곳은', '정보', '어디', '있어', '하고', 
                    '가장', '좋은', '추천해줘', '알려줘'
                ]
                search_words = [w for w in words if w not in exclude_words]
                if search_words:
                    filters = []
                    for w in search_words:
                        filters.append(models.Location.name.like(f"%{w}%"))
                        filters.append(models.Location.address.like(f"%{w}%"))
                    search_q = db.query(models.Location).filter(or_(*filters))
                    if preferred_category:
                        search_q = search_q.filter(models.Location.category == preferred_category)
                    matched_locations = search_q.limit(3).all()

    context_parts = []
    sources = []
    for loc in matched_locations:
        # 설명에서 이미지 URL이나 '장소 이미지(참고):' 같은 메타 문구 제거
        desc_raw = loc.description or ""
        try:
            # re is available in this scope (imported earlier in chat)
            desc = re.sub(r"장소 이미지\(참고\):\s*", "", desc_raw)
            desc = re.sub(r"https?://\S+", "", desc)
            desc = desc.strip()
        except Exception:
            desc = desc_raw

        context_parts.append(
            f"- 장소명: {loc.name}\n"
            f"  카테고리: {loc.category or '기타'}\n"
            f"  주소: {loc.address or ''}\n"
            f"  설명: {desc}"
        )
        sources.append({
            "contentid": loc.content_id,
            "title": loc.name,
            "category": loc.category,
            "address": loc.address
        })

    context_text = "\n\n".join(context_parts) if context_parts else "조회된 데이터베이스 내 장소 정보가 없습니다."

    system_prompt = (
        "당신은 LocalHub의 서울 관광 안내 인공지능 비서입니다.\n\n"
        "지침:\n"
        "1. 사용자가 '안녕', '고마워' 등 일상적인 인사나 잡담을 시도하는 경우, 아래의 장소 데이터베이스를 참고하지 말고 자연스럽고 친절한 대화형 일상 답변만 해 주세요. "
        "억지로 장소를 추천하거나 '연관 추천 정보'를 덧붙여서는 절대 안 됩니다.\n"
        "2. 사용자가 특정 지하철역, 자치구, 혹은 가볼 만한 관광 명소 등에 대해 질문한 경우에만, 아래 제공되는 [조회된 실제 장소 정보]를 바탕으로 추천 답변을 작성해 주세요.\n"
        "3. 장소 추천 시에는 제공된 [조회된 실제 장소 정보]의 장소명, 주소, 설명을 활용해 사실에 맞고 성실하게 설명해 주세요.\n"
        "4. 사용자가 질의한 지하철역(또는 지역)에서 가까운 장소를 위주로 추천하고, 거리나 교통 등을 알기 쉽게 설명해 주세요.\n"
        "5. 장소 추천 답변의 마지막 부분에는 반드시 제공된 [조회된 실제 장소 정보](최대 3개)만을 기반으로 하여 '연관 추천 정보' 섹션을 작성하고 장소명과 주소를 깔끔하게 정리해 주세요. 제공되지 않은 가상의 장소를 임의로 지어내어 추천해서는 절대 안 됩니다. 조회된 실제 정보가 없거나 일상 대화인 경우에는 이 섹션을 반드시 완전히 생략하세요.\n"
        "6. 모든 답변은 친절하고 정중한 한국어로 작성하세요.\n\n"
        f"[조회된 실제 장소 정보]\n{context_text}"
    )

    messages = [{"role": "system", "content": system_prompt}]

    for msg in req.history or []:
        role = "assistant" if msg.get("role") in {"assistant", "model"} else "user"
        content = msg.get("text", "") or msg.get("content", "")
        messages.append({
            "role": role,
            "content": content
        })

    messages.append({
        "role": "user",
        "content": req.message
    })

    from fastapi.responses import StreamingResponse

    payload = {
        "model": "gpt-5-mini",
        "messages": messages,
        "stream": True
    }

    url = "https://api.openai.com/v1/chat/completions"
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    def event_generator():
        try:
            request = urllib.request.Request(
                url,
                data=data,
                headers=headers,
                method="POST"
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                buffer = b""
                while True:
                    chunk = response.read(1024)
                    if not chunk:
                        break
                    buffer += chunk
                    while b"\n" in buffer:
                        line, buffer = buffer.split(b"\n", 1)
                        line_str = line.decode("utf-8").strip()
                        if not line_str:
                            continue
                        if line_str.startswith("data:"):
                            data_content = line_str[5:].strip()
                            if data_content == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_content)
                                delta = data_json.get("choices", [{}])[0].get("delta", {})
                                text_chunk = delta.get("content", "")
                                if text_chunk:
                                    yield f"data: {json.dumps({'text': text_chunk})}\n\n"
                            except Exception:
                                continue
            yield f"data: {json.dumps({'sources': sources})}\n\n"
        except urllib.error.HTTPError as e:
            try:
                error_body = e.read().decode("utf-8")
                yield f"data: {json.dumps({'error': f'HTTP Error {e.code}: {error_body}'})}\n\n"
            except Exception:
                yield f"data: {json.dumps({'error': f'HTTP Error {e.code}: {e.reason}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': f'AI 응답 실패: {e}'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

