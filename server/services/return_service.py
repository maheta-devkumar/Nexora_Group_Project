from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.return_repository import ReturnRepository
from repositories.order_repository import OrderRepository
from repositories.product_catalog.variant_repository import VariantRepository
from repositories.user_repository import UserRepository
from services.notification_service import NotificationService  # ADD THIS
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any

class ReturnService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = ReturnRepository()
        self.order_repo = OrderRepository()
        self.variant_repo = VariantRepository()
        self.user_repo = UserRepository()
        self.notification_service = NotificationService(db)  # ADD THIS
    
    def create_return_request(self, order_id: int, user_id: int, return_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a return request for an order"""
        # Verify order exists and belongs to user
        order = self.order_repo.get_order_by_id(self.db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if order can be returned - EXPAND ALLOWED STATUSES
        allowed_statuses = ["DELIVERED", "COMPLETED", "CONFIRMED"]
        if order.order_status not in allowed_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Order cannot be returned. Current status: {order.order_status}. Allowed statuses: {allowed_statuses}"
            )
        
        # Check if payment is completed
        if order.payment_status != "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Order payment not completed. Current payment status: {order.payment_status}"
            )
        
        # Validate items and calculate refund amount
        total_refund = Decimal('0.00')
        validated_items = []
        
        for item in return_data["items"]:
            # Validate variant_id
            if not item.get("variant_id") or item["variant_id"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Invalid variant ID: {item.get('variant_id')}"
                )
            
            # Validate quantity
            if not item.get("quantity") or item["quantity"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quantity for variant {item['variant_id']}"
                )
            
            # Verify variant exists
            variant = self.variant_repo.get_variant_by_id(self.db, item["variant_id"])
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail=f"Product variant {item['variant_id']} not found"
                )
            
            # Check if variant is in order
            order_item = next((oi for oi in order.items if oi.variant_id == item["variant_id"]), None)
            if not order_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Variant {item['variant_id']} not found in order {order_id}"
                )
            
            # Check return quantity
            if item["quantity"] > order_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Return quantity ({item['quantity']}) exceeds ordered quantity ({order_item.quantity}) for variant {item['variant_id']}"
                )
            
            # Calculate refund for this item
            item_refund = order_item.price * item["quantity"]
            total_refund += item_refund
            
            validated_items.append({
                "variant_id": item["variant_id"],
                "quantity": item["quantity"],
                "unit_price": float(order_item.price),
                "refund_amount": float(item_refund),
                "variant_name": variant.variant_name,
                "product_name": variant.product.product_name if variant.product else "Unknown"
            })
        
        # Create return request
        return_request_data = {
            "order_id": order_id,
            "reason": return_data["reason"],
            "status": "REQUESTED"
        }
        
        return_request = self.repository.create_return_request(self.db, return_request_data)
        
        # Create return items
        for item in validated_items:
            return_product_data = {
                "return_id": return_request.return_id,
                "variant_id": item["variant_id"],
                "quantity": item["quantity"]
            }
            self.repository.create_return_product(self.db, return_product_data)
        
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR RETURN REQUEST CREATION
        # ============================================
        try:
            self._send_return_request_notifications(return_request, order, user_id, validated_items, total_refund)
        except Exception as notif_error:
            print(f"⚠️ Return request notification failed: {notif_error}")
        
        return {
            "return_id": return_request.return_id,
            "order_id": return_request.order_id,
            "reason": return_request.reason,
            "status": return_request.status,
            "requested_at": return_request.requested_at,
            "total_refund_amount": float(total_refund),
            "items": validated_items
        }
    
    def get_user_returns(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get return requests for a user"""
        result = self.repository.get_returns_by_user_id(self.db, user_id, page, per_page)
        
        returns_data = []
        for return_req in result["returns"]:
            # Calculate refund amount
            refund_amount = Decimal('0.00')
            for item in return_req.items:
                order = self.order_repo.get_order_by_id(self.db, return_req.order_id)
                if order:
                    order_item = next((oi for oi in order.items if oi.variant_id == item.variant_id), None)
                    if order_item:
                        refund_amount += order_item.price * item.quantity
            
            returns_data.append({
                "return_id": return_req.return_id,
                "order_id": return_req.order_id,
                "reason": return_req.reason,
                "status": return_req.status,
                "requested_at": return_req.requested_at,
                "total_refund_amount": float(refund_amount)
            })
        
        return {
            "returns": returns_data,
            "total_returns": result["total_returns"]
        }
    
    def get_return_details(self, return_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed return request with items"""
        return_req = self.repository.get_return_by_id(self.db, return_id)
        if not return_req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Return request not found"
            )
        
        # Verify the return belongs to the user
        if return_req.order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Get return items with product info
        items_data = []
        total_refund = Decimal('0.00')
        
        for item in return_req.items:
            variant = self.variant_repo.get_variant_by_id(self.db, item.variant_id)
            product = variant.product if variant else None
            
            # Find order item to get price
            order_item = next((oi for oi in return_req.order.items if oi.variant_id == item.variant_id), None)
            unit_price = float(order_item.price) if order_item else 0.0
            item_refund = unit_price * item.quantity
            total_refund += Decimal(str(item_refund))
            
            items_data.append({
                "return_id": item.return_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "product_name": product.product_name if product else "Unknown",
                "variant_name": variant.variant_name if variant else "Unknown",
                "unit_price": unit_price
            })
        
        # Get refund info if exists
        refund_data = None
        if return_req.refund:
            refund_data = {
                "refund_id": return_req.refund.refund_id,
                "return_id": return_req.refund.return_id,
                "amount": float(return_req.refund.amount),
                "status": return_req.refund.status,
                "processed_at": return_req.refund.processed_at
            }
        
        return {
            "return_request": {
                "return_id": return_req.return_id,
                "order_id": return_req.order_id,
                "reason": return_req.reason,
                "status": return_req.status,
                "requested_at": return_req.requested_at,
                "total_refund_amount": float(total_refund)
            },
            "items": items_data,
            "refund": refund_data
        }
    
    def update_return_status(self, return_id: int, status: str) -> Dict[str, Any]:
        """Update return request status"""
        # Get return request before update for notification
        return_req = self.repository.get_return_by_id(self.db, return_id)
        if not return_req:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Return request not found"
            )
        
        # Store old status for notification
        old_status = return_req.status
        
        # Update return status
        updated_return = self.repository.update_return_status(self.db, return_id, status)
        if not updated_return:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Return request not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR RETURN STATUS UPDATE
        # ============================================
        try:
            order = self.order_repo.get_order_by_id(self.db, updated_return.order_id)
            if order:
                self._send_return_status_notifications(updated_return, order, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Return status update notification failed: {notif_error}")
        
        return {
            "return_id": updated_return.return_id,
            "status": updated_return.status,
            "message": f"Return status updated to {status}"
        }
    
    def get_all_returns_admin(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all return requests"""
        result = self.repository.get_all_returns(self.db, page, per_page, status)
        
        returns_data = []
        for return_req in result["returns"]:
            # Calculate refund amount
            refund_amount = Decimal('0.00')
            for item in return_req.items:
                order = self.order_repo.get_order_by_id(self.db, return_req.order_id)
                if order:
                    order_item = next((oi for oi in order.items if oi.variant_id == item.variant_id), None)
                    if order_item:
                        refund_amount += order_item.price * item.quantity
            
            returns_data.append({
                "return_id": return_req.return_id,
                "order_id": return_req.order_id,
                "user_id": return_req.order.user_id if return_req.order else None,
                "reason": return_req.reason,
                "status": return_req.status,
                "requested_at": return_req.requested_at,
                "total_refund_amount": float(refund_amount)
            })
        
        return {
            "returns": returns_data,
            "total_returns": result["total_returns"]
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_return_request_notifications(self, return_request, order, user_id: int, items: list, total_refund: Decimal):
        """Send notifications when return request is created"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            if not customer:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Calculate item summary
            item_count = len(items)
            item_names = []
            for item in items[:3]:  # Limit to first 3 items for notification
                item_names.append(f"{item['product_name']} ({item['variant_name']})")
            
            item_summary = ", ".join(item_names)
            if item_count > 3:
                item_summary += f" and {item_count - 3} more item(s)"
            
            # 1. Send notification to customer (return request confirmation)
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="🔄 Return Request Submitted",
                message=f"Return request #{return_request.return_id} for Order #{order.order_id} has been submitted. Refund amount: ${total_refund:.2f}",
                type="RETURN",
                reference_id=return_request.return_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 New Return Request",
                    message=f"New return request #{return_request.return_id} from {customer_name} for Order #{order.order_id}. Reason: {return_request.reason}, Items: {item_summary}, Refund: ${total_refund:.2f}",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send return request notifications: {e}")

    def _send_return_status_notifications(self, return_request, order, old_status: str, new_status: str):
        """Send notifications when return status is updated"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            if not customer:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "REQUESTED": "📝",
                "APPROVED": "✅",
                "REJECTED": "❌",
                "PROCESSING": "🔄",
                "COMPLETED": "🎉",
                "CANCELLED": "🚫"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            all_notifications = []
            
            # 1. Send notification to customer for important status changes
            if new_status in ["APPROVED", "REJECTED", "COMPLETED", "CANCELLED"]:
                if new_status == "APPROVED":
                    customer_title = "✅ Return Approved"
                    customer_message = f"Your return request #{return_request.return_id} for Order #{order.order_id} has been approved. Refund will be processed soon."
                elif new_status == "REJECTED":
                    customer_title = "❌ Return Rejected"
                    customer_message = f"Your return request #{return_request.return_id} for Order #{order.order_id} has been rejected. Please contact support for details."
                elif new_status == "COMPLETED":
                    customer_title = "🎉 Return Completed"
                    customer_message = f"Your return request #{return_request.return_id} for Order #{order.order_id} has been completed. Refund has been processed."
                else:  # CANCELLED
                    customer_title = "🚫 Return Cancelled"
                    customer_message = f"Your return request #{return_request.return_id} for Order #{order.order_id} has been cancelled."
                
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title=customer_title,
                    message=customer_message,
                    type="RETURN",
                    reference_id=return_request.return_id
                )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{new_emoji} Return Status Updated",
                    message=f"Return #{return_request.return_id} (Order #{order.order_id}, Customer: {customer_name}) status updated from {old_status} to {new_status}.",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send return status notifications: {e}")