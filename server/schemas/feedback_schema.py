from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# --- Enums ---
class FeedbackType(str, Enum):
    COMPLAINT = "COMPLAINT"
    SUGGESTION = "SUGGESTION"
    APP_FEEDBACK = "APP_FEEDBACK"
    DELIVERY_FEEDBACK = "DELIVERY_FEEDBACK"

class FeedbackStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class IssuePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class IssueStatus(str, Enum):
    OPEN = "OPEN"
    UNDER_REVIEW = "UNDER_REVIEW"
    FIXED = "FIXED"
    REJECTED = "REJECTED"

# --- Feedback Schemas ---
class FeedbackBase(BaseModel):
    feedback_type: FeedbackType
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    rating: Optional[int] = Field(None, ge=1, le=5)
    order_id: Optional[int] = None

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    feedback_status: Optional[FeedbackStatus] = None

class FeedbackResponse(BaseModel):
    feedback_id: int
    user_id: int
    order_id: Optional[int]
    feedback_type: FeedbackType
    subject: str
    message: str
    rating: Optional[int]
    feedback_status: FeedbackStatus  # Changed from status to feedback_status
    created_at: datetime
    resolved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

# Feedback with responses
class FeedbackDetailResponse(FeedbackResponse):
    responses: List['FeedbackResponseResponse'] = []

class FeedbackResponseBase(BaseModel):
    response_message: str = Field(..., min_length=1)

class FeedbackResponseCreate(FeedbackResponseBase):
    pass

class FeedbackResponseResponse(FeedbackResponseBase):
    response_id: int
    feedback_id: int
    admin_id: Optional[int]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- User Issue Schemas ---
class UserIssueBase(BaseModel):
    raised_by_role: str = Field(..., min_length=1, max_length=50)
    order_id: int
    delivery_id: int
    issue_type: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=150)
    description: str = Field(..., min_length=1)
    priority: str = Field(default="MEDIUM", max_length=20)

class UserIssueCreate(UserIssueBase):
    pass

class UserIssueUpdate(BaseModel):
    status: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, max_length=20)
    resolution_note: Optional[str] = None

class UserIssueResponse(UserIssueBase):
    issue_id: int
    raised_by_id: Optional[int]
    status: str
    resolution_note: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas ---
class FeedbackWrapper(BaseModel):
    success: bool
    message: str
    data: FeedbackResponse

class FeedbackListWrapper(BaseModel):
    success: bool
    message: str
    data: List[FeedbackResponse]

class FeedbackDetailWrapper(BaseModel):
    success: bool
    message: str
    data: FeedbackDetailResponse

class FeedbackResponseWrapper(BaseModel):
    success: bool
    message: str
    data: FeedbackResponseResponse

class UserIssueWrapper(BaseModel):
    success: bool
    message: str
    data: UserIssueResponse

class UserIssueListWrapper(BaseModel):
    success: bool
    message: str
    data: List[UserIssueResponse]

class MessageWrapper(BaseModel):
    success: bool
    message: str
    data: dict = {}

# --- Analytics Schemas ---
class FeedbackAnalyticsResponse(BaseModel):
    total_feedbacks: int
    open_feedbacks: int
    in_progress_feedbacks: int
    resolved_feedbacks: int
    average_rating: Optional[float]
    feedbacks_by_type: dict

class FeedbackAnalyticsWrapper(BaseModel):
    success: bool
    message: str
    data: FeedbackAnalyticsResponse