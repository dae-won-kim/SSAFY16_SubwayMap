from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- 댓글 스키마 ---
class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    password: str

class CommentResponse(CommentBase):
    id: int
    post_id: int
    created_at: datetime

    class Config:
        orm_mode = True

# --- 게시글 스키마 ---
class PostBase(BaseModel):
    title: str
    content: str

class PostCreate(PostBase):
    password: str

class PostUpdate(PostBase):
    title: str
    content: str
    password: str

class PostDeleteRequest(BaseModel):
    password: str

class PostListResponse(PostBase):
    id: int
    views: int
    created_at: datetime
    comment_count: int

    class Config:
        orm_mode = True

class PostDetailResponse(BaseModel):
    id: int
    title: str
    content: str
    views: int
    created_at: datetime
    comments: List[CommentResponse] = []

    class Config:
        orm_mode = True

class AttractionListResponse(BaseModel):
    id: int
    content_id: Optional[str] = None
    name: str
    category: Optional[str] = None
    gu_name: Optional[str] = None
    address: Optional[str] = None
    mapx: Optional[str] = None
    mapy: Optional[str] = None
    description: Optional[str] = None

    class Config:
        orm_mode = True

class AttractionDetailResponse(AttractionListResponse):
    pass