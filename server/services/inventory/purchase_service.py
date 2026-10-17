from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.purchase_repository import PurchaseRepository
from repositories.inventory.supplier_repository import SupplierRepository
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.inventory_schema import PurchaseCreate, PurchaseStatus
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime
from utils.send_email import EmailService  # Import email service
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class PurchaseService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = PurchaseRepository()
        self.supplier_repo = SupplierRepository()
        self.variant_repo = VariantRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def create_purchase(self, purchase_data: PurchaseCreate) -> Dict[str, Any]:
        """Create a new purchase"""
        # Check if supplier exists
        supplier = self.supplier_repo.get_supplier_by_id(self.db, purchase_data.supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        # Validate all variants exist and collect variant details
        variant_details = []
        total_cost = Decimal('0')
        total_quantity = 0
        
        for item in purchase_data.items:
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
                "cost_per_unit": float(item.cost_per_unit) if item.cost_per_unit else 0.0,
                "total_cost": float(item.total_cost) if item.total_cost else 0.0
            })
            total_cost += item.total_cost if item.total_cost else Decimal('0')
            total_quantity += item.quantity
        
        # Get supplier details
        supplier_name = supplier.name if hasattr(supplier, 'name') else "Supplier"
        supplier_email = supplier.email if hasattr(supplier, 'email') else None
        
        # Create purchase (remove company_id from the data)
        purchase_dict = purchase_data.model_dump(exclude={'items', 'company_id'})
        purchase = self.repository.create_purchase(self.db, purchase_dict)
        
        # Create purchase items
        for item in purchase_data.items:
            purchase_item_data = {
                "purchase_id": purchase.purchase_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "cost_per_unit": item.cost_per_unit,
                "total_cost": item.total_cost
            }
            self.repository.create_purchase_item(self.db, purchase_item_data)
        
        # Update purchase total cost
        purchase.total_cost = total_cost
        
        self.db.commit()
        self.db.refresh(purchase)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR PURCHASE CREATION
        # ============================================
        try:
            # Format variant details for email
            items_summary = "\n".join([
                f"- {item['product_name']} ({item['variant_name']}): {item['quantity']} units @ ${item['cost_per_unit']:.2f} = ${item['total_cost']:.2f}"
                for item in variant_details
            ])
            
            # 1. Send email to all admins (a)
            admin_subject = f"📋 New Purchase Order Created - #{purchase.invoice_number}"
            admin_message = f"""
PURCHASE ORDER CREATION NOTIFICATION

Purchase Details:
- Purchase ID: {purchase.purchase_id}
- Invoice Number: {purchase.invoice_number}
- Supplier: {supplier_name} (ID: {purchase.supplier_id})
- Total Cost: ${total_cost:.2f}
- Purchase Date: {purchase.purchase_date.strftime('%Y-%m-%d') if purchase.purchase_date else datetime.utcnow().strftime('%Y-%m-%d')}
- Status: {purchase.status}
- Created At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Notes: {purchase.notes if purchase.notes else 'No notes'}

Supplier Details:
- Name: {supplier_name}
- Email: {supplier_email if supplier_email else 'Not provided'}
- Phone: {supplier.phone if hasattr(supplier, 'phone') and supplier.phone else 'Not provided'}

Purchase Items ({total_quantity} units total):
{items_summary}

Total Purchase Amount: ${total_cost:.2f}

ACTION REQUIRED:
1. Finance team: Process payment to supplier
2. Inventory team: Prepare for stock arrival
3. Procurement team: Follow up on delivery

Next Steps:
- Confirm delivery schedule with supplier
- Update inventory upon receipt
- Process payment as per terms

Best regards,
Procurement Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send email to supplier if email is available (bonus feature)
            if supplier_email:
                supplier_subject = f"New Purchase Order - #{purchase.invoice_number}"
                supplier_message = f"""
Dear {supplier_name},

We have created a new purchase order with your company.

Order Details:
- Purchase Order #: {purchase.invoice_number}
- Order Date: {purchase.purchase_date.strftime('%Y-%m-%d') if purchase.purchase_date else datetime.utcnow().strftime('%Y-%m-%d')}
- Total Amount: ${total_cost:.2f}
- Our Reference: {purchase.purchase_id}

Order Items:
{items_summary}

Total Quantity: {total_quantity} units
Total Amount: ${total_cost:.2f}

Please:
1. Confirm receipt of this purchase order
2. Provide expected delivery date
3. Share tracking details when shipped
4. Include invoice with delivery

Payment Terms:
As per agreed terms. Please provide invoice upon shipment.

