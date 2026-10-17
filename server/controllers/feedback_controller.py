from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.feedback_service import FeedbackService
from schemas.feedback_schema import FeedbackCreate, FeedbackResponseCreate, UserIssueCreate
from models.feedback.feedback import FeedbackStatus
from typing import Dict, Any, List

class FeedbackController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = FeedbackService(db)
    
    def create_feedback(self, feedback_data: FeedbackCreate, user_id: int) -> Dict[str, Any]:
        """Create a new feedback"""
        try:
            return self.service.create_feedback(feedback_data, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_feedbacks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all feedbacks submitted by current user"""
        try:
            return self.service.get_user_feedbacks(user_id, skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_feedback_details(self, feedback_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed feedback with admin responses"""
        try:
            return self.service.get_feedback_details(feedback_id, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_feedback_status(self, feedback_id: int, user_id: int, status: FeedbackStatus) -> Dict[str, str]:
        """Update feedback status"""
        try:
            return self.service.update_feedback_status(feedback_id, user_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_issue(self, issue_data: UserIssueCreate, user_id: int) -> Dict[str, Any]:
        """Create a new user issue (for delivery persons)"""
        try:
            return self.service.create_issue(issue_data, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_issues(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all issues reported by current user"""
        try:
            return self.service.get_user_issues(user_id, skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_issue_status(self, issue_id: int, user_id: int, status: str) -> Dict[str, str]:
        """Update issue status"""
        try:
            return self.service.update_issue_status(issue_id, user_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_feedbacks(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all feedbacks (admin only)"""
        try:
            return self.service.get_all_feedbacks(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_issues(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all issues (admin only)"""
        try:
            return self.service.get_all_issues(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def respond_to_feedback(self, feedback_id: int, admin_id: int, response_data: FeedbackResponseCreate) -> Dict[str, Any]:
        """Admin responds to feedback"""
        try:
            return self.service.respond_to_feedback(feedback_id, admin_id, response_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_feedback_analytics(self) -> Dict[str, Any]:
        """Get feedback statistics for admin dashboard"""
        try:
            return self.service.get_feedback_analytics()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))