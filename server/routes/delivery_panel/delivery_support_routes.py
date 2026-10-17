from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional

from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_support_controller import DeliverySupportController
from schemas.delivery_panel.delivery_support_schema import (
    IssueSubmissionRequest,
    IssueSubmissionResponse
)
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel/support", tags=["Delivery Support"])


# ===== ISSUE SUBMISSION =====

@router.post(
    "/issue",
    response_model=IssueSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Support Issue",
    description="""
    Submit a support issue as a delivery person.
    
    **Fields:**
    - `issue_type`: Type of issue (DELIVERY_ISSUE, PAYMENT_ISSUE, APP_TECHNICAL_ISSUE, VEHICLE_ISSUE, OTHER)
    - `message`: Detailed description of the issue (minimum 10 characters)
    - `order_id`: Optional order ID if issue is related to a specific order
    
    **Permissions:**
    - Only delivery persons can submit issues
    
    **Response:**
    - `success`: Boolean indicating success
    - `message`: Success or error message
    - `submission_time`: Timestamp when issue was submitted
    """
)
def submit_issue(
    request: IssueSubmissionRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliverySupportController = Depends()
):
    """
    Submit a support issue from delivery person
    """
    return controller.submit_issue(request, current_user)


# ===== HEALTH CHECK =====

@router.get(
    "/health",
    summary="Support Service Health Check",
    description="Check if the delivery support service is operational",
    response_model=dict
)
def health_check(
    current_user: User = Depends(is_delivery_person),
    controller: DeliverySupportController = Depends()
):
    """
    Health check for delivery support service
    """
    return controller.health_check(current_user)


# ===== ERROR HANDLERS =====

@router.get(
    "/contact-info",
    summary="Get Support Contact Information",
    description="Get static contact information for support",
    response_model=dict
)
def get_contact_info():
    """
    Return static support contact information (matches HTML content)
    """
    return {
        "contact_methods": [
            {
                "method": "phone",
                "label": "Call Support",
                "description": "Available 24/7",
                "contact": "1800-123-456",
                "action_url": "tel:+911800123456"
            },
            {
                "method": "chat",
                "label": "Chat Support",
                "description": "Live chat available",
                "contact": "Start Chat",
                "action_type": "button"
            },
            {
                "method": "email",
                "label": "Email Support",
                "description": "Response within 2 hours",
                "contact": "support@nexora.com",
                "action_url": "mailto:support@nexora.com"
            }
        ],
        "quick_topics": [
            "How to mark delivery?",
            "Payment issues",
            "Route navigation help",
            "App technical issues"
        ]
    }


# ===== CUSTOM EXCEPTION HANDLERS =====

def register_exception_handlers(app):
    """
    Register custom exception handlers for support routes
    """
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request, exc):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.detail,
                "error_code": exc.status_code
            }
        )


# Note: This function should be called in your main FastAPI app setup
# Example: register_exception_handlers(app)