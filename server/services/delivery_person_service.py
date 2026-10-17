from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.delivery_person_repository import DeliveryPersonRepository
from repositories.user_repository import UserRepository
from services.notification_service import NotificationService
from schemas.delivery_schema import DeliveryPersonCreate
from typing import Dict, Any
from datetime import datetime
from utils.send_email import EmailService  # Import email service


class DeliveryPersonService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryPersonRepository()
        self.user_repository = UserRepository()
        self.notification_service = NotificationService(db)
        self.email_service = EmailService(db_session=db)  # Initialize email service
    
    def register_delivery_person(self, delivery_data: DeliveryPersonCreate) -> Dict[str, Any]:
        """Register a user as a delivery person"""
        # Check if user exists
        user = self.user_repository.get_user_by_id(self.db, delivery_data.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is already a delivery person
        existing_delivery_person = self.repository.get_delivery_person_by_user_id(self.db, delivery_data.user_id)
        if existing_delivery_person:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a delivery person"
            )
        
        # Create delivery person
        delivery_person_data = {
            "user_id": delivery_data.user_id,
            "license_number": delivery_data.license_number,
            "status": "PENDING"
        }
        
        delivery_person = self.repository.create_delivery_person(self.db, delivery_person_data)
        self.db.refresh(delivery_person)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR DELIVERY PERSON REGISTRATION
        # ============================================
        try:
            # Get user details for email
            user_name = f"{user.first_name} {user.last_name}"
            user_email = user.email
            
            # 1. Send email to delivery person (dp)
            dp_subject = "🎉 Welcome to Our Delivery Team!"
            dp_message = f"""
Dear {user_name},

Welcome to our delivery partner network! Your application to become a delivery person has been received and is currently under review.

Application Details:
- Applicant: {user_name}
- Email: {user_email}
- License Number: {delivery_data.license_number}
- Application Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: PENDING APPROVAL

Next Steps:
1. Our team will review your application
2. You'll receive approval notification within 2-3 business days
3. Once approved, you can start accepting delivery assignments
4. Complete onboarding process

What you can expect:
- Flexible working hours
- Competitive earnings per delivery
- Real-time delivery assignments
- Weekly payments
- Performance bonuses

In the meantime, please ensure:
- Your vehicle documents are ready
- You have a valid driver's license
- You're familiar with the local area

You'll receive an email once your application is approved.

Best regards,
Delivery Partner Team
"""
            self.email_service.send_to_user_by_id(user.user_id, dp_subject, dp_message)
            
            # 2. Send email to all admins (a)
            admin_subject = f"🛵 New Delivery Person Application - {user_name}"
            admin_message = f"""
NEW DELIVERY PERSON APPLICATION

Applicant Details:
- User ID: {user.user_id}
- Name: {user_name}
- Email: {user_email}
- Phone: {user.phone if user.phone else 'Not provided'}
- License Number: {delivery_data.license_number}
- Application Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: PENDING
- Delivery Person ID: {delivery_person.delivery_person_id}

User Information:
- Username: {user.username}
- Account Created: {user.created_at.strftime('%Y-%m-%d %H:%M:%S') if user.created_at else 'N/A'}
- Email Verified: {'Yes' if user.is_verified else 'No'}
- Account Active: {'Yes' if user.is_active else 'No'}

ACTION REQUIRED:
1. Review the application
2. Verify license details
3. Check background if needed
4. Approve or reject application
5. Notify applicant

The applicant has been notified that their application is under review.

Best regards,
Delivery Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail registration if email fails
            print(f"⚠️ Email sending failed but delivery person was registered: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR DELIVERY PERSON REGISTRATION
        # ============================================
        try:
            self._send_delivery_person_registration_notifications(delivery_person, user)
        except Exception as notif_error:
            print(f"⚠️ Delivery person registration notification failed: {notif_error}")
        
        return self._serialize_delivery_person(delivery_person)
    
    def get_all_delivery_persons(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all delivery persons with filtering"""
        result = self.repository.get_all_delivery_persons(self.db, page, per_page, status)
        
        delivery_persons_data = [
            self._serialize_delivery_person(dp) for dp in result["delivery_persons"]
        ]
        
        return {
            "delivery_persons": delivery_persons_data,
            "total_delivery_persons": result["total_delivery_persons"],
            "total_pages": result["total_pages"]
        }
    
    def get_delivery_person_by_id(self, delivery_person_id: int) -> Dict[str, Any]:
        """Get delivery person by ID"""
        delivery_person = self.repository.get_delivery_person_by_id(self.db, delivery_person_id)
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery person not found"
            )
        
        return self._serialize_delivery_person(delivery_person)
    
    def update_delivery_person_status(self, delivery_person_id: int, status: str) -> Dict[str, Any]:
        """Update delivery person status"""
        valid_statuses = ["PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )
        
        # Get current delivery person details before update
        current_delivery_person = self.repository.get_delivery_person_by_id(self.db, delivery_person_id)
        if not current_delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery person not found"
            )
        
        old_status = current_delivery_person.status
        
        # Update status
        delivery_person = self.repository.update_delivery_person_status(self.db, delivery_person_id, status)
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery person not found"
            )
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR STATUS UPDATE
        # ============================================
        try:
            # Get user details
            user = self.user_repository.get_user_by_id(self.db, delivery_person.user_id)
            if not user:
                return self._serialize_delivery_person(delivery_person)
            
            user_name = f"{user.first_name} {user.last_name}"
            
            # Status-specific messages
            status_messages = {
                "ACTIVE": "Your application has been approved! You can now start accepting delivery assignments.",
                "INACTIVE": "Your delivery account has been marked as inactive. You cannot accept new deliveries.",
                "SUSPENDED": "Your delivery account has been suspended. Please contact support for more information.",
                "PENDING": "Your status has been changed to pending review."
            }
            
            # 1. Send email to delivery person (dp) about status change
            dp_subject = f"📋 Delivery Account Status Updated - {status}"
            dp_message = f"""
Dear {user_name},

Your delivery partner account status has been updated.

Account Details:
- Name: {user_name}
- Email: {user.email}
- Delivery Person ID: {delivery_person.delivery_person_id}
- Previous Status: {old_status}
- New Status: {status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

{status_messages.get(status, f"Your status has been changed to {status}.")}

{
    "ACTIVE": "You can now:\n1. Log in to the delivery app\n2. Accept delivery assignments\n3. Start earning\n4. View your dashboard",
    "INACTIVE": "Your account is inactive. To reactivate:\n1. Contact support\n2. Complete any required updates\n3. Wait for reactivation approval",
    "SUSPENDED": "Your account has been suspended. Please:\n1. Contact support immediately\n2. Resolve any issues\n3. Follow reactivation process",
    "PENDING": "Your application is under review. We'll notify you once a decision is made."
}.get(status, "")

If you have any questions, please contact our delivery support team.

Best regards,
Delivery Partner Team
"""
            self.email_service.send_to_user_by_id(user.user_id, dp_subject, dp_message)
            
            # 2. Send email to all admins (a)
            admin_subject = f"📊 Delivery Person Status Updated - {user_name}"
            admin_message = f"""
DELIVERY PERSON STATUS UPDATE

Delivery Person Details:
- Delivery Person ID: {delivery_person.delivery_person_id}
- Name: {user_name}
- Email: {user.email}
- Phone: {user.phone if user.phone else 'Not provided'}
- License Number: {delivery_person.license_number}
- Previous Status: {old_status}
- New Status: {status}
- Updated By: System/Admin
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Status Change Information:
{status_messages.get(status, f"Status changed from {old_status} to {status}.")}

Delivery Statistics:
- Total Deliveries: {self.repository.get_delivery_stats(self.db, delivery_person_id).get('total_deliveries', 0)}
- Total Earnings: ${self.repository.get_delivery_stats(self.db, delivery_person_id).get('total_earnings', 0):.2f}
- Rating: {delivery_person.rating:.1f if hasattr(delivery_person.rating, '__float__') else 0.0}/5.0

The delivery person has been notified about the status change.

Best regards,
Delivery Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail status update if email fails
            print(f"⚠️ Email sending failed but status was updated: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR STATUS UPDATE
        # ============================================
        try:
            user = self.user_repository.get_user_by_id(self.db, delivery_person.user_id)
            if user:
                self._send_delivery_person_status_notifications(delivery_person, user, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Delivery person status notification failed: {notif_error}")
        
        return self._serialize_delivery_person(delivery_person)
    
    def update_delivery_person_rating(self, delivery_person_id: int, rating: float) -> Dict[str, Any]:
        """Update delivery person rating"""
        if rating < 0 or rating > 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 0 and 5"
            )
        
        delivery_person = self.repository.update_delivery_person_rating(self.db, delivery_person_id, rating)
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery person not found"
            )
        
        # ============================================
        # SEND DATABASE NOTIFICATION FOR RATING UPDATE (Optional)
        # ============================================
        try:
            user = self.user_repository.get_user_by_id(self.db, delivery_person.user_id)
            if user:
                self._send_delivery_person_rating_notification(delivery_person, user, rating)
        except Exception as notif_error:
            print(f"⚠️ Delivery person rating notification failed: {notif_error}")
        
        return self._serialize_delivery_person(delivery_person)
    
    def get_my_delivery_profile(self, user_id: int) -> Dict[str, Any]:
        """Get current user's delivery profile"""
        delivery_person = self.repository.get_delivery_person_by_user_id(self.db, user_id)
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery profile not found"
            )
        
        return self._serialize_delivery_person(delivery_person)
    
    def _serialize_delivery_person(self, delivery_person) -> Dict[str, Any]:
        """Serialize delivery person with user details and stats"""
        user = self.user_repository.get_user_by_id(self.db, delivery_person.user_id)
        stats = self.repository.get_delivery_stats(self.db, delivery_person.delivery_person_id)
        
        return {
            "delivery_person_id": delivery_person.delivery_person_id,
            "user_id": delivery_person.user_id,
            "user_name": f"{user.first_name} {user.last_name}" if user else "Unknown",
            "email": user.email if user else "Unknown",
            "phone": user.phone if user else "Unknown",
            "license_number": delivery_person.license_number,
            "status": delivery_person.status,
            "rating": float(delivery_person.rating),
            "total_deliveries": stats["total_deliveries"],
            "total_earnings": stats["total_earnings"],
            "joined_at": delivery_person.joined_at
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_delivery_person_registration_notifications(self, delivery_person, user):
        """Send database notifications when a user registers as delivery person"""
        try:
            # Get all admin users
            admin_users = self.user_repository.get_admin_users(self.db)
            
            user_name = f"{user.first_name} {user.last_name}"
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🛵 New Delivery Person Registration",
                    message=f"New delivery person application from {user_name} (User ID: {user.user_id}). " +
                              f"License: {delivery_person.license_number}. Status: {delivery_person.status}.",
                    type="DELIVERY_PERSON",
                    reference_id=delivery_person.delivery_person_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery person registration notification: {e}")

    def _send_delivery_person_status_notifications(self, delivery_person, user, old_status: str, new_status: str):
        """Send database notifications when delivery person status changes"""
        try:
            # Get all admin users
            admin_users = self.user_repository.get_admin_users(self.db)
            
            user_name = f"{user.first_name} {user.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "ACTIVE": "✅",
                "INACTIVE": "⏸️",
                "SUSPENDED": "🚫",
                "PENDING": "⏳"
            }
            
            emoji = status_emojis.get(new_status, "📋")
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Delivery Person Status Updated",
                    message=f"Delivery person {user_name} (ID: {delivery_person.delivery_person_id}) " +
                              f"status changed from '{old_status}' to '{new_status}'.",
                    type="DELIVERY_PERSON",
                    reference_id=delivery_person.delivery_person_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery person status notification: {e}")

    def _send_delivery_person_rating_notification(self, delivery_person, user, new_rating: float):
        """Send database notifications when delivery person rating is updated"""
        try:
            # Get all admin users
            admin_users = self.user_repository.get_admin_users(self.db)
            
            user_name = f"{user.first_name} {user.last_name}"
            old_rating = float(delivery_person.rating) if hasattr(delivery_person, 'rating') and delivery_person.rating else 0.0
            
            # Only send notification if rating changed significantly (0.5 or more)
            if abs(new_rating - old_rating) < 0.5:
                return
            
            # Determine rating trend
            if new_rating > old_rating:
                trend = "increased"
                emoji = "📈"
            elif new_rating < old_rating:
                trend = "decreased"
                emoji = "📉"
            else:
                trend = "unchanged"
                emoji = "📊"
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Delivery Person Rating Updated",
                    message=f"Delivery person {user_name} (ID: {delivery_person.delivery_person_id}) " +
                              f"rating {trend} from {old_rating:.1f}/5.0 to {new_rating:.1f}/5.0.",
                    type="DELIVERY_PERSON",
                    reference_id=delivery_person.delivery_person_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery person rating notification: {e}")