from sqlalchemy.orm import Session
from sqlalchemy import func
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.feedback.user_issue import UserIssue
from models.order.order import Order
from datetime import datetime
from utils.send_email import EmailService  # Import email service


class DeliveryAdminRepository:

    def __init__(self):
        pass  # Email service will be initialized in the service layer

    # 1️⃣ Assign delivery
    def create_delivery(self, db: Session, order_id: int, delivery_person_id: int):
        delivery = Delivery(
            order_id=order_id,
            delivery_person_id=delivery_person_id,
            status="ASSIGNED"
        )
        db.add(delivery)
        db.commit()
        db.refresh(delivery)
        return delivery

    # 2️⃣ Get all deliveries
    def get_all_deliveries(self, db: Session):
        return db.query(Delivery).all()

    # 4️⃣ Stats
    def get_delivery_stats(self, db: Session):
        return {
            "active": db.query(Delivery).filter(Delivery.status == "OUT_FOR_DELIVERY").count(),
            "completed": db.query(Delivery).filter(Delivery.status == "DELIVERED").count(),
            "pending": db.query(Delivery).filter(Delivery.status == "ASSIGNED").count(),
            "cancelled": db.query(Delivery).filter(Delivery.status == "CANCELLED").count(),
        }

    # 5️⃣ Update status
    def update_status(self, db: Session, delivery: Delivery, status: str, email_service: EmailService = None):
        """Update delivery status with email notifications"""
        old_status = delivery.status
        delivery.status = status
        
        if status == "DELIVERED":
            delivery.delivered_at = datetime.utcnow()
        
        db.commit()
        db.refresh(delivery)
        
        # Send email notifications if email service is provided
        if email_service:
            self._send_status_update_emails(db, delivery, old_status, status, email_service)
        
        return delivery

    # 6️⃣ Reassign
    def reassign_delivery(self, db: Session, delivery: Delivery, new_person_id: int, email_service: EmailService = None):
        """Reassign delivery with email notifications"""
        old_person_id = delivery.delivery_person_id
        delivery.delivery_person_id = new_person_id
        
        db.commit()
        db.refresh(delivery)
        
        # Send email notifications if email service is provided
        if email_service:
            self._send_reassignment_emails(db, delivery, old_person_id, new_person_id, email_service)
        
        return delivery

    # 7️⃣ Earnings
    def get_earnings(self, db: Session):
        # Get raw earnings data
        earnings_data = db.query(
            DeliveryEarnings.delivery_person_id,
            func.sum(DeliveryEarnings.amount).label("total"),
            func.count(DeliveryEarnings.delivery_id).label("count")
        ).group_by(DeliveryEarnings.delivery_person_id).all()
        
        # Convert to list of dictionaries for proper JSON serialization
        earnings_list = []
        for earning in earnings_data:
            # Get delivery person info
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == earning.delivery_person_id
            ).first()
            
            earnings_list.append({
                "delivery_person_id": earning.delivery_person_id,
                "delivery_person_name": delivery_person.user.username if delivery_person and delivery_person.user else "Unknown",
                "total_earnings": float(earning.total) if earning.total else 0.0,
                "total_deliveries": earning.count or 0
            })
        
        return {
            "success": True,
            "message": "Delivery earnings fetched successfully",
            "data": earnings_list
        }

    # 8️⃣ Performance - FIXED VERSION
    def get_performance(self, db: Session):
        # Get raw performance data
        performance_data = db.query(
            Delivery.delivery_person_id,
            func.count(Delivery.delivery_id).label("completed")
        ).filter(Delivery.status == "DELIVERED") \
         .group_by(Delivery.delivery_person_id).all()
        
        # Convert to list of dictionaries for proper JSON serialization
        performance_list = []
        for perf in performance_data:
            # Get delivery person info
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == perf.delivery_person_id
            ).first()
            
            # Get total deliveries for this person
            total_deliveries = db.query(Delivery).filter(
                Delivery.delivery_person_id == perf.delivery_person_id
            ).count()
            
            # Calculate rating (simplified - you can adjust this)
            rating = 4.5  # Default rating
            if delivery_person:
                rating = float(delivery_person.rating) if delivery_person.rating else 4.0
            
            performance_list.append({
                "delivery_person_id": perf.delivery_person_id,
                "delivery_person_name": delivery_person.user.username if delivery_person and delivery_person.user else "Unknown",
                "completed_deliveries": perf.completed or 0,
                "total_deliveries": total_deliveries or 0,
                "completion_rate": round((perf.completed / total_deliveries * 100) if total_deliveries > 0 else 0, 1),
                "rating": rating
            })
        
        return {
            "success": True,
            "message": "Delivery person performance fetched successfully",
            "data": performance_list
        }

    # 9️⃣ Search
    def search_deliveries(self, db: Session, filters: dict):
        query = db.query(Delivery)
        for key, value in filters.items():
            if value is not None:
                query = query.filter(getattr(Delivery, key) == value)
        return query.all()

    # 1️⃣1️⃣ Timeline
    def get_timeline(self, delivery: Delivery):
        return [
            {"status": delivery.status, "timestamp": delivery.assigned_at},
            {"status": "DELIVERED", "timestamp": delivery.delivered_at}
        ]

    # 1️⃣2️⃣ Cancel
    def cancel_delivery(self, db: Session, delivery: Delivery, email_service: EmailService = None):
        """Cancel delivery with email notifications"""
        delivery.status = "CANCELLED"
        db.commit()
        
        # Send cancellation emails if email service is provided
        if email_service:
            self._send_cancellation_emails(db, delivery, email_service)
        
        return delivery

    # 1️⃣4️⃣ Validate completion
    def validate_completion(self, db: Session, delivery: Delivery, email_service: EmailService = None):
        """Validate delivery completion with email notifications"""
        old_status = delivery.status
        delivery.status = "DELIVERED"
        delivery.delivered_at = datetime.utcnow()
        db.commit()
        
        # Send completion emails if email service is provided
        if email_service:
            self._send_completion_emails(db, delivery, old_status, email_service)
        
        return delivery

    # 1️⃣5️⃣ Issues
    def get_issues(self, db: Session):
        return db.query(UserIssue).filter(UserIssue.delivery_id.isnot(None)).all()

    # ============================================
    # EMAIL NOTIFICATION METHODS
    # ============================================

    def _send_status_update_emails(self, db: Session, delivery: Delivery, old_status: str, new_status: str, email_service: EmailService):
        """Send email notifications for status update"""
        try:
            # Get delivery details
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if not order:
                return
            
            # Get customer details
            customer = order.user
            if not customer:
                return
            
            # Get delivery person details
            delivery_person = None
            if delivery.delivery_person_id:
                delivery_person = db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery.delivery_person_id
                ).first()
            
            # Status-specific email content
            status_config = {
                "OUT_FOR_DELIVERY": {
                    "customer_subject": f"🚚 Your Order #{order.order_id} is Out for Delivery",
                    "customer_message": f"Great news! Your order is now out for delivery and should arrive soon.",
                    "dp_subject": f"📦 Delivery Status Updated - Order #{order.order_id}",
                    "dp_message": f"Delivery status updated to OUT FOR DELIVERY. Please proceed with the delivery."
                },
                "DELIVERED": {
                    "customer_subject": f"✅ Your Order #{order.order_id} Has Been Delivered",
                    "customer_message": f"Your order has been successfully delivered! Thank you for shopping with us.",
                    "dp_subject": f"🎉 Delivery Completed - Order #{order.order_id}",
                    "dp_message": f"Delivery marked as DELIVERED. Great job!"
                },
                "CANCELLED": {
                    "customer_subject": f"❌ Delivery Cancelled - Order #{order.order_id}",
                    "customer_message": f"Your delivery has been cancelled. Please contact support for more information.",
                    "dp_subject": f"⚠️ Delivery Cancelled - Order #{order.order_id}",
                    "dp_message": f"Delivery has been cancelled. Please check with admin for details."
                }
            }
            
            config = status_config.get(new_status, {
                "customer_subject": f"Delivery Status Update - Order #{order.order_id}",
                "customer_message": f"Your delivery status has been updated from {old_status} to {new_status}.",
                "dp_subject": f"Delivery Status Update - Order #{order.order_id}",
                "dp_message": f"Delivery status updated from {old_status} to {new_status}."
            })
            
            # 1. Send email to customer (c)
            customer_email = f"""
Dear {customer.first_name} {customer.last_name},

{config['customer_message']}

Order Details:
- Order ID: #{order.order_id}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Previous Status: {old_status}
- New Status: {new_status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

You can track your order from your account dashboard.

Thank you for shopping with us!

Best regards,
Delivery Support Team
"""
            email_service.send_to_user_by_id(customer.user_id, config['customer_subject'], customer_email)
            
            # 2. Send email to delivery person (dp) if assigned
            if delivery_person and delivery_person.user and delivery_person.user.email:
                dp_email = f"""
Dear {delivery_person.user.first_name if delivery_person.user.first_name else 'Delivery Partner'},

{config['dp_message']}

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name}
- Previous Status: {old_status}
- New Status: {new_status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Please take appropriate action based on the new status.

Best regards,
Delivery Management Team
"""
                email_service.send_email_to_delivery_person(delivery_person.user.email, config['dp_subject'], dp_email)
            
            # 3. Send email to all admins (a) - Status update notification
            admin_subject = f"📊 Delivery Status Updated - Order #{order.order_id}"
            admin_message = f"""
DELIVERY STATUS UPDATE NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name} (ID: {customer.user_id})
- Delivery Person: {delivery_person.user.first_name + ' ' + delivery_person.user.last_name if delivery_person and delivery_person.user else 'Not assigned'}
- Previous Status: {old_status}
- New Status: {new_status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

Status change has been processed and notifications sent to relevant parties.

Best regards,
Delivery Management System
"""
            email_service.send_to_all_admins(admin_subject, admin_message)
            
            print(f"✅ Status update emails sent for delivery #{delivery.delivery_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to send status update emails: {e}")

    def _send_reassignment_emails(self, db: Session, delivery: Delivery, old_person_id: int, new_person_id: int, email_service: EmailService):
        """Send email notifications for delivery reassignment"""
        try:
            # Get delivery details
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if not order:
                return
            
            # Get customer details
            customer = order.user
            if not customer:
                return
            
            # Get old delivery person details
            old_delivery_person = None
            if old_person_id:
                old_delivery_person = db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == old_person_id
                ).first()
            
            # Get new delivery person details
            new_delivery_person = None
            if new_person_id:
                new_delivery_person = db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == new_person_id
                ).first()
            
            # 1. Send email to customer (c) about reassignment
            customer_subject = f"🔄 Delivery Person Updated - Order #{order.order_id}"
            customer_message = f"""
Dear {customer.first_name} {customer.last_name},

We wanted to inform you that there has been a change in your delivery assignment.

Your order #{order.order_id} has been reassigned to a new delivery person.

Delivery Details:
- Order ID: #{order.order_id}
- New Delivery Person: {new_delivery_person.user.first_name + ' ' + new_delivery_person.user.last_name if new_delivery_person and new_delivery_person.user else 'New delivery partner'}
- Reassigned At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Your delivery will continue as scheduled. You can track the updated delivery from your account dashboard.

Thank you for your understanding!

Best regards,
Delivery Support Team
"""
            email_service.send_to_user_by_id(customer.user_id, customer_subject, customer_message)
            
            # 2. Send email to old delivery person (dp)
            if old_delivery_person and old_delivery_person.user and old_delivery_person.user.email:
                old_dp_subject = f"🔄 Delivery Reassigned - Order #{order.order_id}"
                old_dp_message = f"""
Dear {old_delivery_person.user.first_name if old_delivery_person.user.first_name else 'Delivery Partner'},

The delivery assignment for order #{order.order_id} has been reassigned to another delivery person.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name}
- Reassigned At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- New Delivery Person: {new_delivery_person.user.first_name + ' ' + new_delivery_person.user.last_name if new_delivery_person and new_delivery_person.user else 'Another partner'}

You are no longer responsible for this delivery. Please focus on your other assigned deliveries.

Best regards,
Delivery Management Team
"""
                email_service.send_email_to_delivery_person(old_delivery_person.user.email, old_dp_subject, old_dp_message)
            
            # 3. Send email to new delivery person (dp)
            if new_delivery_person and new_delivery_person.user and new_delivery_person.user.email:
                new_dp_subject = f"📦 New Delivery Assignment - Order #{order.order_id}"
                new_dp_message = f"""
Dear {new_delivery_person.user.first_name if new_delivery_person.user.first_name else 'Delivery Partner'},

You have been assigned a new delivery.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name}
- Customer Phone: {customer.phone if customer.phone else 'Not provided'}
- Assigned At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: {delivery.status}
- Previous Delivery Person: {old_delivery_person.user.first_name + ' ' + old_delivery_person.user.last_name if old_delivery_person and old_delivery_person.user else 'Previous partner'}

Please proceed with this delivery assignment immediately.

Best regards,
Delivery Management Team
"""
                email_service.send_email_to_delivery_person(new_delivery_person.user.email, new_dp_subject, new_dp_message)
            
            # 4. Send email to all admins (a)
            admin_subject = f"🔄 Delivery Reassigned - Order #{order.order_id}"
            admin_message = f"""
DELIVERY REASSIGNMENT NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name} (ID: {customer.user_id})
- Old Delivery Person: {old_delivery_person.user.first_name + ' ' + old_delivery_person.user.last_name if old_delivery_person and old_delivery_person.user else 'Not assigned'} (ID: {old_person_id})
- New Delivery Person: {new_delivery_person.user.first_name + ' ' + new_delivery_person.user.last_name if new_delivery_person and new_delivery_person.user else 'New assignment'} (ID: {new_person_id})
- Reassigned At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Status: {delivery.status}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

The delivery has been successfully reassigned. All parties have been notified.

Best regards,
Delivery Management System
"""
            email_service.send_to_all_admins(admin_subject, admin_message)
            
            print(f"✅ Reassignment emails sent for delivery #{delivery.delivery_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to send reassignment emails: {e}")

    def _send_cancellation_emails(self, db: Session, delivery: Delivery, email_service: EmailService):
        """Send email notifications for delivery cancellation"""
        try:
            # Get delivery details
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if not order:
                return
            
            # Get customer details
            customer = order.user
            if not customer:
                return
            
            # Get delivery person details
            delivery_person = None
            if delivery.delivery_person_id:
                delivery_person = db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery.delivery_person_id
                ).first()
            
            # 1. Send email to customer (c)
            customer_subject = f"❌ Delivery Cancelled - Order #{order.order_id}"
            customer_message = f"""
Dear {customer.first_name} {customer.last_name},

We regret to inform you that your delivery has been cancelled.

Order Details:
- Order ID: #{order.order_id}
- Delivery ID: {delivery.delivery_id}
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reason: Cancelled by admin/system

What happens next?
1. Your order will be refunded (if paid)
2. You can place a new order when ready
3. Contact support for assistance

We apologize for the inconvenience. If you have any questions, please contact our customer support.

Best regards,
Delivery Support Team
"""
            email_service.send_to_user_by_id(customer.user_id, customer_subject, customer_message)
            
            # 2. Send email to delivery person (dp) if assigned
            if delivery_person and delivery_person.user and delivery_person.user.email:
                dp_subject = f"❌ Delivery Cancelled - Order #{order.order_id}"
                dp_message = f"""
Dear {delivery_person.user.first_name if delivery_person.user.first_name else 'Delivery Partner'},

The delivery assignment for order #{order.order_id} has been cancelled.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name}
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reason: Cancelled by admin/system

You are no longer responsible for this delivery. Please focus on your other assigned deliveries.

Best regards,
Delivery Management Team
"""
                email_service.send_email_to_delivery_person(delivery_person.user.email, dp_subject, dp_message)
            
            # 3. Send email to all admins (a)
            admin_subject = f"❌ Delivery Cancelled - Order #{order.order_id}"
            admin_message = f"""
DELIVERY CANCELLATION NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name} (ID: {customer.user_id})
- Delivery Person: {delivery_person.user.first_name + ' ' + delivery_person.user.last_name if delivery_person and delivery_person.user else 'Not assigned'} (ID: {delivery.delivery_person_id})
- Cancelled At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Reason: Admin cancellation

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

ACTION REQUIRED:
1. Process refund if payment was made
2. Update inventory if needed
3. Notify relevant departments

The delivery has been cancelled and all parties have been notified.

Best regards,
Delivery Management System
"""
            email_service.send_to_all_admins(admin_subject, admin_message)
            
            print(f"✅ Cancellation emails sent for delivery #{delivery.delivery_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to send cancellation emails: {e}")

    def _send_completion_emails(self, db: Session, delivery: Delivery, old_status: str, email_service: EmailService):
        """Send email notifications for delivery completion"""
        try:
            # Get delivery details
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if not order:
                return
            
            # Get customer details
            customer = order.user
            if not customer:
                return
            
            # Get delivery person details
            delivery_person = None
            if delivery.delivery_person_id:
                delivery_person = db.query(DeliveryPerson).filter(
                    DeliveryPerson.delivery_person_id == delivery.delivery_person_id
                ).first()
            
            # 1. Send email to customer (c)
            customer_subject = f"✅ Delivery Completed - Order #{order.order_id}"
            customer_message = f"""
Dear {customer.first_name} {customer.last_name},

Great news! Your order has been successfully delivered.

Delivery Details:
- Order ID: #{order.order_id}
- Delivery ID: {delivery.delivery_id}
- Delivered At: {delivery.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.delivered_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Delivery Person: {delivery_person.user.first_name + ' ' + delivery_person.user.last_name if delivery_person and delivery_person.user else 'Our delivery partner'}

Order Details:
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}

We hope you're satisfied with your purchase. Please consider leaving a review for the products and delivery service.

Thank you for shopping with us!

Best regards,
Customer Support Team
"""
            email_service.send_to_user_by_id(customer.user_id, customer_subject, customer_message)
            
            # 2. Send email to delivery person (dp)
            if delivery_person and delivery_person.user and delivery_person.user.email:
                dp_subject = f"🎉 Delivery Successfully Completed - Order #{order.order_id}"
                dp_message = f"""
Dear {delivery_person.user.first_name if delivery_person.user.first_name else 'Delivery Partner'},

Congratulations! You have successfully completed the delivery.

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name}
- Delivered At: {delivery.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.delivered_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Previous Status: {old_status}
- Completion Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Great job! Your earnings for this delivery will be updated in your account.

Keep up the good work!

Best regards,
Delivery Management Team
"""
                email_service.send_email_to_delivery_person(delivery_person.user.email, dp_subject, dp_message)
            
            # 3. Send email to all admins (a)
            admin_subject = f"✅ Delivery Completed - Order #{order.order_id}"
            admin_message = f"""
DELIVERY COMPLETION NOTIFICATION

Delivery Details:
- Delivery ID: {delivery.delivery_id}
- Order ID: #{order.order_id}
- Customer: {customer.first_name} {customer.last_name} (ID: {customer.user_id})
- Delivery Person: {delivery_person.user.first_name + ' ' + delivery_person.user.last_name if delivery_person and delivery_person.user else 'Delivery partner'} (ID: {delivery.delivery_person_id})
- Delivered At: {delivery.delivered_at.strftime('%Y-%m-%d %H:%M:%S') if delivery.delivered_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Previous Status: {old_status}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}

The delivery has been successfully completed and marked as DELIVERED. All parties have been notified.

Next Steps:
1. Update delivery person earnings
2. Mark order as completed
3. Archive delivery records

Best regards,
Delivery Management System
"""
            email_service.send_to_all_admins(admin_subject, admin_message)
            
            print(f"✅ Completion emails sent for delivery #{delivery.delivery_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to send completion emails: {e}")