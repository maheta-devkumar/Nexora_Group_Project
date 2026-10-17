from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# Existing schemas...
class ReviewBase(BaseModel):
    variant_id: int
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    images: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewResponse(ReviewBase):
    review_id: int
    user_id: int
    user_name: str
    created_at: datetime

    class Config:
        from_attributes = True

# Add pagination wrapper for reviews
class ReviewListResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

class ReviewWrapper(BaseModel):
    success: bool
    message: str
    data: ReviewResponse

# ADD THIS NEW SCHEMA FOR PAGINATED REVIEWS
class ReviewListWrapper(BaseModel):
    success: bool
    message: str
    data: ReviewListResponse

class MessageWrapper(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any] = {}