from sqlalchemy.orm import Session
from sqlalchemy import func
from models.feedback.feedback import Feedback, FeedbackResponse, FeedbackType, FeedbackStatus
from models.feedback.user_issue import UserIssue
from models.user import User
from models.order.order import Order
from schemas.feedback_schema import FeedbackCreate, UserIssueCreate
from datetime import datetime
from typing import Dict, Any, List, Optional

class FeedbackRepository:
    
    @staticmethod
    def get_feedback_by_id(db: Session, feedback_id: int) -> Optional[Feedback]:
        """Get feedback by ID"""
        return db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
    
    @staticmethod
    def get_feedbacks_by_user_id(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Feedback]:
        """Get all feedbacks submitted by user"""
        return db.query(Feedback).filter(Feedback.user_id == user_id).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_feedback(db: Session, feedback_data: Dict[str, Any]) -> Feedback:
        """Create a new feedback"""
        feedback = Feedback(**feedback_data)
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback
    
    @staticmethod
    def update_feedback_status(db: Session, feedback_id: int, status: FeedbackStatus) -> Optional[Feedback]:
        """Update feedback status"""
        feedback = db.query(Feedback).filter(Feedback.feedback_id == feedback_id).first()
        
        if feedback:
            feedback.feedback_status = status
            
            # Set resolved_at timestamp if status is RESOLVED
            if status == FeedbackStatus.RESOLVED and not feedback.resolved_at:
                feedback.resolved_at = datetime.now()
            
            db.commit()
            db.refresh(feedback)
        
        return feedback
    
    @staticmethod
    def get_all_feedbacks(db: Session, skip: int = 0, limit: int = 100) -> List[Feedback]:
        """Get all feedbacks"""
        return db.query(Feedback).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_feedback_response(db: Session, response_data: Dict[str, Any]) -> FeedbackResponse:
        """Create a feedback response"""
        response = FeedbackResponse(**response_data)
        db.add(response)
        db.commit()
        db.refresh(response)
        return response
    
    @staticmethod
    def get_feedback_analytics(db: Session) -> Dict[str, Any]:
        """Get feedback statistics"""
        # Total feedbacks
        total_feedbacks = db.query(Feedback).count()
        
        # Feedback by status
        open_feedbacks = db.query(Feedback).filter(Feedback.feedback_status == FeedbackStatus.OPEN).count()
        in_progress_feedbacks = db.query(Feedback).filter(Feedback.feedback_status == FeedbackStatus.IN_PROGRESS).count()
        resolved_feedbacks = db.query(Feedback).filter(Feedback.feedback_status == FeedbackStatus.RESOLVED).count()
        
        # Average rating
        avg_rating_result = db.query(func.avg(Feedback.rating)).filter(Feedback.rating.isnot(None)).scalar()
        average_rating = float(avg_rating_result) if avg_rating_result else None
        
        # Feedbacks by type
        feedbacks_by_type = {}
        for feedback_type in FeedbackType:
            count = db.query(Feedback).filter(Feedback.feedback_type == feedback_type).count()
            feedbacks_by_type[feedback_type.value] = count
        
        return {
            "total_feedbacks": total_feedbacks,
            "open_feedbacks": open_feedbacks,
            "in_progress_feedbacks": in_progress_feedbacks,
            "resolved_feedbacks": resolved_feedbacks,
            "average_rating": average_rating,
            "feedbacks_by_type": feedbacks_by_type
        }

class UserIssueRepository:
    
    @staticmethod
    def get_issue_by_id(db: Session, issue_id: int) -> Optional[UserIssue]:
        """Get issue by ID"""
        return db.query(UserIssue).filter(UserIssue.issue_id == issue_id).first()
    
    @staticmethod
    def get_issues_by_user_id(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[UserIssue]:
        """Get all issues reported by user"""
        return db.query(UserIssue).filter(UserIssue.raised_by_id == user_id).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_issue(db: Session, issue_data: Dict[str, Any]) -> UserIssue:
        """Create a new user issue"""
        issue = UserIssue(**issue_data)
        db.add(issue)
        db.commit()
        db.refresh(issue)
        return issue
    
    @staticmethod
    def update_issue_status(db: Session, issue_id: int, status: str) -> Optional[UserIssue]:
        """Update issue status"""
        issue = db.query(UserIssue).filter(UserIssue.issue_id == issue_id).first()
        
        if issue:
            issue.status = status
            
            # Set resolved_at timestamp if status indicates resolution
            if status in ["FIXED", "RESOLVED"] and not issue.resolved_at:
                issue.resolved_at = datetime.now()
            
            db.commit()
            db.refresh(issue)
        
        return issue
    
    @staticmethod
    def get_all_issues(db: Session, skip: int = 0, limit: int = 100) -> List[UserIssue]:
        """Get all issues"""
        return db.query(UserIssue).offset(skip).limit(limit).all()