from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class DeliveryAvailableService:

    def __init__(self, db: Session):
        self.db = db
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()

    def fetchAvailableDeliveries(self):
        """Fetch available deliveries for delivery person - based on status and is_available only"""
        try:
            # Get available deliveries based on status and is_available
            results = self.db.execute(
                text("""
                SELECT 
                    d.delivery_id,
                    d.order_id,
                    d.status,
                    d.assigned_at,
                    d.is_available,
                    d.delivery_person_id
                FROM delivery d
                WHERE UPPER(d.status) = 'AVAILABLE'
                  AND d.is_available = true
                ORDER BY d.delivery_id ASC
                """)
            ).fetchall()
            
            print(f"DEBUG: Found {len(results)} available deliveries")
            
            deliveries = []
            current_time = datetime.utcnow()  # For consistent timestamp
            
            for row in results:
                delivery_id, order_id, status, assigned_at, is_available, delivery_person_id = row
                
                print(f"DEBUG: Processing delivery {delivery_id}, order {order_id}, status: {status}")
                
                # Get customer details
                order_result = self.db.execute(
                    text("""
                    SELECT 
                        u.first_name,
                        u.last_name,
                        o.address_id,
                        o.total_amount,
                        o.order_status,
                        o.user_id
                    FROM "order" o
                    JOIN "user" u ON o.user_id = u.user_id
                    WHERE o.order_id = :order_id
                    """),
                    {"order_id": order_id}
                ).fetchone()
                
                if order_result:
                    customer_name = f"{order_result[0]} {order_result[1]}"
                    address_id = order_result[2]
                    order_total = float(order_result[3]) if order_result[3] else 0.0
                    order_status = order_result[4]
                    customer_user_id = order_result[5]
                    
                    # Get address details
                    delivery_address = "Address not available"
                    if address_id:
                        address_result = self.db.execute(
                            text("""
                            SELECT 
                                a.line1,
                                a.line2,
                                ar.area_name,
                                c.city_name,
                                s.state_name,
                                ar.pincode
                            FROM address a
                            JOIN area ar ON a.area_id = ar.area_id
                            JOIN city c ON ar.city_id = c.city_id
                            LEFT JOIN state s ON c.state_id = s.state_id
                            WHERE a.address_id = :address_id
                            """),
                            {"address_id": address_id}
                        ).fetchone()
                        
                        if address_result:
                            # Build address string
                            parts = []
                            if address_result[0]:
                                parts.append(address_result[0])
                            if address_result[1]:
                                parts.append(address_result[1])
                            if address_result[2]:
                                parts.append(f"{address_result[2]}")
                            if address_result[3]:
                                parts.append(f"{address_result[3]}")
                            if address_result[4]:
                                parts.append(f"{address_result[4]}")
                            if address_result[5]:
                                parts.append(f"Pincode: {address_result[5]}")
                            
                            delivery_address = ", ".join(parts) if parts else "Address not available"
                else:
                    customer_name = "Customer"
                    delivery_address = "Address not available"
                    order_total = 0.0
                    order_status = "UNKNOWN"
                    customer_user_id = None
                
                deliveries.append({
                    "delivery_id": delivery_id,
                    "order_id": order_id,
                    "status": status,
                    "customer_name": customer_name,
                    "delivery_address": delivery_address,
                    "available_since": current_time,  # Use current time for response schema
                    "waiting_time_minutes": 0.0,  # Set to 0 since we're not tracking this
                    "is_available": is_available,
                    "order_total": order_total,
                    "order_status": order_status,
                    "delivery_person_id": delivery_person_id,
                    "customer_user_id": customer_user_id
                })
            
            print(f"DEBUG: Returning {len(deliveries)} deliveries")
            return deliveries
            
        except Exception as e:
            print(f"Error fetching available deliveries: {e}")
            import traceback
            traceback.print_exc()
            return []

    def assignDeliveryToPerson(self, delivery_id, delivery_person_id):
        """Assign delivery to delivery person with transaction lock"""
        try:
            # Start transaction with row lock
            self.db.execute(text("BEGIN"))
            
            # Check if delivery is still available (with lock)
            result = self.db.execute(
                text("""
                SELECT status, is_available, delivery_person_id, order_id 
                FROM delivery 
                WHERE delivery_id = :delivery_id 
                FOR UPDATE
                """),
                {"delivery_id": delivery_id}
            ).fetchone()
            
            if not result:
                self.db.execute(text("ROLLBACK"))
                raise HTTPException(404, "Delivery not found")
            
            status, is_available, current_person_id, order_id = result
            
            # Check if already assigned
            if current_person_id:
                self.db.execute(text("ROLLBACK"))
                return {
                    "success": False,
                    "message": "Delivery already assigned to another person",
                    "assigned_to": current_person_id
                }
            
            if status != "AVAILABLE" or not is_available:
                self.db.execute(text("ROLLBACK"))
                return {
                    "success": False,
                    "message": "Delivery is no longer available"
                }
            
            # Get delivery person details before assignment
            delivery_person_result = self.db.execute(
                text("""
                SELECT u.first_name, u.last_name, dp.user_id 
                FROM delivery_person dp
                JOIN "user" u ON dp.user_id = u.user_id
                WHERE dp.delivery_person_id = :dp_id
                """),
                {"dp_id": delivery_person_id}
            ).fetchone()
            
            delivery_person_name = f"{delivery_person_result[0]} {delivery_person_result[1]}" if delivery_person_result else "Delivery Person"
            delivery_person_user_id = delivery_person_result[2] if delivery_person_result and delivery_person_result[2] else None
            
            # Get customer details for notification
            customer_result = self.db.execute(
                text("""
                SELECT u.user_id, u.first_name, u.last_name 
                FROM "order" o
                JOIN "user" u ON o.user_id = u.user_id
                WHERE o.order_id = :order_id
                """),
                {"order_id": order_id}
            ).fetchone()
            
            customer_user_id = customer_result[0] if customer_result else None
            customer_name = f"{customer_result[1]} {customer_result[2]}" if customer_result else "Customer"
            
            # Assign delivery
            self.db.execute(
                text("""
                UPDATE delivery 
                SET delivery_person_id = :dp_id,
                    status = 'ASSIGNED',
                    is_available = false,
                    assigned_at = :now
                WHERE delivery_id = :delivery_id
                """),
                {
                    "dp_id": delivery_person_id,
                    "delivery_id": delivery_id,
                    "now": datetime.utcnow()
                }
            )
            
            self.db.execute(text("COMMIT"))
            
            # ============================================
            # SEND NOTIFICATIONS AFTER SUCCESSFUL ASSIGNMENT
            # ============================================
            try:
                # 1. Notify Customer
                if customer_user_id:
                    self._send_delivery_assigned_customer_notification(
                        customer_id=customer_user_id,
                        order_id=order_id,
                        delivery_person_name=delivery_person_name
                    )
                
                # 2. Notify Delivery Person (if they have a user_id)
                if delivery_person_user_id:
                    self._send_delivery_assigned_person_notification(
                        delivery_person_user_id=delivery_person_user_id,
                        delivery_id=delivery_id,
                        order_id=order_id,
                        customer_name=customer_name
                    )
                
                # 3. Notify Admin Users (bulk notification)
                self._send_delivery_assigned_admin_notification(
                    delivery_id=delivery_id,
                    order_id=order_id,
                    delivery_person_name=delivery_person_name,
                    customer_name=customer_name
                )
                
            except Exception as notif_error:
                print(f"⚠️ Notification sending failed after delivery assignment: {notif_error}")
                # Don't fail the main operation if notifications fail
            
            return {
                "success": True,
                "message": "Delivery accepted successfully",
                "delivery_id": delivery_id,
                "delivery_person_id": delivery_person_id
            }
            
        except Exception as e:
            self.db.execute(text("ROLLBACK"))
            raise HTTPException(500, f"Failed to accept delivery: {str(e)}")

    def cancelDelivery(self, delivery_id, delivery_person_id):
        """Cancel delivery by delivery person"""
        try:
            # Start transaction
            self.db.execute(text("BEGIN"))
            
            # Check if delivery belongs to this person
            result = self.db.execute(
                text("""
                SELECT status, delivery_person_id, order_id 
                FROM delivery 
                WHERE delivery_id = :delivery_id 
                FOR UPDATE
                """),
                {"delivery_id": delivery_id}
            ).fetchone()
            
            if not result:
                self.db.execute(text("ROLLBACK"))
                raise HTTPException(404, "Delivery not found")
            
            status, assigned_person_id, order_id = result
            
            # Check permissions
            if assigned_person_id != delivery_person_id:
                self.db.execute(text("ROLLBACK"))
                raise HTTPException(403, "Not authorized to cancel this delivery")
            
            if status != "ASSIGNED":
                self.db.execute(text("ROLLBACK"))
                return {
                    "success": False,
                    "message": f"Cannot cancel delivery with status: {status}"
                }
            
            # Get delivery person details for notification
            delivery_person_result = self.db.execute(
                text("""
                SELECT u.first_name, u.last_name 
                FROM delivery_person dp
                JOIN "user" u ON dp.user_id = u.user_id
                WHERE dp.delivery_person_id = :dp_id
                """),
                {"dp_id": delivery_person_id}
            ).fetchone()
            
            delivery_person_name = f"{delivery_person_result[0]} {delivery_person_result[1]}" if delivery_person_result else "Delivery Person"
            
            # Get customer details for notification
            customer_result = self.db.execute(
                text("""
                SELECT u.user_id, u.first_name, u.last_name 
                FROM "order" o
                JOIN "user" u ON o.user_id = u.user_id
                WHERE o.order_id = :order_id
                """),
                {"order_id": order_id}
            ).fetchone()
            
            customer_user_id = customer_result[0] if customer_result else None
            customer_name = f"{customer_result[1]} {customer_result[2]}" if customer_result else "Customer"
            
            # Cancel and make available again
            self.db.execute(
                text("""
                UPDATE delivery 
                SET status = 'AVAILABLE',
                    is_available = true,
                    delivery_person_id = NULL
                WHERE delivery_id = :delivery_id
                """),
                {"delivery_id": delivery_id}
            )
            
            self.db.execute(text("COMMIT"))
            
            # ============================================
            # SEND NOTIFICATIONS AFTER CANCELLATION
            # ============================================
            try:
                # 1. Notify Customer
                if customer_user_id:
                    self._send_delivery_cancelled_customer_notification(
                        customer_id=customer_user_id,
                        order_id=order_id
                    )
                
                # 2. Notify Admin Users (bulk notification)
                self._send_delivery_cancelled_admin_notification(
                    delivery_id=delivery_id,
                    order_id=order_id,
                    delivery_person_name=delivery_person_name,
                    customer_name=customer_name
                )
                
            except Exception as notif_error:
                print(f"⚠️ Notification sending failed after delivery cancellation: {notif_error}")
                # Don't fail the main operation if notifications fail
            
            return {
                "success": True,
                "message": "Delivery cancelled and made available again",
                "delivery_id": delivery_id
            }
            
        except Exception as e:
            self.db.execute(text("ROLLBACK"))
            raise HTTPException(500, f"Failed to cancel delivery: {str(e)}")

    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_delivery_assigned_customer_notification(self, customer_id: int, order_id: int, delivery_person_name: str):
        """Send notification to customer when delivery is assigned"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="🚚 Delivery Assigned",
                message=f"Great news! Your order #{order_id} has been assigned to {delivery_person_name} for delivery. You can track the delivery in real-time.",
                type="DELIVERY",
                reference_id=order_id
            )
            print(f"✅ Customer notification sent for order #{order_id}")
        except Exception as e:
            print(f"⚠️ Failed to send customer assignment notification: {e}")
    
    def _send_delivery_assigned_person_notification(self, delivery_person_user_id: int, delivery_id: int, order_id: int, customer_name: str):
        """Send notification to delivery person when they accept a delivery"""
        try:
            self.notification_service.send_notification(
                user_id=delivery_person_user_id,
                title="📦 New Delivery Assigned",
                message=f"You have been assigned delivery #{delivery_id} for order #{order_id}. Customer: {customer_name}. Please proceed with pickup.",
                type="DELIVERY",
                reference_id=delivery_id
            )
            print(f"✅ Delivery person notification sent for delivery #{delivery_id}")
        except Exception as e:
            print(f"⚠️ Failed to send delivery person assignment notification: {e}")
    
    def _send_delivery_assigned_admin_notification(self, delivery_id: int, order_id: int, delivery_person_name: str, customer_name: str):
        """Send notification to all admins when delivery is assigned"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Delivery Accepted",
                    message=f"Delivery #{delivery_id} for order #{order_id} has been accepted by {delivery_person_name}. Customer: {customer_name}.",
                    type="DELIVERY",
                    reference_id=delivery_id
                )
            print(f"✅ Admin notifications sent for delivery #{delivery_id}")
        except Exception as e:
            print(f"⚠️ Failed to send admin assignment notification: {e}")
    
    def _send_delivery_cancelled_customer_notification(self, customer_id: int, order_id: int):
        """Send notification to customer when delivery is cancelled/rejected"""
        try:
            self.notification_service.send_notification(
                user_id=customer_id,
                title="🔄 Delivery Rescheduled",
                message=f"Your order #{order_id} delivery has been rescheduled. A new delivery person will be assigned soon.",
                type="DELIVERY",
                reference_id=order_id
            )
            print(f"✅ Customer cancellation notification sent for order #{order_id}")
        except Exception as e:
            print(f"⚠️ Failed to send customer cancellation notification: {e}")
    
    def _send_delivery_cancelled_admin_notification(self, delivery_id: int, order_id: int, delivery_person_name: str, customer_name: str):
        """Send notification to all admins when delivery is cancelled/rejected"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="⚠️ Delivery Rejected",
                    message=f"Delivery #{delivery_id} for order #{order_id} has been rejected by {delivery_person_name}. Customer: {customer_name}. The delivery is now available for other delivery persons.",
                    type="DELIVERY",
                    reference_id=delivery_id
                )
            print(f"✅ Admin cancellation notifications sent for delivery #{delivery_id}")
        except Exception as e:
            print(f"⚠️ Failed to send admin cancellation notification: {e}")