from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.delivery_repository import DeliveryRepository
from repositories.delivery_person_repository import DeliveryPersonRepository
from repositories.order_repository import OrderRepository
from repositories.user_repository import UserRepository
from repositories.address_repository import AddressRepository
from services.notification_service import NotificationService
from typing import Dict, Any, Optional
from datetime import datetime
from utils.send_email import EmailService  # Import email service


class DeliveryService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryRepository()
        self.delivery_person_repo = DeliveryPersonRepository()
        self.order_repo = OrderRepository()
        self.user_repo = UserRepository()
        self.address_repo = AddressRepository()
        self.notification_service = NotificationService(db)
        self.email_service = EmailService(db_session=db)  # Initialize email service
    
    def assign_delivery_person(self, order_id: int, delivery_person_id: int) -> Dict[str, Any]:
        """Assign a delivery person to an order"""
        order = self.order_repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        delivery_person = self.delivery_person_repo.get_delivery_person_by_id(self.db, delivery_person_id)
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery person not found"
            )
        
        # Check delivery person status
        if delivery_person.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Delivery person is {delivery_person.status.lower()}. Only active delivery persons can be assigned."
            )
        
        # Check if delivery already exists
        existing_delivery = self.repository.get_delivery_by_order_id(self.db, order_id)
        if existing_delivery:
            existing_delivery.delivery_person_id = delivery_person_id
            delivery = existing_delivery
            self.db.commit()
            self.db.refresh(delivery)
        else:
            # Create new delivery
            delivery_data = {
                "order_id": order_id,
                "delivery_person_id": delivery_person_id,
                "status": "ASSIGNED"
            }
            delivery = self.repository.create_delivery(self.db, delivery_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR DELIVERY ASSIGNMENT
        # ============================================
        try:
            # Get customer details
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Customer"
            customer_email = customer.email if customer else None
            
            # Get delivery person user details
            dp_user = self.user_repo.get_user_by_id(self.db, delivery_person.user_id)
            dp_name = f"{dp_user.first_name} {dp_user.last_name}" if dp_user else "Delivery Partner"
            dp_email = dp_user.email if dp_user else None
            
            # Get address details
            address = self.address_repo.get_address_by_id(self.db, order.address_id)
            if address:
                area_name = address.area.area_name if address.area else "Unknown Area"
                city_name = address.area.city.city_name if address.area and address.area.city else "Unknown City"
                delivery_address = f"{address.line1}, {address.line2 if address.line2 else ''}, {area_name}, {city_name}"
            else:
                delivery_address = "Address not available"
            
            # 1. Send email to delivery person (dp)
            if dp_email:
                dp_subject = f"📦 New Delivery Assignment - Order #{order.order_id}"
                dp_message = f"""
Dear {dp_name},

You have been assigned a new delivery.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer_name}
- Customer Phone: {customer.phone if customer and customer.phone else 'Not provided'}
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Delivery Address: {delivery_address}
- Assigned At: {delivery.assigned_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.assigned_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: ASSIGNED

Delivery Instructions:
1. Proceed to pickup location
2. Verify items with store staff
3. Deliver to customer address above
4. Collect payment if COD
5. Mark as delivered in app

Estimated Earnings: $50.00 for this delivery

Please start the delivery as soon as possible.

Best regards,
Delivery Management Team
"""
                self.email_service.send_email_to_delivery_person(dp_email, dp_subject, dp_message)
            
            # 2. Send email to customer (c) about delivery assignment
            if customer_email:
                customer_subject = f"🚚 Your Order #{order.order_id} Delivery Assigned"
                customer_message = f"""
Dear {customer_name},

Great news! A delivery person has been assigned to your order.

Delivery Details:
- Order ID: #{order.order_id}
- Delivery Person: {dp_name}
- Assigned At: {delivery.assigned_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.assigned_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Delivery Address: {delivery_address}
- Estimated Delivery: 30-60 minutes

Order Summary:
- Items: {len(order.items) if hasattr(order, 'items') else 'Multiple'} items
- Total Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Payment Status: {order.payment_status}

You can track your delivery in real-time from your account dashboard.

Delivery Person Contact:
If needed, you can contact the delivery person through the app messaging system.

Thank you for shopping with us!

Best regards,
Customer Support Team
"""
                self.email_service.send_to_user_by_id(customer.user_id, customer_subject, customer_message)
            
            # 3. Send email to all admins (a)
            admin_subject = f"📦 Delivery Assigned - Order #{order.order_id}"
            admin_message = f"""
DELIVERY ASSIGNMENT NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Assigned To: {dp_name} (ID: {delivery_person_id})
- Customer: {customer_name} (ID: {order.user_id})
- Assigned At: {delivery.assigned_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.assigned_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: ASSIGNED

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Payment Status: {order.payment_status}
- Payment Method: {'COD' if order.payment_status == 'PENDING' else 'Prepaid'}

Delivery Address:
{delivery_address}

Both customer and delivery person have been notified about the assignment.

Best regards,
Delivery Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail assignment if email fails
            print(f"⚠️ Email sending failed but delivery was assigned: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR DELIVERY ASSIGNMENT
        # ============================================
        try:
            self._send_delivery_assignment_notifications(delivery, order, delivery_person)
        except Exception as notif_error:
            print(f"⚠️ Delivery assignment notification failed: {notif_error}")
        
        return self._serialize_delivery(delivery)
    
    def get_delivery_person_orders(self, delivery_person_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all orders assigned to a delivery person"""
        result = self.repository.get_deliveries_by_delivery_person(self.db, delivery_person_id, page, per_page)
        
        deliveries_data = [
            self._serialize_delivery(delivery) for delivery in result["deliveries"]
        ]
        
        return {
            "deliveries": deliveries_data,
            "total_deliveries": result["total_deliveries"]
        }
    
    def update_delivery_status(self, delivery_id: int, status: str, delivery_person_id: int) -> Dict[str, Any]:
        """Update delivery status"""
        delivery = self.repository.get_delivery_by_id(self.db, delivery_id)
        if not delivery or delivery.delivery_person_id != delivery_person_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery not found"
            )
        
        old_status = delivery.status
        updated_delivery = self.repository.update_delivery_status(self.db, delivery_id, status)
        if not updated_delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery not found"
            )
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR STATUS UPDATE
        # ============================================
        try:
            # Get order details
            order = self.order_repo.get_order_by_id(self.db, delivery.order_id)
            if not order:
                return self._serialize_delivery(updated_delivery)
            
            # Get customer details
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Customer"
            
            # Get delivery person details
            delivery_person = self.delivery_person_repo.get_delivery_person_by_id(self.db, delivery_person_id)
            dp_user = self.user_repo.get_user_by_id(self.db, delivery_person.user_id) if delivery_person else None
            dp_name = f"{dp_user.first_name} {dp_user.last_name}" if dp_user else "Delivery Partner"
            
            # Status-specific configurations
            status_config = {
                "PICKED_UP": {
                    "customer_subject": f"📦 Order #{order.order_id} Picked Up",
                    "customer_message": "Your order has been picked up by the delivery person and is on its way to you.",
                    "admin_subject": f"📦 Delivery Picked Up - Order #{order.order_id}"
                },
                "OUT_FOR_DELIVERY": {
                    "customer_subject": f"🚚 Order #{order.order_id} Out for Delivery",
                    "customer_message": "Your order is out for delivery and should arrive soon.",
                    "admin_subject": f"🚚 Delivery Out for Delivery - Order #{order.order_id}"
                },
                "DELIVERED": {
                    "customer_subject": f"✅ Order #{order.order_id} Delivered",
                    "customer_message": "Your order has been successfully delivered!",
                    "admin_subject": f"✅ Delivery Completed - Order #{order.order_id}"
                }
            }
            
            config = status_config.get(status, {
                "customer_subject": f"Delivery Status Update - Order #{order.order_id}",
                "customer_message": f"Delivery status updated to {status}.",
                "admin_subject": f"📊 Delivery Status Update - Order #{order.order_id}"
            })
            
            # 1. Send email to customer (c)
            customer_email = f"""
Dear {customer_name},

{config['customer_message']}

Delivery Details:
- Order ID: #{order.order_id}
- Delivery Person: {dp_name}
- Previous Status: {old_status}
- New Status: {status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Summary:
- Total Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

{
    "DELIVERED": "We hope you're satisfied with your purchase. Please consider leaving a review!",
    "OUT_FOR_DELIVERY": "You can track the delivery in real-time from your account.",
    "PICKED_UP": "Your order is now on its way to you."
}.get(status, "You can track your order from your account dashboard.")

Thank you for shopping with us!

Best regards,
Customer Support Team
"""
            self.email_service.send_to_user_by_id(customer.user_id, config['customer_subject'], customer_email)
            
            # 2. Send email to delivery person (dp)
            if dp_user and dp_user.email:
                dp_subject = f"📋 Delivery Status Updated - {status}"
                dp_message = f"""
Dear {dp_name},

You have updated the delivery status.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer_name}
- Previous Status: {old_status}
- New Status: {status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

{
    "PICKED_UP": "Order picked up successfully. Proceed to delivery address.",
    "OUT_FOR_DELIVERY": "Marked as out for delivery. Please complete delivery soon.",
    "DELIVERED": "Delivery completed successfully. Great job!"
}.get(status, f"Status updated from {old_status} to {status}.")

{
    "DELIVERED": "Your earnings for this delivery will be updated in your account.",
    "OUT_FOR_DELIVERY": "Please ensure timely delivery.",
    "PICKED_UP": "Please proceed to delivery address."
}.get(status, "Please continue with the delivery process.")

Best regards,
Delivery Management Team
"""
                self.email_service.send_email_to_delivery_person(dp_user.email, dp_subject, dp_message)
            
            # 3. Send email to all admins (a)
            admin_message = f"""
DELIVERY STATUS UPDATE NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Delivery Person: {dp_name} (ID: {delivery_person_id})
- Customer: {customer_name} (ID: {customer.user_id})
- Previous Status: {old_status}
- New Status: {status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Payment Status: {order.payment_status}

Status Change: {old_status} → {status}

{
    "DELIVERED": "ACTION: Update order status to DELIVERED and process delivery person earnings.",
    "OUT_FOR_DELIVERY": "ACTION: Monitor delivery progress.",
    "PICKED_UP": "ACTION: Track delivery progress."
}.get(status, "ACTION: Monitor delivery status.")

Both customer and delivery person have been notified.

Best regards,
Delivery Management System
"""
            self.email_service.send_to_all_admins(config['admin_subject'], admin_message)
            
            # Handle DELIVERED status separately
            if status == "DELIVERED":
                # Update order status
                order.order_status = "DELIVERED"
                
                # Create earnings record
                earnings_data = {
                    "delivery_person_id": delivery_person_id,
                    "delivery_id": delivery_id,
                    "amount": 50.00  # Fixed delivery fee
                }
                self.repository.create_delivery_earnings(self.db, earnings_data)
                
                self.db.commit()
            
            
        except Exception as email_error:
            # Don't fail status update if email fails
            print(f"⚠️ Email sending failed but status was updated: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR STATUS UPDATE
        # ============================================
        try:
            order = self.order_repo.get_order_by_id(self.db, delivery.order_id)
            if order:
                customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                delivery_person = self.delivery_person_repo.get_delivery_person_by_id(self.db, delivery_person_id)
                
                if customer and delivery_person:
                    self._send_delivery_status_notifications(delivery, order, customer, delivery_person, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Delivery status notification failed: {notif_error}")
        
        return self._serialize_delivery(updated_delivery)
    
    def get_delivery_person_earnings(self, delivery_person_id: int) -> Dict[str, Any]:
        """Get earnings summary for delivery person"""
        return self.repository.get_delivery_person_earnings(self.db, delivery_person_id)
    
    def get_all_deliveries(self, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all deliveries"""
        result = self.repository.get_all_deliveries(self.db, page, per_page, status)
        
        deliveries_data = [
            self._serialize_delivery(delivery) for delivery in result["deliveries"]
        ]
        
        return {
            "deliveries": deliveries_data,
            "total_deliveries": result["total_deliveries"]
        }
    
    def get_delivery_by_order_id(self, order_id: int) -> Dict[str, Any]:
        """Get delivery by order ID"""
        delivery = self.repository.get_delivery_by_order_id(self.db, order_id)
        if not delivery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Delivery not found for this order"
            )
        
        return self._serialize_delivery(delivery)
    
    def _serialize_delivery(self, delivery) -> Dict[str, Any]:
        """Serialize delivery with related data"""
        order = self.order_repo.get_order_by_id(self.db, delivery.order_id)
        delivery_person = self.delivery_person_repo.get_delivery_person_by_id(self.db, delivery.delivery_person_id)
        user = self.user_repo.get_user_by_id(self.db, delivery_person.user_id) if delivery_person else None
        address = self.address_repo.get_address_by_id(self.db, order.address_id) if order else None
        customer = self.user_repo.get_user_by_id(self.db, order.user_id) if order else None
        
        return {
            "delivery_id": delivery.delivery_id,
            "order_id": delivery.order_id,
            "delivery_person_name": f"{user.first_name} {user.last_name}" if user else None,
            "status": delivery.status,
            "assigned_at": delivery.assigned_at,
            "delivered_at": delivery.delivered_at,
            "available_since": delivery.available_since if hasattr(delivery, 'available_since') else None,
            "is_available": delivery.is_available if hasattr(delivery, 'is_available') else False,
            "pickup_otp": delivery.pickup_otp,
            "delivery_otp": delivery.delivery_otp,
            "order_status": order.order_status if order else "UNKNOWN",
            "customer_name": f"{customer.first_name} {customer.last_name}" if customer else "Unknown",
            "customer_address": f"{address.line1}, {address.area.area_name}" if address and address.area else "Address not available",
            "order_items": [
                {
                    "product_name": item.variant.product.product_name if item.variant and item.variant.product else "Item",
                    "quantity": item.quantity
                } for item in (order.items if order and hasattr(order, 'items') else [])
            ]
        }
    
    # ===========================
    # NEW LIFECYCLE METHODS
    # ===========================

    def get_available_deliveries(self, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get deliveries available for pickup"""
        result = self.repository.get_available_deliveries(self.db, page, per_page)
        
        deliveries_data = [
            self._serialize_delivery(delivery) for delivery in result["deliveries"]
        ]
        
        return {
            "deliveries": deliveries_data,
            "total_deliveries": result["total_deliveries"]
        }

    def accept_delivery(self, delivery_id: int, delivery_person_id: int) -> Dict[str, Any]:
        """Delivery Person accepts a delivery"""
        # 1. Get Delivery Person
        delivery_person = self.delivery_person_repo.get_delivery_person_by_id(self.db, delivery_person_id)
        if not delivery_person or delivery_person.status != "ACTIVE":
            raise HTTPException(status_code=400, detail="Delivery account not active")

        # 2. Get Delivery with pessimistic lock (for update) would be ideal, 
        # but here we rely on the specific filter update or check-then-act with refresh
        
        # Check current status
        delivery = self.repository.get_delivery_by_id(self.db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        if delivery.status != "AVAILABLE" or not delivery.is_available:
            raise HTTPException(status_code=409, detail="Delivery is no longer available")
        
        if delivery.delivery_person_id is not None:
             raise HTTPException(status_code=409, detail="Delivery already assigned to someone else")

        # 3. Assign
        delivery.delivery_person_id = delivery_person_id
        delivery.status = "ASSIGNED"
        delivery.is_available = False
        delivery.assigned_at = datetime.now()
        
        # Generate OTPs
        import secrets
        delivery.pickup_otp = f"{secrets.randbelow(10000):04}" # 4 digit OTP
        delivery.delivery_otp = f"{secrets.randbelow(10000):04}"
        
        self.db.commit()
        self.db.refresh(delivery)
        
        # 4. Notify
        try:
             order = self.order_repo.get_order_by_id(self.db, delivery.order_id)
             self._send_delivery_assignment_notifications(delivery, order, delivery_person)
        except Exception as e:
            print(f"Notification error: {e}")

        return self._serialize_delivery(delivery)

    def confirm_pickup(self, delivery_id: int, delivery_person_id: int) -> Dict[str, Any]:
        """Delivery Person confirms pickup from store"""
        delivery = self.repository.get_delivery_by_id(self.db, delivery_id)
        if not delivery:
             raise HTTPException(status_code=404, detail="Delivery not found")
        
        if delivery.delivery_person_id != delivery_person_id:
             raise HTTPException(status_code=403, detail="Not authorized for this delivery")
             
        if delivery.status != "ASSIGNED":
             raise HTTPException(status_code=400, detail="Delivery must be ASSIGNED before pickup")

        # Update status
        self.update_delivery_status(delivery_id, "PICKED_UP", delivery_person_id)
        
        return self._serialize_delivery(delivery)

    def verify_delivery_otp(self, delivery_id: int, otp: str, delivery_person_id: int) -> Dict[str, Any]:
        """Verify delivery OTP and complete delivery"""
        delivery = self.repository.get_delivery_by_id(self.db, delivery_id)
        if not delivery:
             raise HTTPException(status_code=404, detail="Delivery not found")
             
        if delivery.delivery_person_id != delivery_person_id:
             raise HTTPException(status_code=403, detail="Not authorized for this delivery")
             
        if delivery.status != "PICKED_UP" and delivery.status != "OUT_FOR_DELIVERY":
             raise HTTPException(status_code=400, detail="Invalid status for completion")
             
        if delivery.delivery_otp != otp:
             raise HTTPException(status_code=400, detail="Invalid OTP")
             
        # Complete Delivery
        self.update_delivery_status(delivery_id, "DELIVERED", delivery_person_id)
        
        return self._serialize_delivery(delivery)
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_delivery_assignment_notifications(self, delivery, order, delivery_person):
        """Send database notifications when delivery person is assigned"""
        try:
            # Get user details
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            dp_user = self.user_repo.get_user_by_id(self.db, delivery_person.user_id)
            
            if not customer or not dp_user:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            dp_name = f"{dp_user.first_name} {dp_user.last_name}"
            
            # 1. Send notification to admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Delivery Assigned",
                    message=f"Delivery #{delivery.delivery_id} (Order #{order.order_id}) assigned to {dp_name} for customer {customer_name}.",
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
            
            # 2. Send notification to delivery person
            self.notification_service.send_notification(
                user_id=dp_user.user_id,
                title="🎯 New Delivery Assignment",
                message=f"You've been assigned to deliver Order #{order.order_id} for {customer_name}.",
                type="DELIVERY",
                reference_id=delivery.delivery_id
            )
            
            # 3. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="🚚 Delivery Person Assigned",
                message=f"{dp_name} has been assigned to deliver your Order #{order.order_id}.",
                type="DELIVERY",
                reference_id=order.order_id
            )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery assignment notifications: {e}")

    def _send_delivery_status_notifications(self, delivery, order, customer, delivery_person, old_status: str, new_status: str):
        """Send database notifications when delivery status changes"""
        try:
            # Get user details
            dp_user = self.user_repo.get_user_by_id(self.db, delivery_person.user_id)
            
            if not customer or not dp_user:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            dp_name = f"{dp_user.first_name} {dp_user.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "ASSIGNED": "📋",
                "PICKED_UP": "📦",
                "OUT_FOR_DELIVERY": "🚚",
                "DELIVERED": "✅",
                "CANCELLED": "❌"
            }
            
            emoji = status_emojis.get(new_status, "📊")
            
            # Status-specific messages
            status_messages = {
                "PICKED_UP": f"Order #{order.order_id} has been picked up by {dp_name}.",
                "OUT_FOR_DELIVERY": f"Order #{order.order_id} is out for delivery with {dp_name}.",
                "DELIVERED": f"Order #{order.order_id} has been successfully delivered by {dp_name}.",
                "CANCELLED": f"Delivery for Order #{order.order_id} has been cancelled."
            }
            
            generic_message = f"Delivery #{delivery.delivery_id} status changed from '{old_status}' to '{new_status}'."
            
            # 1. Send notification to admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Delivery Status Updated",
                    message=f"Delivery #{delivery.delivery_id} (Order #{order.order_id}): {status_messages.get(new_status, generic_message)}",
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
            
            # 2. Send notification to customer
            if new_status in ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]:
                customer_title = f"{emoji} Order #{order.order_id} Update"
                customer_message = status_messages.get(new_status, f"Your order status is now: {new_status}")
                
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title=customer_title,
                    message=customer_message,
                    type="DELIVERY",
                    reference_id=order.order_id
                )
            
            # 3. Send notification to delivery person
            if new_status in ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]:
                dp_title = f"{emoji} Delivery Status Updated"
                dp_message = f"You updated delivery #{delivery.delivery_id} status to '{new_status}'."
                
                self.notification_service.send_notification(
                    user_id=dp_user.user_id,
                    title=dp_title,
                    message=dp_message,
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery status notifications: {e}")