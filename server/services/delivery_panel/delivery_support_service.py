from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from repositories.delivery_panel.delivery_support_repository import DeliverySupportRepository
from schemas.delivery_panel.delivery_support_schema import (
    IssueSubmissionRequest,
    IssueSubmissionResponse,
    IssueCategory
)


class DeliverySupportService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliverySupportRepository()
    
    def submit_issue(
        self,
        delivery_person_id: int,
        request: IssueSubmissionRequest
    ) -> IssueSubmissionResponse:
        """
        Submit a support issue from delivery person
        """
        # Validate required fields
        if not request.message or len(request.message.strip()) < 10:
            return IssueSubmissionResponse(
                success=False,
                message="Please provide a detailed description (minimum 10 characters)."
            )
        
        # Validate order_id if provided
        if request.order_id:
            if not self.repository.validate_order_exists(self.db, request.order_id):
                return IssueSubmissionResponse(
                    success=False,
                    message=f"Order ID {request.order_id} not found."
                )
            
            # Optional: Validate if order is assigned to this delivery person
            if not self.repository.validate_delivery_association(
                self.db, delivery_person_id, request.order_id
            ):
                # Still allow submission but warn about association
                pass  # We'll still create the issue but without delivery_id
        
        # Get delivery person info for logging
        delivery_person_info = self.repository.get_delivery_person_info(
            self.db, delivery_person_id
        )
        
        if not delivery_person_info:
            return IssueSubmissionResponse(
                success=False,
                message="Delivery person not found."
            )
        
        # Map issue type to priority (simple mapping)
        priority_mapping = {
            IssueCategory.DELIVERY_ISSUE: "HIGH",
            IssueCategory.PAYMENT_ISSUE: "MEDIUM",
            IssueCategory.APP_TECHNICAL_ISSUE: "MEDIUM",
            IssueCategory.VEHICLE_ISSUE: "HIGH",
            IssueCategory.OTHER: "LOW"
        }
        
        priority = priority_mapping.get(request.issue_type, "MEDIUM")
        
        # Create issue record
        success = self.repository.create_issue_record(
            db=self.db,
            delivery_person_id=delivery_person_id,
            issue_type=request.issue_type.value,
            description=request.message,
            order_id=request.order_id,
            priority=priority
        )
        
        if success:
            return IssueSubmissionResponse(
                success=True,
                message="Issue submitted successfully. Our support team will review it and contact you if needed.",
                submission_time=datetime.now()
            )
        else:
            return IssueSubmissionResponse(
                success=False,
                message="Failed to submit issue. Please try again later."
            )
    
    def validate_delivery_person(self, delivery_person_id: int) -> bool:
        """
        Validate if delivery person exists and is active
        """
        delivery_person_info = self.repository.get_delivery_person_info(
            self.db, delivery_person_id
        )
        
        if not delivery_person_info:
            return False
        
        # Check if delivery person is active
        if delivery_person_info.get("status") != "ACTIVE":
            return False
        
        return True