from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.purchase_return_repository import PurchaseReturnRepository
from repositories.inventory.purchase_repository import PurchaseRepository
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.inventory_schema import PurchaseReturnCreate, ReturnStatus
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime
from utils.send_email import EmailService  # Import email service

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class PurchaseReturnService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = PurchaseReturnRepository()
        self.purchase_repo = PurchaseRepository()
        self.variant_repo = VariantRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def create_purchase_return(self, return_data: PurchaseReturnCreate) -> Dict[str, Any]:
        """Create a new purchase return"""
        # Check if purchase exists
        purchase = self.purchase_repo.get_purchase_by_id(self.db, return_data.purchase_id)
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase not found"
            )
        
        # Validate all variants exist and collect variant details
        variant_details = []
        total_refund = Decimal('0')
        total_quantity = 0
        
        for item in return_data.items:
            variant = self.variant_repo.get_variant_by_id(self.db, item.variant_id)
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Product variant {item.variant_id} not found"
                )
            
            # Get product name
            product_name = variant.product.product_name if variant.product else "Unknown Product"
            variant_details.append({
                "variant_id": item.variant_id,
                "variant_name": variant.variant_name,
                "product_name": product_name,
                "quantity": item.quantity,
                "refund_amount": float(item.refund_amount) if item.refund_amount else 0.0
            })
            total_refund += item.refund_amount if item.refund_amount else Decimal('0')
            total_quantity += item.quantity
        
        # Get supplier details from purchase
        supplier_name = purchase.supplier_name if hasattr(purchase, 'supplier_name') else "Supplier"
        
        # Create purchase return
        return_dict = return_data.model_dump(exclude={'items'})
        purchase_return = self.repository.create_purchase_return(self.db, return_dict)
        
        # Create return items
        for item in return_data.items:
            return_item_data = {
                "return_id": purchase_return.return_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "refund_amount": item.refund_amount
            }
            self.repository.create_purchase_return_item(self.db, return_item_data)
        
        # Update return total refund
        purchase_return.total_refund = total_refund
        
        self.db.commit()
        self.db.refresh(purchase_return)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR PURCHASE RETURN
        # ============================================
        try:
            # Format variant details for email
            items_summary = "\n".join([
                f"- {item['product_name']} ({item['variant_name']}): {item['quantity']} units - Refund: ${item['refund_amount']:.2f}"
                for item in variant_details
            ])
            
            # Get purchase details
            purchase_date = purchase.purchase_date.strftime('%Y-%m-%d') if hasattr(purchase, 'purchase_date') and purchase.purchase_date else 'N/A'
            purchase_amount = float(purchase.total_amount) if hasattr(purchase, 'total_amount') else 0.0
            
            # 1. Send email to all admins (a)
            admin_subject = f"🔄 Purchase Return Created - ID: {purchase_return.return_id}"
            admin_message = f"""
PURCHASE RETURN CREATION NOTIFICATION

Return Details:
- Return ID: {purchase_return.return_id}
- Purchase ID: {purchase_return.purchase_id}
- Reason: {purchase_return.reason}
- Return Date: {purchase_return.return_date.strftime('%Y-%m-%d') if purchase_return.return_date else datetime.utcnow().strftime('%Y-%m-%d')}
- Total Refund Amount: ${total_refund:.2f}
- Status: {purchase_return.status}
- Created At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Original Purchase Details:
- Purchase Date: {purchase_date}
- Supplier: {supplier_name}
- Purchase Amount: ${purchase_amount:.2f}

Return Items ({total_quantity} units total):
{items_summary}

Total Refund: ${total_refund:.2f}

ACTION REQUIRED:
1. Process the refund to supplier
2. Update inventory stock levels
3. Update financial records

Next Steps:
- Finance team: Process refund payment
- Inventory team: Update stock quantities
- Procurement team: Review supplier quality

Best regards,
Purchase & Inventory Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send email to supplier contact if available in purchase (bonus feature)
            supplier_email = None
            if hasattr(purchase, 'supplier_email') and purchase.supplier_email:
                supplier_email = purchase.supplier_email
            
            if supplier_email:
                supplier_subject = f"Purchase Return Notification - Reference: {purchase_return.return_id}"
                supplier_message = f"""
