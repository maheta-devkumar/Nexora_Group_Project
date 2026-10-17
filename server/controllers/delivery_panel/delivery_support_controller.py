from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional

from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_support_service import DeliverySupportService
from schemas.delivery_panel.delivery_support_schema import (
    IssueSubmissionRequest,
    IssueSubmissionResponse
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliverySupportController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliverySupportService(db)
    
    # ===== HELPER METHOD =====
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """
        Get delivery person ID from user
        """
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    # ===== ISSUE SUBMISSION =====
    
    def submit_issue(
        self,
        request: IssueSubmissionRequest,
        current_user: User
    ) -> IssueSubmissionResponse:
        """
        Submit a support issue from delivery person
        """
        try:
            # Get delivery person ID
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Validate delivery person is active
            if not self.service.validate_delivery_person(delivery_person_id):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Delivery person account is not active"
                )
            
            # Submit issue using service
            return self.service.submit_issue(delivery_person_id, request)
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to submit issue: {str(e)}"
            )
    
    # ===== HEALTH CHECK =====
    
    def health_check(self, current_user: User) -> dict:
        """
        Simple health check endpoint
        """
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return {
                "status": "healthy",
                "service": "delivery_support",
                "delivery_person_id": delivery_person_id,
                "message": "Support service is operational"
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Support service health check failed: {str(e)}"
            )