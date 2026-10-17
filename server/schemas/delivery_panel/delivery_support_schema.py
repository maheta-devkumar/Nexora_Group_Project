from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from enum import Enum
from datetime import datetime


# Enums
class IssueCategory(str, Enum):
    DELIVERY_ISSUE = "DELIVERY_ISSUE"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    APP_TECHNICAL_ISSUE = "APP_TECHNICAL_ISSUE"
    VEHICLE_ISSUE = "VEHICLE_ISSUE"
    OTHER = "OTHER"


# Request Schema
class IssueSubmissionRequest(BaseModel):
    """Schema for submitting a support issue"""
    
    issue_type: IssueCategory = Field(
        ...,
        description="Type/category of the issue"
    )
    message: str = Field(
        ...,
        min_length=10,
        max_length=2000,
        description="Detailed description of the issue"
    )
    order_id: Optional[int] = Field(
        None,
        ge=1,
        description="Optional order ID if issue is related to a specific order"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "issue_type": "DELIVERY_ISSUE",
                "message": "Customer was not available for delivery despite multiple attempts.",
                "order_id": 12345
            }
        }
    )


# Response Schema
class IssueSubmissionResponse(BaseModel):
    """Schema for issue submission response"""
    
    success: bool = Field(
        ...,
        description="Indicates if the issue was submitted successfully"
    )
    message: str = Field(
        ...,
        description="Success or error message"
    )
    submission_time: Optional[datetime] = Field(
        None,
        description="Timestamp of issue submission"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "success": True,
                    "message": "Issue submitted successfully. Support team will contact you soon.",
                    "submission_time": "2025-01-15T14:30:00Z"
                },
                {
                    "success": False,
                    "message": "Failed to submit issue. Please try again.",
                    "submission_time": None
                }
            ]
        }
    )


# Optional: Schema for validation errors
class ValidationErrorResponse(BaseModel):
    """Schema for validation error response"""
    
    success: bool = Field(default=False)
    message: str = Field(description="Validation error message")
    errors: Optional[list] = Field(
        None,
        description="Detailed validation errors"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "success": False,
                "message": "Validation error",
                "errors": [
                    {
                        "field": "message",
                        "error": "String should have at least 10 characters"
                    }
                ]
            }
        }
    )