Dear {supplier_name},

This is to inform you about a purchase return from your recent supply.

Return Details:
- Return Reference: {purchase_return.return_id}
- Original Purchase ID: {purchase_return.purchase_id}
- Return Date: {purchase_return.return_date.strftime('%Y-%m-%d') if purchase_return.return_date else datetime.utcnow().strftime('%Y-%m-%d')}
- Reason: {purchase_return.reason}
- Total Refund Amount: ${total_refund:.2f}

Returned Items:
{items_summary}

Refund Process:
We will process the refund of ${total_refund:.2f} to your account within 7-10 business days.

Please ensure:
1. The returned items are as per the list above
2. Quality issues are addressed for future supplies
3. Contact our procurement team for any queries

If you have any questions regarding this return, please contact our procurement department.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([supplier_email], supplier_subject, supplier_message)
            
        except Exception as email_error:
            # Don't fail purchase return creation if email fails
            print(f"⚠️ Email sending failed but purchase return was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR PURCHASE RETURN
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_purchase_return_creation_notifications(
                purchase_return, 
                total_refund, 
                total_quantity, 
                supplier_name, 
                variant_details
            )
            
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but purchase return was created: {notif_error}")
        
        return self._serialize_purchase_return(purchase_return)
    
    def get_purchase_return(self, return_id: int) -> Dict[str, Any]:
        """Get purchase return by ID"""
        purchase_return = self.repository.get_purchase_return_by_id(self.db, return_id)
        if not purchase_return:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase return not found"
            )
        
        return self._serialize_purchase_return_with_items(purchase_return)
    
    def get_all_purchase_returns(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all purchase returns"""
        returns = self.repository.get_all_purchase_returns(self.db, skip, limit)
        return [self._serialize_purchase_return(ret) for ret in returns]
    
    def update_purchase_return_status(self, return_id: int, status: str) -> Dict[str, str]:
        """Update purchase return status"""
        # Validate status
        valid_statuses = [s.value for s in ReturnStatus]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get current return details before update
        current_return = self.repository.get_purchase_return_by_id(self.db, return_id)
        if not current_return:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase return not found"
            )
        
        old_status = current_return.status
        
        # Update status
        purchase_return = self.repository.update_purchase_return_status(self.db, return_id, status)
        if not purchase_return:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase return not found"
            )
        
        # Send email status update notification
        self._send_status_update_notification(purchase_return, status)
        
        # Send database notification for status update
        self._send_purchase_return_status_notifications(purchase_return, old_status, status)
        
        return {"message": f"Purchase return status updated to {status}"}
    
    def _send_status_update_notification(self, purchase_return, new_status: str):
        """Send email notification when purchase return status is updated"""
        try:
            # Get purchase details
            purchase = self.purchase_repo.get_purchase_by_id(self.db, purchase_return.purchase_id)
            supplier_name = purchase.supplier_name if purchase and hasattr(purchase, 'supplier_name') else "Supplier"
            
            # Status-specific messages
            status_messages = {
                "APPROVED": "The purchase return has been approved and refund will be processed.",
                "REJECTED": "The purchase return has been rejected.",
                "REFUNDED": "The refund has been processed and payment completed.",
                "COMPLETED": "The purchase return process has been completed.",
                "CANCELLED": "The purchase return has been cancelled."
            }
            
            status_message = status_messages.get(new_status, f"Status updated to {new_status}.")
            
            admin_subject = f"📊 Purchase Return Status Updated - ID: {purchase_return.return_id}"
            admin_message = f"""
PURCHASE RETURN STATUS UPDATE

Return Details:
- Return ID: {purchase_return.return_id}
- Purchase ID: {purchase_return.purchase_id}
- Supplier: {supplier_name}
- Previous Status: {purchase_return.status}
- New Status: {new_status}
- Total Refund: ${purchase_return.total_refund:.2f if hasattr(purchase_return.total_refund, '__float__') else 0.0}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Update Details:
{status_message}

Next Actions:
{
    "APPROVED": "Proceed with refund processing.",
    "REJECTED": "Inform supplier and update records.",
    "REFUNDED": "Mark as completed and update financial records.",
    "COMPLETED": "Archive return documents.",
    "CANCELLED": "Reverse any stock adjustments made."
}.get(new_status, "Review and take appropriate action.")

Best regards,
Purchase & Inventory Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # Also notify supplier if status is APPROVED or REJECTED
            if new_status in ["APPROVED", "REJECTED"] and purchase and hasattr(purchase, 'supplier_email') and purchase.supplier_email:
                supplier_status_subject = f"Purchase Return Update - Reference: {purchase_return.return_id}"
                supplier_status_message = f"""
Dear {supplier_name},

This is an update regarding your purchase return.

Return Reference: {purchase_return.return_id}
Original Purchase ID: {purchase_return.purchase_id}
Status: {new_status}
Update Date: {datetime.utcnow().strftime('%Y-%m-%d')}

{
    "APPROVED": "Your return has been approved. Refund of ${purchase_return.total_refund:.2f if hasattr(purchase_return.total_refund, '__float__') else 0.0} will be processed within 7-10 business days.",
    "REJECTED": "Your return has been rejected. Please contact our procurement team for more information."
}.get(new_status, f"Status updated to {new_status}.")

If you have any questions, please contact our procurement department.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([purchase.supplier_email], supplier_status_subject, supplier_status_message)
            
        except Exception as e:
            print(f"⚠️ Failed to send status update email: {e}")
    
    def _serialize_purchase_return(self, purchase_return) -> Dict[str, Any]:
        """Serialize purchase return data"""
        return {
            "return_id": purchase_return.return_id,
            "purchase_id": purchase_return.purchase_id,
            "reason": purchase_return.reason,
            "return_date": purchase_return.return_date,
            "total_refund": purchase_return.total_refund,
            "status": purchase_return.status,
        }
    
    def _serialize_purchase_return_with_items(self, purchase_return) -> Dict[str, Any]:
        """Serialize purchase return with items"""
        items = self.repository.get_purchase_return_items(self.db, purchase_return.return_id)
        
        return_data = self._serialize_purchase_return(purchase_return)
        return_data["items"] = [{
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "refund_amount": item.refund_amount
        } for item in items]
        
        return return_data
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_purchase_return_creation_notifications(
        self, 
        purchase_return, 
        total_refund: Decimal, 
        total_quantity: int, 
        supplier_name: str, 
        variant_details: List[Dict]
    ):
        """Send database notifications when purchase return is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Count total variants
            total_variants = len(variant_details)
            
            # Create notifications for all admins
            # Create notifications for all admins
            total_variants = len(variant_details)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 New Purchase Return",
                    message=f"New purchase return #{purchase_return.return_id} created for supplier {supplier_name}. Total refund: ${total_refund:.2f} for {total_quantity} units across {total_variants} variants.",
                    type="PURCHASE_RETURN",
                    reference_id=purchase_return.return_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send purchase return creation notifications: {e}")
    
    def _send_purchase_return_status_notifications(self, purchase_return, old_status: str, new_status: str):
        """Send database notifications when purchase return status is updated"""
        try:
            # Get purchase details
            purchase = self.purchase_repo.get_purchase_by_id(self.db, purchase_return.purchase_id)
            supplier_name = purchase.supplier_name if purchase and hasattr(purchase, 'supplier_name') else "Supplier"
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Status-specific notification details
            status_emojis = {
                "APPROVED": "✅",
                "REJECTED": "❌", 
                "REFUNDED": "💰",
                "COMPLETED": "🏁",
                "CANCELLED": "🚫"
            }
            
            emoji = status_emojis.get(new_status, "📊")
            
            # Create notifications for all admins
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Purchase Return Status Updated",
                    message=f"Purchase return #{purchase_return.return_id} (Supplier: {supplier_name}) status changed from {old_status} to {new_status}. Total refund: ${purchase_return.total_refund:.2f if hasattr(purchase_return.total_refund, '__float__') else 0.0}.",
                    type="PURCHASE_RETURN",
                    reference_id=purchase_return.return_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send purchase return status notifications: {e}")