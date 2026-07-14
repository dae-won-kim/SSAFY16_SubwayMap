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
        from_attributes = True

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
        from_attributes = True

class PostDetailResponse(BaseModel):
    id: int
    title: str
    content: str
    views: int
    created_at: datetime
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True