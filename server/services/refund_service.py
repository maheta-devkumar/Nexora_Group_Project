from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.refund_repository import RefundRepository
from repositories.return_repository import ReturnRepository
from repositories.payment_repository import PaymentRepository
from repositories.user_repository import UserRepository
from services.notification_service import NotificationService  # ADD THIS
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any

class RefundService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = RefundRepository()
        self.return_repo = ReturnRepository()
        self.payment_repo = PaymentRepository()
        self.user_repo = UserRepository()
        self.notification_service = NotificationService(db)  # ADD THIS
    
    def process_refund(self, return_id: int, admin_id: int) -> Dict[str, Any]:
        """Process refund for a return request"""
        return_request = self.return_repo.get_return_by_id(self.db, return_id)
        
        if not return_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Return request not found"
            )
        
        if return_request.status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Return must be approved before refund"
            )
        
        if return_request.refund:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund already processed"
            )
        
        # Calculate refund amount from return items
        total_refund = Decimal('0.00')
        for item in return_request.items:
            order_item = next((oi for oi in return_request.order.items if oi.variant_id == item.variant_id), None)
            if order_item:
                total_refund += order_item.price * item.quantity
        
        if total_refund <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid refund amount"
            )
        
        # Get original payment method
        original_payment = self.payment_repo.get_payment_by_order_id(self.db, return_request.order_id)
        payment_method = original_payment.payment_method if original_payment else "WALLET"
        
        # Store refund details for notification before processing
        refund_details = {
            "return_id": return_id,
            "order_id": return_request.order_id,
            "amount": total_refund,
            "payment_method": payment_method,
            "customer_id": return_request.order.user_id
        }
        
        # Create refund record
        refund_data = {
            "return_id": return_id,
            "amount": total_refund,
            "status": "PROCESSING",
            "payment_method": payment_method,
            "processed_by": admin_id,
            "processed_at": datetime.now()
        }
        
        refund = self.repository.create_refund(self.db, refund_data)
        
        # Process refund based on payment method
        try:
            refund_result = self._execute_refund_payment(refund, original_payment)
            refund.status = "COMPLETED"
            refund.transaction_id = refund_result.get("transaction_id")
            
            # Update refund details with transaction ID
            refund_details["transaction_id"] = refund.transaction_id
            refund_details["status"] = "COMPLETED"
        except Exception as e:
            refund.status = "FAILED"
            refund.reason = str(e)
            refund_details["status"] = "FAILED"
            refund_details["reason"] = str(e)
        
        self.db.commit()
        self.db.refresh(refund)
        
        # ============================================
        # SEND NOTIFICATIONS FOR REFUND PROCESSING
        # ============================================
        try:
            self._send_refund_processing_notifications(refund, return_request, admin_id, refund_details)
        except Exception as notif_error:
            print(f"⚠️ Refund processing notification failed: {notif_error}")
        
        return self._serialize_refund(refund)
    
    def get_refund_details(self, refund_id: int, user_id: int) -> Dict[str, Any]:
        """Get refund details"""
        # Find refund and verify it belongs to the user
        refund = self.repository.get_refund_by_id(self.db, refund_id)
        if not refund:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Refund not found"
            )
        
        # Verify the refund belongs to the user
        return_request = refund.return_request
        if not return_request or return_request.order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Simple response with basic refund info
        return {
            "refund_id": refund.refund_id,
            "return_id": refund.return_id,
            "order_id": refund.return_request.order_id,
            "amount": float(refund.amount),
            "status": refund.status,
            "transaction_id": refund.transaction_id,
            "processed_at": refund.processed_at,
            "created_at": refund.created_at
        }
    
    def get_refunds_by_user(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all refunds for a user"""
        result = self.repository.get_refunds_by_user_id(self.db, user_id, page, per_page)
        
        refunds_data = []
        for refund in result["refunds"]:
            return_request = refund.return_request
            order = return_request.order if return_request else None
            
            refunds_data.append({
                "refund_id": refund.refund_id,
                "return_id": refund.return_id,
                "order_id": return_request.order_id if return_request else None,
                "amount": float(refund.amount),
                "status": refund.status,
                "payment_method": refund.payment_method,
                "transaction_id": refund.transaction_id,
                "processed_at": refund.processed_at,
                "order_user_id": order.user_id if order else None
            })
        
        return {
            "refunds": refunds_data,
            "total_refunds": result["total_refunds"]
        }
    
    def get_all_refunds(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Get all refunds"""
        result = self.repository.get_all_refunds(self.db, page, per_page, status)
        
        refunds_data = [
            self._serialize_refund(refund) for refund in result["refunds"]
        ]
        
        return {
            "refunds": refunds_data,
            "total_refunds": result["total_refunds"]
        }
    
    def update_refund_status(self, refund_id: int, status: str, admin_id: int) -> Dict[str, Any]:
        """Update refund status"""
        # Get refund before update for notification
        refund = self.repository.get_refund_by_id(self.db, refund_id)
        if not refund:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Refund not found"
            )
        
        # Store old status for notification
        old_status = refund.status
        
        # Update refund status
        updated_refund = self.repository.update_refund_status(self.db, refund_id, status, admin_id)
        if not updated_refund:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Refund not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR REFUND STATUS UPDATE
        # ============================================
        try:
            return_request = updated_refund.return_request
            if return_request and return_request.order:
                self._send_refund_status_update_notifications(updated_refund, return_request, admin_id, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Refund status update notification failed: {notif_error}")
        
        return self._serialize_refund(updated_refund)
    
    def _execute_refund_payment(self, refund: OrderRefund, original_payment) -> Dict[str, Any]:
        """Execute refund through payment system"""
        try:
            # Get the original payment
            payment = self.payment_repo.get_payment_for_refund(self.db, refund.return_request.order_id)
            
            # Process refund through payment system
            from services.payment_service import PaymentService
            payment_service = PaymentService(self.db)
            refund_result = payment_service.process_refund_payment(
                payment.payment_id, 
                refund.amount
            )
            
            # Link refund to payment
            refund.payment_id = payment.payment_id
            refund.transaction_id = refund_result["transaction_id"]
            refund.status = "COMPLETED"
            
            self.db.commit()
            
            return refund_result
            
        except HTTPException:
            raise
        except Exception as e:
            refund.status = "FAILED"
            refund.reason = str(e)
            self.db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Refund execution failed: {str(e)}"
            )
    
    def _serialize_refund(self, refund: OrderRefund) -> Dict[str, Any]:
        """Serialize refund data"""
        processor = self.user_repo.get_user_by_id(self.db, refund.processed_by) if refund.processed_by else None
        
        return {
            "refund_id": refund.refund_id,
            "return_id": refund.return_id,
            "order_id": refund.return_request.order_id,
            "amount": float(refund.amount),
            "status": refund.status,
            "payment_method": refund.payment_method,
            "transaction_id": refund.transaction_id,
            "reason": refund.reason,
            "processed_by": f"{processor.first_name} {processor.last_name}" if processor else None,
            "processed_at": refund.processed_at,
            "created_at": refund.created_at
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_refund_processing_notifications(self, refund, return_request, admin_id: int, refund_details: Dict[str, Any]):
        """Send notifications when refund is processed"""
        try:
            # Get admin user who processed the refund
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, refund_details["customer_id"])
            if not customer:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "PROCESSING": "🔄",
                "COMPLETED": "✅",
                "FAILED": "❌"
            }
            
            status_emoji = status_emojis.get(refund_details["status"], "📊")
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            all_notifications = []
            
            # 1. Send notification to customer
            if refund_details["status"] == "COMPLETED":
                customer_title = "💰 Refund Processed"
                customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} has been processed successfully. Amount: ${refund_details['amount']:.2f}"
                if refund_details.get("transaction_id"):
                    customer_message += f", Transaction ID: {refund_details['transaction_id']}"
            elif refund_details["status"] == "FAILED":
                customer_title = "❌ Refund Failed"
                customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} has failed. Reason: {refund_details.get('reason', 'Unknown error')}"
            else:
                customer_title = "🔄 Refund Processing"
                customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} is being processed. Amount: ${refund_details['amount']:.2f}"
            
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title=customer_title,
                message=customer_message,
                type="REFUND",
                reference_id=refund.refund_id
            )
            
            # 2. Send notifications to admin users (excluding the one who processed it)
            for admin in admin_users:
                if admin.user_id != admin_id:  # Exclude the admin who processed refund
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title=f"{status_emoji} Refund Processed",
                        message=f"Refund #{refund.refund_id} for Return #{return_request.return_id} processed by {admin_name}. Status: {refund_details['status']}, Amount: ${refund_details['amount']:.2f}",
                        type="REFUND",
                        reference_id=refund.refund_id
                    )
            
            # 3. Send confirmation notification to the admin who processed it
            self.notification_service.send_notification(
                user_id=admin_user.user_id,
                title=f"{status_emoji} Refund Action Completed",
                message=f"You processed refund #{refund.refund_id} for Return #{return_request.return_id}. Status: {refund_details['status']}, Amount: ${refund_details['amount']:.2f}",
                type="REFUND",
                reference_id=refund.refund_id
            )
                
        except Exception as e:
            print(f"⚠️ Failed to send refund processing notifications: {e}")

    def _send_refund_status_update_notifications(self, refund, return_request, admin_id: int, old_status: str, new_status: str):
        """Send notifications when refund status is updated"""
        try:
            # Get admin user who updated the status
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, return_request.order.user_id)
            if not customer:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "PENDING": "⏳",
                "PROCESSING": "🔄",
                "COMPLETED": "✅",
                "FAILED": "❌",
                "CANCELLED": "🚫"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            all_notifications = []
            
            # 1. Send notification to customer for significant status changes
            if new_status in ["COMPLETED", "FAILED", "CANCELLED"]:
                if new_status == "COMPLETED":
                    customer_title = "✅ Refund Completed"
                    customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} has been completed. Amount: ${refund.amount:.2f} will be processed to your account."
                elif new_status == "FAILED":
                    customer_title = "❌ Refund Failed"
                    customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} has failed. Please contact support."
                else:  # CANCELLED
                    customer_title = "🚫 Refund Cancelled"
                    customer_message = f"Refund #{refund.refund_id} for Return #{return_request.return_id} has been cancelled."
                
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title=customer_title,
                    message=customer_message,
                    type="REFUND",
                    reference_id=refund.refund_id
                )
            
            # 2. Send notifications to admin users (excluding the one who updated it)
            for admin in admin_users:
                if admin.user_id != admin_id:  # Exclude the admin who updated status
                    self.notification_service.send_notification(
                        user_id=admin.user_id,
                        title=f"{new_emoji} Refund Status Updated",
                        message=f"Refund #{refund.refund_id} (Order #{return_request.order_id}) status updated from {old_status} to {new_status} by {admin_name}.",
                        type="REFUND",
                        reference_id=refund.refund_id
                    )
            
            # 3. Send confirmation notification to the admin who updated it
            self.notification_service.send_notification(
                user_id=admin_user.user_id,
                title=f"{new_emoji} Refund Status Updated",
                message=f"You updated refund #{refund.refund_id} status from {old_status} to {new_status}.",
                type="REFUND",
                reference_id=refund.refund_id
            )

        except Exception as e:
            print(f"⚠️ Failed to send refund status update notifications: {e}")