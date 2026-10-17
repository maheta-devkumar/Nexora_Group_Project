from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from repositories.delivery_admin_repository import DeliveryAdminRepository
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.order.order import Order
from models.user import User
from models.notification import Notification
from datetime import datetime, timedelta
from sqlalchemy import func, text, case
import json
from utils.send_email import EmailService
from typing import Dict, Any, List

class DeliveryAdminService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = DeliveryAdminRepository()
        self.email_service = EmailService(db_session=db)
        # ADD NOTIFICATION REPOSITORIES
        # ADD NOTIFICATION REPOSITORIES
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()

    # OPTIMIZED OVERVIEW METHOD
    def getDeliveryOverview(self):
        """
        Consolidated endpoint for Admin Delivery Dashboard.
        Fetches Stats + Recent Activity + Active Delivery Persons in ONE go.
        """
        try:
            # 1. AGGREGATED STATS (Single Query)
            stats_query = self.db.query(
                func.count(Delivery.delivery_id).label('total'),
                func.sum(case((Delivery.status == 'DELIVERED', 1), else_=0)).label('delivered'),
                func.sum(case((Delivery.status.in_(['PENDING', 'ASSIGNED', 'OUT_FOR_DELIVERY']), 1), else_=0)).label('pending'),
                func.sum(case((Delivery.status.in_(['FAILED', 'CANCELLED']), 1), else_=0)).label('failed')
            ).one()

            total = stats_query.total or 0
            delivered = stats_query.delivered or 0
            pending = stats_query.pending or 0
            failed = stats_query.failed or 0

            # 2. ACTIVE DELIVERY PERSONS (Count only)
            active_persons = self.db.query(func.count(DeliveryPerson.delivery_person_id))\
                .filter(DeliveryPerson.status == 'ACTIVE', DeliveryPerson.is_online == True).scalar() or 0

            # 3. RECENT ACTIVITY (Limit 5, Eager Load)
            recent_activities = self.db.query(Delivery)\
                .options(joinedload(Delivery.order), joinedload(Delivery.delivery_person).joinedload(DeliveryPerson.user))\
                .order_by(Delivery.updated_at.desc())\
                .limit(5).all()

            activity_log = []
            for activity in recent_activities:
                desc = f"Order #{activity.order_id} update: {activity.status}"
                if activity.delivery_person and activity.delivery_person.user:
                    desc += f" by {activity.delivery_person.user.name}"
                
                activity_log.append({
                    "description": desc,
                    "time": activity.updated_at.strftime("%H:%M"),
                    "status": activity.status
                })

            # Calculate percentages safe from division by zero
            delivered_rate = int((delivered / total * 100)) if total > 0 else 0
            pending_rate = int((pending / total * 100)) if total > 0 else 0
            failed_rate = int((failed / total * 100)) if total > 0 else 0

            return {
                "success": True,
                "data": {
                    "total_deliveries": total,
                    "delivered_count": delivered,
                    "pending_count": pending,
                    "failed_count": failed,
                    "active_delivery_persons": active_persons,
                    "delivery_stats": {
                        "delivered_rate": f"{delivered_rate}%",
                        "pending_rate": f"{pending_rate}%",
                        "failed_rate": f"{failed_rate}%"
                    },
                    "recent_activity": activity_log
                }
            }

        except Exception as e:
            print(f"Error in getDeliveryOverview: {e}")
            return {"success": False, "message": str(e)}

    # EXISTING METHODS (Preserved exactly as they were)
    def assignDeliveryPerson(self, order_id, delivery_person_id):
        """Assign delivery person to order"""
        result = self.repo.create_delivery(self.db, order_id, delivery_person_id)
        
        # ============================================
        # SEND NOTIFICATION FOR DELIVERY ASSIGNMENT
        # ============================================
        try:
            self._send_delivery_assignment_notification(order_id, delivery_person_id)
        except Exception as notif_error:
            print(f"⚠️ Delivery assignment notification failed: {notif_error}")
        
        return result

    def getAllDeliveries(self):
        # OPTIMIZATION: Use repository but ensure it uses JOINs? 
        # For now, let's trust the repo but maybe we should override here if repo is bad.
        # Assuming repo is basic, let's stick to existing call to avoid breaking unique repo logic usually found there.
        return self.repo.get_all_deliveries(self.db)

    def getDeliveryStats(self):
        return self.repo.get_delivery_stats(self.db)

    def updateDeliveryStatus(self, delivery_id, status):
        delivery = self.repo.get_delivery_by_id(self.db, delivery_id)
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found")
        
        # Store old status for notification
        old_status = delivery.status
        
        # Pass email_service to the repository method
        updated_delivery = self.repo.update_status(
            self.db, 
            delivery, 
            status, 
            self.email_service
        )
        
        # ============================================
        # SEND NOTIFICATION FOR STATUS UPDATE
        # ============================================
        try:
            self._send_delivery_status_notification(delivery, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Delivery status notification failed: {notif_error}")
        
        return updated_delivery

    def reassignDeliveryPerson(self, delivery_id, new_person_id):
        delivery = self.db.query(Delivery).get(delivery_id)
        if not delivery:
            raise HTTPException(404, "Delivery not found")
        
        # Store old delivery person for notification
        old_person_id = delivery.delivery_person_id
        
        result = self.repo.reassign_delivery(self.db, delivery, new_person_id)
        
        # ============================================
        # SEND NOTIFICATION FOR REASSIGNMENT
        # ============================================
        try:
            self._send_delivery_reassignment_notification(delivery, old_person_id, new_person_id)
        except Exception as notif_error:
            print(f"⚠️ Delivery reassignment notification failed: {notif_error}")
        
        return result

    def getDeliveryEarnings(self):
        return self.repo.get_earnings(self.db)

    def getDeliveryPersonPerformance(self):
        return self.repo.get_performance(self.db)

    def searchDeliveries(self, filters):
        return self.repo.search_deliveries(self.db, filters)

    def getDeliveryTimeline(self, delivery_id):
        delivery = self.db.query(Delivery).get(delivery_id)
        if not delivery:
            raise HTTPException(404, "Delivery not found")
        return self.repo.get_timeline(delivery)

    def cancelDelivery(self, delivery_id):
        delivery = self.db.query(Delivery).get(delivery_id)
        if not delivery:
            raise HTTPException(404, "Delivery not found")
        
        # Store delivery details for notification
        delivery_details = {
            'delivery_id': delivery.delivery_id,
            'order_id': delivery.order_id,
            'delivery_person_id': delivery.delivery_person_id,
            'status': delivery.status
        }
        
        result = self.repo.cancel_delivery(self.db, delivery)
        
        # ============================================
        # SEND NOTIFICATION FOR DELIVERY CANCELLATION
        # ============================================
        try:
            self._send_delivery_cancellation_notification(delivery_details)
        except Exception as notif_error:
            print(f"⚠️ Delivery cancellation notification failed: {notif_error}")
        
        return result

    def validateDeliveryCompletion(self, delivery_id):
        delivery = self.db.query(Delivery).get(delivery_id)
        if not delivery:
            raise HTTPException(404, "Delivery not found")
        return self.repo.validate_completion(self.db, delivery)

    def getDeliveryIssues(self):
        return self.repo.get_issues(self.db)

    # NEW METHODS for ADMIN ONLY (4 essential ones)
    def handleOrderCreatedWebhook(self, order_data):
        """Webhook for order creation - create delivery in pool & auto-send notifications"""
        try:
            order_id = order_data['order_id']
            
            # Check if order already has delivery
            existing_delivery = self.db.query(Delivery).filter(
                Delivery.order_id == order_id
            ).first()
            
            if existing_delivery:
                return {
                    "success": False,
                    "message": "Order already has delivery assignment",
                    "delivery_id": existing_delivery.delivery_id
                }
            
            # Create delivery in pool
            delivery = Delivery(
                order_id=order_id,
                status="AVAILABLE",
                assigned_at=datetime.utcnow(),
                is_available=True,
                available_since=datetime.utcnow()
            )
            self.db.add(delivery)
            self.db.commit()
            self.db.refresh(delivery)
            
            # Get order details for notification
            order = self.db.query(Order).filter(Order.order_id == order_id).first()
            customer_name = "Customer"
            delivery_address = ""
            
            if order and hasattr(order, 'customer'):
                customer_name = f"{order.customer.first_name} {order.customer.last_name}"
                delivery_address = order.shipping_address or ""
            
            # Auto-send notifications to all available delivery persons
            available_persons = self.getAvailableDeliveryPersons()
            notifications_sent = []
            
            for person in available_persons:
                try:
                    # Send notification to each delivery person
                    notification = self._sendDeliveryNotification(
                        delivery_person_id=person['delivery_person_id'],
                        delivery_id=delivery.delivery_id,
                        order_id=order_id,
                        customer_name=customer_name,
                        delivery_address=delivery_address
                    )
                    if notification:
                        notifications_sent.append(notification['notification_id'])
                except Exception as e:
                    print(f"Failed to send notification to {person['delivery_person_id']}: {e}")
                    continue
            
            # ============================================
            # SEND NOTIFICATION TO ADMIN ABOUT NEW DELIVERY
            # ============================================
            try:
                self._send_admin_delivery_created_notification(delivery, order, len(available_persons))
            except Exception as admin_notif_error:
                print(f"⚠️ Admin notification for new delivery failed: {admin_notif_error}")
            
            return {
                "success": True,
                "message": "Delivery created and notifications sent",
                "delivery_id": delivery.delivery_id,
                "notifications_sent": len(notifications_sent),
                "delivery_persons_notified": len(available_persons)
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(500, f"Failed to create delivery: {str(e)}")

    def _sendDeliveryNotification(self, delivery_person_id, delivery_id, order_id, customer_name, delivery_address):
        """Helper to send delivery notification"""
        # Get delivery person user_id
        result = self.db.execute(
            text("""
            SELECT user_id FROM delivery_person 
            WHERE delivery_person_id = :dp_id
            """),
            {"dp_id": delivery_person_id}
        ).fetchone()
        
        if not result:
            return None
        
        user_id = result[0]
        
        # Create notification via service
        notification = self.notification_service.send_notification(
            user_id=user_id,
            title="New Delivery Available",
            message=f"Order #{order_id} for {customer_name} at {delivery_address}",
            type="DELIVERY",
            reference_id=delivery_id
        )
        
        return {
            "notification_id": notification.notification_id,
            "delivery_person_id": delivery_person_id
        }

    def getAvailableDeliveryPersons(self):
        """Get available delivery persons (admin view)"""
        try:
            results = self.db.execute(
                text("""
                SELECT 
                    delivery_person_id,
                    user_id,
                    rating,
                    is_online,
                    status
                FROM delivery_person
                WHERE is_online = true 
                AND status = 'ACTIVE'
                """)
            ).fetchall()
            
            return [
                {
                    "delivery_person_id": row[0],
                    "user_id": row[1],
                    "rating": float(row[2]) if row[2] else 0.0,
                    "is_online": row[3],
                    "status": row[4]
                }
                for row in results
            ]
        except Exception as e:
            print(f"Error in getAvailableDeliveryPersons: {e}")
            return []

    def getDeliveryPool(self):
        """Get available deliveries in pool (admin view)"""
        try:
            results = self.db.execute(
                text("""
                SELECT 
                    delivery_id,
                    order_id,
                    status,
                    assigned_at,
                    delivery_person_id
                FROM delivery
                WHERE is_available = true 
                AND status = 'AVAILABLE'
                ORDER BY assigned_at ASC
                """)
            ).fetchall()
            
            return [
                {
                    "delivery_id": row[0],
                    "order_id": row[1],
                    "status": row[2],
                    "created_at": row[3],
                    "delivery_person_id": row[4],
                    "waiting_time_minutes": (
                        (datetime.utcnow() - row[3]).total_seconds() / 60
                        if row[3] else 0
                    )
                }
                for row in results
            ]
        except Exception as e:
            print(f"Error in getDeliveryPool: {e}")
            return []

    def notifyDeliveryPerson(self, notification_data):
        """Admin manually sends notification to specific delivery person"""
        try:
            # Get delivery person user_id
            result = self.db.execute(
                text("""
                SELECT user_id FROM delivery_person 
                WHERE delivery_person_id = :dp_id
                """),
                {"dp_id": notification_data['delivery_person_id']}
            ).fetchone()
            
            if not result:
                raise HTTPException(404, "Delivery person not found")
            
            user_id = result[0]
            
            # Create notification via service
            notification = self.notification_service.send_notification(
                user_id=user_id,
                title=notification_data['title'],
                message=notification_data['message'],
                type="DELIVERY",
                reference_id=notification_data.get('delivery_id') or notification_data.get('order_id')
            )
            
            # ============================================
            # SEND NOTIFICATION TO ADMIN ABOUT MANUAL NOTIFICATION
            # ============================================
            try:
                self._send_admin_manual_notification_sent(notification_data)
            except Exception as admin_notif_error:
                print(f"⚠️ Admin notification for manual notification failed: {admin_notif_error}")
            
            return {
                "notification_id": notification.notification_id,
                "message": "Notification sent successfully",
                "delivery_person_id": notification_data['delivery_person_id']
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(500, f"Failed to send notification: {str(e)}")
    
    def cancelDeliveryAdmin(self, delivery_id):
        """Admin cancels delivery (makes it available again)"""
        try:
            # Check if delivery exists
            delivery = self.db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id
            ).first()
            
            if not delivery:
                raise HTTPException(404, "Delivery not found")
            
            # Store delivery details before cancellation
            delivery_details = {
                'delivery_id': delivery.delivery_id,
                'order_id': delivery.order_id,
                'delivery_person_id': delivery.delivery_person_id,
                'status': delivery.status
            }
            
            # Make delivery available again
            delivery.status = "AVAILABLE"
            delivery.is_available = True
            delivery.delivery_person_id = None
            delivery.available_since = datetime.utcnow()
            
            self.db.commit()
            
            # ============================================
            # SEND NOTIFICATION FOR ADMIN CANCELLATION
            # ============================================
            try:
                self._send_admin_delivery_cancellation_notification(delivery_details)
            except Exception as notif_error:
                print(f"⚠️ Admin delivery cancellation notification failed: {notif_error}")
            
            return {
                "success": True,
                "message": "Delivery cancelled and made available again",
                "delivery_id": delivery_id
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(500, f"Failed to cancel delivery: {str(e)}")

    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_delivery_assignment_notification(self, order_id: int, delivery_person_id: int):
        """Send notification when delivery person is assigned to order"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Get delivery person info
            delivery_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            # Get order info
            order = self.db.query(Order).filter(Order.order_id == order_id).first()
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 Delivery Assigned",
                    message=f"Order #{order_id} has been assigned to delivery person ID: {delivery_person_id}" + 
                              (f" ({delivery_person.user.name})" if delivery_person and hasattr(delivery_person, 'user') else ""),
                    type="DELIVERY",
                    reference_id=order_id
                )
            
            print(f"✅ Delivery assignment notification sent for order #{order_id}")
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery assignment notification: {e}")

    def _send_delivery_status_notification(self, delivery: Delivery, old_status: str, new_status: str):
        """Send notification when delivery status changes"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 Delivery Status Updated",
                    message=f"Delivery #{delivery.delivery_id} (Order #{delivery.order_id}) status changed from '{old_status}' to '{new_status}'.",
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery status notification: {e}")

    def _send_delivery_reassignment_notification(self, delivery: Delivery, old_person_id: int, new_person_id: int):
        """Send notification when delivery is reassigned to different person"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Get delivery person info
            old_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == old_person_id
            ).first() if old_person_id else None
            
            new_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == new_person_id
            ).first()
            
            # Create notifications for all admins
            for admin in admin_users:
                old_name = f"ID: {old_person_id}" + (f" ({old_person.user.name})" if old_person and hasattr(old_person, 'user') else "") if old_person_id else "Unassigned"
                new_name = f"ID: {new_person_id}" + (f" ({new_person.user.name})" if new_person and hasattr(new_person, 'user') else "")
                
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 Delivery Reassigned",
                    message=f"Delivery #{delivery.delivery_id} (Order #{delivery.order_id}) reassigned from {old_name} to {new_name}.",
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery reassignment notification: {e}")

    def _send_delivery_cancellation_notification(self, delivery_details: Dict[str, Any]):
        """Send notification when delivery is cancelled"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="❌ Delivery Cancelled",
                    message=f"Delivery #{delivery_details['delivery_id']} (Order #{delivery_details['order_id']}) has been cancelled." + 
                              (f" Was assigned to person ID: {delivery_details['delivery_person_id']}" if delivery_details.get('delivery_person_id') else ""),
                    type="DELIVERY",
                    reference_id=delivery_details['delivery_id']
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send delivery cancellation notification: {e}")

    def _send_admin_delivery_created_notification(self, delivery: Delivery, order: Order, available_persons_count: int):
        """Send notification to admin when new delivery is created"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Get customer info
            customer_name = "Customer"
            if order and hasattr(order, 'customer'):
                customer_name = f"{order.customer.first_name} {order.customer.last_name}"
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 New Delivery Created",
                    message=f"New delivery #{delivery.delivery_id} created for Order #{delivery.order_id} ({customer_name}). " +
                              f"Notified {available_persons_count} available delivery persons.",
                    type="DELIVERY",
                    reference_id=delivery.delivery_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send admin delivery creation notification: {e}")

    def _send_admin_manual_notification_sent(self, notification_data: Dict[str, Any]):
        """Send notification to admin when they manually send a notification"""
        try:
            # Get admin users (excluding the one who sent it, if we had that info)
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📨 Manual Notification Sent",
                    message=f"Manual notification sent to delivery person ID: {notification_data['delivery_person_id']}. " +
                              f"Title: '{notification_data['title']}'",
                    type="SYSTEM",
                    reference_id=notification_data.get('delivery_id') or notification_data.get('order_id')
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send admin manual notification record: {e}")

    def _send_admin_delivery_cancellation_notification(self, delivery_details: Dict[str, Any]):
        """Send notification to admin when they cancel a delivery"""
        try:
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 Admin Cancelled Delivery",
                    message=f"Delivery #{delivery_details['delivery_id']} (Order #{delivery_details['order_id']}) " +
                              f"has been cancelled by admin and made available again.",
                    type="DELIVERY",
                    reference_id=delivery_details['delivery_id']
                )
               
        except Exception as e:
            print(f"⚠️ Failed to send admin delivery cancellation notification: {e}")