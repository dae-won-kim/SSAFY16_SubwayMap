# 🗺️ LocalHub — 서울 지역 정보 공유 커뮤니티

> 공공데이터 기반 서울 관광지 정보 탐색 + 익명 커뮤니티 플랫폼  
> **SSAFY 팀 프로젝트 | 2026.07.14 ~ 2026.07.16**

<br>

[![Vue.js](https://img.shields.io/badge/Vue.js-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Netlify](https://img.shields.io/badge/FE-Netlify-00C7B7?style=flat-square&logo=netlify&logoColor=white)](https://www.netlify.com/)
[![Render](https://img.shields.io/badge/BE-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/Data-공공누리_Type1·3-blue?style=flat-square)](https://www.kogl.or.kr/)

<br>

---

## 📌 목차

1. [프로젝트 소개](#-프로젝트-소개)
2. [주요 기능](#-주요-기능)
3. [기술 스택](#-기술-스택)
4. [데이터 개요](#-데이터-개요)
5. [아키텍처](#-아키텍처)
6. [API 명세](#-api-명세)
7. [DB 스키마](#-db-스키마)
8. [Vue 3 컴포넌트 구조](#-vue-3-컴포넌트-구조)
9. [시작하기](#-시작하기)
10. [환경 변수](#-환경-변수)
11. [배포](#-배포)
12. [산출물](#-산출물)
13. [팀원](#-팀원)

<br>

---

## 🧭 프로젝트 소개

**LocalHub**는 한국관광공사 TourAPI 4.0에서 수집한 **서울 관광지 783건**을 기반으로,  
지하철역 기준 주변 시설 탐색과 익명 커뮤니티 기능을 제공하는 SPA 서비스입니다.

```
"홍대입구역 근처 놀거리 뭐 있어?"  →  챗봇 or 지도 검색으로 즉시 확인
```

| 구분 | 내용 |
|------|------|
| 대상 권역 | 서울 (lDongRegnCd: `"11"`) |
| 데이터 출처 | 한국관광공사 TourAPI 4.0 (contentTypeId: `12` — 관광지) |
| 전체 항목 수 | **783건** |
| 좌표 보유 | 783건 전체 (결측 0건) |
| 이미지 보유 | 718건 (91.7%) |
| 저작권 유형 | 공공누리 Type1: 343건 / Type3: 375건 / 미분류: 65건 |

<br>

---

## ✨ 주요 기능

### ✅ 필수 기능

| 기능 | 설명 |
|------|------|
| 🔍 관광지 목록 / 상세 | 서울 관광지 783건 목록 조회, 상세 정보 확인 |
| 🚇 지하철역 기준 검색 | 역명 입력 → 반경(기본 1km) 내 관광지 거리순 표시 |
| 🤖 챗봇 | 자연어로 관광지·축제·맛집 질의응답 (OpenAI API) |
| 📋 익명 게시판 CRUD | 회원가입 없이 제목·내용·비밀번호로 게시글 관리 |
| 🔑 비밀번호 기반 권한 | 수정·삭제 시 작성 비밀번호 일치 여부로만 인증 |

### 🟡 선택 기능 (구현 예정)

| 기능 | 설명 |
|------|------|
| 👁️ 조회수 | 게시글 상세 조회 시 자동 +1 |
| 🔎 게시글 검색 | 제목 키워드 기반 필터링 |

<br>

---

## 🛠️ 기술 스택

```
Frontend          Backend           Database    Infra
──────────        ──────────        ────────    ─────
Vue.js 3          FastAPI 0.111     SQLite 3    Netlify (FE)
Vue Router 4      SQLAlchemy 2.x               Render   (BE)
Pinia             Uvicorn
Axios             Python 3.11
Vite
```

### AI / 외부 API

| 도구 | 용도 |
|------|------|
| OpenAI API (GPT) | 챗봇 자연어 응답 |
| VSCode Copilot | 개발 보조 (팀 허용 도구) |
| 한국관광공사 TourAPI 4.0 | 관광지 원본 데이터 (사전 수집 후 JSON 제공) |

<br>

---

## 📊 데이터 개요

### 분류체계 (lclsSystm1) 분포

| 코드 | 의미 | 건수 |
|------|------|------|
| `VE` | 자연·경관 | 353건 |
| `HS` | 역사·문화 | 228건 |
| `EX` | 체험·레포츠 | 111건 |
| `NA` | 자연생태 | 91건 |

### 주요 자치구 분포 (상위 5)

| lDongSignguCd | 건수 |
|---|---|
| 110 (종로구) | 150건 |
| 140 (중구) | 67건 |
| 440 (마포구) | 41건 |
| 680 (송파구) | 40건 |
| 170 (성동구) | 39건 |

### ⚠️ 데이터 주의사항

- `mapx` / `mapy` 는 JSON에서 **string 타입**으로 제공됨 → DB import 시 `Float`으로 변환 필수
- `firstimage` 가 빈 문자열(`""`)인 경우 FE에서 기본 이미지로 대체 처리
- `cpyrhtDivCd` 가 `"Type3"` 인 이미지는 **출처 표기 의무** (공공누리 3유형)

<br>

---

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 브라우저                         │
│                    Vue 3 SPA (Netlify)                       │
│  HomeView  AttractionListView  PostListView  ChatbotWidget   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS (REST API / JSON)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  FastAPI 서버 (Render)                        │
│   /api/attractions   /api/posts   /api/chat   /api/stations  │
│                  SQLAlchemy ORM                              │
└────────────────────┬──────────────────────┬─────────────────┘
                     │                      │
              ┌──────▼──────┐      ┌────────▼────────┐
              │  SQLite DB   │      │   OpenAI API     │
              │ localhub.db  │      │  (챗봇 응답)      │
              └─────────────┘      └─────────────────┘
```

<br>

---

## 📡 API 명세

**Base URL:** `https://localhub-api.onrender.com/api`  
**Content-Type:** `application/json`

---

### 관광지 (Attractions)

#### `GET /api/attractions` — 관광지 목록 조회

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 제목 키워드 검색 |
| `sigungu` | string | 자치구 코드 (예: `"110"`) |
| `lclsSystm1` | string | 분류체계1 코드 (예: `"VE"`, `"HS"`) |
| `near_station` | string | 지하철역명 — 반경 내 필터링 |
| `radius_m` | integer | 검색 반경 미터 (기본: `1000`) |
| `has_image` | boolean | `true`: 이미지 있는 항목만 |
| `page` | integer | 페이지 번호 (기본: `1`) |
| `size` | integer | 페이지 당 수 (기본: `20`, 최대: `100`) |

<details>
<summary>응답 예시 (200)</summary>

```json
{
  "total": 783,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": 1,
      "contentid": "1059877",
      "title": "양화한강공원",
      "addr1": "서울특별시 영등포구 노들로 221",
      "mapx": 126.9023658810,
      "mapy": 37.5382819489,
      "lcls_systm1": "VE",
      "lcls_systm2": "VE03",
      "lcls_systm3": "VE030100",
      "first_image": "https://tong.visitkorea.or.kr/...",
      "first_image2": "https://tong.visitkorea.or.kr/...",
      "cpyrht_div_cd": "Type1"
    }
  ]
}
```

</details>

---

#### `GET /api/attractions/near-station` — 🚇 지하철역 기준 주변 관광지 ★

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `station` | string | ✅ | 역명 (예: `"홍대입구"`) |
| `radius_m` | integer | | 반경 미터 (기본: `1000`, 최대: `5000`) |
| `lclsSystm1` | string | | 분류 필터 |
| `page` | integer | | 페이지 |
| `size` | integer | | 페이지 당 수 |

<details>
<summary>응답 예시 (200)</summary>

```json
{
  "station": "홍대입구",
  "station_mapx": 126.9236,
  "station_mapy": 37.5571,
  "radius_m": 1000,
  "total": 12,
  "items": [
    {
      "id": 42,
      "title": "홍대 걷고싶은거리",
      "addr1": "서울특별시 마포구 어울마당로",
      "distance_m": 230
    }
  ]
}
```

</details>

---

#### `GET /api/attractions/{id}` — 관광지 상세

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `id` (path) | integer | 관광지 PK |

---

#### `GET /api/stations` — 지하철역 목록 (자동완성)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 역명 키워드 |
| `line` | string | 호선 필터 (예: `"2호선"`) |

---

### 커뮤니티 게시판 (Posts)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/posts` | 목록 조회 (카테고리·키워드·정렬·페이지) |
| `POST` | `/api/posts` | 게시글 작성 |
| `GET` | `/api/posts/{id}` | 상세 조회 (views +1) |
| `PUT` | `/api/posts/{id}` | 수정 (비밀번호 확인) |
| `DELETE` | `/api/posts/{id}` | 삭제 (비밀번호 확인) |

<details>
<summary>POST /api/posts — 요청 바디</summary>

```json
{
  "title": "경복궁 야간개장 후기",
  "content": "...",
  "category": "관광지",
  "password": "1234",
  "attraction_id": 42
}
```

> ⚠️ `password`는 교육 목적 설계로 **평문 저장**합니다. 실서비스 전환 시 해시 암호화 필수.

</details>

---

### 챗봇 (Chat)

#### `POST /api/chat`

<details>
<summary>요청 / 응답 예시</summary>

```json
// Request
{
  "message": "홍대입구역 근처 놀거리 알려줘",
  "history": [
    { "role": "user", "content": "서울 야경 명소 추천해줘" },
    { "role": "assistant", "content": "남산서울타워, 북악스카이웨이..." }
  ]
}

// Response
{
  "answer": "홍대입구역 반경 1km 내 주요 관광지로는 홍대 걷고싶은거리, 경의선숲길 등이 있습니다.",
  "sources": [
    { "title": "홍대 걷고싶은거리", "contentid": "123456" }
  ]
}
```

</details>

---


## 🗄️ DB 스키마

**파일:** `./localhub.db` | **ORM:** SQLAlchemy 2.x | **마이그레이션:** 기동 시 `create_all()`

---

### `attractions` — 관광지

```sql
CREATE TABLE attractions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    contentid        VARCHAR(20)  NOT NULL UNIQUE,   -- TourAPI 원본 contentid
    contenttypeid    VARCHAR(5)   NOT NULL,           -- "12" 고정
    title            VARCHAR(200) NOT NULL,
    addr1            TEXT,
    addr2            TEXT,
    zipcode          VARCHAR(10),
    mapx             REAL         NOT NULL,           -- 원본 string → Float 변환
    mapy             REAL         NOT NULL,
    l_dong_regn_cd   VARCHAR(10),                    -- lDongRegnCd
    l_dong_signgu_cd VARCHAR(10),                    -- lDongSignguCd
    lcls_systm1      VARCHAR(10),                    -- lclsSystm1
    lcls_systm2      VARCHAR(10),                    -- lclsSystm2
    lcls_systm3      VARCHAR(20),                    -- lclsSystm3
    first_image      TEXT,                           -- firstimage (원본 URL)
    first_image2     TEXT,                           -- firstimage2 (썸네일)
    cpyrht_div_cd    VARCHAR(10),                    -- "Type1" | "Type3"
    tour_created_at  VARCHAR(20),                    -- createdtime
    tour_modified_at VARCHAR(20),                    -- modifiedtime
    imported_at      DATETIME     NOT NULL
);

-- 인덱스
CREATE INDEX idx_attractions_mapxy   ON attractions (mapx, mapy);   -- 반경 검색
CREATE INDEX idx_attractions_signgu  ON attractions (l_dong_signgu_cd);
CREATE INDEX idx_attractions_lcls1   ON attractions (lcls_systm1);
```

---

### `stations` — 서울 지하철역 (좌표 기준 테이블)

```sql
CREATE TABLE stations (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  VARCHAR(100) NOT NULL UNIQUE,  -- 예: "홍대입구"
    line  VARCHAR(20)  NOT NULL,         -- 예: "2호선"
    mapx  REAL         NOT NULL,
    mapy  REAL         NOT NULL
);
```

---

### `posts` — 커뮤니티 게시글

```sql
CREATE TABLE posts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    category      VARCHAR(50)  NOT NULL,   -- "관광지" | "맛집" | "축제행사" | "기타"
    password      VARCHAR(100) NOT NULL,   -- 평문 저장 (교육 목적)
    views         INTEGER      NOT NULL DEFAULT 0,
    attraction_id INTEGER REFERENCES attractions(id),  -- NULL 허용
    created_at    DATETIME     NOT NULL,
    updated_at    DATETIME     NOT NULL
);

-- 인덱스
CREATE INDEX idx_posts_category ON posts (category);
CREATE INDEX idx_posts_created  ON posts (created_at DESC);
```

---

### ERD 관계

```
attractions  ──────────────────────  posts
     id (PK)                         attraction_id (FK, nullable)
                  1 : N (선택)
     
stations  (독립 테이블)
  역명 → mapx/mapy 변환 전용
  attractions와 직접 FK 없음
  검색 시 좌표 기반 반경 계산
```

---

### SQLAlchemy ORM 모델

```python
# models.py
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Attraction(Base):
    __tablename__ = "attractions"

    id               = Column(Integer, primary_key=True, index=True)
    contentid        = Column(String(20), unique=True, nullable=False)
    title            = Column(String(200), nullable=False, index=True)
    mapx             = Column(Float, nullable=False)
    mapy             = Column(Float, nullable=False)
    l_dong_signgu_cd = Column(String(10), index=True)
    lcls_systm1      = Column(String(10), index=True)
    lcls_systm2      = Column(String(10))
    lcls_systm3      = Column(String(20))
    first_image      = Column(Text)
    first_image2     = Column(Text)
    cpyrht_div_cd    = Column(String(10))
    # ... 나머지 필드
    posts            = relationship("Post", back_populates="attraction")


class Post(Base):
    __tablename__ = "posts"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(200), nullable=False)
    content       = Column(Text, nullable=False)
    category      = Column(String(50), nullable=False, index=True)
    password      = Column(String(100), nullable=False)  # 평문 (교육 목적)
    views         = Column(Integer, default=0)
    attraction_id = Column(Integer, ForeignKey("attractions.id"), nullable=True)
    attraction    = relationship("Attraction", back_populates="posts")


class Station(Base):
    __tablename__ = "stations"

    id   = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    line = Column(String(20), nullable=False)
    mapx = Column(Float, nullable=False)
    mapy = Column(Float, nullable=False)
```

<br>

---

## 🧩 Vue 3 컴포넌트 구조

### 디렉토리 트리

```
src/
├── main.js                        # Vue 앱 초기화, Pinia·Router 등록
├── App.vue                        # 루트 컴포넌트 (RouterView + ChatbotWidget)
│
├── router/
│   └── index.js                   # 라우트 정의
│
├── stores/                        # Pinia 전역 상태
│   ├── attractionStore.js         # 관광지 목록·상세·검색 상태
│   ├── postStore.js               # 게시글 CRUD 상태
│   └── chatStore.js               # 챗봇 대화 히스토리
│
├── api/                           # Axios 인스턴스 + 엔드포인트 래퍼
│   ├── index.js                   # baseURL, 인터셉터 설정
│   ├── attractionApi.js           # /api/attractions, /api/stations
│   ├── postApi.js                 # /api/posts CRUD
│   └── chatApi.js                 # /api/chat
│
├── views/                         # 페이지 단위 (라우터 1:1 매핑)
│   ├── HomeView.vue               # 홈: 배너 + 카테고리 + 최근 게시글
│   ├── AttractionListView.vue     # 관광지 목록 + 역 기준 검색
│   ├── AttractionDetailView.vue   # 관광지 상세
│   ├── PostListView.vue           # 게시판 목록
│   ├── PostDetailView.vue         # 게시글 상세
│   └── PostFormView.vue           # 게시글 작성·수정
│
└── components/                    # 재사용 컴포넌트
    ├── common/
    │   ├── AppHeader.vue          # 상단 네비게이션 + 검색 아이콘
    │   ├── AppFooter.vue          # 저작권·링크
    │   └── Pagination.vue         # 공통 페이지네이션
    ├── attraction/
    │   ├── AttractionCard.vue     # 썸네일·제목·주소·분류 카드
    │   ├── AttractionList.vue     # AttractionCard 그리드 래퍼
    │   ├── StationSearch.vue      # 역명 자동완성 + 반경 슬라이더
    │   └── AttractionMap.vue      # (선택) Leaflet 지도 + 핀
    ├── post/
    │   ├── PostTable.vue          # 게시글 목록 테이블
    │   ├── PostForm.vue           # 작성·수정 폼
    │   └── PasswordModal.vue      # 수정·삭제 비밀번호 확인 모달
    └── chat/
        ├── ChatbotWidget.vue      # 플로팅 버튼 ↔ 대화창 전환
        ├── ChatWindow.vue         # 대화 히스토리 + 입력창
        └── ChatMessage.vue        # 단일 메시지 말풍선 (user / assistant)
```

---

### 라우터 정의

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',                component: () => import('@/views/HomeView.vue') },
  { path: '/attractions',     component: () => import('@/views/AttractionListView.vue') },
  { path: '/attractions/:id', component: () => import('@/views/AttractionDetailView.vue') },
  { path: '/posts',           component: () => import('@/views/PostListView.vue') },
  { path: '/posts/new',       component: () => import('@/views/PostFormView.vue') },
  { path: '/posts/:id',       component: () => import('@/views/PostDetailView.vue') },
  { path: '/posts/:id/edit',  component: () => import('@/views/PostFormView.vue') },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
```

---

### 핵심 컴포넌트 Props / Emits

#### `StationSearch.vue`

```
Props  modelValue  String              v-model 바인딩 역명
       radiusM     Number (기본 1000)  검색 반경

Emits  update:modelValue  String              역명 변경 시
       search             { station, radiusM } 검색 실행 시
```

> 역명 입력 시 **debounce 300ms** 적용 → `GET /api/stations?q=` 자동완성

---

#### `PasswordModal.vue`

```
Props  visible  Boolean          모달 표시 여부
       mode     "edit"|"delete"  제목 텍스트 분기

Emits  confirm  password: String  부모에서 PUT / DELETE 호출
       cancel   —                 모달 닫기
```

> `<input type="password">` 사용 / FE 로컬 저장 금지

---

#### `ChatbotWidget.vue`

```
state  isOpen  ref<Boolean>  대화창 열림 여부 (기본 false)

닫힌 상태  →  우측 하단 플로팅 버튼 (position: fixed)
열린 상태  →  ChatWindow 렌더링
              - 모바일 (≤ 768px): 전체 화면
              - 데스크톱: 고정 박스 (360×520px)
```

---

### Pinia 스토어

```javascript
// stores/attractionStore.js  (간략)
export const useAttractionStore = defineStore('attraction', {
  state: () => ({ list: [], detail: null, loading: false, total: 0 }),
  actions: {
    async fetchList(params) { /* GET /api/attractions */ },
    async fetchDetail(id)   { /* GET /api/attractions/:id */ },
    async fetchNearStation(station, radiusM) { /* GET /api/attractions/near-station */ },
  },
})

// stores/chatStore.js  (간략)
export const useChatStore = defineStore('chat', {
  state: () => ({ messages: [], isLoading: false }),
  actions: {
    async sendMessage(text) { /* POST /api/chat + 히스토리 누적 */ },
    clearHistory() { this.messages = [] },
  },
})
```

<br>

---

## 🚀 시작하기

### 사전 요구사항

- Node.js 20+
- Python 3.11+
- Git

### 프론트엔드

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### 백엔드

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# JSON → SQLite import (최초 1회)
python scripts/import_data.py

# 서버 실행
uvicorn main:app --reload     # http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

<br>

---

## ⚙️ 환경 변수

> ⚠️ `.env` 파일은 **절대 커밋하지 마세요.** `.gitignore`에 등록되어 있습니다.

### 백엔드 (`backend/.env`)

```env
# OpenAI
OPENAI_API_KEY=sk-...

# DB
DATABASE_URL=sqlite:///./localhub.db

# CORS — Netlify 배포 도메인으로 변경
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.netlify.app
```

### 프론트엔드 (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

<br>

---

## 🌐 배포

| 서비스 | 플랫폼 | URL |
|--------|--------|-----|
| Frontend (Vue 3) | Netlify | `https://localhub.netlify.app` |
| Backend (FastAPI) | Render | `https://localhub-api.onrender.com` |

### Netlify (FE)

```
Build command : npm run build
Publish dir   : dist
Environment   : VITE_API_BASE_URL=https://localhub-api.onrender.com/api
```

### Render (BE)

```
Runtime       : Python 3.11
Build command : pip install -r requirements.txt
Start command : uvicorn main:app --host 0.0.0.0 --port $PORT
Environment   : OPENAI_API_KEY / DATABASE_URL / ALLOWED_ORIGINS
```

> ⚠️ Render 무료 플랜은 **cold start 약 1분** 소요될 수 있습니다.

<br>

---

## 📁 산출물

| 구분 | 산출물 | 형식 | 비고 |
|------|--------|------|------|
| 소스코드 | 프론트엔드 (Vue.js) | GitLab URL | `.env` 미포함 확인 |
| 소스코드 | 백엔드 (FastAPI) | GitLab URL | `.env` 미포함 확인 |
| DB | SQLite `.db` 파일 | 파일 직접 제출 | 초기 데이터 포함 |
| 배포 | Netlify URL | 외부 접근 가능 | repo 연동 |
| 배포 | Render URL | 외부 접근 가능 | repo 연동 |
| 문서 | 기능 명세서 | PDF / docx | 데이터 출처·라이선스 포함 |
| 문서 | WBS | 스프레드시트 | — |
| 발표 | PPT 자료 | PPT / PDF | — |

**제출 마감: 2026.07.16 (목) 15:00 — SSAFY GitLab**

<br>

---


## 📜 라이선스 / 저작권

본 프로젝트에서 사용하는 데이터는 **한국관광공사 TourAPI 4.0**에서 제공합니다.

| 저작권 유형 | 건수 | 조건 |
|-------------|------|------|
| 공공누리 Type1 | 343건 | 출처 표시 |
| 공공누리 Type3 | 375건 | 출처 표시 + 변경 금지 |
| 미분류 | 65건 | 별도 확인 필요 |

> 이 프로젝트는 **SSAFY 교육 목적**으로만 사용하며 상업적 활용을 금지합니다.
