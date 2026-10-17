from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_admin
from controllers.feedback_controller import FeedbackController
from schemas.feedback_schema import (
    FeedbackCreate, FeedbackUpdate, FeedbackWrapper, FeedbackListWrapper, FeedbackDetailWrapper,
    FeedbackResponseCreate, FeedbackResponseWrapper, UserIssueCreate, UserIssueUpdate,
    UserIssueWrapper, UserIssueListWrapper, MessageWrapper, FeedbackAnalyticsWrapper, FeedbackStatus
)
from models.user import User

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback & Support"])

# 🧍‍♂️ Customer-Facing Endpoints
@router.post("", response_model=FeedbackWrapper)
def submit_feedback_route(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit new feedback or complaint"""
    controller = FeedbackController(db)
    feedback = controller.create_feedback(feedback_data, current_user.user_id)
    return {
        "success": True,
        "message": "Feedback submitted successfully",
        "data": feedback
    }

@router.get("/my", response_model=FeedbackListWrapper)
def get_my_feedbacks_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """View all feedbacks submitted by current user"""
    controller = FeedbackController(db)
    feedbacks = controller.get_user_feedbacks(current_user.user_id, skip, limit)
    return {
        "success": True,
        "message": "Feedbacks retrieved successfully",
        "data": feedbacks
    }

@router.get("/my/{feedback_id}", response_model=FeedbackDetailWrapper)
def get_my_feedback_details_route(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """View detailed feedback with admin response"""
    controller = FeedbackController(db)
    feedback = controller.get_feedback_details(feedback_id, current_user.user_id)
    return {
        "success": True,
        "message": "Feedback details retrieved successfully",
        "data": feedback
    }

@router.patch("/{feedback_id}/status", response_model=MessageWrapper)
def update_feedback_status_route(
    feedback_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update feedback status"""
    try:
        # Check for both 'status' and 'feedback_status' field names
        if "feedback_status" in status_update:
            status_value = status_update["feedback_status"]
        elif "status" in status_update:
            status_value = status_update["status"]
        else:
            raise HTTPException(status_code=400, detail="feedback_status is required")
        
        # Validate the status value
        try:
            status_enum = FeedbackStatus(status_value)
        except ValueError:
            valid_statuses = [s.value for s in FeedbackStatus]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        controller = FeedbackController(db)
        result = controller.update_feedback_status(feedback_id, current_user.user_id, status_enum)
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🚚 Delivery Person Endpoints
@router.post("/issues", response_model=UserIssueWrapper)
def report_issue_route(
    issue_data: UserIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Report a delivery or system issue"""
    controller = FeedbackController(db)
    issue = controller.create_issue(issue_data, current_user.user_id)
    return {
        "success": True,
        "message": "Issue reported successfully",
        "data": issue
    }

@router.get("/issues/my", response_model=UserIssueListWrapper)
def get_my_issues_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """View delivery person's reported issues"""
    controller = FeedbackController(db)
    issues = controller.get_user_issues(current_user.user_id, skip, limit)
    return {
        "success": True,
        "message": "Issues retrieved successfully",
        "data": issues
    }

@router.patch("/issues/{issue_id}/status", response_model=MessageWrapper)
def update_issue_status_route(
    issue_id: int,
    status_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update issue status"""
    try:
        if "status" not in status_update:
            raise HTTPException(status_code=400, detail="status is required")
        
        controller = FeedbackController(db)
        result = controller.update_issue_status(issue_id, current_user.user_id, status_update["status"])
        return {
            "success": True,
            "message": result["message"],
            "data": {}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 🧑‍💼 Admin-Facing Endpoints
@router.get("/all", response_model=FeedbackListWrapper)
def get_all_feedbacks_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """View all feedbacks (admin only)"""
    controller = FeedbackController(db)
    feedbacks = controller.get_all_feedbacks(skip, limit)
    return {
        "success": True,
        "message": "All feedbacks retrieved successfully",
        "data": feedbacks
    }

@router.get("/issues", response_model=UserIssueListWrapper)
def get_all_issues_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """View all user or delivery issues (admin only)"""
    controller = FeedbackController(db)
    issues = controller.get_all_issues(skip, limit)
    return {
        "success": True,
        "message": "All issues retrieved successfully",
        "data": issues
    }

@router.post("/response/{feedback_id}", response_model=FeedbackResponseWrapper)
def respond_to_feedback_route(
    feedback_id: int,
    response_data: FeedbackResponseCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Send admin response to feedback"""
    controller = FeedbackController(db)
    response = controller.respond_to_feedback(feedback_id, admin.user_id, response_data)
    return {
        "success": True,
        "message": "Response sent successfully",
        "data": response
    }

@router.get("/analytics", response_model=FeedbackAnalyticsWrapper)
def get_feedback_analytics_route(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    """Get feedback statistics (admin only)"""
    controller = FeedbackController(db)
    analytics = controller.get_feedback_analytics()
    return {
        "success": True,
        "message": "Analytics retrieved successfully",
        "data": analytics
    }