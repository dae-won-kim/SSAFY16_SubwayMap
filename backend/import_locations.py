import os
import json

from sqlalchemy.orm import Session
import models
from database import SessionLocal

def extract_gu_name(addr: str):
    if not addr:
        return None
    for part in addr.split():
        if part.endswith("구"):
            return part
    return None

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def import_file(db: Session, json_path: str, category: str):
    payload = load_json(json_path)
    items = payload.get("items", [])
    inserted = 0

    for item in items:
        content_id = str(item.get("contentid", "")).strip()
        if not content_id:
            continue

        # 중복 방지
        exists = db.query(models.Location).filter_by(
            content_id=content_id,
            category=category
        ).first()
        if exists:
            continue

        address = item.get("addr1") or item.get("addr2") or ""
        description = item.get("firstimage2") or item.get("firstimage") or ""
        db.add(models.Location(
            content_id=content_id,
            name=item.get("title", ""),
            category=category,
            gu_name=extract_gu_name(item.get("addr1", "") or item.get("addr2", "")),
            address=address,
            mapx=item.get("mapx", ""),
            mapy=item.get("mapy", ""),
            description=description
        ))
        inserted += 1

    db.commit()
    return inserted

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base, "..", "ssafy_frontend", "public", "data")

    files = {
        "서울_관광지.json": "관광지",
        "서울_레포츠.json": "레포츠",
        "서울_문화시설.json": "문화시설",
        "서울_쇼핑.json": "쇼핑",
        "서울_숙박.json": "숙박",
        "서울_여행코스.json": "여행코스",
        "서울_축제공연행사.json": "축제공연행사",
    }

    db = SessionLocal()
    try:
        for filename, category in files.items():
            path = os.path.join(data_dir, filename)
            if not os.path.exists(path):
                print("파일 없음:", path)
                continue
            count = import_file(db, path, category)
            print(f"{filename} -> {category}: {count}개 추가")
    finally:
        db.close()

if __name__ == "__main__":
    main()