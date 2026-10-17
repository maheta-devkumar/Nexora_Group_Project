from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.stock_repository import StockRepository
from repositories.product_catalog.variant_repository import VariantRepository
from decimal import Decimal
from typing import List, Dict, Any
from datetime import datetime

# ADD NOTIFICATION IMPORTS
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class StockService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = StockRepository()
        self.variant_repo = VariantRepository()
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def get_stock_movements(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all stock movements"""
        movements = self.repository.get_all_stock_movements(self.db, skip, limit)
        return [self._serialize_stock_movement(movement) for movement in movements]
    
    def get_stock_summary(self) -> List[Dict[str, Any]]:
        """Get current stock summary"""
        stock_summary = self.repository.get_stock_summary(self.db)
        
        result = []
        for summary in stock_summary:
            variant = summary["variant"]
            current_stock = summary["current_stock"]
            
            result.append({
                "variant_id": variant.variant_id,
                "variant_name": variant.variant_name if hasattr(variant, 'variant_name') else f"Variant {variant.variant_id}",
                "current_stock": current_stock,
                "reserved_stock": 0,  # You might want to calculate this based on orders
                "available_stock": current_stock,
                "total_value": Decimal('0')  # You might want to calculate this based on average cost
            })
            
            # Check for low stock and send notifications if needed
            self._check_low_stock_and_notify(variant, current_stock)
        
        return result
    
    def adjust_stock(self, adjustment_data: dict, user_id: int) -> Dict[str, Any]:
        """Manually adjust stock"""
        variant_id = adjustment_data.get("variant_id")
        quantity = adjustment_data.get("quantity")
        remark = adjustment_data.get("remark", "Manual adjustment")
        
        if not variant_id or quantity is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Variant ID and quantity are required"
            )
        
        # Check if variant exists
        variant = self.variant_repo.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product variant not found"
            )
        
        # Get current stock before adjustment
        current_stock = self._get_current_stock(variant_id)
        
        # Determine movement type based on quantity sign
        if quantity > 0:
            movement_type = "INBOUND"
            adjustment_type = "increased"
        elif quantity < 0:
            movement_type = "OUTBOUND"
            adjustment_type = "decreased"
            quantity = abs(quantity)  # Store positive quantity for outbound
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity cannot be zero"
            )
        
        # Create stock movement
        movement_data = {
            "variant_id": variant_id,
            "movement_type": movement_type,
            "reference_type": "MANUAL_ADJUSTMENT",
            "reference_id": user_id,
            "quantity": quantity,
            "unit_cost": adjustment_data.get("unit_cost"),
            "remark": remark
        }
        
        movement = self.repository.create_stock_movement(self.db, movement_data)
        
        # ============================================
        # SEND NOTIFICATIONS FOR STOCK ADJUSTMENT
        # ============================================
        try:
            # Get product details
            product_name = variant.product.product_name if variant.product else "Unknown Product"
            
            # Send notifications to all admin users
            self._send_stock_adjustment_notifications(
                variant=variant,
                product_name=product_name,
                quantity=quantity,
                adjustment_type=adjustment_type,
                remark=remark,
                current_stock=current_stock,
                movement_type=movement_type
            )
            
        except Exception as notif_error:
            print(f"⚠️ Stock adjustment notification failed: {notif_error}")
            # Don't fail the main operation
        
        return {"message": f"Stock adjusted by {quantity} units"}
    
    def get_variant_movements(self, variant_id: int, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get stock movements for a specific variant"""
        # Check if variant exists
        variant = self.variant_repo.get_variant_by_id(self.db, variant_id)
        if not variant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product variant not found"
            )
        
        movements = self.repository.get_stock_movements_by_variant(self.db, variant_id, skip, limit)
        return [self._serialize_stock_movement(movement) for movement in movements]
    
    def check_low_stock_products(self, threshold: int = 10):
        """Check for products with low stock and send notifications"""
        try:
            # Get all variants with stock below threshold
            low_stock_variants = self.repository.get_low_stock_variants(self.db, threshold)
            
            if low_stock_variants:
                self._send_low_stock_notifications(low_stock_variants, threshold)
                return {
                    "message": f"Found {len(low_stock_variants)} products with stock below {threshold}",
                    "low_stock_count": len(low_stock_variants)
                }
            else:
                return {
                    "message": f"No products with stock below {threshold}",
                    "low_stock_count": 0
                }
                
        except Exception as e:
            print(f"⚠️ Error checking low stock: {e}")
            return {"error": str(e)}
    
    def check_out_of_stock_products(self):
        """Check for out of stock products and send notifications"""
        try:
            # Get all variants with zero stock
            out_of_stock_variants = self.repository.get_out_of_stock_variants(self.db)
            
            if out_of_stock_variants:
                self._send_out_of_stock_notifications(out_of_stock_variants)
                return {
                    "message": f"Found {len(out_of_stock_variants)} out of stock products",
                    "out_of_stock_count": len(out_of_stock_variants)
                }
            else:
                return {
                    "message": "No out of stock products",
                    "out_of_stock_count": 0
                }
                
        except Exception as e:
            print(f"⚠️ Error checking out of stock: {e}")
            return {"error": str(e)}
    
    def _serialize_stock_movement(self, movement: StockMovement) -> Dict[str, Any]:
        """Serialize stock movement data"""
        return {
            "movement_id": movement.movement_id,
            "variant_id": movement.variant_id,
            "movement_type": movement.movement_type,
            "reference_type": movement.reference_type,
            "reference_id": movement.reference_id,
            "quantity": movement.quantity,
            "unit_cost": movement.unit_cost,
            "remark": movement.remark,
            "moved_at": movement.moved_at
        }
    
    def _get_current_stock(self, variant_id: int) -> int:
        """Get current stock for a variant"""
        summary = self.repository.get_stock_summary_for_variant(self.db, variant_id)
        if summary and "current_stock" in summary:
            return summary["current_stock"]
        return 0
    
    def _check_low_stock_and_notify(self, variant, current_stock: int):
        """Check if stock is low and send notification if needed"""
        try:
            # Low stock threshold (you can make this configurable)
            low_stock_threshold = 10
            
            if current_stock <= low_stock_threshold and current_stock > 0:
                product_name = variant.product.product_name if variant.product else "Unknown Product"
                
                # Get all admin users
                admin_users = self.user_repo.get_admin_users(self.db)
                
                # Send notifications
                for admin in admin_users:
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title="⚠️ Low Stock Alert",
                        message=f"Product '{product_name}' ({variant.variant_name}) is running low. Current stock: {current_stock} units.",
                        type="INVENTORY",
                        reference_id=variant.variant_id
                    )
                    
        except Exception as e:
            print(f"⚠️ Error in low stock check: {e}")
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_stock_adjustment_notifications(
        self, 
        variant, 
        product_name: str, 
        quantity: int, 
        adjustment_type: str, 
        remark: str,
        current_stock: int,
        movement_type: str
    ):
        """Send notifications for stock adjustments"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # New stock after adjustment
            new_stock = current_stock + (quantity if movement_type == "INBOUND" else -quantity)
            
            # Determine emoji based on movement type
            emoji = "⬆️" if movement_type == "INBOUND" else "⬇️"
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Stock Adjusted",
                    message=f"Stock for '{product_name}' ({variant.variant_name}) was {adjustment_type} by {quantity} units. Old: {current_stock}, New: {new_stock}. Reason: {remark}",
                    type="INVENTORY",
                    reference_id=variant.variant_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send stock adjustment notifications: {e}")
    
    def _send_low_stock_notifications(self, low_stock_variants: List, threshold: int):
        """Send notifications for low stock products"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Group variants by product for consolidated notifications
            variants_by_product = {}
            for variant_data in low_stock_variants:
                variant = variant_data["variant"]
                current_stock = variant_data["current_stock"]
                product_name = variant.product.product_name if variant.product else "Unknown Product"
                
                if product_name not in variants_by_product:
                    variants_by_product[product_name] = []
                
                variants_by_product[product_name].append({
                    "variant_name": variant.variant_name,
                    "current_stock": current_stock
                })
            
            # Create consolidated notifications
            for admin in admin_users:
                for product_name, variants in variants_by_product.items():
                    # Create summary for multiple variants
                    if len(variants) > 1:
                        variant_summary = ", ".join([
                            f"{v['variant_name']} ({v['current_stock']})"
                            for v in variants
                        ])
                        message = f"Multiple variants of '{product_name}' are low on stock: {variant_summary} (Threshold: {threshold})"
                    else:
                        variant = variants[0]
                        message = f"Product '{product_name}' ({variant['variant_name']}) is low on stock. Current: {variant['current_stock']} (Threshold: {threshold})"
                    
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title="⚠️ Low Stock Alert",
                        message=message,
                        type="INVENTORY",
                        reference_id=variants[0].get("variant_id", 0)
                    )
                
        except Exception as e:
            print(f"⚠️ Failed to send low stock notifications: {e}")
    
    def _send_out_of_stock_notifications(self, out_of_stock_variants: List):
        """Send notifications for out of stock products"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Group variants by product for consolidated notifications
            variants_by_product = {}
            for variant_data in out_of_stock_variants:
                variant = variant_data["variant"]
                product_name = variant.product.product_name if variant.product else "Unknown Product"
                
                if product_name not in variants_by_product:
                    variants_by_product[product_name] = []
                
                variants_by_product[product_name].append(variant.variant_name)
            
            # Create consolidated notifications
            for admin in admin_users:
                for product_name, variant_names in variants_by_product.items():
                    # Create summary for multiple variants
                    if len(variant_names) > 1:
                        variant_summary = ", ".join(variant_names)
                        message = f"Multiple variants of '{product_name}' are out of stock: {variant_summary}"
                    else:
                        message = f"Product '{product_name}' ({variant_names[0]}) is out of stock"
                    
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title="❌ Out of Stock",
                        message=message,
                        type="INVENTORY",
                        reference_id=out_of_stock_variants[0].get("variant_id", 0)
                    )
                
        except Exception as e:
            print(f"⚠️ Failed to send out of stock notifications: {e}")