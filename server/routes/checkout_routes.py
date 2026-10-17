from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from controllers.checkout_controller import CheckoutController
from schemas.checkout_schema import ConfirmCheckoutRequest
from config.dependencies import get_current_user  # your auth function

router = APIRouter(prefix="/api/v1/checkout", tags=["Checkout"])

@router.get("/initiate/{address_id}")
def initiate_checkout(address_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return CheckoutController.initiate_checkout(user.user_id, address_id, db)

@router.post("/confirm")
def confirm_checkout(data: ConfirmCheckoutRequest, db: Session = Depends(get_db), user=Depends(get_current_user)):
    return CheckoutController.confirm_checkout(user.user_id, data, db)