If you have any questions, please contact our procurement department.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([supplier_email], supplier_subject, supplier_message)
            
            
        except Exception as email_error:
            # Don't fail purchase creation if email fails
            print(f"⚠️ Email sending failed but purchase was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR PURCHASE CREATION
        # ============================================
        try:
            self._send_purchase_creation_notifications(purchase, supplier_name, total_cost)
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but purchase was created: {notif_error}")
        
        return self._serialize_purchase(purchase)
    
    def get_purchase(self, purchase_id: int) -> Dict[str, Any]:
        """Get purchase by ID"""
        purchase = self.repository.get_purchase_by_id(self.db, purchase_id)
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase not found"
            )
        
        return self._serialize_purchase_with_items(purchase)
    
    def get_all_purchases(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all purchases"""
        purchases = self.repository.get_all_purchases(self.db, skip, limit)
        return [self._serialize_purchase(purchase) for purchase in purchases]
    
    def update_purchase_status(self, purchase_id: int, new_status: str) -> Dict[str, str]:
        """Update purchase status"""
        # Validate status
        valid_statuses = [s.value for s in PurchaseStatus]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        purchase = self.repository.update_purchase_status(self.db, purchase_id, new_status)
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase not found"
            )
        
        # Send status update notification
        self._send_purchase_status_notification(purchase, new_status)
        
        # Send database notification
        try:
            self._send_purchase_status_db_notifications(purchase, new_status)
        except Exception as notif_error:
            print(f"⚠️ Database notification failed for purchase status update: {notif_error}")
        
        return {"message": f"Purchase status updated to {new_status}"}
    
    def _send_purchase_status_notification(self, purchase, new_status: str):
        """Send notification when purchase status is updated"""
        try:
            # Get supplier details
            supplier = self.supplier_repo.get_supplier_by_id(self.db, purchase.supplier_id)
            supplier_name = supplier.name if supplier and hasattr(supplier, 'name') else "Supplier"
            supplier_email = supplier.email if supplier and hasattr(supplier, 'email') else None
            
            # Status-specific messages
            status_messages = {
                "PENDING": "Purchase order is pending processing.",
                "APPROVED": "Purchase order has been approved.",
                "ORDERED": "Purchase has been ordered from supplier.",
                "SHIPPED": "Goods have been shipped by supplier.",
                "RECEIVED": "Goods have been received in inventory.",
                "CANCELLED": "Purchase order has been cancelled."
            }
            
            status_message = status_messages.get(new_status, f"Status updated to {new_status}.")
            
            admin_subject = f"📊 Purchase Status Updated - #{purchase.invoice_number}"
            admin_message = f"""
PURCHASE STATUS UPDATE

Purchase Details:
- Purchase ID: {purchase.purchase_id}
- Invoice Number: {purchase.invoice_number}
- Supplier: {supplier_name}
- Total Cost: ${purchase.total_cost:.2f if hasattr(purchase.total_cost, '__float__') else 0.0}
- Previous Status: {purchase.status}
- New Status: {new_status}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Update Details:
{status_message}

Next Actions:
{
    "PENDING": "Review and approve purchase order.",
    "APPROVED": "Place order with supplier.",
    "ORDERED": "Track shipment and update when received.",
    "SHIPPED": "Prepare for goods receipt.",
    "RECEIVED": "Update inventory and process payment.",
    "CANCELLED": "Update records and inform supplier."
}.get(new_status, "Review and take appropriate action.")

Best regards,
Procurement Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # Also notify supplier if status is ORDERED, SHIPPED, or CANCELLED
            if new_status in ["ORDERED", "SHIPPED", "CANCELLED"] and supplier_email:
                supplier_status_subject = f"Purchase Order Update - #{purchase.invoice_number}"
                supplier_status_message = f"""
Dear {supplier_name},

This is an update regarding purchase order #{purchase.invoice_number}.

Status Update: {new_status}
Update Date: {datetime.utcnow().strftime('%Y-%m-%d')}

{
    "ORDERED": "The purchase order has been confirmed and placed with your company.",
    "SHIPPED": "Thank you for shipping the order. Please share tracking details.",
    "CANCELLED": "The purchase order has been cancelled. Please contact us for details."
}.get(new_status, f"Status updated to {new_status}.")

If you have any questions, please contact our procurement department.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([supplier_email], supplier_status_subject, supplier_status_message)
            
            
        except Exception as e:
            print(f"⚠️ Failed to send status update email: {e}")
    
    def _serialize_purchase(self, purchase) -> Dict[str, Any]:
        """Serialize purchase data"""
        return {
            "purchase_id": purchase.purchase_id,
            "supplier_id": purchase.supplier_id,
            "invoice_number": purchase.invoice_number,
            "total_cost": purchase.total_cost,
            "status": purchase.status,
            "notes": purchase.notes,
            "purchase_date": purchase.purchase_date,
            "created_at": purchase.created_at,
            "updated_at": purchase.updated_at
        }
    
    def _serialize_purchase_with_items(self, purchase) -> Dict[str, Any]:
        """Serialize purchase with items"""
        items = self.repository.get_purchase_items(self.db, purchase.purchase_id)
        
        purchase_data = self._serialize_purchase(purchase)
        purchase_data["items"] = [{
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "cost_per_unit": item.cost_per_unit,
            "total_cost": item.total_cost
        } for item in items]
        
        
        return purchase_data

    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_purchase_creation_notifications(self, purchase, supplier_name: str, total_cost: Decimal):
        """Send database notifications when purchase is created"""
        try:
            admin_users = self.user_repo.get_admin_users(self.db)
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📋 New Purchase Order",
                    message=f"New PO #{purchase.invoice_number} created for {supplier_name}. Total: ${total_cost:.2f}.",
                    type="PURCHASE",
                    reference_id=purchase.purchase_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send purchase creation notifications: {e}")
            
    def _send_purchase_status_db_notifications(self, purchase, new_status: str):
        """Send database notifications when purchase status is updated"""
        try:
            admin_users = self.user_repo.get_admin_users(self.db)
            
            supplier = self.supplier_repo.get_supplier_by_id(self.db, purchase.supplier_id)
            supplier_name = supplier.name if supplier else "Supplier"
            
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📊 Purchase Status Update",
                    message=f"PO #{purchase.invoice_number} ({supplier_name}) status updated to {new_status}.",
                    type="PURCHASE",
                    reference_id=purchase.purchase_id
                )
        except Exception as e:
            print(f"⚠️ Failed to send purchase status notifications: {e}")