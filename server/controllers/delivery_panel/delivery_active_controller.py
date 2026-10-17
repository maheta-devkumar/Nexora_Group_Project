# delivery_panel/active_deliveries/delivery_active_controller.py
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List

from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_active_service import DeliveryActiveService
from schemas.delivery_panel.delivery_active_schema import (
    ActiveDeliveriesListResponse, DeliveryResponse, StatusUpdateRequest,
    LocationUpdateResponse, CustomerCallResponse, NavigationDataResponse,
    SuccessResponse, DeliveryStatistics, StatusTransitionResponse,
    ProgressUpdateRequest, DeliveryStatus,
    DeliveryOTPRequestResponse, DeliveryOTPConfirmRequest, DeliveryOTPConfirmResponse
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliveryActiveController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryActiveService(db)
    
    # ===== HELPER METHOD =====
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    # ===== ACTIVE DELIVERIES =====
    
    def get_active_deliveries(self, current_user: User) -> ActiveDeliveriesListResponse:
        """Get all active deliveries for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_active_deliveries(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get active deliveries: {str(e)}"
            )
    
    def get_delivery_by_id(self, delivery_id: int, current_user: User) -> DeliveryResponse:
        """Get specific delivery by ID"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_delivery_by_id(delivery_id, delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get delivery: {str(e)}"
            )
    
    def get_delivery_statistics(self, current_user: User) -> DeliveryStatistics:
        """Get delivery statistics"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_delivery_statistics(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get delivery statistics: {str(e)}"
            )
    
    # ===== OTP & COMPLETION =====
    
    def request_delivery_otp(self, delivery_id: int, current_user: User) -> DeliveryOTPRequestResponse:
        """Request OTP"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.request_delivery_otp(delivery_id, delivery_person_id)
        except ValueError as e:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception as e:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
            
    def confirm_delivery(
        self, 
        delivery_id: int, 
        request: DeliveryOTPConfirmRequest,
        current_user: User
    ) -> DeliveryOTPConfirmResponse:
        """Confirm delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.confirm_delivery_otp(delivery_id, delivery_person_id, request)
        except Exception as e:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    # ===== STATUS UPDATES =====
    
    def update_delivery_status(
        self, 
        delivery_id: int, 
        request: StatusUpdateRequest,
        current_user: User
    ) -> DeliveryResponse:
        """Update delivery status"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_delivery_status(
                delivery_id, delivery_person_id, request
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update delivery status: {str(e)}"
            )
    
    def mark_delivery_delivered(
        self,
        delivery_id: int,
        request: StatusUpdateRequest,
        current_user: User
    ) -> DeliveryResponse:
        """Mark delivery as delivered"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            # Ensure status is DELIVERED in request for consistency
            request.status = DeliveryStatus.DELIVERED
            return self.service.mark_delivery_delivered(
                delivery_id, delivery_person_id, request
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to complete delivery: {str(e)}"
            )
    
    def validate_status_transition(
        self,
        delivery_id: int,
        target_status: str,
        current_user: User
    ) -> StatusTransitionResponse:
        """Validate if status transition is allowed"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.validate_status_transition(
                delivery_id, delivery_person_id, target_status
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to validate status transition: {str(e)}"
            )
    
    def update_delivery_progress(
        self,
        delivery_id: int,
        request: ProgressUpdateRequest,
        current_user: User
    ) -> DeliveryResponse:
        """Update delivery progress with location"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_delivery_progress(
                delivery_id, delivery_person_id, request
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update delivery progress: {str(e)}"
            )
    
    # ===== LOCATION UPDATES =====
    
    def update_delivery_person_location(
        self,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None,
        current_user: User = None
    ) -> LocationUpdateResponse:
        """Update delivery person's current location"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.update_delivery_person_location(
                delivery_person_id, latitude, longitude, accuracy
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update location: {str(e)}"
            )
    
    # ===== CUSTOMER CALL =====
    
    def get_customer_contact_info(
        self, 
        delivery_id: int,
        current_user: User
    ) -> CustomerCallResponse:
        """Get customer contact information for calling"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_customer_contact_info(
                delivery_id, delivery_person_id
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get customer information: {str(e)}"
            )
    
    # ===== NAVIGATION =====
    
    def get_delivery_navigation_data(
        self, 
        delivery_id: int,
        current_user: User
    ) -> NavigationDataResponse:
        """Get navigation data for delivery"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_delivery_navigation_data(
                delivery_id, delivery_person_id
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get navigation data: {str(e)}"
            )
    
    # ===== ADDITIONAL METHODS =====
    
    def get_todays_deliveries(self, current_user: User) -> ActiveDeliveriesListResponse:
        """Get all deliveries assigned today"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_todays_deliveries(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get today's deliveries: {str(e)}"
            )
    
    def get_deliveries_by_status(
        self,
        status: str,
        current_user: User
    ) -> ActiveDeliveriesListResponse:
        """Get deliveries by specific status"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_deliveries_by_status(delivery_person_id, status)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get deliveries by status: {str(e)}"
            )
    
    # ===== HEALTH CHECK =====
    
    def health_check(self, current_user: User) -> SuccessResponse:
        """Health check for active deliveries module"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Try to get active deliveries as a test
            result = self.service.get_active_deliveries(delivery_person_id)
            
            if result.success:
                return SuccessResponse(
                    success=True,
                    message="Active deliveries module is working correctly",
                    timestamp=result.timestamp if hasattr(result, 'timestamp') else None
                )
            else:
                return SuccessResponse(
                    success=False,
                    message=f"Active deliveries module test failed: {result.message}",
                    timestamp=None
                )
                
        except Exception as e:
            return SuccessResponse(
                success=False,
                message=f"Active deliveries module health check failed: {str(e)}",
                timestamp=None
            )