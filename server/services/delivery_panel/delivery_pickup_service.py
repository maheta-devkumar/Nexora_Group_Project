from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

from repositories.delivery_panel.delivery_pickup_repository import DeliveryPickupRepository
from schemas.delivery_panel.delivery_pickup_schema import (
    PendingPickup, PendingPickupsResponse, PickupLocationGroup,
    PickupDetailsResponse, ConfirmPickupRequest, ConfirmPickupResponse, NavigationResponse,
    VendorContactResponse, DeliveryPickupResponse, PickupFilters,
    PickupStatus, VendorType, VendorDetails, PickupLocation, PickupItem
)
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.order.order import Order
from models.user import User as UserModel

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class DeliveryPickupService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryPickupRepository()
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    # ===== PICKUPS BY STATUS =====
    
    def get_pickups_by_status(
        self, 
        delivery_person_id: int,
        status: Union[str, List[str]] = "ASSIGNED",
        filters: Optional[PickupFilters] = None
    ) -> PendingPickupsResponse:
        """Get pickups by status for delivery person"""
        # Convert filters to dict
        filter_dict = filters.dict(exclude_none=True) if filters else {}
        
        # Get pickups from repository
        pickups_data = self.repository.get_pickups_by_status(
            self.db, delivery_person_id, status, filter_dict
        )
        
        # Convert to PendingPickup objects
        pending_pickups = []
        for pickup_data in pickups_data:
            # Convert vendor info
            vendor_data = pickup_data["vendor"]
            vendor = VendorDetails(**vendor_data)
            
            # Convert pickup location
            location_data = pickup_data["pickup_location"]
            pickup_location = PickupLocation(**location_data)
            
            # Convert items
            items = [
                PickupItem(**item) for item in pickup_data["items"]
            ]
            
            # Create PendingPickup object
            pickup = PendingPickup(
                delivery_id=pickup_data["delivery_id"],
                order_id=pickup_data["order_id"],
                delivery_number=pickup_data["delivery_number"],
                order_number=pickup_data["order_number"],
                vendor=vendor,
                pickup_location=pickup_location,
                items=items,
                total_items=pickup_data["total_items"],
                order_amount=pickup_data["order_amount"],
                payment_type=pickup_data["payment_type"],
                status=pickup_data["status"],
                status_text=pickup_data["status_text"],
                assigned_at=pickup_data["assigned_at"],
                expected_pickup_time=pickup_data["expected_pickup_time"],
                pickup_time_slot=pickup_data["pickup_time_slot"],
                available_actions=pickup_data["available_actions"],
                priority=pickup_data["priority"],
                notes=pickup_data["notes"]
            )
            pending_pickups.append(pickup)
        
        # Group pickups by location
        location_groups_data = self.repository.group_pickups_by_location(
            self.db, delivery_person_id, status
        )
        
        location_groups = []
        for group_data in location_groups_data:
            # Get pickups for this location
            location_pickups = [
                p for p in pending_pickups 
                if p.pickup_location.location_id == group_data["location_id"]
            ]
            
            group = PickupLocationGroup(
                location_id=group_data["location_id"],
                location_name=group_data["location_name"],
                location_type=group_data["location_type"],
                address=group_data["address"],
                distance=group_data["distance"],
                estimated_time=group_data["estimated_time"],
                pickup_count=group_data["pickup_count"],
                pickups=location_pickups
            )
            location_groups.append(group)
        
        # Calculate stats - FIXED: Use proper structure
        stats = {
            "total_pending": len(pending_pickups),
            "by_vendor_type": {
                "STORE": len([p for p in pending_pickups if p.vendor.vendor_type == VendorType.STORE]),
                "WAREHOUSE": len([p for p in pending_pickups if p.vendor.vendor_type == VendorType.WAREHOUSE]),
                "SUPPLIER": len([p for p in pending_pickups if p.vendor.vendor_type == VendorType.SUPPLIER]),
            },
            "urgent": len([p for p in pending_pickups if p.priority == "URGENT"]),
            "high": len([p for p in pending_pickups if p.priority == "HIGH"]),
            "normal": len([p for p in pending_pickups if p.priority == "NORMAL"]),
            "with_contact": len([p for p in pending_pickups if p.vendor.phone]),
            "cod_orders": len([p for p in pending_pickups if p.payment_type == "COD"]),
            "prepaid_orders": len([p for p in pending_pickups if p.payment_type == "PREPAID"]),
            "total_items": sum(p.total_items for p in pending_pickups),
            "total_value": sum(p.order_amount or 0 for p in pending_pickups)
        }
        
        return PendingPickupsResponse(
            pending_pickups=pending_pickups,
            grouped_by_location=location_groups,
            stats=stats,
            total_count=len(pending_pickups)
        )
    
    # ===== PENDING PICKUPS (ONLY ASSIGNED) =====
    
    def get_pending_pickups(
        self, 
        delivery_person_id: int,
        filters: Optional[PickupFilters] = None
    ) -> PendingPickupsResponse:
        """Get only pending (ASSIGNED) pickups for delivery person"""
        return self.get_pickups_by_status(
            delivery_person_id, "ASSIGNED", filters
        )
    
    # ===== ACTIVE PICKUPS (ASSIGNED + PICKED_UP) =====
    
    def get_active_pickups(
        self, 
        delivery_person_id: int,
        filters: Optional[PickupFilters] = None
    ) -> PendingPickupsResponse:
        """Get all active pickups (ASSIGNED + PICKED_UP) for delivery person"""
        return self.get_pickups_by_status(
            delivery_person_id, ["ASSIGNED", "PICKED_UP"], filters
        )
    
    # ===== COMPLETED PICKUPS =====
    
    def get_completed_pickups(
        self, 
        delivery_person_id: int,
        filters: Optional[PickupFilters] = None
    ) -> PendingPickupsResponse:
        """Get completed pickups (PICKED_UP) for delivery person"""
        return self.get_pickups_by_status(
            delivery_person_id, "PICKED_UP", filters
        )
    
    # ===== PICKUP DETAILS =====
    
    def get_pickup_details(
        self,
        delivery_person_id: int,
        delivery_id: int
    ) -> PickupDetailsResponse:
        """Get detailed information for specific pickup"""
        # First check if delivery exists and belongs to this delivery person
        delivery = self.db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            # Return empty response instead of raising exception
            return PickupDetailsResponse(
                pickup=None,
                order_details={},
                vendor_contact=None,
                pickup_instructions="Pickup not found or not assigned to you",
                qr_requirements=["Valid QR code", "Delivery person verification"]
            )
        
        # Get pickup data from repository with allow_all_statuses=True
        pickup_data = self.repository.get_pickup_by_id(
            self.db, delivery_person_id, delivery_id, allow_all_statuses=True
        )
        
        if not pickup_data:
            return PickupDetailsResponse(
                pickup=None,
                order_details={},
                vendor_contact=None,
                pickup_instructions="Unable to retrieve pickup details",
                qr_requirements=["Valid QR code", "Delivery person verification"]
            )
        
        # Convert to PendingPickup object
        vendor_data = pickup_data["vendor"]
        vendor = VendorDetails(**vendor_data)
        
        location_data = pickup_data["pickup_location"]
        pickup_location = PickupLocation(**location_data)
        
        items = [
            PickupItem(**item) for item in pickup_data["items"]
        ]
        
        pickup = PendingPickup(
            delivery_id=pickup_data["delivery_id"],
            order_id=pickup_data["order_id"],
            delivery_number=pickup_data["delivery_number"],
            order_number=pickup_data["order_number"],
            vendor=vendor,
            pickup_location=pickup_location,
            items=items,
            total_items=pickup_data["total_items"],
            order_amount=pickup_data["order_amount"],
            payment_type=pickup_data["payment_type"],
            status=pickup_data["status"],
            status_text=pickup_data["status_text"],
            assigned_at=pickup_data["assigned_at"],
            expected_pickup_time=pickup_data["expected_pickup_time"],
            pickup_time_slot=pickup_data["pickup_time_slot"],
            available_actions=pickup_data["available_actions"],
            priority=pickup_data["priority"],
            notes=pickup_data["notes"]
        )
        
        # Get QR requirements based on status
        qr_requirements = []
        if pickup_data["status"] == "ASSIGNED":
            qr_requirements = []
        
        # Pickup instructions
        status_suffix = ""
        if pickup_data["status"] == "PICKED_UP":
            status_suffix = " (Already Picked Up)"
        
        pickup_instructions = f"""
        Please proceed to {pickup_location.name} at:
        {pickup_location.address_line1}
        {pickup_location.area_name}, {pickup_location.city_name}
        
        Contact: {vendor.contact_person} - {vendor.phone}
        Hours: {vendor.business_hours}
        
        Status: {pickup_data['status_text']}{status_suffix}
        """
        
        return PickupDetailsResponse(
            pickup=pickup,
            order_details=pickup_data.get("order_details", {}),
            vendor_contact={
                "contact_person": vendor.contact_person,
                "phone": vendor.phone,
                "email": vendor.email,
                "best_time_to_call": "During business hours"
            },
            pickup_instructions=pickup_instructions.strip(),
            qr_requirements=qr_requirements
        )
    
    # ===== QR VERIFICATION =====
    

    
    # ===== PICKUP CONFIRMATION =====
    
    def confirm_pickup(
        self,
        delivery_person_id: int,
        request: ConfirmPickupRequest
    ) -> ConfirmPickupResponse:
        """Confirm pickup after QR verification"""
        # First, check if delivery exists and is in correct state
        delivery = self.db.query(Delivery).filter(
            Delivery.delivery_id == request.delivery_id,
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "ASSIGNED"
        ).first()
        
        if not delivery:
            # Check if already picked up
            existing = self.db.query(Delivery).filter(
                Delivery.delivery_id == request.delivery_id,
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "PICKED_UP"
            ).first()
            
            if existing:
                return ConfirmPickupResponse(
                    success=True,
                    message="Pickup already confirmed",
                    delivery_id=request.delivery_id,
                    order_id=existing.order_id,
                    confirmed_at=datetime.now(),
                    new_status=PickupStatus.PICKED_UP,
                    next_step="proceed_to_delivery"
                )
            
            return ConfirmPickupResponse(
                success=False,
                message="Delivery not found or already picked up",
                delivery_id=request.delivery_id,
                order_id=0,
                confirmed_at=datetime.now(),
                new_status=PickupStatus.CANCELLED,
                next_step="contact_support"
            )
        
        # Get order details for notifications
        order = self.db.query(Order).filter(Order.order_id == delivery.order_id).first()
        customer_user_id = order.user_id if order else None
        
        # Get delivery person details for notifications
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()

        # Get name from user relationship
        delivery_person_name = "Delivery Person"
        if delivery_person and delivery_person.user_id:
            user = self.db.query(UserModel).filter(UserModel.user_id == delivery_person.user_id).first()
            if user:
                delivery_person_name = f"{user.first_name} {user.last_name}"
        
        # Confirm pickup through repository
        result = self.repository.confirm_pickup(
            self.db,
            delivery_person_id,
            request.delivery_id,
            request.notes,
            request.pod_image_url,
            request.signature_url
        )
        
        if result["success"]:
            # ============================================
            # SEND NOTIFICATIONS FOR SUCCESSFUL PICKUP
            # ============================================
            try:
                # 1. Notify Customer
                if customer_user_id:
                    self._send_pickup_confirmed_customer_notification(
                        customer_id=customer_user_id,
                        order_id=result["order_id"],
                        delivery_person_name=delivery_person_name
                    )
                
                # 2. Notify Admin Users (bulk)
                self._send_pickup_confirmed_admin_notification(
                    delivery_id=request.delivery_id,
                    order_id=result["order_id"],
                    delivery_person_name=delivery_person_name
                )
                
                # 3. Notify Delivery Person
                if hasattr(delivery_person, 'user_id') and delivery_person.user_id:
                    self._send_pickup_confirmed_delivery_person_notification(
                        delivery_person_user_id=delivery_person.user_id,
                        delivery_id=request.delivery_id,
                        order_id=result["order_id"]
                    )
                
            except Exception as notif_error:
                print(f"⚠️ Pickup confirmation notification failed: {notif_error}")
                # Don't fail the main operation
            
            return ConfirmPickupResponse(
                success=True,
                message=result["message"],
                delivery_id=result["delivery_id"],
                order_id=result["order_id"],
                confirmed_at=result["confirmed_at"],
                new_status=PickupStatus.PICKED_UP,
                next_step=result["next_step"]
            )
        else:
            return ConfirmPickupResponse(
                success=False,
                message=result["message"],
                delivery_id=request.delivery_id,
                order_id=delivery.order_id,
                confirmed_at=datetime.now(),
                new_status=PickupStatus.PENDING_PICKUP,
                next_step="retry_confirmation"
            )
    
    # ===== NAVIGATION =====
    
    def get_navigation_details(
        self,
        delivery_person_id: int,
        delivery_id: int
    ) -> NavigationResponse:
        """Get navigation details for pickup location"""
        result = self.repository.get_navigation_details(
            self.db, delivery_person_id, delivery_id
        )
        
        if result["success"]:
            return NavigationResponse(**result)
        else:
            return NavigationResponse(
                success=False,
                pickup_location_id=0,
                google_maps_url="",
                openstreetmap_url="",
                latitude=0.0,
                longitude=0.0,
                formatted_address="",
                distance_km=None,
                estimated_time_minutes=None
            )
    
    # ===== VENDOR CONTACT =====
    
    def get_vendor_contact(
        self,
        delivery_person_id: int,
        delivery_id: int
    ) -> VendorContactResponse:
        """Get vendor contact information"""
        result = self.repository.get_vendor_contact(
            self.db, delivery_person_id, delivery_id
        )
        
        if result["success"]:
            return VendorContactResponse(**result)
        else:
            return VendorContactResponse(
                success=False,
                vendor_id=0,
                vendor_name="",
                contact_person=None,
                phone=None,
                email=None,
                business_hours=None,
                emergency_contact=None,
                notes="Contact information not available"
            )
    
    # ===== VALIDATION METHODS =====
    
    def validate_pickup_access(
        self,
        delivery_person_id: int,
        delivery_id: int,
        require_assigned_status: bool = False
    ) -> bool:
        """Validate if delivery person can access this pickup"""
        query = self.db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Only filter by ASSIGNED status if required
        if require_assigned_status:
            query = query.filter(Delivery.status == "ASSIGNED")
        
        delivery = query.first()
        
        return delivery is not None
    

    
    # ===== BUSINESS LOGIC =====
    
    def get_optimized_pickup_route(
        self,
        delivery_person_id: int,
        include_completed: bool = False
    ) -> List[Dict[str, Any]]:
        """Get optimized route for all pending pickups"""
        # Get all active pickups (or include completed if specified)
        status = ["ASSIGNED", "PICKED_UP"] if include_completed else "ASSIGNED"
        pickups_data = self.repository.get_pickups_by_status(self.db, delivery_person_id, status)
        
        if not pickups_data:
            return []
        
        # Sort by distance (simple optimization)
        pickups_with_distance = []
        for pickup in pickups_data:
            distance_info = pickup.get("distance_info", {})
            distance_km = distance_info.get("distance_km", 999)
            pickups_with_distance.append((pickup, distance_km))
        
        # Sort by distance
        pickups_with_distance.sort(key=lambda x: x[1])
        
        # Build route with sequence
        route = []
        sequence = 1
        
        for pickup_data, distance in pickups_with_distance:
            location = pickup_data["pickup_location"]
            
            route_point = {
                "sequence": sequence,
                "delivery_id": pickup_data["delivery_id"],
                "order_id": pickup_data["order_id"],
                "location_name": location["name"],
                "address": f"{location['address_line1']}, {location['area_name']}",
                "distance_km": distance,
                "estimated_minutes": pickup_data.get("distance_info", {}).get("estimated_minutes", 15),
                "vendor_name": pickup_data["vendor"]["vendor_name"],
                "items_count": pickup_data["total_items"],
                "priority": pickup_data["priority"],
                "status": pickup_data["status"],  # Include status
                "status_text": pickup_data["status_text"]  # Include status text
            }
            
            route.append(route_point)
            sequence += 1
        
        return route
    
    # ===== NOTIFICATION HELPER METHODS =====
    

    
    def _send_pickup_confirmed_customer_notification(
        self, 
        customer_id: int, 
        order_id: int,
        delivery_person_name: str
    ):
        """Send notification to customer when pickup is confirmed"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="📦 Order Picked Up",
                message=f"Great news! Your order #{order_id} has been picked up by {delivery_person_name} and is now on the way to you. You can track the delivery in real-time.",
                type="ORDER",
                reference_id=order_id
            )
            print(f"✅ Customer pickup notification sent for order #{order_id}")
        except Exception as e:
            print(f"⚠️ Failed to send customer pickup notification: {e}")
    
    def _send_pickup_confirmed_admin_notification(
        self, 
        delivery_id: int, 
        order_id: int,
        delivery_person_name: str
    ):
        """Send notification to all admins when pickup is confirmed"""
        try:
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Pickup Confirmed",
                    message=f"Pickup for delivery #{delivery_id} (order #{order_id}) has been confirmed by {delivery_person_name}. Package is now in transit to customer.",
                    type="PICKUP",
                    reference_id=order_id
                )
            print(f"✅ Admin pickup notifications sent for delivery #{delivery_id}")
                
        except Exception as e:
            print(f"⚠️ Failed to send admin pickup notifications: {e}")
    
    def _send_pickup_confirmed_delivery_person_notification(
        self, 
        delivery_person_user_id: int, 
        delivery_id: int,
        order_id: int
    ):
        """Send notification to delivery person when pickup is confirmed"""
        try:
            self.notification_service.send_notification(
                user_id=delivery_person_user_id,
                title="✅ Pickup Successful",
                message=f"You have successfully picked up order #{order_id} (delivery #{delivery_id}). Please proceed with delivery to the customer.",
                type="DELIVERY",
                reference_id=delivery_id
            )
            print(f"✅ Delivery person pickup notification sent for delivery #{delivery_id}")
        except Exception as e:
            print(f"⚠️ Failed to send delivery person pickup notification: {e}")