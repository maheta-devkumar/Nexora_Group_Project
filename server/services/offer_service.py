from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.offer_repository import OfferRepository
from repositories.product_catalog.variant_repository import VariantRepository
from repositories.notification_repository import NotificationRepository  # ADD THIS
from repositories.user_repository import UserRepository  # ADD THIS
from schemas.marketing_schema import OfferCreate, OfferUpdate
from datetime import datetime
from typing import List, Dict, Any

class OfferService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = OfferRepository()
        self.variant_repo = VariantRepository()
        # ADD NOTIFICATION REPOSITORIES
        self.notification_repo = NotificationRepository()
        self.user_repo = UserRepository()
    
    def create_offer(self, offer_data: OfferCreate) -> Dict[str, Any]:
        """Create a new offer"""
        # Validate dates
        if offer_data.start_date >= offer_data.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
        
        # Validate discount values
        if offer_data.discount_type == "PERCENT" and offer_data.discount_value > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Percentage discount cannot exceed 100%"
            )
        
        # Create offer
        offer_dict = offer_data.model_dump(exclude={'variant_ids'})
        offer = self.repository.create_offer(self.db, offer_dict)
        
        # Link variants if provided
        if offer_data.variant_ids:
            # Validate all variants exist
            for variant_id in offer_data.variant_ids:
                variant = self.variant_repo.get_variant_by_id(self.db, variant_id)
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Product variant {variant_id} not found"
                    )
                
                offer_variant_data = {
                    "offer_id": offer.offer_id,
                    "variant_id": variant_id
                }
                self.repository.create_offer_variant(self.db, offer_variant_data)
        
        self.db.commit()
        self.db.refresh(offer)
        
        # ============================================
        # SEND NOTIFICATIONS FOR OFFER CREATION
        # ============================================
        try:
            self._send_offer_creation_notifications(offer, offer_data.variant_ids)
        except Exception as notif_error:
            print(f"⚠️ Offer creation notification failed: {notif_error}")
        
        return self._serialize_offer(offer)
    
    def get_offer(self, offer_id: int) -> Dict[str, Any]:
        """Get offer by ID"""
        offer = self.repository.get_offer_by_id(self.db, offer_id)
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        return self._serialize_offer(offer)
    
    def get_all_offers(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all offers"""
        offers = self.repository.get_all_offers(self.db, skip, limit)
        return [self._serialize_offer(offer) for offer in offers]
    
    def get_active_offers(self) -> List[Dict[str, Any]]:
        """Get currently active offers"""
        offers = self.repository.get_active_offers(self.db)
        return [self._serialize_offer(offer) for offer in offers]
    
    def update_offer(self, offer_id: int, offer_data: OfferUpdate) -> Dict[str, Any]:
        """Update offer"""
        offer = self.repository.get_offer_by_id(self.db, offer_id)
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Store old values for notification
        old_values = {
            'title': offer.title,
            'description': offer.description,
            'discount_type': offer.discount_type,
            'discount_value': offer.discount_value,
            'start_date': offer.start_date,
            'end_date': offer.end_date,
            'is_active': offer.is_active
        }
        
        # Update fields
        update_data = offer_data.model_dump(exclude_unset=True)
        updated_offer = self.repository.update_offer(self.db, offer_id, update_data)
        if not updated_offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR OFFER UPDATE
        # ============================================
        try:
            self._send_offer_update_notifications(offer, old_values, update_data)
        except Exception as notif_error:
            print(f"⚠️ Offer update notification failed: {notif_error}")
        
        return self._serialize_offer(updated_offer)
    
    def update_offer_status(self, offer_id: int, is_active: bool) -> Dict[str, str]:
        """Update offer status"""
        # Get offer before update for notification
        offer = self.repository.get_offer_by_id(self.db, offer_id)
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Store old status
        old_status = offer.is_active
        
        # Update status
        updated_offer = self.repository.update_offer_status(self.db, offer_id, is_active)
        if not updated_offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR OFFER STATUS CHANGE
        # ============================================
        try:
            self._send_offer_status_notifications(offer, old_status, is_active)
        except Exception as notif_error:
            print(f"⚠️ Offer status notification failed: {notif_error}")
        
        status_text = "activated" if is_active else "deactivated"
        return {"message": f"Offer {status_text} successfully"}
    
    def delete_offer(self, offer_id: int) -> Dict[str, str]:
        """Delete offer"""
        # Get offer details before deletion for notification
        offer = self.repository.get_offer_by_id(self.db, offer_id)
        if not offer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # Store offer details for notification
        offer_details = {
            "offer_id": offer.offer_id,
            "title": offer.title,
            "discount_type": offer.discount_type,
            "discount_value": float(offer.discount_value),
            "start_date": offer.start_date,
            "end_date": offer.end_date,
            "variant_count": len(self.repository.get_offer_variants(self.db, offer.offer_id))
        }
        
        # Delete offer
        success = self.repository.delete_offer(self.db, offer_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Offer not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR OFFER DELETION
        # ============================================
        try:
            self._send_offer_deletion_notifications(offer_details)
        except Exception as notif_error:
            print(f"⚠️ Offer deletion notification failed: {notif_error}")
        
        return {"message": "Offer deleted successfully"}
    
    def check_expiring_offers(self, days_threshold: int = 7):
        """Check for offers expiring soon and send notifications"""
        try:
            # Get offers expiring within the threshold
            expiring_offers = self.repository.get_expiring_offers(self.db, days_threshold)
            
            if expiring_offers:
                self._send_offer_expiry_notifications(expiring_offers, days_threshold)
                return {
                    "message": f"Found {len(expiring_offers)} offers expiring within {days_threshold} days",
                    "expiring_count": len(expiring_offers)
                }
            else:
                return {
                    "message": f"No offers expiring within {days_threshold} days",
                    "expiring_count": 0
                }
                
        except Exception as e:
            print(f"⚠️ Error checking expiring offers: {e}")
            return {"error": str(e)}
    
    def _serialize_offer(self, offer: Offer) -> Dict[str, Any]:
        """Serialize offer data"""
        variant_ids = self.repository.get_offer_variants(self.db, offer.offer_id)
        
        return {
            "offer_id": offer.offer_id,
            "title": offer.title,
            "description": offer.description,
            "discount_type": offer.discount_type,
            "discount_value": offer.discount_value,
            "start_date": offer.start_date,
            "end_date": offer.end_date,
            "is_active": offer.is_active,
            "created_at": offer.created_at,
            "variants": variant_ids
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_offer_creation_notifications(self, offer, variant_ids: List[int]):
        """Send notifications when offer is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Format discount display
            if offer.discount_type == "PERCENT":
                discount_display = f"{offer.discount_value}% OFF"
            else:
                discount_display = f"${offer.discount_value:.2f} OFF"
            
            # Check if offer has variant restrictions
            variant_info = ""
            if variant_ids:
                variant_count = len(variant_ids)
                variant_info = f" (Applies to {variant_count} product variant{'s' if variant_count > 1 else ''})"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🎁 New Offer Created",
                    'message': f"New offer '{offer.title}' created. Discount: {discount_display}. Valid from {offer.start_date.strftime('%Y-%m-%d')} to {offer.end_date.strftime('%Y-%m-%d')}.{variant_info}",
                    'type': "OFFER",
                    'reference_id': offer.offer_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send offer creation notifications: {e}")
    
    def _send_offer_update_notifications(self, offer, old_values: Dict[str, Any], update_data: Dict[str, Any]):
        """Send notifications when offer is updated"""
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
            
            # Create detailed message about changes
            changes = []
            for field in significant_fields:
                if field in old_values and field in update_data:
                    old_val = old_values[field]
                    new_val = update_data[field]
                    if old_val != new_val:
                        if field in ['start_date', 'end_date']:
                            old_val = old_val.strftime('%Y-%m-%d') if hasattr(old_val, 'strftime') else str(old_val)
                            new_val = new_val.strftime('%Y-%m-%d') if hasattr(new_val, 'strftime') else str(new_val)
                        changes.append(f"{field}: {old_val} → {new_val}")
            
            if not changes:
                return
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "✏️ Offer Updated",
                    'message': f"Offer '{offer.title}' has been updated. Changes: {', '.join(changes)}.",
                    'type': "OFFER",
                    'reference_id': offer.offer_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send offer update notifications: {e}")
    
    def _send_offer_status_notifications(self, offer, old_status: bool, new_status: bool):
        """Send notifications when offer status changes"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            status_text = "activated" if new_status else "deactivated"
            emoji = "✅" if new_status else "🚫"
            
            # Format discount display
            if offer.discount_type == "PERCENT":
                discount_display = f"{offer.discount_value}%"
            else:
                discount_display = f"${offer.discount_value:.2f}"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': f"{emoji} Offer {status_text.title()}",
                    'message': f"Offer '{offer.title}' has been {status_text}. Discount: {discount_display}{'%' if offer.discount_type == 'PERCENT' else ''}. Valid until {offer.end_date.strftime('%Y-%m-%d')}.",
                    'type': "OFFER",
                    'reference_id': offer.offer_id
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send offer status notifications: {e}")
    
    def _send_offer_deletion_notifications(self, offer_details: Dict[str, Any]):
        """Send notifications when offer is deleted"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Format discount display
            discount_display = f"{offer_details['discount_value']}{'%' if offer_details['discount_type'] == 'PERCENT' else ''}"
            
            # Create notifications for all admins
            notifications_data = []
            for admin in admin_users:
                variant_info = f" (Applied to {offer_details['variant_count']} variants)" if offer_details.get('variant_count', 0) > 0 else ""
                
                notification_dict = {
                    'user_id': admin.user_id,
                    'title': "🗑️ Offer Deleted",
                    'message': f"Offer '{offer_details['title']}' has been deleted. Was {discount_display} discount{variant_info}, valid from {offer_details['start_date'].strftime('%Y-%m-%d')} to {offer_details['end_date'].strftime('%Y-%m-%d')}.",
                    'type': "OFFER",
                    'reference_id': offer_details['offer_id']
                }
                notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send offer deletion notifications: {e}")
    
    def _send_offer_expiry_notifications(self, expiring_offers: List, days_threshold: int):
        """Send notifications for offers expiring soon"""
        try:
            if not expiring_offers:
                return
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Group offers by expiry date
            offers_by_expiry = {}
            for offer_data in expiring_offers:
                offer = offer_data["offer"]
                days_until_expiry = offer_data["days_until_expiry"]
                
                if days_until_expiry not in offers_by_expiry:
                    offers_by_expiry[days_until_expiry] = []
                
                offers_by_expiry[days_until_expiry].append(offer)
            
            # Create consolidated notifications
            notifications_data = []
            for admin in admin_users:
                for days_until, offers in offers_by_expiry.items():
                    if len(offers) > 1:
                        offer_titles = ", ".join([o.title for o in offers])
                        message = f"Multiple offers expiring in {days_until} days: {offer_titles}"
                    else:
                        offer = offers[0]
                        discount_display = f"{offer.discount_value}{'%' if offer.discount_type == 'PERCENT' else ''}"
                        message = f"Offer '{offer.title}' ({discount_display} discount) expires in {days_until} days on {offer.end_date.strftime('%Y-%m-%d')}."
                    
                    notification_dict = {
                        'user_id': admin.user_id,
                        'title': "⏳ Offer Expiring Soon",
                        'message': message,
                        'type': "OFFER",
                        'reference_id': offers[0].offer_id
                    }
                    notifications_data.append(notification_dict)
            
            if notifications_data:
                self.notification_repo.create_bulk_notifications(self.db, notifications_data)
                
        except Exception as e:
            print(f"⚠️ Failed to send offer expiry notifications: {e}")