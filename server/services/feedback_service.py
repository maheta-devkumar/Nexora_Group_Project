from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.feedback_repository import FeedbackRepository, UserIssueRepository
from repositories.user_repository import UserRepository
from repositories.order_repository import OrderRepository
from repositories.notification_repository import NotificationRepository  # ADD THIS
from schemas.feedback_schema import FeedbackCreate, FeedbackResponseCreate, UserIssueCreate
from models.feedback.feedback import FeedbackStatus
from typing import Dict, Any, List
from datetime import datetime

class FeedbackService:
    
    def __init__(self, db: Session):
        self.db = db
        self.feedback_repo = FeedbackRepository()
        self.issue_repo = UserIssueRepository()
        self.user_repo = UserRepository()
        self.order_repo = OrderRepository()
        self.notification_repo = NotificationRepository()  # ADD THIS
    
    def create_feedback(self, feedback_data: FeedbackCreate, user_id: int) -> Dict[str, Any]:
        """Create a new feedback"""
        # Validate order exists if provided
        if feedback_data.order_id:
            order = self.order_repo.get_order_by_id(self.db, feedback_data.order_id)
            if not order:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
        
        # Validate user exists
        user = self.user_repo.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create feedback with correct column name feedback_status
        feedback_data_dict = {
            "user_id": user_id,
            "order_id": feedback_data.order_id,
            "feedback_type": feedback_data.feedback_type,
            "subject": feedback_data.subject,
            "message": feedback_data.message,
            "rating": feedback_data.rating,
            "feedback_status": FeedbackStatus.OPEN  # Use feedback_status instead of status
        }
        
        feedback = self.feedback_repo.create_feedback(self.db, feedback_data_dict)
        
        # ============================================
        # SEND NOTIFICATION FOR NEW FEEDBACK
        # ============================================
        try:
            self._send_feedback_created_notifications(feedback, user)
        except Exception as notif_error:
            print(f"⚠️ Feedback creation notification failed: {notif_error}")
        
        return self._serialize_feedback(feedback)
    
    def get_user_feedbacks(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all feedbacks submitted by current user"""
        feedbacks = self.feedback_repo.get_feedbacks_by_user_id(self.db, user_id, skip, limit)
        
        return [self._serialize_feedback(feedback) for feedback in feedbacks]
    
    def get_feedback_details(self, feedback_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed feedback with admin responses"""
        feedback = self.feedback_repo.get_feedback_by_id(self.db, feedback_id)
        if not feedback or feedback.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        # Get responses
        responses_data = []
        for response in feedback.responses:
            responses_data.append({
                "response_id": response.response_id,
                "feedback_id": response.feedback_id,
                "admin_id": response.admin_id,
                "response_message": response.response_message,
                "created_at": response.created_at
            })
        
        result = self._serialize_feedback(feedback)
        result["responses"] = responses_data
        return result
    
    def update_feedback_status(self, feedback_id: int, user_id: int, status: FeedbackStatus) -> Dict[str, str]:
        """Update feedback status"""
        feedback = self.feedback_repo.get_feedback_by_id(self.db, feedback_id)
        if not feedback or feedback.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        # Store old status for notification
        old_status = feedback.feedback_status
        
        updated_feedback = self.feedback_repo.update_feedback_status(self.db, feedback_id, status)
        if not updated_feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        # ============================================
        # SEND NOTIFICATION FOR FEEDBACK STATUS UPDATE
        # ============================================
        try:
            user = self.user_repo.get_user_by_id(self.db, user_id)
            if user:
                self._send_feedback_status_notifications(updated_feedback, user, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Feedback status notification failed: {notif_error}")
        
        return {"message": f"Feedback status updated to {status}"}
    
    def create_issue(self, issue_data: UserIssueCreate, user_id: int) -> Dict[str, Any]:
        """Create a new user issue (for delivery persons)"""
        # Validate order exists
        order = self.order_repo.get_order_by_id(self.db, issue_data.order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Create issue
        issue_data_dict = {
            "raised_by_id": user_id,
            "raised_by_role": issue_data.raised_by_role,
            "order_id": issue_data.order_id,
            "delivery_id": issue_data.delivery_id,
            "issue_type": issue_data.issue_type,
            "title": issue_data.title,
            "description": issue_data.description,
            "priority": issue_data.priority
        }
        
        issue = self.issue_repo.create_issue(self.db, issue_data_dict)
        
        # ============================================
        # SEND NOTIFICATION FOR NEW ISSUE
        # ============================================
        try:
            user = self.user_repo.get_user_by_id(self.db, user_id)
            if user:
                self._send_issue_created_notifications(issue, user, order)
        except Exception as notif_error:
            print(f"⚠️ Issue creation notification failed: {notif_error}")
        
        return self._serialize_issue(issue)
    
    def get_user_issues(self, user_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all issues reported by current user"""
        issues = self.issue_repo.get_issues_by_user_id(self.db, user_id, skip, limit)
        
        return [self._serialize_issue(issue) for issue in issues]
    
    def update_issue_status(self, issue_id: int, user_id: int, status: str) -> Dict[str, str]:
        """Update issue status"""
        issue = self.issue_repo.get_issue_by_id(self.db, issue_id)
        if not issue or issue.raised_by_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )
        
        # Store old status for notification
        old_status = issue.status
        
        updated_issue = self.issue_repo.update_issue_status(self.db, issue_id, status)
        if not updated_issue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Issue not found"
            )
        
        # ============================================
        # SEND NOTIFICATION FOR ISSUE STATUS UPDATE
        # ============================================
        try:
            user = self.user_repo.get_user_by_id(self.db, user_id)
            if user:
                self._send_issue_status_notifications(updated_issue, user, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Issue status notification failed: {notif_error}")
        
        return {"message": f"Issue status updated to {status}"}
    
    def get_all_feedbacks(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all feedbacks (admin only)"""
        feedbacks = self.feedback_repo.get_all_feedbacks(self.db, skip, limit)
        
        return [self._serialize_feedback(feedback) for feedback in feedbacks]
    
    def get_all_issues(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all issues (admin only)"""
        issues = self.issue_repo.get_all_issues(self.db, skip, limit)
        
        return [self._serialize_issue(issue) for issue in issues]
    
    def respond_to_feedback(self, feedback_id: int, admin_id: int, response_data: FeedbackResponseCreate) -> Dict[str, Any]:
        """Admin responds to feedback"""
        feedback = self.feedback_repo.get_feedback_by_id(self.db, feedback_id)
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Feedback not found"
            )
        
        # Create response
        response_data_dict = {
            "feedback_id": feedback_id,
            "admin_id": admin_id,
            "response_message": response_data.response_message
        }
        
        response = self.feedback_repo.create_feedback_response(self.db, response_data_dict)
        
        # Update feedback status to IN_PROGRESS if it was OPEN
        old_status = feedback.feedback_status
        if feedback.feedback_status == FeedbackStatus.OPEN:
            feedback.feedback_status = FeedbackStatus.IN_PROGRESS
            self.db.commit()
        
        # ============================================
        # SEND NOTIFICATION FOR FEEDBACK RESPONSE
        # ============================================
        try:
            # Get feedback user
            feedback_user = self.user_repo.get_user_by_id(self.db, feedback.user_id)
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            
            if feedback_user and admin_user:
                self._send_feedback_response_notifications(feedback, feedback_user, admin_user, response)
        except Exception as notif_error:
            print(f"⚠️ Feedback response notification failed: {notif_error}")
        
        return {
            "response_id": response.response_id,
            "feedback_id": response.feedback_id,
            "admin_id": response.admin_id,
            "response_message": response.response_message,
            "created_at": response.created_at
        }
    
    def get_feedback_analytics(self) -> Dict[str, Any]:
        """Get feedback statistics for admin dashboard"""
        return self.feedback_repo.get_feedback_analytics(self.db)
    
    def _serialize_feedback(self, feedback: Feedback) -> Dict[str, Any]:
        """Serialize feedback data"""
        return {
            "feedback_id": feedback.feedback_id,
            "user_id": feedback.user_id,
            "order_id": feedback.order_id,
            "feedback_type": feedback.feedback_type,
            "subject": feedback.subject,
            "message": feedback.message,
            "rating": feedback.rating,
            "feedback_status": feedback.feedback_status,
            "created_at": feedback.created_at,
            "resolved_at": feedback.resolved_at
        }
    
    def _serialize_issue(self, issue: UserIssue) -> Dict[str, Any]:
        """Serialize issue data"""
        return {
            "issue_id": issue.issue_id,
            "raised_by_id": issue.raised_by_id,
            "raised_by_role": issue.raised_by_role,
            "order_id": issue.order_id,
            "delivery_id": issue.delivery_id,
            "issue_type": issue.issue_type,
            "title": issue.title,
            "description": issue.description,
            "priority": issue.priority,
            "status": issue.status,
            "resolution_note": issue.resolution_note,
            "created_at": issue.created_at,
            "resolved_at": issue.resolved_at
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_feedback_created_notifications(self, feedback, user):
        """Send notifications when new feedback is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            user_name = f"{user.first_name} {user.last_name}"
            feedback_type_emoji = {
                "GENERAL": "💬",
                "COMPLAINT": "⚠️",
                "SUGGESTION": "💡",
                "COMPLIMENT": "🌟",
                "BUG_REPORT": "🐛"
            }
            emoji = feedback_type_emoji.get(feedback.feedback_type, "📝")
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                order_info = f" for Order #{feedback.order_id}" if feedback.order_id else ""
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{emoji} New Feedback Received",
                    'message': f"New {feedback.feedback_type.lower()} feedback from {user_name}{order_info}. Subject: '{feedback.subject}'",
                    'type': "FEEDBACK",
                    'reference_id': feedback.feedback_id
                }
                notifications_data.append(notification_dict)
            
            # Also send notification to the user who submitted feedback
            user_notification = {
                'user_id': user.user_id,
                'title': f"{emoji} Feedback Submitted",
                'message': f"Thank you for your feedback! Your {feedback.feedback_type.lower()} '{feedback.subject}' has been received.",
                'type': "FEEDBACK",
                'reference_id': feedback.feedback_id
            }
            notifications_data.append(user_notification)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send feedback creation notifications: {e}")

    def _send_feedback_status_notifications(self, feedback, user, old_status: FeedbackStatus, new_status: FeedbackStatus):
        """Send notifications when feedback status changes"""
        try:
            # Status emoji mapping
            status_emojis = {
                "OPEN": "📝",
                "IN_PROGRESS": "🔄",
                "RESOLVED": "✅",
                "CLOSED": "🔒"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            user_name = f"{user.first_name} {user.last_name}"
            
            # 1. Send notification to user who submitted feedback
            user_notification = {
                'user_id': user.user_id,
                'title': f"{new_emoji} Feedback Status Updated",
                'message': f"Your feedback '{feedback.subject}' status changed from {old_status} to {new_status}.",
                'type': "FEEDBACK",
                'reference_id': feedback.feedback_id
            }
            
            # 2. Send notifications to admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            admin_notifications = []
            
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{new_emoji} Feedback Status Updated",
                    'message': f"Feedback #{feedback.feedback_id} from {user_name} changed from {old_status} to {new_status}.",
                    'type': "FEEDBACK",
                    'reference_id': feedback.feedback_id
                }
                admin_notifications.append(notification_dict)
            
            # Combine all notifications
            all_notifications = [user_notification] + admin_notifications
            
            if all_notifications:
                self.notification_repo.create_bulk_notifications(self.db, all_notifications)
                
        except Exception as e:
            print(f"⚠️ Failed to send feedback status notifications: {e}")

    def _send_issue_created_notifications(self, issue, user, order):
        """Send notifications when new issue is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            user_name = f"{user.first_name} {user.last_name}"
            
            # Priority emoji mapping
            priority_emojis = {
                "HIGH": "🔴",
                "MEDIUM": "🟡",
                "LOW": "🟢"
            }
            priority_emoji = priority_emojis.get(issue.priority, "⚪")
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{priority_emoji} New Issue Reported",
                    'message': f"New {issue.issue_type.lower()} issue from {user_name} ({issue.raised_by_role}) for Order #{issue.order_id}. Priority: {issue.priority}",
                    'type': "ISSUE",
                    'reference_id': issue.issue_id
                }
                notifications_data.append(notification_dict)
            
            # Also send notification to the user who reported issue
            user_notification = {
                'user_id': user.user_id,
                'title': f"{priority_emoji} Issue Reported",
                'message': f"Your {issue.issue_type.lower()} issue '{issue.title}' has been reported. Our team will look into it.",
                'type': "ISSUE",
                'reference_id': issue.issue_id
            }
            notifications_data.append(user_notification)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send issue creation notifications: {e}")

    def _send_issue_status_notifications(self, issue, user, old_status: str, new_status: str):
        """Send notifications when issue status changes"""
        try:
            user_name = f"{user.first_name} {user.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "OPEN": "📝",
                "IN_PROGRESS": "🔄",
                "RESOLVED": "✅",
                "CLOSED": "🔒"
            }
            
            new_emoji = status_emojis.get(new_status, "📊")
            
            # 1. Send notification to user who reported issue
            user_notification = {
                'user_id': user.user_id,
                'title': f"{new_emoji} Issue Status Updated",
                'message': f"Your issue '{issue.title}' status changed from {old_status} to {new_status}.",
                'type': "ISSUE",
                'reference_id': issue.issue_id
            }
            
            # 2. Send notifications to admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            admin_notifications = []
            
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{new_emoji} Issue Status Updated",
                    'message': f"Issue #{issue.issue_id} from {user_name} changed from {old_status} to {new_status}.",
                    'type': "ISSUE",
                    'reference_id': issue.issue_id
                }
                admin_notifications.append(notification_dict)
            
            # Combine all notifications
            all_notifications = [user_notification] + admin_notifications
            
            if all_notifications:
                self.notification_repo.create_bulk_notifications(self.db, all_notifications)
                
        except Exception as e:
            print(f"⚠️ Failed to send issue status notifications: {e}")

    def _send_feedback_response_notifications(self, feedback, feedback_user, admin_user, response):
        """Send notifications when admin responds to feedback"""
        try:
            feedback_user_name = f"{feedback_user.first_name} {feedback_user.last_name}"
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # 1. Send notification to user who submitted feedback
            user_notification = {
                'user_id': feedback_user.user_id,
                'title': "💬 Response to Your Feedback",
                'message': f"Admin {admin_name} has responded to your feedback '{feedback.subject}'.",
                'type': "FEEDBACK",
                'reference_id': feedback.feedback_id
            }
            
            # 2. Send notifications to other admin users (excluding the one who responded)
            admin_users = self.user_repo.get_admin_users(self.db)
            admin_notifications = []
            
            for admin in admin_users:
                if admin.user_id != admin_user.user_id:  # Exclude the responding admin
                    notification_dict = {
                        'user_id': admin.user_id,
                        'title': "💬 Feedback Response Added",
                        'message': f"Admin {admin_name} responded to feedback #{feedback.feedback_id} from {feedback_user_name}.",
                        'type': "FEEDBACK",
                        'reference_id': feedback.feedback_id
                    }
                    admin_notifications.append(notification_dict)
            
            # 3. Send notification to the responding admin (confirmation)
            admin_confirmation = {
                'user_id': admin_user.user_id,
                'title': "✅ Response Sent",
                'message': f"Your response has been sent to {feedback_user_name} for feedback '{feedback.subject}'.",
                'type': "FEEDBACK",
                'reference_id': feedback.feedback_id
            }
            
            # Combine all notifications
            all_notifications = [user_notification] + admin_notifications + [admin_confirmation]
            
            if all_notifications:
                self.notification_repo.create_bulk_notifications(self.db, all_notifications)
                
        except Exception as e:
            print(f"⚠️ Failed to send feedback response notifications: {e}")