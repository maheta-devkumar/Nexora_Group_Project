from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.order_admin_repository import OrderAdminRepository
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository  # ADD THIS
from utils.send_email import EmailService  # Import email service
from datetime import datetime
from typing import Dict, Any

class OrderAdminService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = OrderAdminRepository()
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()  # ADD THIS
        self.email_service = EmailService(db_session=db)  # Initialize email service

    def get_all_orders(self, page, per_page, status):
        return self.repo.get_all_orders(self.db, page, per_page, status)

    def get_order_admin(self, order_id):
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        return order

    def update_order_admin(self, order_id, data, admin_id):
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")

        # Store old values for notification
        old_values = {
            'order_status': order.order_status,
            'payment_status': order.payment_status,
            'total_amount': order.total_amount if hasattr(order, 'total_amount') else None
        }

        for key, value in data.items():
            setattr(order, key, value)

        self.repo.add_history(self.db, order_id, data.get("order_status"), admin_id)
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR ORDER UPDATE
        # ============================================
        try:
            self._send_order_update_notifications(order, admin_id, old_values, data)
        except Exception as notif_error:
            print(f"⚠️ Order update notification failed: {notif_error}")
        
        return order

    def admin_cancel_order(self, order_id, admin_id):
        """Admin cancel order with email notifications"""
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        old_status = order.order_status
        order.order_status = "CANCELLED"
        self.repo.add_history(self.db, order_id, "CANCELLED", admin_id)
        self.db.commit()
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR ADMIN CANCELLATION
        # ============================================
        try:
            # Get admin user details
            admin_user = self.repo.get_user_by_id(self.db, admin_id)
            admin_name = f"{admin_user.first_name} {admin_user.last_name}" if admin_user else "Admin"
            
            # 1. Send email to customer (c)
            customer_email = f"""
Dear Customer,

We regret to inform you that your order has been cancelled by our administration team.

Order Details:
- Order ID: #{order.order_id}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Previous Status: {old_status}
- New Status: CANCELLED
- Cancelled By: {admin_name} (Admin)
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Reason: Cancelled by admin due to system requirements or policy compliance.

What happens next?
1. If payment was made, refund will be processed within 5-7 business days
2. Any reserved stock has been released back to inventory
3. You can place a new order at any time

If you have any questions about this cancellation, please contact our customer support.

We apologize for any inconvenience caused.

Best regards,
Customer Support Team
"""
            self.email_service.send_to_user_by_id(order.user_id, "❌ Order Cancelled by Admin", customer_email)
            
            # 2. Send email to all admins (a) - notification
            admin_notification_subject = f"🚫 Order #{order.order_id} Cancelled by Admin"
            admin_notification_message = f"""
ADMIN ORDER CANCELLATION NOTIFICATION

Order Details:
- Order ID: #{order.order_id}
- Customer ID: {order.user_id}
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Previous Status: {old_status}
- New Status: CANCELLED
- Cancelled By: {admin_name} (ID: {admin_id})
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Customer has been notified about the cancellation.

ACTION REQUIRED:
1. Process refund if payment was made
2. Release inventory stock if applicable
3. Update financial records

Best regards,
Order Management System
"""
            self.email_service.send_to_all_admins(admin_notification_subject, admin_notification_message)
            
            # 3. Send email to delivery person (dp) if assigned
            delivery = self.repo.get_delivery_by_order_id(self.db, order_id)
            if delivery and delivery.delivery_person_id:
                dp_email = f"""
Dear Delivery Partner,

The order #{order.order_id} you were assigned to has been cancelled by admin.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer ID: {order.user_id}
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reason: Cancelled by admin

You are no longer responsible for this delivery. Please focus on your other assigned deliveries.

If you have any questions, please contact delivery management.

Best regards,
Delivery Management Team
"""
                # Get delivery person user ID
                dp_user_id = self.repo.get_delivery_person_user_id(self.db, delivery.delivery_person_id)
                if dp_user_id:
                    self.email_service.send_to_user_by_id(dp_user_id, "📦 Delivery Cancelled - Order #{order.order_id}", dp_email)
            
            
        except Exception as email_error:
            # Don't fail cancellation if email fails
            print(f"⚠️ Email sending failed but order was cancelled: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR ORDER CANCELLATION
        # ============================================
        try:
            self._send_order_cancellation_notifications(order, admin_id, old_status)
        except Exception as notif_error:
            print(f"⚠️ Order cancellation notification failed: {notif_error}")
        
        return {"message": "Order cancelled by admin"}

    def delete_order(self, order_id):
        # Get order details before deletion for notification
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        # Store order details for notification
        order_details = {
            "order_id": order.order_id,
            "user_id": order.user_id,
            "total_amount": order.total_amount if hasattr(order, 'total_amount') else 0.0,
            "order_status": order.order_status,
            "placed_at": order.placed_at
        }
        
        self.repo.delete_order(self.db, order_id)
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR ORDER DELETION
        # ============================================
        try:
            self._send_order_deletion_notifications(order_details)
        except Exception as notif_error:
            print(f"⚠️ Order deletion notification failed: {notif_error}")
        
        return {"message": "Order deleted"}

    def get_order_items(self, order_id):
        return self.repo.get_order_items(self.db, order_id)

    def update_order_item_qty(self, order_id: int, variant_id: int, qty: int):
        if qty <= 0:
            raise HTTPException(
                status_code=400,
                detail="Quantity must be greater than zero"
            )
        
        # Get old quantity for notification
        old_qty = self.repo.get_order_item_qty(self.db, order_id, variant_id)
        
        result = self.repo.update_order_item_qty(
            self.db,
            order_id,
            variant_id,
            qty
        )
        
        # ============================================
        # SEND NOTIFICATIONS FOR ORDER ITEM QUANTITY UPDATE
        # ============================================
        try:
            self._send_order_item_qty_notifications(order_id, variant_id, old_qty, qty)
        except Exception as notif_error:
            print(f"⚠️ Order item quantity notification failed: {notif_error}")
        
        return result

    def remove_order_item(self, order_id, variant_id):
        # Get item details before removal for notification
        item_details = self.repo.get_order_item_details(self.db, order_id, variant_id)
        
        result = self.repo.remove_order_item(self.db, order_id, variant_id)
        
        # ============================================
        # SEND NOTIFICATIONS FOR ORDER ITEM REMOVAL
        # ============================================
        try:
            if item_details:
                self._send_order_item_removal_notifications(order_id, item_details)
        except Exception as notif_error:
            print(f"⚠️ Order item removal notification failed: {notif_error}")
        
        return result

    def get_order_history(self, order_id):
        return self.repo.get_order_history(self.db, order_id)

    def add_order_history(self, order_id, status, admin_id):
        history = self.repo.add_history(
            self.db,
            order_id,
            status,
            admin_id
        )

        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR ORDER HISTORY ADDITION
        # ============================================
        try:
            order = self.repo.get_order_by_id(self.db, order_id)
            if order:
                self._send_order_history_notifications(order, status, admin_id)
        except Exception as notif_error:
            print(f"⚠️ Order history notification failed: {notif_error}")

        return {
            "message": "Order history added successfully",
            "history_id": history.history_id,
            "order_id": history.order_id,
            "status": history.status
        }

    def list_all_returns(self):
        return self.repo.list_all_returns(self.db)

    def get_return_request(self, return_id):
        return self.repo.get_return_request(self.db, return_id)

    def approve_return(self, return_id, admin_id):
        """Approve return request with email notifications"""
        return_request = self.repo.get_return_request(self.db, return_id)
        if not return_request:
            raise HTTPException(404, "Return request not found")
        
        # Store old status for notification
        old_status = return_request.status
        
        # Update return status
        result = self.repo.update_return_status(self.db, return_id, "APPROVED")
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR RETURN APPROVAL
        # ============================================
        try:
            # Get order and customer details
            order = self.repo.get_order_by_id(self.db, return_request.order_id)
            if not order:
                return result
            
            # Get admin details
            admin_user = self.repo.get_user_by_id(self.db, admin_id)
            admin_name = f"{admin_user.first_name} {admin_user.last_name}" if admin_user else "Admin"
            
            # 1. Send email to customer (c)
            customer_subject = f"✅ Return Request Approved - Order #{order.order_id}"
            customer_message = f"""
Dear Customer,

Great news! Your return request has been approved.

Return Details:
- Return ID: #{return_request.return_id}
- Order ID: #{order.order_id}
- Reason: {return_request.reason}
- Status: APPROVED
- Approved By: {admin_name}
- Approved At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Next Steps:
1. Please prepare the items for return
2. You will receive a return pickup schedule
3. Refund will be processed after we receive the items
4. You'll receive confirmation when refund is initiated

Refund will be processed to your original payment method within 5-7 business days after we receive the returned items.

If you have any questions, please contact our customer support.

Thank you for your patience.

Best regards,
Returns & Refunds Team
"""
            self.email_service.send_to_user_by_id(order.user_id, customer_subject, customer_message)
            
            # 2. Send email to all admins (a)
            admin_subject = f"🔄 Return Request Approved - #{return_request.return_id}"
            admin_message = f"""
RETURN REQUEST APPROVAL NOTIFICATION

Return Details:
- Return ID: #{return_request.return_id}
- Order ID: #{order.order_id}
- Customer ID: {order.user_id}
- Reason: {return_request.reason}
- Status: APPROVED → APPROVED
- Approved By: {admin_name} (ID: {admin_id})
- Approved At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

NEXT ACTION REQUIRED:
1. Schedule return pickup with customer
2. Update inventory upon receipt
3. Initiate refund process

Customer has been notified about the approval.

Best regards,
Returns Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail return approval if email fails
            print(f"⚠️ Email sending failed but return was approved: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR RETURN APPROVAL
        # ============================================
        try:
            order = self.repo.get_order_by_id(self.db, return_request.order_id)
            if order:
                self._send_return_approval_notifications(return_request, order, admin_id, old_status)
        except Exception as notif_error:
            print(f"⚠️ Return approval notification failed: {notif_error}")
        
        return result

    def reject_return(self, return_id, admin_id, reason):
        # Get return details before rejection
        return_request = self.repo.get_return_request(self.db, return_id)
        if not return_request:
            raise HTTPException(404, "Return request not found")
        
        # Store old status for notification
        old_status = return_request.status
        
        result = self.repo.update_return_status(self.db, return_id, "REJECTED")
        
        # ============================================
        # SEND NOTIFICATIONS FOR RETURN REJECTION
        # ============================================
        try:
            order = self.repo.get_order_by_id(self.db, return_request.order_id)
            if order:
                self._send_return_rejection_notifications(return_request, order, admin_id, old_status, reason)
        except Exception as notif_error:
            print(f"⚠️ Return rejection notification failed: {notif_error}")
        
        return result

    def get_return_items(self, return_id):
        return self.repo.get_return_items(self.db, return_id)

    def list_all_refunds(self):
        return self.repo.list_all_refunds(self.db)

    def get_refund(self, refund_id):
        return self.repo.get_refund(self.db, refund_id)

    def create_refund(self, return_id, admin_id):
        """Create refund with email notifications"""
        refund = self.repo.create_refund(self.db, return_id, admin_id)
        if not refund:
            raise HTTPException(404, "Cannot create refund")
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR REFUND CREATION
        # ============================================
        try:
            # Get return and order details
            return_request = self.repo.get_return_request(self.db, return_id)
            if not return_request:
                return refund
            
            order = self.repo.get_order_by_id(self.db, return_request.order_id)
            if not order:
                return refund
            
            # Get admin details
            admin_user = self.repo.get_user_by_id(self.db, admin_id)
            admin_name = f"{admin_user.first_name} {admin_user.last_name}" if admin_user else "Admin"
            
            # 1. Send email to customer (c)
            customer_subject = f"💰 Refund Initiated - Order #{order.order_id}"
            customer_message = f"""
Dear Customer,

Your refund has been successfully initiated.

Refund Details:
- Refund ID: #{refund.refund_id}
- Return ID: #{return_request.return_id}
- Order ID: #{order.order_id}
- Refund Amount: ${refund.amount:.2f if hasattr(refund.amount, '__float__') else 0.0}
- Status: {refund.status}
- Initiated By: {admin_name}
- Initiated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Refund Method: {refund.refund_method}

Refund Timeline:
- Processing: 1-2 business days
- Bank Processing: 3-5 business days
- Total: 5-7 business days to reflect in your account

You will receive another notification when the refund is completed and processed to your account.

If you don't see the refund in your account after 7 business days, please contact our customer support.

Thank you for your patience.

Best regards,
Refunds Department
"""
            self.email_service.send_to_user_by_id(order.user_id, customer_subject, customer_message)
            
            # 2. Send email to all admins (a)
            admin_subject = f"💰 Refund Created - #{refund.refund_id}"
            admin_message = f"""
REFUND CREATION NOTIFICATION

Refund Details:
- Refund ID: #{refund.refund_id}
- Return ID: #{return_request.return_id}
- Order ID: #{order.order_id}
- Customer ID: {order.user_id}
- Refund Amount: ${refund.amount:.2f if hasattr(refund.amount, '__float__') else 0.0}
- Status: {refund.status}
- Refund Method: {refund.refund_method}
- Created By: {admin_name} (ID: {admin_id})
- Created At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Original Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

NEXT ACTION REQUIRED:
1. Process refund through payment gateway/bank
2. Update financial records
3. Mark as completed when finished

Customer has been notified about the refund initiation.

Best regards,
Finance Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail refund creation if email fails
            print(f"⚠️ Email sending failed but refund was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR REFUND CREATION
        # ============================================
        try:
            order = self.repo.get_order_by_id(self.db, return_request.order_id)
            if order:
                self._send_refund_creation_notifications(refund, order, admin_id)
        except Exception as notif_error:
            print(f"⚠️ Refund creation notification failed: {notif_error}")
        
        return refund

    def update_refund_status(self, refund_id, status, admin_id):
        # Get refund details before update
        refund = self.repo.get_refund(self.db, refund_id)
        if not refund:
            raise HTTPException(404, "Refund not found")
        
        # Store old status for notification
        old_status = refund.status
        
        result = self.repo.update_refund_status(self.db, refund_id, status)
        
        # ============================================
        # SEND NOTIFICATIONS FOR REFUND STATUS UPDATE
        # ============================================
        try:
            self._send_refund_status_notifications(refund, old_status, status, admin_id)
        except Exception as notif_error:
            print(f"⚠️ Refund status notification failed: {notif_error}")
        
        return result

    def retry_refund(self, refund_id, admin_id):
        return self.update_refund_status(refund_id, "PROCESSING", admin_id)

    def get_order_stats(self):
        return self.repo.get_order_stats(self.db)

    def get_orders_by_date(self, start, end):
        return self.repo.get_orders_by_date(self.db, start, end)

    def get_orders_by_payment_status(self, status):
        return self.repo.get_orders_by_payment_status(self.db, status)

    def get_orders_by_delivery_status(self, status):
        return self.repo.get_orders_by_delivery_status(self.db, status)

    # ADD THESE MISSING METHODS:
    def assign_delivery(self, order_id, delivery_user_id):
        # Basic implementation - you'll need to modify based on your Order model
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        # Assuming your Order model has a delivery_user_id field
        old_delivery_user_id = getattr(order, 'delivery_user_id', None)
        order.delivery_user_id = delivery_user_id
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR DELIVERY ASSIGNMENT
        # ============================================
        try:
            self._send_delivery_assignment_notifications(order, old_delivery_user_id, delivery_user_id, admin_id=None)
        except Exception as notif_error:
            print(f"⚠️ Delivery assignment notification failed: {notif_error}")
        
        return {"message": "Delivery person assigned", "order_id": order_id, "delivery_user_id": delivery_user_id}

    def update_delivery_person(self, order_id, delivery_user_id):
        # Similar to assign_delivery
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        old_delivery_user_id = getattr(order, 'delivery_user_id', None)
        order.delivery_user_id = delivery_user_id
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR DELIVERY PERSON UPDATE
        # ============================================
        try:
            self._send_delivery_update_notifications(order, old_delivery_user_id, delivery_user_id, admin_id=None)
        except Exception as notif_error:
            print(f"⚠️ Delivery person update notification failed: {notif_error}")
        
        return {"message": "Delivery person updated", "order_id": order_id, "delivery_user_id": delivery_user_id}

    def get_delivery_details(self, order_id):
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        # Return delivery details based on your Order model
        return {
            "order_id": order.order_id,
            "delivery_user_id": getattr(order, 'delivery_user_id', None),
            "delivery_status": order.order_status,
            "delivery_address": getattr(order, 'delivery_address', None),
            "estimated_delivery": getattr(order, 'estimated_delivery', None)
        }

    def get_order_issues(self, order_id):
        # Placeholder - implement based on your Issue model
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        return {"message": "No issues found", "order_id": order_id}

    def resolve_order_issue(self, issue_id, resolution_note):
        # Placeholder - implement based on your Issue model
        return {"message": f"Issue {issue_id} resolved", "resolution_note": resolution_note}

    def get_order_feedback(self, order_id):
        # Placeholder - implement based on your Feedback model
        order = self.repo.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(404, "Order not found")
        
        return {"message": "No feedback available", "order_id": order_id}
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_order_update_notifications(self, order, admin_id, old_values: Dict[str, Any], new_data: Dict[str, Any]):
        """Send notifications when admin updates order"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Determine what changed
            changes = []
            for key, old_value in old_values.items():
                if key in new_data and new_data[key] != old_value:
                    changes.append(f"{key}: {old_value} → {new_data[key]}")
            
            if not changes:
                return
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # 1. Send notification to admin users (all admins except the one who made the change)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                if admin.user_id != admin_id:  # Exclude the admin who made the change
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title="✏️ Order Updated by Admin",
                        message=f"Order #{order.order_id} updated by {admin_name}. Changes: {', '.join(changes)}.",
                        type="ORDER",
                        reference_id=order.order_id
                    )
            
            # 2. Send notification to customer if order status or payment status changed
            if customer and ('order_status' in new_data or 'payment_status' in new_data):
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title="📋 Order Update",
                    message=f"Your Order #{order.order_id} has been updated by admin.",
                    type="ORDER",
                    reference_id=order.order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send order update notifications: {e}")

    def _send_order_cancellation_notifications(self, order, admin_id, old_status: str):
        """Send notifications when admin cancels order"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="❌ Order Cancelled by Admin",
                    message=f"Order #{order.order_id} cancelled by {admin_name}. Was: {old_status}.",
                    type="ORDER",
                    reference_id=order.order_id
                )
            
            # 2. Send notification to customer
            if customer:
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title="❌ Order Cancelled",
                    message=f"Your Order #{order.order_id} has been cancelled by admin.",
                    type="ORDER",
                    reference_id=order.order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send order cancellation notifications: {e}")

    def _send_order_deletion_notifications(self, order_details: Dict[str, Any]):
        """Send notifications when order is deleted"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🗑️ Order Deleted",
                    message=f"Order #{order_details['order_id']} (Customer ID: {order_details['user_id']}, Amount: ${order_details['total_amount']:.2f}) has been deleted.",
                    type="ORDER",
                    reference_id=order_details['order_id']
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send order deletion notifications: {e}")

    def _send_order_item_qty_notifications(self, order_id: int, variant_id: int, old_qty: int, new_qty: int):
        """Send notifications when order item quantity is updated"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Order Item Quantity Updated",
                    message=f"Order #{order_id}, Variant #{variant_id}: Quantity changed from {old_qty} to {new_qty}.",
                    type="ORDER",
                    reference_id=order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send order item quantity notifications: {e}")

    def _send_order_item_removal_notifications(self, order_id: int, item_details: Dict[str, Any]):
        """Send notifications when order item is removed"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🗑️ Order Item Removed",
                    message=f"Order #{order_id}: Item '{item_details.get('product_name', 'Unknown')}' (Variant #{item_details.get('variant_id')}) removed.",
                    type="ORDER",
                    reference_id=order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send order item removal notifications: {e}")

    def _send_order_history_notifications(self, order, status: str, admin_id: int):
        """Send notifications when order history is added"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                if admin.user_id != admin_id:  # Exclude the admin who added history
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title="📝 Order History Added",
                        message=f"Order #{order.order_id}: {admin_name} added history with status '{status}'.",
                        type="ORDER",
                        reference_id=order.order_id
                    )
                
        except Exception as e:
            print(f"⚠️ Failed to send order history notifications: {e}")

    def _send_return_approval_notifications(self, return_request, order, admin_id: int, old_status: str):
        """Send notifications when return is approved"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="✅ Return Approved",
                    message=f"Return #{return_request.return_id} for Order #{order.order_id} approved by {admin_name}.",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
            
            # 2. Send notification to customer
            if customer:
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title="✅ Return Approved",
                    message=f"Your return request for Order #{order.order_id} has been approved.",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send return approval notifications: {e}")

    def _send_return_rejection_notifications(self, return_request, order, admin_id: int, old_status: str, reason: str):
        """Send notifications when return is rejected"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="❌ Return Rejected",
                    message=f"Return #{return_request.return_id} for Order #{order.order_id} rejected by {admin_name}. Reason: {reason}",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
            
            # 2. Send notification to customer
            if customer:
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title="❌ Return Rejected",
                    message=f"Your return request for Order #{order.order_id} has been rejected. Reason: {reason}",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send return rejection notifications: {e}")

    def _send_refund_creation_notifications(self, refund, order, admin_id: int):
        """Send notifications when refund is created"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            # 1. Send notification to admin users (all admins)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="💰 Refund Created",
                    message=f"Refund #{refund.refund_id} for Order #{order.order_id} created by {admin_name}. Amount: ${refund.amount:.2f}",
                    type="REFUND",
                    reference_id=refund.refund_id
                )
            
            # 2. Send notification to customer
            if customer:
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title="💰 Refund Initiated",
                    message=f"Refund for Order #{order.order_id} has been initiated. Amount: ${refund.amount:.2f}",
                    type="REFUND",
                    reference_id=refund.refund_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send refund creation notifications: {e}")

    def _send_refund_status_notifications(self, refund, old_status: str, new_status: str, admin_id: int):
        """Send notifications when refund status changes"""
        try:
            # Get admin user
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "PENDING": "⏳",
                "PROCESSING": "🔄",
                "COMPLETED": "✅",
                "FAILED": "❌"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{new_emoji} Refund Status Updated",
                    message=f"Refund #{refund.refund_id}: Status changed from {old_status} to {new_status} by {admin_name}. Amount: ${refund.amount:.2f}",
                    type="REFUND",
                    reference_id=refund.refund_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send refund status notifications: {e}")

    def _send_delivery_assignment_notifications(self, order, old_delivery_user_id, new_delivery_user_id, admin_id=None):
        """Send notifications when delivery person is assigned"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🚚 Delivery Assigned",
                    message=f"Order #{order.order_id}: Delivery person assigned (User ID: {new_delivery_user_id}).",
                    type="DELIVERY",
                    reference_id=order.order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery assignment notifications: {e}")

    def _send_delivery_update_notifications(self, order, old_delivery_user_id, new_delivery_user_id, admin_id=None):
        """Send notifications when delivery person is updated"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                old_info = f"User ID: {old_delivery_user_id}" if old_delivery_user_id else "Unassigned"
                new_info = f"User ID: {new_delivery_user_id}" if new_delivery_user_id else "Unassigned"
                
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 Delivery Person Updated",
                    message=f"Order #{order.order_id}: Delivery person changed from {old_info} to {new_info}.",
                    type="DELIVERY",
                    reference_id=order.order_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery update notifications: {e}")