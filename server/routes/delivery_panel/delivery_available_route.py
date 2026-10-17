from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_available_controller import DeliveryAvailableController
from schemas.delivery_panel.delivery_available_schema import *

from models.delivery.delivery_person import DeliveryPerson

router = APIRouter(prefix="/api/v1/delivery_panel", tags=["Delivery Available"])


@router.get("/available", response_model=list[AvailableDeliveryResponse])
def get_available_deliveries(
    db: Session = Depends(get_db), 
    current_user = Depends(is_delivery_person)
):
    """Get available deliveries for delivery person"""
    return DeliveryAvailableController(db).get_available_deliveries_for_delivery_person()


@router.post("/available/{delivery_id}/accept")
def accept_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(is_delivery_person)
):
    """Accept delivery by delivery person"""
    
    delivery_person = db.query(DeliveryPerson).filter(
        DeliveryPerson.user_id == current_user.user_id
    ).first()
    
    if not delivery_person:
        from fastapi import HTTPException
        raise HTTPException(404, "Delivery person not found for this user")
    
    return DeliveryAvailableController(db).accept_delivery(delivery_id, delivery_person.delivery_person_id)


@router.post("/{delivery_id}/cancel")
def cancel_delivery(
    delivery_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(is_delivery_person)
):
    """Cancel delivery by delivery person"""
    
    delivery_person = db.query(DeliveryPerson).filter(
        DeliveryPerson.user_id == current_user.user_id
    ).first()
    
    if not delivery_person:
        from fastapi import HTTPException
        raise HTTPException(404, "Delivery person not found for this user")
    
    return DeliveryAvailableController(db).cancel_delivery(delivery_id, delivery_person.delivery_person_id)