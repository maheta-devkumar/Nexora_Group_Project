from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.payment_service import PaymentService
from schemas.payment_schema import PaymentInitiateRequest, PaymentVerifyRequest
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, Optional

class PaymentController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = PaymentService(db)
    
    def initiate_payment(self, payment_data: PaymentInitiateRequest, user_id: int) -> Dict[str, Any]:
        """Initiate payment for an order"""
        try:
            return self.service.initiate_payment(payment_data, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def verify_payment(self, verify_data: PaymentVerifyRequest, user_id: int) -> Dict[str, Any]:
        """Verify payment completion"""
        try:
            return self.service.verify_payment(verify_data, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_payments(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all payments for a user"""
        try:
            return self.service.get_user_payments(user_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_payment_by_id(self, payment_id: int, user_id: int, is_admin: bool = False) -> Dict[str, Any]:
        """Get payment details by ID"""
        try:
            return self.service.get_payment_by_id(payment_id, user_id, is_admin)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_payments(self, page: int = 1, per_page: int = 20, 
                         status: Optional[str] = None, method: Optional[str] = None,
                         from_date: Optional[datetime] = None, to_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Get all payments with filters"""
        try:
            return self.service.get_all_payments(page, per_page, status, method, from_date, to_date)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
            
    def get_payment_summary(self) -> Dict[str, Any]:
        """Get payment summary metrics"""
        try:
            return self.service.get_payment_summary()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_payment_status(self, payment_id: int, status: str) -> Dict[str, Any]:
        """Update payment status"""
        try:
            return self.service.update_payment_status(payment_id, status)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_payment_for_refund(self, order_id: int):
        """Get payment details for refund processing"""
        try:
            return self.service.get_payment_for_refund(order_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def process_refund_payment(self, payment_id: int, refund_amount: Decimal) -> Dict[str, Any]:
        """Process refund through payment gateway"""
        try:
            return self.service.process_refund_payment(payment_id, refund_amount)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_payment_refund_status(self, payment_id: int) -> Dict[str, Any]:
        """Get refund status for a payment"""
        try:
            return self.service.get_payment_refund_status(payment_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def confirm_payment(self, payment_id: str, payment_data: dict):
        try:
            return self.service.confirm_payment(payment_id, payment_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


    def get_payment_status(self, payment_id: str):
        try:
            return self.service.get_payment_status(payment_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))