from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.coupon_repository import CouponRepository
from repositories.product_catalog.variant_repository import VariantRepository
from schemas.marketing_schema import CouponCreate, CouponUpdate
from datetime import datetime
from decimal import Decimal
from typing import List, Dict, Any

# ADD NOTIFICATION IMPORTS
from repositories.notification_repository import NotificationRepository
from schemas.notification import NotificationCreate
from repositories.user_repository import UserRepository


class CouponService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = CouponRepository()
        self.variant_repo = VariantRepository()
        # ADD NOTIFICATION REPOSITORY
        self.notification_repo = NotificationRepository()
        self.user_repo = UserRepository()
    
    def create_coupon(self, coupon_data: CouponCreate) -> Dict[str, Any]:
        """Create a new coupon"""
        # Check if coupon code already exists
        existing_coupon = self.repository.get_coupon_by_code(self.db, coupon_data.code)
        if existing_coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Coupon code already exists"
            )
        
        # Validate dates
        if coupon_data.start_date >= coupon_data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        # Validate discount values
        if coupon_data.discount_type == "PERCENT" and coupon_data.discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage discount cannot exceed 100%"
            )
        
        # Create coupon
        coupon_dict = coupon_data.model_dump(exclude={'variant_ids'})
        coupon = self.repository.create_coupon(self.db, coupon_dict)
        
        # Link variants if provided
        if coupon_data.variant_ids:
            # Validate all variants exist
            for variant_id in coupon_data.variant_ids:
                variant = self.variant_repo.get_variant_by_id(self.db, variant_id)
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product variant {variant_id} not found"
                    )
                
                coupon_variant_data = {
                    "coupon_id": coupon.coupon_id,
                    "variant_id": variant_id
                }
                self.repository.create_coupon_variant(self.db, coupon_variant_data)
        
        self.db.commit()
        self.db.refresh(coupon)
        
        # ============================================
        # SEND NOTIFICATIONS FOR COUPON CREATION
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_coupon_creation_notifications(coupon, coupon_data.variant_ids)
            
        except Exception as notif_error:
            print(f"⚠️ Coupon creation notification failed: {notif_error}")
        
        return self._serialize_coupon(coupon)
    
    def get_coupon(self, coupon_id: int) -> Dict[str, Any]:
        """Get coupon by ID"""
        coupon = self.repository.get_coupon_by_id(self.db, coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        return self._serialize_coupon(coupon)
    
    def get_all_coupons(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all coupons"""
        coupons = self.repository.get_all_coupons(self.db, skip, limit)
        return [self._serialize_coupon(coupon) for coupon in coupons]
    
    def get_active_coupons(self) -> List[Dict[str, Any]]:
        """Get currently active coupons"""
        coupons = self.repository.get_active_coupons(self.db)
        return [self._serialize_coupon(coupon) for coupon in coupons]
    
    def update_coupon(self, coupon_id: int, coupon_data: CouponUpdate) -> Dict[str, Any]:
        """Update coupon"""
        coupon = self.repository.get_coupon_by_id(self.db, coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Update fields
        update_data = coupon_data.model_dump(exclude_unset=True)
        updated_coupon = self.repository.update_coupon(self.db, coupon_id, update_data)
        if not updated_coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Send notifications for coupon update
        self._send_coupon_update_notifications(coupon, update_data)
        
        return self._serialize_coupon(updated_coupon)
    
    def update_coupon_status(self, coupon_id: int, is_active: bool) -> Dict[str, str]:
        """Update coupon status"""
        # Get coupon before update for notification
        coupon = self.repository.get_coupon_by_id(self.db, coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Store old status
        old_status = coupon.is_active
        
        # Update status
        updated_coupon = self.repository.update_coupon_status(self.db, coupon_id, is_active)
        if not updated_coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Send status change notification
        self._send_coupon_status_notifications(coupon, old_status, is_active)
        
        status = "activated" if is_active else "deactivated"
        return {"message": f"Coupon {status} successfully"}
    
    def delete_coupon(self, coupon_id: int) -> Dict[str, str]:
        """Delete coupon"""
        # Get coupon details before deletion for notification
        coupon = self.repository.get_coupon_by_id(self.db, coupon_id)
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Store coupon details for notification
        coupon_details = {
            "coupon_id": coupon.coupon_id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "start_date": coupon.start_date,
            "end_date": coupon.end_date
        }
        
        # Delete coupon
        success = self.repository.delete_coupon(self.db, coupon_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Send deletion notification
        self._send_coupon_deletion_notifications(coupon_details)
        
        return {"message": "Coupon deleted successfully"}
    
    def validate_coupon(self, code: str, variant_ids: List[int], order_total: Decimal) -> Dict[str, Any]:
        """Validate coupon for checkout"""
        coupon = self.repository.get_coupon_by_code(self.db, code)
        if not coupon:
            return {
                "valid": False,
                "discount_amount": Decimal('0'),
                "message": "Invalid coupon code"
            }
        
        now = datetime.now()
        
        # Check if coupon is active
        if not coupon.is_active:
            return {
                "valid": False,
                "discount_amount": Decimal('0'),
                "message": "Coupon is not active"
            }
        
        # Check date validity
        if now < coupon.start_date or now > coupon.end_date:
            return {
                "valid": False,
                "discount_amount": Decimal('0'),
                "message": "Coupon is expired or not yet active"
            }
        
        # Check minimum order amount
        if coupon.min_order_amount and order_total < coupon.min_order_amount:
            return {
                "valid": False,
                "discount_amount": Decimal('0'),
                "message": f"Minimum order amount of {coupon.min_order_amount} required"
            }
        
        # Check if coupon applies to variants
        coupon_variants = self.repository.get_coupon_variants(self.db, coupon.coupon_id)
        if coupon_variants:
            valid_variants = any(variant_id in coupon_variants for variant_id in variant_ids)
            if not valid_variants:
                return {
                    "valid": False,
                    "discount_amount": Decimal('0'),
                    "message": "Coupon not applicable to selected product variants"
                }
        
        # Calculate discount
        if coupon.discount_type == "PERCENT":
            discount_amount = (order_total * coupon.discount_value) / 100
            if coupon.max_discount_amount and discount_amount > coupon.max_discount_amount:
                discount_amount = coupon.max_discount_amount
        else:  # FLAT discount
            discount_amount = coupon.discount_value
        
        # Ensure discount doesn't exceed order total
        if discount_amount > order_total:
            discount_amount = order_total
        
        # Get coupon details for response
        coupon_details = self._serialize_coupon(coupon)
        
        return {
            "valid": True,
            "discount_amount": discount_amount,
            "message": "Coupon applied successfully",
            "coupon": coupon_details
        }
    
    def check_expiring_coupons(self, days_threshold: int = 7):
        """Check for coupons expiring soon and send notifications"""
        try:
            # Get coupons expiring within the threshold
            expiring_coupons = self.repository.get_expiring_coupons(self.db, days_threshold)
            
            if expiring_coupons:
                self._send_coupon_expiry_notifications(expiring_coupons, days_threshold)
                return {
                    "message": f"Found {len(expiring_coupons)} coupons expiring within {days_threshold} days",
                    "expiring_count": len(expiring_coupons)
                }
            else:
                return {
                    "message": f"No coupons expiring within {days_threshold} days",
                    "expiring_count": 0
                }
                
        except Exception as e:
            print(f"⚠️ Error checking expiring coupons: {e}")
            return {"error": str(e)}
    
    def _serialize_coupon(self, coupon: Coupon) -> Dict[str, Any]:
        """Serialize coupon data"""
        variant_ids = self.repository.get_coupon_variants(self.db, coupon.coupon_id)
        
        return {
            "coupon_id": coupon.coupon_id,
            "code": coupon.code,
            "description": coupon.description,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "min_order_amount": coupon.min_order_amount,
            "max_discount_amount": coupon.max_discount_amount,
            "start_date": coupon.start_date,
            "end_date": coupon.end_date,
            "usage_limit": coupon.usage_limit,
            "is_active": coupon.is_active,
            "created_at": coupon.created_at,
            "variants": variant_ids
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_coupon_creation_notifications(self, coupon, variant_ids: List[int]):
        """Send notifications when coupon is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Format discount display
            if coupon.discount_type == "PERCENT":
                discount_display = f"{coupon.discount_value}%"
            else:
                discount_display = f"${coupon.discount_value:.2f}"
            
            # Check if coupon has variant restrictions
            variant_info = ""
            if variant_ids:
                variant_count = len(variant_ids)
                variant_info = f" (Applies to {variant_count} product variant{'s' if variant_count > 1 else ''})"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🎁 New Coupon Created",
                    'message': f"New coupon '{coupon.code}' created. Discount: {discount_display}. Valid from {coupon.start_date.strftime('%Y-%m-%d')} to {coupon.end_date.strftime('%Y-%m-%d')}.{variant_info}",
                    'type': "COUPON",
                    'reference_id': coupon.coupon_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send coupon creation notifications: {e}")
    
    def _send_coupon_update_notifications(self, coupon, update_data: Dict[str, Any]):
        """Send notifications when coupon is updated"""
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
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "✏️ Coupon Updated",
                    'message': f"Coupon '{coupon.code}' has been updated. Updated fields: {', '.join(significant_fields)}.",
                    'type': "COUPON",
                    'reference_id': coupon.coupon_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send coupon update notifications: {e}")
    
    def _send_coupon_status_notifications(self, coupon, old_status: bool, new_status: bool):
        """Send notifications when coupon status changes"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            status_text = "activated" if new_status else "deactivated"
            emoji = "✅" if new_status else "🚫"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{emoji} Coupon {status_text.title()}",
                    'message': f"Coupon '{coupon.code}' has been {status_text}. Discount: {coupon.discount_value}{'%' if coupon.discount_type == 'PERCENT' else ''}.",
                    'type': "COUPON",
                    'reference_id': coupon.coupon_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send coupon status notifications: {e}")
    
    def _send_coupon_deletion_notifications(self, coupon_details: Dict[str, Any]):
        """Send notifications when coupon is deleted"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Format discount display
            discount_display = f"{coupon_details['discount_value']}{'%' if coupon_details['discount_type'] == 'PERCENT' else ''}"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🗑️ Coupon Deleted",
                    'message': f"Coupon '{coupon_details['code']}' has been deleted. Was {discount_display} discount, valid from {coupon_details['start_date'].strftime('%Y-%m-%d')} to {coupon_details['end_date'].strftime('%Y-%m-%d')}.",
                    'type': "COUPON",
                    'reference_id': coupon_details['coupon_id']
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send coupon deletion notifications: {e}")
    
    def _send_coupon_expiry_notifications(self, expiring_coupons: List, days_threshold: int):
        """Send notifications for coupons expiring soon"""
        try:
            if not expiring_coupons:
                return
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Group coupons by expiry date
            coupons_by_expiry = {}
            for coupon_data in expiring_coupons:
                coupon = coupon_data["coupon"]
                days_until_expiry = coupon_data["days_until_expiry"]
                
                if days_until_expiry not in coupons_by_expiry:
                    coupons_by_expiry[days_until_expiry] = []
                
                coupons_by_expiry[days_until_expiry].append(coupon)
            
            # Create consolidated notifications
            notifications_data = []
            for admin in admin_users:
                for days_until, coupons in coupons_by_expiry.items():
                    if len(coupons) > 1:
                        coupon_codes = ", ".join([c.code for c in coupons])
                        message = f"Multiple coupons expiring in {days_until} days: {coupon_codes}"
                    else:
                        coupon = coupons[0]
                        discount_display = f"{coupon.discount_value}{'%' if coupon.discount_type == 'PERCENT' else ''}"
                        message = f"Coupon '{coupon.code}' ({discount_display} discount) expires in {days_until} days on {coupon.end_date.strftime('%Y-%m-%d')}."
                    
                    notification_dict = {
                        'user_id': admin.user_id,
                        'title': "⏳ Coupon Expiring Soon",
                        'message': message,
                        'type': "COUPON",
                        'reference_id': coupons[0].coupon_id
                    }
                    notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send coupon expiry notifications: {e}")