# delivery_panel/active_deliveries/delivery_active_service.py
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Optional, Dict, Any
from decimal import Decimal

from repositories.delivery_panel.delivery_active_repository import DeliveryActiveRepository
from schemas.delivery_panel.delivery_active_schema import (
    ActiveDeliveriesListResponse, ActiveDelivery, CustomerInfo,
    DeliveryAddress, OrderInfo, DeliveryResponse, StatusUpdateRequest,
    LocationUpdateResponse, CustomerCallResponse, NavigationDataResponse,
    SuccessResponse, DeliveryStatistics, DeliveryStatus, PaymentType,
    StatusTransitionResponse, ProgressUpdateRequest,
    DeliveryOTPRequestResponse, DeliveryOTPConfirmRequest, DeliveryOTPConfirmResponse
)

from models.delivery.delivery import Delivery as DeliveryModel
from models.delivery.delivery_person import DeliveryPerson
import hashlib
import random
from models.order.order import Order as OrderModel
from models.user import User as UserModel
from models.address import Address as AddressModel
from models.payment import Payment as PaymentModel

from models.payment import Payment as PaymentModel

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository
from utils.send_email import send_delivery_otp_email


class DeliveryActiveService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryActiveRepository()
        self.repository = DeliveryActiveRepository()
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    # ===== ACTIVE DELIVERIES LIST =====
    
    def get_active_deliveries(self, delivery_person_id: int) -> ActiveDeliveriesListResponse:
        """Get all active deliveries for delivery person"""
        try:
            # Get deliveries from repository
            deliveries_data = self.repository.get_active_deliveries(self.db, delivery_person_id)
            
            # Get statistics
            stats = self.repository.get_delivery_statistics(self.db, delivery_person_id)
            
            # Convert to schema objects
            active_deliveries = []
            for delivery_data in deliveries_data:
                delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
                if delivery_schema:
                    active_deliveries.append(delivery_schema)
            
            return ActiveDeliveriesListResponse(
                success=True,
                message=f"Found {len(active_deliveries)} active deliveries",
                active_deliveries=active_deliveries,
                count=len(active_deliveries),
                pending_pickup=stats["pending_pickup"],
                in_transit=stats["in_transit"],
                picked_up=stats["picked_up"]
            )
            
        except Exception as e:
            return ActiveDeliveriesListResponse(
                success=False,
                message=f"Failed to get active deliveries: {str(e)}",
                active_deliveries=[],
                count=0,
                pending_pickup=0,
                in_transit=0,
                picked_up=0
            )
    
    def get_delivery_by_id(self, delivery_id: int, delivery_person_id: int) -> DeliveryResponse:
        """Get specific delivery by ID"""
        try:
            delivery_data = self.repository.get_delivery_by_id(self.db, delivery_id, delivery_person_id)
            
            if not delivery_data:
                return DeliveryResponse(
                    success=False,
                    message=f"Delivery {delivery_id} not found or not assigned to you"
                )
            
            delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
            if not delivery_schema:
                return DeliveryResponse(
                    success=False,
                    message="Failed to process delivery data"
                )
            
            return DeliveryResponse(
                success=True,
                message="Delivery retrieved successfully",
                delivery=delivery_schema
            )
            
        except Exception as e:
            return DeliveryResponse(
                success=False,
                message=f"Failed to get delivery: {str(e)}"
            )
    
    def get_delivery_statistics(self, delivery_person_id: int) -> DeliveryStatistics:
        """Get delivery statistics"""
        stats = self.repository.get_delivery_statistics(self.db, delivery_person_id)
        
        return DeliveryStatistics(**stats)
    
    # ===== MARK DELIVERED =====
    
    def mark_delivery_delivered(
        self,
        delivery_id: int,
        delivery_person_id: int,
        request: StatusUpdateRequest
    ) -> DeliveryResponse:
        """Mark delivery as delivered (Completed)"""
        try:
            # Get current delivery status
            delivery = self.db.query(DeliveryModel).filter(
                DeliveryModel.delivery_id == delivery_id,
                DeliveryModel.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return DeliveryResponse(
                    success=False,
                    message="Delivery not found"
                )
            
            # STRICT VALIDATION: Only allow from OUT_FOR_DELIVERY
            if delivery.status != "OUT_FOR_DELIVERY":
                return DeliveryResponse(
                    success=False,
                    message=f"Cannot mark as delivered. Current status is {delivery.status}. Must be OUT_FOR_DELIVERY."
                )
            
            # Execute completion logic
            updated_delivery_data = self.repository.mark_delivery_completed(
                self.db,
                delivery_id,
                delivery_person_id,
                request.notes
            )
            
            if not updated_delivery_data:
                return DeliveryResponse(
                    success=False,
                    message="Failed to mark delivery as completed"
                )
            
            # Get info for notifications
            order_id = updated_delivery_data["order_id"]
            
            # ============================================
            # SEND NOTIFICATIONS
            # ============================================
            try:
                # Get delivery person details
                delivery_person = self.db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery_person_id
                ).first()
                delivery_person_name = f"{delivery_person.first_name} {delivery_person.last_name}" if delivery_person else "Delivery Person"
                
                # Get Customer ID
                order = self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()
                if order:
                    # Notify customer
                    self._send_delivered_notification(
                        customer_id=order.user_id,
                        order_id=order_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                    # Notify admin
                    self._send_delivery_completed_admin_notification(
                        order_id=order_id,
                        delivery_id=delivery_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                    # Notify delivery person
                    self._send_delivery_person_completed_notification(
                        delivery_person_id=delivery_person_id,
                        order_id=order.order_id
                    )
            except Exception as e:
                print(f"⚠️ Notification error during completion: {e}")
            
            # Convert to schema
            delivery_schema = self._convert_dict_to_active_delivery(updated_delivery_data)
            
            # ============================================
            # PROCESS COD PAYMENT (If applicable)
            # ============================================
            try:
                self._process_cod_payment_completion(order_id)
            except Exception as e:
                print(f"⚠️ Failed to process COD payment completion: {e}")

            return DeliveryResponse(
                success=True,
                message="Delivery marked as completed successfully",
                delivery=delivery_schema
            )
            
        except Exception as e:
            return DeliveryResponse(
                success=False,
                message=f"Error active delivery completion: {str(e)}"
            )


    # ===== OTP & COMPLETION =====
    
    def request_delivery_otp(
        self,
        delivery_id: int,
        delivery_person_id: int
    ) -> DeliveryOTPRequestResponse:
        """Request OTP for delivery completion"""
        # Validate delivery status
        delivery = self.db.query(DeliveryModel).filter(
            DeliveryModel.delivery_id == delivery_id,
            DeliveryModel.delivery_person_id == delivery_person_id
        ).first()

        if not delivery:
            raise ValueError("Delivery not found")
            
        if delivery.status not in ["PICKED_UP", "OUT_FOR_DELIVERY"]:
            raise ValueError("Delivery must be active to request OTP")
            
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        
        # Hash OTP
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        
        # Set expiry (e.g., 10 minutes)
        expiry = datetime.utcnow() + timedelta(minutes=10)
        
        # Save to DB
        if not self.repository.save_delivery_otp(self.db, delivery_id, delivery_person_id, otp_hash, expiry):
            raise ValueError("Failed to save OTP to database")
            
        # Get customer email/phone
        order = self.db.query(OrderModel).filter(OrderModel.order_id == delivery.order_id).first()
        if not order:
            print(f"❌ Order {delivery.order_id} not found for delivery {delivery_id}")
            raise ValueError("Order not found associated with this delivery")

        customer = self.db.query(UserModel).filter(UserModel.user_id == order.user_id).first()
        if not customer:
            print(f"❌ User {order.user_id} not found for order {order.order_id}")
            raise ValueError("Customer not found associated with this order")

        customer_email = customer.email
        if not customer_email:
             print(f"⚠️ Customer {customer.user_id} has no email. Returning success with console OTP.")
             print(f"🔐 [BACKUP OTP] For Delivery #{delivery_id}: {otp}")
             return DeliveryOTPRequestResponse(
                success=True,
                message="Customer has no email. Check console for OTP (Dev Mode).",
                delivery_id=delivery_id,
                otp_sent_to="Console (No Email Found)",
                expiry_seconds=600
            )

        # SEND OTP
        try:
            print(f"📧 Attempting to send OTP email to {customer_email}...")
            email_sent = send_delivery_otp_email(customer_email, otp, order_id=delivery.order_id)
        except Exception as e:
            print(f"❌ Exception calling send_otp_email: {e}")
            email_sent = False
        
        if not email_sent:
            # Fallback to console if email fails
            print(f"⚠️ Email failed. Backup OTP for Delivery #{delivery_id}: {otp}")
            return DeliveryOTPRequestResponse(
                success=True, 
                message="OTP generated. Email failed (check server logs). Code in Console.",
                delivery_id=delivery_id,
                otp_sent_to=customer_email,
                expiry_seconds=600
            )

        print(f"✅ OTP Email sent successfully to {customer_email}")
        
        return DeliveryOTPRequestResponse(
            success=True,
            message=f"OTP sent to {customer_email}",
            delivery_id=delivery_id,
            otp_sent_to=customer_email,
            expiry_seconds=600
        )
        
    def confirm_delivery_otp(
        self,
        delivery_id: int,
        delivery_person_id: int,
        request: DeliveryOTPConfirmRequest
    ) -> DeliveryOTPConfirmResponse:
        """Confirm delivery with OTP"""
        # Get stored OTP
        otp_data = self.repository.get_delivery_otp_data(self.db, delivery_id, delivery_person_id)
        
        if not otp_data or not otp_data["otp_hash"]:
            return DeliveryOTPConfirmResponse(
                success=False,
                message="No OTP request found. Please request OTP first."
            )
            
        # Verify Expiry
        if datetime.utcnow() > otp_data["expiry"]:
            return DeliveryOTPConfirmResponse(
                success=False,
                message="OTP expired. Please request a new one."
            )
            
        # Verify Hash
        input_hash = hashlib.sha256(request.otp.encode()).hexdigest()
        if input_hash != otp_data["otp_hash"]:
            return DeliveryOTPConfirmResponse(
                success=False,
                message="Invalid OTP. Please try again."
            )
            
        # Mark as Completed
        updated_delivery = self.repository.mark_delivery_completed(
            self.db, delivery_id, delivery_person_id, notes="Verified via OTP"
        )
        
        if not updated_delivery:
            return DeliveryOTPConfirmResponse(
                success=False,
                message="Failed to update delivery status"
            )
            
        # Return success with updated delivery object
        delivery_schema = self._convert_dict_to_active_delivery(updated_delivery)
        
        return DeliveryOTPConfirmResponse(
            success=True,
            message="Delivery confirmed successfully!",
            delivery=delivery_schema
        )
            
        # ============================================
        # PROCESS COD PAYMENT (If applicable)
        # ============================================
        try:
            self._process_cod_payment_completion(updated_delivery["order_id"])
        except Exception as e:
            print(f"⚠️ Failed to process COD payment completion: {e}")

        return DeliveryOTPConfirmResponse(
            success=True,
            message="Delivery confirmed successfully!",
            delivery=delivery_schema
        )

    # ===== STATUS UPDATES =====
    
    def update_delivery_status(
        self, 
        delivery_id: int, 
        delivery_person_id: int, 
        request: StatusUpdateRequest
    ) -> DeliveryResponse:
        """Update delivery status"""
        try:
            # Validate status transition
            validation = self.repository.validate_status_transition(
                self.db, delivery_id, delivery_person_id, request.status
            )
            
            if not validation["allowed"]:
                return DeliveryResponse(
                    success=False,
                    message=validation["message"]
                )
            
            # Get delivery details before update for notification
            delivery = self.db.query(DeliveryModel).filter(
                DeliveryModel.delivery_id == delivery_id,
                DeliveryModel.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return DeliveryResponse(
                    success=False,
                    message="Delivery not found"
                )
            
            # Get order and customer details
            order = self.db.query(OrderModel).filter(
                OrderModel.order_id == delivery.order_id
            ).first()
            
            if not order:
                return DeliveryResponse(
                    success=False,
                    message="Order not found"
                )
            
            # Update status
            success = self.repository.update_delivery_status(
                self.db,
                delivery_id,
                request.status,
                delivery_person_id,
                request.notes,
                request.latitude,
                request.longitude
            )
            
            if not success:
                return DeliveryResponse(
                    success=False,
                    message="Failed to update delivery status"
                )
            
            # ============================================
            # SEND NOTIFICATIONS BASED ON STATUS
            # ============================================
            try:
                # Get delivery person details
                delivery_person = self.db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery_person_id
                ).first()
                
                delivery_person_name = f"{delivery_person.first_name} {delivery_person.last_name}" if delivery_person else "Delivery Person"
                
                # Status-specific notifications
                if request.status == "PICKED_UP":
                    # Notify customer
                    self._send_picked_up_notification(
                        customer_id=order.user_id,
                        order_id=order.order_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                elif request.status == "OUT_FOR_DELIVERY":
                    # Notify customer
                    self._send_out_for_delivery_notification(
                        customer_id=order.user_id,
                        order_id=order.order_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                elif request.status == "DELIVERED":
                    # Notify customer
                    self._send_delivered_notification(
                        customer_id=order.user_id,
                        order_id=order.order_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                    # Notify admin
                    self._send_delivery_completed_admin_notification(
                        order_id=order.order_id,
                        delivery_id=delivery_id,
                        delivery_person_name=delivery_person_name
                    )
                    
                    # Notify delivery person
                    self._send_delivery_person_completed_notification(
                        delivery_person_id=delivery_person_id,
                        order_id=order.order_id
                    )
                    
                elif request.status == "FAILED":
                    # Notify customer
                    self._send_delivery_failed_notification(
                        customer_id=order.user_id,
                        order_id=order.order_id,
                        notes=request.notes
                    )
                    
                    # Notify admin
                    self._send_delivery_failed_admin_notification(
                        order_id=order.order_id,
                        delivery_id=delivery_id,
                        delivery_person_name=delivery_person_name,
                        notes=request.notes
                    )
                    
            except Exception as notif_error:
                # Log but don't fail the status update
                print(f"⚠️ Notification sending failed: {notif_error}")
            
            # Get updated delivery
            delivery_data = self.repository.get_delivery_by_id(self.db, delivery_id, delivery_person_id)
            if not delivery_data:
                return DeliveryResponse(
                    success=False,
                    message="Delivery updated but could not retrieve updated data"
                )
            
            delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
            
            return DeliveryResponse(
                success=True,
                message=f"Delivery status updated to {request.status}",
                delivery=delivery_schema
            )
            
        except Exception as e:
            return DeliveryResponse(
                success=False,
                message=f"Failed to update delivery status: {str(e)}"
            )
    
    def validate_status_transition(
        self,
        delivery_id: int,
        delivery_person_id: int,
        target_status: str
    ) -> StatusTransitionResponse:
        """Validate if status transition is allowed"""
        validation = self.repository.validate_status_transition(
            self.db, delivery_id, delivery_person_id, target_status
        )
        
        return StatusTransitionResponse(**validation)
    
    def update_delivery_progress(
        self,
        delivery_id: int,
        delivery_person_id: int,
        request: ProgressUpdateRequest
    ) -> DeliveryResponse:
        """Update delivery progress with location"""
        try:
            # Determine status based on progress
            status = None
            if request.progress_percentage >= 75:
                status = DeliveryStatus.OUT_FOR_DELIVERY
            elif request.progress_percentage >= 50:
                status = DeliveryStatus.PICKED_UP
            
            # Update location
            if request.latitude is not None and request.longitude is not None:
                location_success = self.repository.update_delivery_person_location(
                    self.db,
                    delivery_person_id,
                    request.latitude,
                    request.longitude
                )
                
                if not location_success:
                    return DeliveryResponse(
                        success=False,
                        message="Failed to update location"
                    )
            
            # Update status if determined
            if status:
                # Create status update request
                status_request = StatusUpdateRequest(
                    status=status,
                    notes=request.notes,
                    latitude=request.latitude,
                    longitude=request.longitude
                )
                
                return self.update_delivery_status(
                    delivery_id,
                    delivery_person_id,
                    status_request
                )
            
            # Get updated delivery
            delivery_data = self.repository.get_delivery_by_id(self.db, delivery_id, delivery_person_id)
            if not delivery_data:
                return DeliveryResponse(
                    success=False,
                    message="Progress updated but could not retrieve delivery"
                )
            
            delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
            
            return DeliveryResponse(
                success=True,
                message=f"Delivery progress updated to {request.progress_percentage}%",
                delivery=delivery_schema
            )
            
        except Exception as e:
            return DeliveryResponse(
                success=False,
                message=f"Failed to update delivery progress: {str(e)}"
            )
    
    # ===== LOCATION UPDATES =====
    
    def update_delivery_person_location(
        self,
        delivery_person_id: int,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None
    ) -> LocationUpdateResponse:
        """Update delivery person's current location"""
        try:
            success = self.repository.update_delivery_person_location(
                self.db,
                delivery_person_id,
                latitude,
                longitude,
                accuracy
            )
            
            if not success:
                return LocationUpdateResponse(
                    success=False,
                    message="Failed to update location",
                    updated_at=datetime.utcnow(),
                    latitude=latitude,
                    longitude=longitude
                )
            
            return LocationUpdateResponse(
                success=True,
                message="Location updated successfully",
                updated_at=datetime.utcnow(),
                latitude=latitude,
                longitude=longitude
            )
            
        except Exception as e:
            return LocationUpdateResponse(
                success=False,
                message=f"Failed to update location: {str(e)}",
                updated_at=datetime.utcnow(),
                latitude=latitude,
                longitude=longitude
            )
    
    # ===== CUSTOMER CALL =====
    
    def get_customer_contact_info(
        self, 
        delivery_id: int, 
        delivery_person_id: int
    ) -> CustomerCallResponse:
        """Get customer contact information for calling"""
        try:
            contact_info = self.repository.get_customer_contact_info(
                self.db, delivery_id, delivery_person_id
            )
            
            if not contact_info:
                return CustomerCallResponse(
                    success=False,
                    message="Customer information not found",
                    customer_name="",
                    customer_phone="",
                    delivery_id=delivery_id,
                    order_id=0,
                    call_timestamp=datetime.now()
                )
            
            # Log the call action
            self.repository.log_call_action(
                self.db,
                delivery_person_id,
                delivery_id,
                contact_info["customer_id"]
            )
            
            # ============================================
            # SEND NOTIFICATION TO CUSTOMER ABOUT CALL
            # ============================================
            try:
                # Get delivery person details
                delivery_person = self.db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery_person_id
                ).first()
                
                delivery_person_name = f"{delivery_person.first_name} {delivery_person.last_name}" if delivery_person else "Delivery Person"
                
                # Send notification to customer
                self._send_customer_call_notification(
                    customer_id=contact_info["customer_id"],
                    order_id=contact_info["order_id"],
                    delivery_person_name=delivery_person_name
                )
            except Exception as notif_error:
                print(f"⚠️ Call notification failed: {notif_error}")
            
            return CustomerCallResponse(
                success=True,
                message="Customer contact information retrieved",
                customer_name=contact_info["name"],
                customer_phone=contact_info["phone"],
                delivery_id=delivery_id,
                order_id=contact_info["order_id"],
                call_timestamp=datetime.now()
            )
            
        except Exception as e:
            return CustomerCallResponse(
                success=False,
                message=f"Failed to get customer information: {str(e)}",
                customer_name="",
                customer_phone="",
                delivery_id=delivery_id,
                order_id=0,
                call_timestamp=datetime.utcnow()
            )
    
    # ===== NAVIGATION =====
    
    def get_delivery_navigation_data(
        self, 
        delivery_id: int, 
        delivery_person_id: int
    ) -> NavigationDataResponse:
        """Get navigation data for delivery"""
        try:
            nav_data = self.repository.get_delivery_navigation_data(
                self.db, delivery_id, delivery_person_id
            )
            
            if not nav_data:
                return NavigationDataResponse(
                    success=False,
                    message="Navigation data not found",
                    delivery_address=DeliveryAddress(
                        address_id=0,
                        line1="",
                        area_name="",
                        city_name=""
                    ),
                    customer_name="",
                    customer_phone="",
                    google_maps_url="",
                    openstreetmap_url=""
                )
            
            # Create delivery address
            delivery_address = DeliveryAddress(
                address_id=0,  # Not directly available
                line1=nav_data["formatted_address"].split(",")[0] if nav_data["formatted_address"] else "",
                line2=None,
                area_name="",
                city_name="",
                pincode=None,
                latitude=nav_data.get("latitude"),
                longitude=nav_data.get("longitude")
            )
            
            return NavigationDataResponse(
                success=True,
                message="Navigation data retrieved",
                delivery_address=delivery_address,
                formatted_address=nav_data.get("formatted_address"),
                customer_name=nav_data.get("customer_name"),
                customer_phone=nav_data.get("customer_phone"),
                latitude=nav_data.get("latitude"),
                longitude=nav_data.get("longitude"),
                google_maps_url=nav_data["google_maps_url"],
                openstreetmap_url=nav_data["openstreetmap_url"],
                distance_km=nav_data.get("distance_km"),
                estimated_time_minutes=self._calculate_estimated_time(nav_data.get("distance_km"))
            )
            
        except Exception as e:
            return NavigationDataResponse(
                success=False,
                message=f"Failed to get navigation data: {str(e)}",
                delivery_address=DeliveryAddress(
                    address_id=0,
                    line1="",
                    area_name="",
                    city_name=""
                ),
                customer_name="",
                customer_phone="",
                google_maps_url="",
                openstreetmap_url=""
            )
    
    # ===== HELPER METHODS =====
    
    def _convert_dict_to_active_delivery(self, delivery_data: Dict[str, Any]) -> Optional[ActiveDelivery]:
        """Convert delivery dictionary to ActiveDelivery schema"""
        try:
            if not delivery_data:
                return None
            
            # Extract data from dictionary
            delivery_id = delivery_data.get("delivery_id")
            order_data = {
                "order_id": delivery_data.get("order_id"),
                "order_number": delivery_data.get("order_number"),
                "subtotal": delivery_data.get("subtotal", 0.0),
                "discount_amount": delivery_data.get("discount_amount", 0.0),
                "delivery_fee": delivery_data.get("delivery_fee", 0.0),
                "total_amount": delivery_data.get("total_amount", 0.0),
                "payment_type": delivery_data.get("payment_type"),
                "cod_amount": delivery_data.get("cod_amount"),
                "items_count": delivery_data.get("items_count", 0)
            }
            
            customer_data = delivery_data.get("customer", {})
            address_data = delivery_data.get("delivery_address", {})
            
            # Customer info
            customer_info = CustomerInfo(
                customer_id=customer_data.get("customer_id", 0),
                name=customer_data.get("name", "Unknown Customer"),
                phone=customer_data.get("phone", ""),
                avatar_url=customer_data.get("avatar_url")
            )
            
            # Delivery address
            delivery_address = DeliveryAddress(
                address_id=address_data.get("address_id", 0),
                line1=address_data.get("line1", ""),
                line2=address_data.get("line2"),
                area_name=address_data.get("area_name", ""),
                city_name=address_data.get("city_name", ""),
                pincode=address_data.get("pincode"),
                latitude=None,
                longitude=None
            )
            
            # Order info
            order_info = OrderInfo(
                order_id=order_data["order_id"],
                order_number=order_data["order_number"],
                subtotal=order_data["subtotal"],
                discount_amount=order_data["discount_amount"],
                delivery_fee=order_data["delivery_fee"],
                total_amount=order_data["total_amount"],
                payment_type=order_data["payment_type"],
                cod_amount=order_data.get("cod_amount"),
                items_count=order_data["items_count"]
            )
            
            # Status
            status = DeliveryStatus(delivery_data.get("status", "ASSIGNED"))
            status_label = delivery_data.get("status_label", delivery_data.get("status", "ASSIGNED"))
            
            return ActiveDelivery(
                delivery_id=delivery_id,
                delivery_person_id=delivery_data.get("delivery_person_id", 0),
                order=order_info,
                customer=customer_info,
                delivery_address=delivery_address,
                status=status,
                status_label=status_label,
                assigned_at=delivery_data.get("assigned_at"),
                # Note: Delivery model doesn't have picked_up_at field
                expected_delivery_time=delivery_data.get("expected_delivery_time"),
                distance_km=delivery_data.get("distance_km"),
                pod_image_url=delivery_data.get("pod_image_url"),
                signature_url=delivery_data.get("signature_url"),
                delivery_notes=delivery_data.get("delivery_notes"),
                current_latitude=delivery_data.get("current_latitude"),
                current_longitude=delivery_data.get("current_longitude")
            )
            
            return ActiveDelivery(
                delivery_id=delivery_id,
                order_info=OrderInfo(**order_data),
                customer_info=customer_info,
                delivery_address=DeliveryAddress(**address_data),
                status=delivery_data.get("status"),
                assigned_at=delivery_data.get("assigned_at"),
                picked_up_at=delivery_data.get("picked_up_at"),
                delivered_at=delivery_data.get("delivered_at"),
                notes=delivery_data.get("notes")
            )
            
        except Exception as e:
            print(f"Error converting delivery data: {e}")
            return None

    def _process_cod_payment_completion(self, order_id: int):
        """
        Check if the order payment method is COD and mark it as PAID if so.
        Used when delivery is successfully completed.
        """
        try:
            # Get payment record
            payment = self.db.query(PaymentModel).filter(PaymentModel.order_id == order_id).first()
            if not payment:
                print(f"⚠️ No payment record found for Order #{order_id} during COD check.")
                return

            if payment.payment_method == "COD" and payment.payment_status != "PAID":
                print(f"💰 Marking COD Payment for Order #{order_id} as PAID upon delivery.")
                
                # Update Payment Status
                payment.payment_status = "PAID"
                payment.transaction_reference = f"COD_DELIVERED_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                # Update Order Payment Status
                order = self.db.query(OrderModel).filter(OrderModel.order_id == order_id).first()
                if order:
                    order.payment_status = "PAID"
                
                self.db.commit()
                
                # We could send a separate payment confirmation notification here if needed,
                # but the delivery completion notification might be enough.
                # If we want to be thorough, we can reuse PaymentService logic, 
                # but a simple DB update is sufficient for the requirement.
                
        except Exception as e:
            print(f"❌ Error processing COD payment completion: {e}")
            raise e
    
    def _calculate_estimated_time(self, distance_km: Optional[float]) -> Optional[int]:
        """Calculate estimated time in minutes based on distance"""
        if not distance_km:
            return None
        
        # Average speed: 30 km/h in city traffic
        hours = distance_km / 30
        minutes = int(hours * 60)
        
        # Add buffer for traffic, stops, etc.
        minutes += 10
        
        return minutes
    
    def get_todays_deliveries(self, delivery_person_id: int) -> ActiveDeliveriesListResponse:
        """Get all deliveries assigned today"""
        try:
            deliveries_data = self.repository.get_todays_deliveries(self.db, delivery_person_id)
            
            # Filter only active deliveries
            active_deliveries = []
            for delivery_data in deliveries_data:
                if delivery_data.get("status") in ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"]:
                    delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
                    if delivery_schema:
                        active_deliveries.append(delivery_schema)
            
            # Get statistics for today
            stats = self.repository.get_delivery_statistics(self.db, delivery_person_id)
            
            return ActiveDeliveriesListResponse(
                success=True,
                message=f"Found {len(active_deliveries)} deliveries for today",
                active_deliveries=active_deliveries,
                count=len(active_deliveries),
                pending_pickup=stats["pending_pickup"],
                in_transit=stats["in_transit"],
                picked_up=stats["picked_up"]
            )
            
        except Exception as e:
            return ActiveDeliveriesListResponse(
                success=False,
                message=f"Failed to get today's deliveries: {str(e)}",
                active_deliveries=[],
                count=0,
                pending_pickup=0,
                in_transit=0,
                picked_up=0
            )
    
    def get_deliveries_by_status(
        self,
        delivery_person_id: int,
        status: str
    ) -> ActiveDeliveriesListResponse:
        """Get deliveries by specific status"""
        try:
            deliveries_data = self.repository.get_deliveries_by_status(
                self.db, delivery_person_id, status
            )
            
            active_deliveries = []
            for delivery_data in deliveries_data:
                delivery_schema = self._convert_dict_to_active_delivery(delivery_data)
                if delivery_schema:
                    active_deliveries.append(delivery_schema)
            
            # Get statistics
            stats = self.repository.get_delivery_statistics(self.db, delivery_person_id)
            
            return ActiveDeliveriesListResponse(
                success=True,
                message=f"Found {len(active_deliveries)} deliveries with status {status}",
                active_deliveries=active_deliveries,
                count=len(active_deliveries),
                pending_pickup=stats["pending_pickup"],
                in_transit=stats["in_transit"],
                picked_up=stats["picked_up"]
            )
            
        except Exception as e:
            return ActiveDeliveriesListResponse(
                success=False,
                message=f"Failed to get deliveries by status: {str(e)}",
                active_deliveries=[],
                count=0,
                pending_pickup=0,
                in_transit=0,
                picked_up=0
            )
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_picked_up_notification(self, customer_id: int, order_id: int, delivery_person_name: str):
        """Send notification to customer when order is picked up"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="📦 Order Picked Up",
                message=f"Your order #{order_id} has been picked up by {delivery_person_name} and is on the way to you.",
                type="DELIVERY",
                reference_id=order_id
            )
        except Exception as e:
            print(f"⚠️ Failed to send picked up notification: {e}")
    
    def _send_out_for_delivery_notification(self, customer_id: int, order_id: int, delivery_person_name: str):
        """Send notification to customer when order is out for delivery"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="🚚 Order Out for Delivery",
                message=f"Your order #{order_id} is out for delivery with {delivery_person_name}. It should arrive soon.",
                type="DELIVERY",
                reference_id=order_id
            )
        except Exception as e:
            print(f"⚠️ Failed to send in transit notification: {e}")
    
    def _send_delivered_notification(self, customer_id: int, order_id: int, delivery_person_name: str):
        """Send notification to customer when order is delivered"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="✅ Order Delivered",
                message=f"Great news! Your order #{order_id} has been successfully delivered by {delivery_person_name}. Thank you for shopping with us!",
                type="DELIVERY",
                reference_id=order_id
            )
        except Exception as e:
            print(f"⚠️ Failed to send delivered notification: {e}")
    
    def _send_delivery_completed_admin_notification(self, order_id: int, delivery_id: int, delivery_person_name: str):
        """Send notification to all admins when delivery is completed"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Delivery Completed",
                    message=f"Delivery #{delivery_id} for order #{order_id} has been completed by {delivery_person_name}.",
                    type="DELIVERY",
                    reference_id=order_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send admin delivery completed notification: {e}")
    
    def _send_delivery_person_completed_notification(self, delivery_person_id: int, order_id: int):
        """Send notification to delivery person when delivery is completed"""
        try:
            # Get delivery person user ID
            delivery_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if delivery_person and hasattr(delivery_person, 'user_id'):
                self.notification_service.send_notification(
                    user_id=delivery_person.user_id,
                    title="🎉 Delivery Completed",
                    message=f"You have successfully delivered order #{order_id}. Great job!",
                    type="DELIVERY",
                    reference_id=order_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send delivery person completed notification: {e}")
    
    def _send_delivery_failed_notification(self, customer_id: int, order_id: int, notes: Optional[str] = None):
        """Send notification to customer when delivery fails"""
        try:
            failure_reason = f" Reason: {notes}" if notes else ""
            self.notification_service.send_notification(
                user_id=customer_id,
                title="❌ Delivery Attempt Failed",
                message=f"Delivery attempt for order #{order_id} was unsuccessful.{failure_reason} Our team will contact you soon.",
                type="DELIVERY",
                reference_id=order_id
            )
        except Exception as e:
            print(f"⚠️ Failed to send delivery failed notification: {e}")
    
    def _send_delivery_failed_admin_notification(self, order_id: int, delivery_id: int, delivery_person_name: str, notes: Optional[str] = None):
        """Send notification to all admins when delivery fails"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            failure_reason = f" Reason: {notes}" if notes else ""
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="⚠️ Delivery Failed",
                    message=f"Delivery #{delivery_id} for order #{order_id} failed.{failure_reason} Delivery person: {delivery_person_name}.",
                    type="DELIVERY",
                    reference_id=order_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send admin delivery failed notification: {e}")
    
    def _send_customer_call_notification(self, customer_id: int, order_id: int, delivery_person_name: str):
        """Send notification to customer when delivery person calls them"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="📞 Delivery Call",
                message=f"{delivery_person_name} tried to contact you regarding your order #{order_id}. Please check your missed calls.",
                type="DELIVERY",
                reference_id=order_id
            )
        except Exception as e:
            print(f"⚠️ Failed to send customer call notification: {e}")