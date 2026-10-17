from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_pickup_service import DeliveryPickupService
from schemas.delivery_panel.delivery_pickup_schema import (
    PendingPickupsResponse, PickupDetailsResponse, ConfirmPickupRequest, ConfirmPickupResponse,
    NavigationResponse, VendorContactResponse, DeliveryPickupResponse,
    PickupFilters
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery import Delivery


class DeliveryPickupController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryPickupService(db)
    
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
    
    # ===== PENDING PICKUPS =====
    
    def get_pending_pickups(
        self,
        current_user: User,
        vendor_type: Optional[str] = None,
        sort_by: str = "nearest",
        pickup_location_id: Optional[int] = None
    ) -> PendingPickupsResponse:
        """Get all pending pickups for delivery person"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Build filters
            filters = PickupFilters(
                vendor_type=vendor_type,
                sort_by=sort_by,
                pickup_location_id=pickup_location_id
            )
            
            return self.service.get_pending_pickups(delivery_person_id, filters)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get pending pickups: {str(e)}"
            )
    
    def get_pickup_details(
        self,
        delivery_id: int,
        current_user: User
    ) -> PickupDetailsResponse:
        """Get detailed information for specific pickup"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Get pickup details using service (which will handle repository calls)
            return self.service.get_pickup_details(delivery_person_id, delivery_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get pickup details: {str(e)}"
            )
    
    # ===== QR VERIFICATION =====
    
    

    
    # ===== PICKUP CONFIRMATION =====
    
    def confirm_pickup(
        self,
        request: ConfirmPickupRequest,
        current_user: User
    ) -> ConfirmPickupResponse:
        """Confirm pickup after QR verification"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # First check if delivery exists and belongs to delivery person
            delivery = self.db.query(Delivery).filter(
                Delivery.delivery_id == request.delivery_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pickup not found or you don't have access"
                )
            
            # Then check if it's in ASSIGNED status for confirmation
            if delivery.status != "ASSIGNED":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Pickup already {delivery.status.lower().replace('_', ' ')}. Cannot confirm pickup."
                )
            
            return self.service.confirm_pickup(delivery_person_id, request)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to confirm pickup: {str(e)}"
            )
    
    # ===== NAVIGATION =====
    
    def get_navigation_details(
        self,
        delivery_id: int,
        current_user: User
    ) -> NavigationResponse:
        """Get navigation details for pickup location"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Check if delivery exists and belongs to delivery person
            delivery = self.db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pickup not found or you don't have access"
                )
            
            return self.service.get_navigation_details(delivery_person_id, delivery_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get navigation details: {str(e)}"
            )
    
    # ===== VENDOR CONTACT =====
    
    def get_vendor_contact(
        self,
        delivery_id: int,
        current_user: User
    ) -> VendorContactResponse:
        """Get vendor contact information"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Check if delivery exists and belongs to delivery person
            delivery = self.db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pickup not found or you don't have access"
                )
            
            return self.service.get_vendor_contact(delivery_person_id, delivery_id)
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get vendor contact: {str(e)}"
            )
    
    # ===== UTILITY METHODS =====
    
    def get_optimized_route(
        self,
        current_user: User
    ) -> DeliveryPickupResponse:
        """Get optimized route for all pending pickups"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            route = self.service.get_optimized_pickup_route(delivery_person_id)
            
            total_distance = sum(point["distance_km"] for point in route) if route else 0
            total_time = sum(point["estimated_minutes"] for point in route) if route else 0
            
            return DeliveryPickupResponse(
                success=True,
                message=f"Route with {len(route)} stops optimized",
                data={
                    "route": route,
                    "summary": {
                        "total_stops": len(route),
                        "total_distance_km": round(total_distance, 2),
                        "total_time_minutes": total_time,
                        "estimated_completion_time": f"{total_time // 60}h {total_time % 60}m"
                    }
                }
            )
            
        except Exception as e:
            return DeliveryPickupResponse(
                success=False,
                message=f"Failed to optimize route: {str(e)}",
                data=None
            )
    
    def get_pickup_statistics(
        self,
        current_user: User
    ) -> DeliveryPickupResponse:
        """Get statistics for pending pickups"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Get all pending pickups
            response = self.service.get_pending_pickups(delivery_person_id)
            
            stats = {
                "total_pending": response.total_count,
                "by_vendor_type": response.stats.get("by_vendor_type", {}),
                "urgent_count": response.stats.get("urgent", 0),
                "with_contact": response.stats.get("with_contact", 0),
                "location_groups": len(response.grouped_by_location),
                "average_items_per_pickup": sum(
                    p.total_items for p in response.pending_pickups
                ) / response.total_count if response.total_count > 0 else 0
            }
            
            return DeliveryPickupResponse(
                success=True,
                message="Pickup statistics retrieved",
                data=stats
            )
            
        except Exception as e:
            return DeliveryPickupResponse(
                success=False,
                message=f"Failed to get statistics: {str(e)}",
                data=None
            )