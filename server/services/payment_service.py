from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.payment_repository import PaymentRepository
from repositories.order_repository import OrderRepository
from repositories.user_repository import UserRepository
from services.notification_service import NotificationService  # ADD THIS
from models.delivery.delivery import Delivery
from schemas.payment_schema import PaymentInitiateRequest, PaymentVerifyRequest
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional
import hashlib
import hmac
import razorpay
import os
from utils.send_email import EmailService

# Razorpay Credentials (Test Mode)
# In production, these should be strictly environment variables
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_S80jfkTufInNy7")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "YlZSWfNA1Zhe20O17QQ25MqQ")


class PaymentService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = PaymentRepository()
        self.order_repo = OrderRepository()
        self.user_repo = UserRepository()
        self.notification_service = NotificationService(db)  # ADD THIS
        self.email_service = EmailService(db_session=db)  # Initialize email service
    
    def initiate_payment(self, payment_data: PaymentInitiateRequest, user_id: int) -> Dict[str, Any]:
        """Initiate a payment for an order"""
        order = self.order_repo.get_order_by_id(self.db, payment_data.order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.payment_status == "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order already paid"
            )
        
        
        # Create payment record
        payment_data_dict = {
            "user_id": user_id,
            "order_id": payment_data.order_id,
            "payment_method": payment_data.payment_method,
            "amount_paid": order.total_amount,
            "payment_status": "PENDING",
            "transaction_reference": f"txn_{datetime.now().timestamp()}"
        }
        
        payment = self.repository.create_payment(self.db, payment_data_dict)
        
        # ============================================
        # SEND NOTIFICATION FOR PAYMENT INITIATION
        # ============================================
        try:
            self._send_payment_initiation_notifications(payment, order, user_id)
        except Exception as notif_error:
            print(f"⚠️ Payment initiation notification failed: {notif_error}")
        
        # For online payments, generate payment gateway data
        if payment_data.payment_method.upper() in ["ONLINE", "RAZORPAY"]:
            try:
                client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
                
                # Create Razorpay Order
                data = {
                    "amount": int(float(order.total_amount) * 100),  # Amount in paise
                    "currency": "INR",
                    "receipt": f"order_rcptid_{order.order_id}",
                    "payment_capture": 1
                }
                
                razorpay_order = client.order.create(data=data)
                razorpay_order_id = razorpay_order['id']
                
                # Update payment with razorpay order id reference
                payment.transaction_reference = razorpay_order_id
                self.db.commit()
                
                return {
                    "payment_id": payment.payment_id,
                    "order_id": payment.order_id,
                    "amount": float(payment.amount_paid),
                    "currency": "INR",
                    "razorpay_order_id": razorpay_order_id,
                    "key": RAZORPAY_KEY_ID,
                    "name": "Nexora",
                    "description": f"Payment for Order #{order.order_id}",
                    "prefill": {
                        "email": self.user_repo.get_user_by_id(self.db, user_id).email,
                        "contact": self.user_repo.get_user_by_id(self.db, user_id).phone or ""
                    }
                }
            except Exception as e:
                print(f"Razorpay Error: {e}")
                # Fallback or re-raise
                raise HTTPException(status_code=500, detail=f"Payment gateway error: {str(e)}")

        else:
            # For COD, return success immediately (but frontend needs to know it's COD)
            return {
                "payment_id": payment.payment_id,
                "order_id": payment.order_id,
                "amount": float(payment.amount_paid),
                "currency": "INR",
                "method": "COD",
                "message": "Cash on Delivery initiated"
            }

    def confirm_payment(self, payment_id: str, payment_data: dict):
        payment = self.repository.get_payment_by_id(self.db, payment_id)

        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")

        if payment.payment_status == "PAID":
            return {
                "message": "Payment already confirmed",
                "payment_id": payment_id,
                "status": "PAID"
            }

        # Store old status for notification
        old_status = payment.payment_status
        
        updated_payment = self.repository.confirm_payment(self.db, payment_id, payment_data)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR PAYMENT CONFIRMATION
        # ============================================
        try:
            # Get order details
            order = self.order_repo.get_order_by_id(self.db, payment.order_id)
            if not order:
                return {
                    "message": "Payment confirmed successfully",
                    "payment_id": updated_payment.payment_id,
                    "status": updated_payment.payment_status,
                    "transaction_reference": updated_payment.transaction_reference
                }
            
            # Get customer details
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Customer"
            
            # Get payment method details
            payment_method_display = {
                "RAZORPAY": "Online Payment (Razorpay)",
                "STRIPE": "Online Payment (Stripe)",
                "COD": "Cash on Delivery",
                "WALLET": "Wallet Payment",
                "BANK_TRANSFER": "Bank Transfer"
            }.get(payment.payment_method, payment.payment_method)
            
            # 1. Send email to customer (c)
            customer_subject = "✅ Payment Confirmed Successfully"
            customer_message = f"""
Dear {customer_name},

Great news! Your payment has been confirmed successfully.

Payment Details:
- Payment ID: #{payment.payment_id}
- Order ID: #{order.order_id}
- Payment Method: {payment_method_display}
- Amount: ${payment.amount_paid:.2f if hasattr(payment.amount_paid, '__float__') else 0.0}
- Transaction Reference: {updated_payment.transaction_reference}
- Status: {old_status} → CONFIRMED
- Confirmed At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Items: {len(order.items) if hasattr(order, 'items') else 'Multiple'} items

What's Next?
1. Your order will now be processed
2. You'll receive shipping updates
3. Track your order from your account

Thank you for your payment. Your order is now being processed.

Best regards,
Payment Support Team
"""
            self.email_service.send_to_user_by_id(customer.user_id, customer_subject, customer_message)
            
            # 2. Send email to all admins (a)
            admin_subject = f"💰 Payment Confirmed - Order #{order.order_id}"
            admin_message = f"""
PAYMENT CONFIRMATION NOTIFICATION

Payment Details:
- Payment ID: #{payment.payment_id}
- Order ID: #{order.order_id}
- Customer: {customer_name} (ID: {order.user_id})
- Payment Method: {payment.payment_method}
- Amount: ${payment.amount_paid:.2f if hasattr(payment.amount_paid, '__float__') else 0.0}
- Transaction Reference: {updated_payment.transaction_reference}
- Previous Status: {old_status}
- New Status: CONFIRMED
- Confirmed At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Order Details:
- Order Amount: ${order.total_amount:.2f if hasattr(order.total_amount, '__float__') else 0.0}
- Order Date: {order.placed_at.strftime('%Y-%m-%d %H:%M:%S') if order.placed_at else 'N/A'}
- Payment Status: PAID

NEXT ACTION REQUIRED:
1. Process order for fulfillment
2. Update inventory if needed
3. Prepare for shipping

Customer has been notified about the payment confirmation.

Best regards,
Payment Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            
        except Exception as email_error:
            # Don't fail payment confirmation if email fails
            print(f"⚠️ Email sending failed but payment was confirmed: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR PAYMENT CONFIRMATION
        # ============================================
        try:
            order = self.order_repo.get_order_by_id(self.db, payment.order_id)
            if order:
                customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                if customer:
                    self._send_payment_confirmation_notifications(payment, order, customer, old_status)
        except Exception as notif_error:
            print(f"⚠️ Payment confirmation notification failed: {notif_error}")
        
        return {
            "message": "Payment confirmed successfully",
            "payment_id": updated_payment.payment_id,
            "status": updated_payment.payment_status,
            "transaction_reference": updated_payment.transaction_reference
        }


    # ===========================
    # GET PAYMENT STATUS
    # ===========================
    def get_payment_status(self, payment_id: str):
        status = self.repository.get_payment_status(self.db, payment_id)

        if not status:
            raise HTTPException(status_code=404, detail="Payment not found")

        return {
            "payment_id": payment_id,
            "status": status
        }

    def verify_payment(self, verify_data: PaymentVerifyRequest, user_id: int) -> Dict[str, Any]:
        """Verify payment completion"""
        payment = self.repository.get_payment_by_id(self.db, verify_data.payment_id)
        if not payment or payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Verify with Razorpay
        try:
            # Check signature
            # razorpay_payment_id, razorpay_order_id, razorpay_signature
            params_dict = {
                'razorpay_order_id': verify_data.razorpay_order_id,
                'razorpay_payment_id': verify_data.razorpay_payment_id,
                'razorpay_signature': verify_data.razorpay_signature
            }
            
            client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
            client.utility.verify_payment_signature(params_dict)
            
            is_valid = True
        except Exception as e:
            print(f"Razorpay Verification Failed: {e}")
            is_valid = False
            
        
        if is_valid:
            # Store old status for notification
            old_status = payment.payment_status
            
            payment.payment_status = "PAID"
            payment.transaction_reference = verify_data.razorpay_payment_id
            
            # Update order status
            order = self.order_repo.get_order_by_id(self.db, payment.order_id)
            if order:
                order.payment_status = "PAID"
            
            self.db.commit()
            
            # ============================================
            # AUTOMATIC DELIVERY CREATION (For Paid Orders)
            # ============================================
            try:
                # Check if delivery exists
                from repositories.delivery_repository import DeliveryRepository
                delivery_repo = DeliveryRepository()
                existing_delivery = delivery_repo.get_delivery_by_order_id(self.db, payment.order_id)
                
                current_time = datetime.now()
                
                if not existing_delivery:
                    delivery_data = {
                        "order_id": payment.order_id,
                        "status": "AVAILABLE",
                        "available_since": current_time,
                        "is_available": True
                    }
                    delivery = Delivery(**delivery_data)
                    self.db.add(delivery)
                    self.db.commit()
                    # print(f"✅ Delivery created for paid order #{payment.order_id}")
                else:
                    # Make it available if not already
                    if not existing_delivery.is_available:
                        existing_delivery.status = "AVAILABLE"
                        existing_delivery.is_available = True
                        existing_delivery.available_since = current_time
                        self.db.add(existing_delivery)
                        self.db.commit()
            except Exception as e:
                print(f"Failed to create/update delivery after payment: {e}")
            
            # ============================================
            # SEND NOTIFICATIONS FOR PAYMENT VERIFICATION
            # ============================================
            try:
                if order:
                    customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                    if customer:
                        self._send_payment_verification_notifications(payment, order, customer, old_status)
            except Exception as notif_error:
                print(f"⚠️ Payment verification notification failed: {notif_error}")
            
            return {
                "payment_id": payment.payment_id,
                "status": "SUCCESS",
                "message": "Payment verified successfully"
            }
        else:
            payment.payment_status = "FAILED"
            self.db.commit()
            
            # Send notification for payment failure
            try:
                order = self.order_repo.get_order_by_id(self.db, payment.order_id)
                if order:
                    customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                    if customer:
                        self._send_payment_failure_notifications(payment, order, customer)
            except Exception as notif_error:
                print(f"⚠️ Payment failure notification failed: {notif_error}")
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment verification failed"
            )
    
    def get_user_payments(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all payments for a user"""
        result = self.repository.get_payments_by_user_id(self.db, user_id, page, per_page)
        
        payments_data = [
            self._serialize_payment(payment) for payment in result["payments"]
        ]
        
        return {
            "payments": payments_data,
            "total_payments": result["total_payments"],
            "total_pages": result["total_pages"]
        }
    
    def get_payment_by_id(self, payment_id: int, user_id: int, is_admin: bool = False) -> Dict[str, Any]:
        """Get payment details by ID"""
        payment = self.repository.get_payment_by_id(self.db, payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        if not is_admin and payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return self._serialize_payment(payment)
    
    def get_all_payments(self, page: int = 1, per_page: int = 20, 
                         status: Optional[str] = None, method: Optional[str] = None,
                         from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get all payments with filters"""
        result = self.repository.get_all_payments(self.db, page, per_page, status, method, from_date, to_date)
        
        payments_data = [
            self._serialize_payment(payment) for payment in result["payments"]
        ]
        
        return {
            "payments": payments_data,
            "total_payments": result["total_payments"],
            "total_pages": result["total_pages"]
        }

    def get_payment_summary(self) -> Dict[str, Any]:
        """Get aggregated payment metrics"""
        return self.repository.get_payment_summary(self.db)
    
    def update_payment_status(self, payment_id: int, status: str) -> Dict[str, Any]:
        """Update payment status"""
        # Get payment before update
        payment = self.repository.get_payment_by_id(self.db, payment_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Store old status for notification
        old_status = payment.payment_status
        
        updated_payment = self.repository.update_payment_status(self.db, payment_id, status)
        if not updated_payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # ============================================
        # SEND NOTIFICATIONS FOR PAYMENT STATUS UPDATE
        # ============================================
        try:
            order = self.order_repo.get_order_by_id(self.db, payment.order_id)
            if order:
                customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                if customer:
                    self._send_payment_status_update_notifications(payment, order, customer, old_status, status)
        except Exception as notif_error:
            print(f"⚠️ Payment status update notification failed: {notif_error}")
        
        return self._serialize_payment(updated_payment)
    
    def get_payment_for_refund(self, order_id: int):
        """Get payment details for refund processing"""
        payment = self.repository.get_payment_by_order_id(self.db, order_id)
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found or not paid"
            )
        
        # Check if payment method supports refunds
        if payment.payment_method == "COD":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="COD payments cannot be refunded"
            )
        
        return payment
    
    def process_refund_payment(self, payment_id: int, refund_amount: Decimal) -> Dict[str, Any]:
        """Process refund through payment gateway"""
        payment = self.repository.get_payment_by_id(self.db, payment_id)
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        if payment.payment_status != "PAID":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment is not completed"
            )
        
        if refund_amount > payment.amount_paid - payment.amount_refunded:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Refund amount exceeds available balance"
            )
        
        # Process refund based on payment method
        try:
            if payment.payment_method in ["RAZORPAY", "STRIPE"]:
                # Integrate with actual payment gateway
                refund_result = self._process_gateway_refund(payment, refund_amount)
            else:
                # For other methods like wallet, bank transfer
                refund_result = self._process_manual_refund(payment, refund_amount)
            
            # Update payment refund amount
            self.repository.update_payment_refund_amount(self.db, payment_id, refund_amount)
            
            # ============================================
            # SEND NOTIFICATIONS FOR PAYMENT REFUND
            # ============================================
            try:
                order = self.order_repo.get_order_by_id(self.db, payment.order_id)
                if order:
                    customer = self.user_repo.get_user_by_id(self.db, order.user_id)
                    if customer:
                        self._send_payment_refund_notifications(payment, order, customer, refund_amount, refund_result)
            except Exception as notif_error:
                print(f"⚠️ Payment refund notification failed: {notif_error}")
            
            return {
                "success": True,
                "transaction_id": refund_result.get("transaction_id"),
                "refund_amount": float(refund_amount),
                "remaining_balance": float(payment.amount_paid - payment.amount_refunded - refund_amount)
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Refund processing failed: {str(e)}"
            )
    
    def get_payment_refund_status(self, payment_id: int) -> Dict[str, Any]:
        """Get refund status and history for a payment"""
        payment = self.repository.get_payment_by_id(self.db, payment_id)
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
        # Get refund history from OrderRefund table
        from models.order.order_refund import OrderRefund
        refunds = self.db.query(OrderRefund).filter(OrderRefund.payment_id == payment_id).all()
        
        refund_history = []
        for refund in refunds:
            refund_history.append({
                "refund_id": refund.refund_id,
                "amount": float(refund.amount),
                "status": refund.status,
                "processed_at": refund.processed_at
            })
        
        return {
            "payment_id": payment.payment_id,
            "total_paid": float(payment.amount_paid),
            "total_refunded": float(payment.amount_refunded),
            "available_for_refund": float(payment.amount_paid - payment.amount_refunded),
            "refund_history": refund_history
        }
    
    def _process_gateway_refund(self, payment, refund_amount: Decimal) -> Dict[str, Any]:
        """Process refund through payment gateway (Razorpay/Stripe)"""
        # This is a placeholder - implement actual gateway integration
        # For Razorpay:
        # client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        # refund = client.payment.refund(payment.transaction_reference, {"amount": int(refund_amount * 100)})
        
        return {
            "transaction_id": f"REF_{payment.transaction_reference}_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "processed"
        }
    
    def _process_manual_refund(self, payment, refund_amount: Decimal) -> Dict[str, Any]:
        """Process manual refund (bank transfer, wallet credit, etc.)"""
        return {
            "transaction_id": f"MANUAL_REF_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "processed"
        }
    
    def _serialize_payment(self, payment) -> Dict[str, Any]:
        """Serialize payment data"""
        return {
            "payment_id": payment.payment_id,
            "payment_method": payment.payment_method,
            "payment_status": payment.payment_status,
            "amount_paid": float(payment.amount_paid),
            "transaction_reference": payment.transaction_reference,
            "payment_date": payment.payment_date,
            "order_id": payment.order_id,
            "user_id": payment.user_id,
            "user_name": f"{payment.user.first_name} {payment.user.last_name}" if payment.user else "Unknown"
        }
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_payment_initiation_notifications(self, payment, order, user_id: int):
        """Send notifications when payment is initiated"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            if not customer:
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Payment method display name
            payment_method_display = {
                "RAZORPAY": "Razorpay",
                "STRIPE": "Stripe",
                "COD": "Cash on Delivery",
                "WALLET": "Wallet",
                "BANK_TRANSFER": "Bank Transfer"
            }.get(payment.payment_method, payment.payment_method)
            
            # 1. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="💰 Payment Initiated",
                message=f"Payment #{payment.payment_id} initiated for Order #{order.order_id}. Method: {payment_method_display}, Amount: ${payment.amount_paid:.2f}",
                type="PAYMENT",
                reference_id=payment.payment_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="💰 Payment Initiated",
                    message=f"Payment #{payment.payment_id} initiated by {customer_name} for Order #{order.order_id}. Method: {payment_method_display}, Amount: ${payment.amount_paid:.2f}",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment initiation notifications: {e}")

    def _send_payment_confirmation_notifications(self, payment, order, customer, old_status: str):
        """Send notifications when payment is confirmed"""
        try:
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Payment method display name
            payment_method_display = {
                "RAZORPAY": "Razorpay",
                "STRIPE": "Stripe",
                "COD": "Cash on Delivery",
                "WALLET": "Wallet",
                "BANK_TRANSFER": "Bank Transfer"
            }.get(payment.payment_method, payment.payment_method)
            
            # 1. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="✅ Payment Confirmed",
                message=f"Payment #{payment.payment_id} for Order #{order.order_id} has been confirmed. Amount: ${payment.amount_paid:.2f}, Reference: {payment.transaction_reference}",
                type="PAYMENT",
                reference_id=payment.payment_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="✅ Payment Confirmed",
                    message=f"Payment #{payment.payment_id} for Order #{order.order_id} (Customer: {customer_name}) confirmed. Method: {payment_method_display}, Amount: ${payment.amount_paid:.2f}",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment confirmation notifications: {e}")

    def _send_payment_verification_notifications(self, payment, order, customer, old_status: str):
        """Send notifications when payment is verified"""
        try:
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Status emoji mapping
            emoji = "✅" if payment.payment_status == "PAID" else "⚠️"
            
            # 1. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title=f"{emoji} Payment Verified",
                message=f"Payment #{payment.payment_id} for Order #{order.order_id} has been verified and marked as PAID.",
                type="PAYMENT",
                reference_id=payment.payment_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{emoji} Payment Verified",
                    message=f"Payment #{payment.payment_id} for Order #{order.order_id} (Customer: {customer_name}) verified. Status: {old_status} → {payment.payment_status}",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment verification notifications: {e}")

    def _send_payment_failure_notifications(self, payment, order, customer):
        """Send notifications when payment fails"""
        try:
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # 1. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="❌ Payment Failed",
                message=f"Payment #{payment.payment_id} for Order #{order.order_id} has failed. Please try again or contact support.",
                type="PAYMENT",
                reference_id=payment.payment_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="❌ Payment Failed",
                    message=f"Payment #{payment.payment_id} for Order #{order.order_id} (Customer: {customer_name}) has failed. Amount: ${payment.amount_paid:.2f}",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment failure notifications: {e}")

    def _send_payment_status_update_notifications(self, payment, order, customer, old_status: str, new_status: str):
        """Send notifications when payment status is updated"""
        try:
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Status emoji mapping
            status_emojis = {
                "PENDING": "⏳",
                "PROCESSING": "🔄",
                "PAID": "✅",
                "FAILED": "❌",
                "REFUNDED": "💰",
                "PARTIALLY_REFUNDED": "💸"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # 1. Send notification to customer (if status changed to PAID or FAILED)
            if new_status in ["PAID", "FAILED", "REFUNDED"]:
                self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title=f"{new_emoji} Payment Status Updated",
                    message=f"Payment #{payment.payment_id} status changed from {old_status} to {new_status}.",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{new_emoji} Payment Status Updated",
                    message=f"Payment #{payment.payment_id} for Order #{order.order_id} (Customer: {customer_name}) status changed from {old_status} to {new_status}.",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment status update notifications: {e}")

    def _send_payment_refund_notifications(self, payment, order, customer, refund_amount: Decimal, refund_result: Dict[str, Any]):
        """Send notifications when payment is refunded"""
        try:
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # 1. Send notification to customer
            self.notification_service.send_notification(
                user_id=customer.user_id,
                title="💰 Payment Refunded",
                message=f"Refund processed for Payment #{payment.payment_id}. Amount: ${refund_amount:.2f}, Transaction ID: {refund_result.get('transaction_id')}",
                type="PAYMENT",
                reference_id=payment.payment_id
            )
            
            # 2. Send notifications to admin users
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="💰 Payment Refunded",
                    message=f"Refund processed for Payment #{payment.payment_id} (Order #{order.order_id}, Customer: {customer_name}). Amount: ${refund_amount:.2f}, Status: {refund_result.get('status')}",
                    type="PAYMENT",
                    reference_id=payment.payment_id
                )
                
        except Exception as e:
            print(f"⚠️ Failed to send payment refund notifications: {e}")