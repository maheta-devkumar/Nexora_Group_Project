from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.customer_repository import CustomerRepository
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository
from typing import Dict, Any

class CustomerService:

    @staticmethod
    def get_all_customers(db: Session):
        return CustomerRepository.get_all_customers(db)

    @staticmethod
    def get_customer_by_id(db: Session, customer_id: int):
        customer = CustomerRepository.get_customer_by_id(db, customer_id)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer

    @staticmethod
    def update_customer(db: Session, customer_id: int, data: dict):
        # Get customer before update
        customer = CustomerService.get_customer_by_id(db, customer_id)
        
        # Store old values for notification (if needed)
        old_values = {
            'name': customer.name,
            'email': customer.email,
            'phone': customer.phone if hasattr(customer, 'phone') else None
        }
        
        # Update customer
        updated_customer = CustomerRepository.update_customer(db, customer, data)
        
        # ============================================
        # SEND NOTIFICATION FOR CUSTOMER UPDATE
        # ============================================
        try:
            CustomerService._send_customer_update_notification(
                db, customer, old_values, data
            )
        except Exception as notif_error:
            print(f"⚠️ Customer update notification failed: {notif_error}")
        
        return updated_customer

    @staticmethod
    def delete_customer(db: Session, customer_id: int):
        # Get customer details before deletion
        customer = CustomerService.get_customer_by_id(db, customer_id)
        
        # Store customer details for notification
        customer_details = {
            'customer_id': customer.customer_id,
            'name': customer.name,
            'email': customer.email,
            'total_orders': getattr(customer, 'total_orders', 0) if hasattr(customer, 'total_orders') else 0
        }
        
        # Delete customer
        CustomerRepository.delete_customer(db, customer)
        
        # ============================================
        # SEND NOTIFICATION FOR CUSTOMER DELETION
        # ============================================
        try:
            CustomerService._send_customer_deletion_notification(db, customer_details)
        except Exception as notif_error:
            print(f"⚠️ Customer deletion notification failed: {notif_error}")

    @staticmethod
    def get_customer_orders(db: Session, customer_id: int):
        CustomerService.get_customer_by_id(db, customer_id)
        return CustomerRepository.get_customer_orders(db, customer_id)

    @staticmethod
    def get_customer_stats(db: Session, customer_id: int):
        CustomerService.get_customer_by_id(db, customer_id)
        return CustomerRepository.get_customer_stats(db, customer_id)

    # ===== NOTIFICATION HELPER METHODS =====
    
    @staticmethod
    def _send_customer_update_notification(db: Session, customer, old_values: Dict[str, Any], new_data: Dict[str, Any]):
        """Send notification when customer details are updated"""
        try:
            # Initialize repositories
            notification_service = NotificationService(db)
            user_repo = UserRepository()
            
            # Get all admin users
            admin_users = user_repo.get_admin_users(db)
            
            # Determine which fields were changed
            changed_fields = []
            for field, old_value in old_values.items():
                if field in new_data and new_data[field] != old_value:
                    changed_fields.append(field)
            
            # If no significant fields changed, don't send notification
            if not changed_fields:
                return
            
            # Create notifications for all admins
            for admin in admin_users:
                notification_service.send_notification(
                    user_id=admin.user_id,
                    title="👤 Customer Updated",
                    message=f"Customer '{customer.name}' (ID: {customer.customer_id}) updated. Changed fields: {', '.join(changed_fields)}.",
                    type="CUSTOMER",
                    reference_id=customer.customer_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send customer update notification: {e}")
            # Don't re-raise - notification failure shouldn't break main operation

    @staticmethod
    def _send_customer_deletion_notification(db: Session, customer_details: Dict[str, Any]):
        """Send notification when customer is deleted"""
        try:
            # Initialize repositories
            notification_service = NotificationService(db)
            user_repo = UserRepository()
            
            # Get all admin users
            admin_users = user_repo.get_admin_users(db)
            
            # Create notifications for all admins
            for admin in admin_users:
                # Add order count to message if available
                order_info = ""
                if customer_details.get('total_orders', 0) > 0:
                    order_info = f" They had {customer_details['total_orders']} previous orders."
                
                notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🗑️ Customer Deleted",
                    message=f"Customer '{customer_details['name']}' (ID: {customer_details['customer_id']}, Email: {customer_details['email']}) has been deleted.{order_info}",
                    type="CUSTOMER",
                    reference_id=customer_details['customer_id']
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send customer deletion notification: {e}")
            # Don't re-raise - notification failure shouldn't break main operation