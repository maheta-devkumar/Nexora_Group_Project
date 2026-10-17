from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from services.checkout_service import CheckoutService
from schemas.checkout_schema import ConfirmCheckoutRequest

class CheckoutController:

    @staticmethod
    def initiate_checkout(user_id: int, address_id: int, db: Session):
        try:
            return CheckoutService.generate_checkout_summary(
                db=db,
                user_id=user_id,
                address_id=address_id
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def confirm_checkout(user_id: int, data: ConfirmCheckoutRequest, db: Session):
        try:
            return CheckoutService.confirm_order(
                db=db,
                user_id=user_id,
                data=data
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
