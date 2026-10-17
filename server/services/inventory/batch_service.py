from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.batch_repository import BatchRepository
from repositories.inventory.purchase_repository import PurchaseRepository
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.inventory_schema import ProductBatchCreate
from typing import List, Dict, Any
from datetime import datetime
from utils.send_email import EmailService  # Import email service

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class BatchService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = BatchRepository()
        self.purchase_repo = PurchaseRepository()
        self.variant_repo = VariantRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def create_batch(self, batch_data: ProductBatchCreate) -> Dict[str, Any]:
        """Create a new product batch"""
        # Check if purchase exists
        purchase = self.purchase_repo.get_purchase_by_id(self.db, batch_data.purchase_id)
        if not purchase:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase not found"
            )
        
        # Check if batch number already exists
        existing_batch = self.repository.get_batch_by_number(self.db, batch_data.batch_number)
        if existing_batch:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Batch number already exists"
            )
        
        # Validate all variants exist and collect variant details
        variant_details = []
        total_quantity = 0
        for item in batch_data.items:
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
                "quantity": item.quantity
            })
            total_quantity += item.quantity
        
        # Create product batch
        batch_dict = batch_data.model_dump(exclude={'items'})
        batch = self.repository.create_batch(self.db, batch_dict)
        
        # Create batch items
        for item in batch_data.items:
            batch_item_data = {
                "batch_id": batch.batch_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity
            }
            self.repository.create_batch_item(self.db, batch_item_data)
        
        self.db.commit()
        self.db.refresh(batch)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR BATCH CREATION
        # ============================================
        try:
            # Get purchase details for email
            purchase_details = self._get_purchase_details(purchase)
            
            # Get supplier name from purchase
            supplier_name = purchase.supplier_name if hasattr(purchase, 'supplier_name') else "Supplier"
            
            # Format variant details for email
            items_summary = "\n".join([
                f"- {item['product_name']} ({item['variant_name']}): {item['quantity']} units"
                for item in variant_details
            ])
            
            # Calculate expiration info
            days_until_expiry = None
            if batch.expires_at:
                days_until_expiry = (batch.expires_at - datetime.utcnow().date()).days
            
            # 1. Send email to all admins (a)
            admin_subject = f"📦 New Product Batch Created - #{batch.batch_number}"
            admin_message = f"""
NEW BATCH CREATION NOTIFICATION

Batch Details:
- Batch ID: {batch.batch_id}
- Batch Number: {batch.batch_number}
- Purchase ID: {batch.purchase_id}
- Supplier: {supplier_name}
- Total Items: {total_quantity} units
- Manufactured Date: {batch.manufactured_at.strftime('%Y-%m-%d') if batch.manufactured_at else 'Not specified'}
- Expiry Date: {batch.expires_at.strftime('%Y-%m-%d') if batch.expires_at else 'Not specified'}
{'Days until expiry: ' + str(days_until_expiry) if days_until_expiry else ''}
- Created At: {batch.created_at.strftime('%Y-%m-%d %H:%M:%S') if batch.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Purchase Details:
- Purchase Date: {purchase_details.get('purchase_date', 'N/A')}
- Supplier: {purchase_details.get('supplier_name', 'N/A')}
- Total Amount: ${purchase_details.get('total_amount', 0):.2f}

Items in Batch:
{items_summary}

Total: {total_quantity} units

The batch has been successfully created and is now available in inventory.

Best regards,
Inventory Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
           
            
        except Exception as email_error:
            # Don't fail batch creation if email fails
            print(f"⚠️ Email sending failed but batch was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR BATCH CREATION
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_batch_creation_notifications(batch, total_quantity, supplier_name, variant_details)
            
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but batch was created: {notif_error}")
        
        return self._serialize_batch(batch)
    
    def get_batch(self, batch_id: int) -> Dict[str, Any]:
        """Get batch by ID"""
        batch = self.repository.get_batch_by_id(self.db, batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )
        
        return self._serialize_batch_with_items(batch)
    
    def get_all_batches(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all batches"""
        batches = self.repository.get_all_batches(self.db, skip, limit)
        return [self._serialize_batch(batch) for batch in batches]
    
    def update_batch(self, batch_id: int, batch_data) -> Dict[str, Any]:
        """Update batch information"""
        batch = self.repository.get_batch_by_id(self.db, batch_id)
        if not batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )
        
        # Update fields
        update_data = batch_data.model_dump(exclude_unset=True)
        updated_batch = self.repository.update_batch(self.db, batch_id, update_data)
        if not updated_batch:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Batch not found"
            )
        
        # Send email notification for batch update
        self._send_batch_update_notification(batch_id, update_data)
        
        # Send database notification for batch update
        self._send_batch_update_notifications(batch, update_data)
        
        return self._serialize_batch(updated_batch)
    
    def check_expiring_batches(self):
        """Check for batches that are expiring soon and send notifications"""
        try:
            today = datetime.utcnow().date()
            
            # Check batches expiring in 7 days
            expiring_soon_batches = self.repository.get_batches_expiring_soon(self.db, days=7)
            
            if expiring_soon_batches:
                self._send_batch_expiry_notifications(expiring_soon_batches, "soon")
            
            # Check batches that have expired
            expired_batches = self.repository.get_expired_batches(self.db)
            
            if expired_batches:
                self._send_batch_expiry_notifications(expired_batches, "expired")
            
            return {
                "expiring_soon": len(expiring_soon_batches),
                "expired": len(expired_batches)
            }
            
        except Exception as e:
            print(f"⚠️ Error checking expiring batches: {e}")
            return {"error": str(e)}
    
    def _get_purchase_details(self, purchase) -> Dict[str, Any]:
        """Extract purchase details for email"""
        try:
            return {
                "purchase_date": purchase.purchase_date.strftime('%Y-%m-%d') if hasattr(purchase, 'purchase_date') and purchase.purchase_date else 'N/A',
                "supplier_name": purchase.supplier_name if hasattr(purchase, 'supplier_name') else 'N/A',
                "total_amount": float(purchase.total_amount) if hasattr(purchase, 'total_amount') else 0.0,
                "invoice_number": purchase.invoice_number if hasattr(purchase, 'invoice_number') else 'N/A'
            }
        except:
            return {}
    
    def _send_batch_update_notification(self, batch_id: int, update_data: Dict[str, Any]):
        """Send email notification when batch is updated"""
        try:
            batch = self.repository.get_batch_by_id(self.db, batch_id)
            if not batch:
                return
            
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Prepare update summary
            update_summary = "\n".join([
                f"- {field}: Updated"
                for field in updated_fields
                if field not in ['created_at', 'updated_at']
            ])
            
            if not update_summary.strip():
                return
            
            admin_subject = f"✏️ Batch Updated - #{batch.batch_number}"
            admin_message = f"""
BATCH UPDATE NOTIFICATION

Batch Details:
- Batch ID: {batch.batch_id}
- Batch Number: {batch.batch_number}
- Purchase ID: {batch.purchase_id}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Updated Fields:
{update_summary}

The batch information has been successfully updated.

Best regards,
Inventory Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
        except Exception as e:
            print(f"⚠️ Failed to send batch update email: {e}")
    
    def _serialize_batch(self, batch) -> Dict[str, Any]:
        """Serialize batch data"""
        return {
            "batch_id": batch.batch_id,
            "purchase_id": batch.purchase_id,
            "batch_number": batch.batch_number,
            "manufactured_at": batch.manufactured_at,
            "expires_at": batch.expires_at,
            "created_at": batch.created_at
        }
    
    def _serialize_batch_with_items(self, batch) -> Dict[str, Any]:
        """Serialize batch with items"""
        items = self.repository.get_batch_items(self.db, batch.batch_id)
        
        batch_data = self._serialize_batch(batch)
        batch_data["items"] = [{
            "variant_id": item.variant_id,
            "quantity": item.quantity
        } for item in items]
        
        return batch_data
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_batch_creation_notifications(
        self, 
        batch, 
        total_quantity: int, 
        supplier_name: str, 
        variant_details: List[Dict]
    ):
        """Send database notifications when batch is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Count total variants
            total_variants = len(variant_details)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 New Batch Created",
                    message=f"New batch #{batch.batch_number} has been created. Total: {total_quantity} units across {total_variants} variants from {supplier_name}. Expires on: {batch.expires_at.strftime('%Y-%m-%d') if batch.expires_at else 'Not specified'}.",
                    type="INVENTORY",
                    reference_id=batch.batch_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send batch creation notifications: {e}")
    
    def _send_batch_update_notifications(self, batch, update_data: Dict[str, Any]):
        """Send database notifications when batch is updated"""
        try:
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Filter out system fields
            significant_fields = [f for f in updated_fields if f not in ['created_at', 'updated_at']]
            if not significant_fields:
                return
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="✏️ Batch Updated",
                    message=f"Batch #{batch.batch_number} has been updated. Updated fields: {', '.join(significant_fields)}.",
                    type="INVENTORY",
                    reference_id=batch.batch_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send batch update notifications: {e}")
    
    def _send_batch_expiry_notifications(self, batches: List, expiry_status: str):
        """Send notifications for batches expiring soon or expired"""
        try:
            if not batches:
                return
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            if expiry_status == "soon":
                # Batches expiring soon (within 7 days)
                for batch in batches:
                    days_left = (batch.expires_at - datetime.utcnow().date()).days
                    
                    for admin in admin_users:
                        self.notification_service.send_notification(
                            user_id=admin.user_id,
                            title="⚠️ Batch Expiring Soon",
                            message=f"Batch #{batch.batch_number} is expiring in {days_left} days (Expiry: {batch.expires_at.strftime('%Y-%m-%d')}). Please review inventory.",
                            type="INVENTORY",
                            reference_id=batch.batch_id
                        )
                    
            elif expiry_status == "expired":
                # Already expired batches
                for batch in batches:
                    for admin in admin_users:
                        self.notification_service.send_notification(
                            user_id=admin.user_id,
                            title="❌ Batch Expired",
                            message=f"Batch #{batch.batch_number} has expired (Expiry: {batch.expires_at.strftime('%Y-%m-%d')}). Immediate action required.",
                            type="INVENTORY",
                            reference_id=batch.batch_id
                        )
                
                print(f"❌ Expiry notifications sent for {len(batches)} batches")
                    
        except Exception as e:
            print(f"⚠️ Failed to send batch expiry notifications: {e}")