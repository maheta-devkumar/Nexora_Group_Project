from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.delivery_admin_controller import DeliveryAdminController
from schemas.delivery_admin_schema import *

router = APIRouter(prefix="/api/v1/delivery-admin", tags=["Admin Delivery"])


# EXISTING ROUTES (Preserved exactly as they were)
@router.post("/assign")
def assign(payload: AssignDeliverySchema, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).assignDeliveryPerson(payload.order_id, payload.delivery_person_id)


@router.get("/overview")
def overview(db: Session = Depends(get_db), admin=Depends(is_admin)):
    """Optimized dashboard overview"""
    return DeliveryAdminController(db).getOverview()


@router.get("/all")
def all_deliveries(db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getAllDeliveries()


@router.get("/stats")
def stats(db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getDeliveryStats()


@router.patch("/{delivery_id}/status")
def update_status(delivery_id: int, payload: UpdateDeliveryStatusSchema, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).updateDeliveryStatus(delivery_id, payload.status)


@router.put("/reassign")
def reassign(payload: ReassignDeliverySchema, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).reassignDeliveryPerson(payload.delivery_id, payload.new_delivery_person_id)


@router.get("/earnings")
def earnings(db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getDeliveryEarnings()


@router.get("/performance")
def performance(db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getDeliveryPersonPerformance()


@router.post("/search")
def search(payload: SearchDeliverySchema, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).searchDeliveries(payload.dict())


@router.get("/{delivery_id}/timeline")
def timeline(delivery_id: int, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getDeliveryTimeline(delivery_id)


@router.delete("/{delivery_id}")
def cancel(delivery_id: int, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).cancelDelivery(delivery_id)


@router.post("/{delivery_id}/validate")
def validate(delivery_id: int, db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).validateDeliveryCompletion(delivery_id)


@router.get("/issues")
def issues(db: Session = Depends(get_db), admin=Depends(is_admin)):
    return DeliveryAdminController(db).getDeliveryIssues()
    
# NEW ROUTES for ADMIN ONLY (4 essential ones)
@router.post("/webhook/order-created")
def handle_order_created_webhook(
    payload: OrderWebhookSchema, 
    db: Session = Depends(get_db), 
    admin=Depends(is_admin)
):
    """Webhook for order creation - create delivery in pool & auto-send notifications"""
    return DeliveryAdminController(db).handleOrderCreatedWebhook(payload.dict())


@router.get("/available-delivery-persons")
def get_available_delivery_persons(db: Session = Depends(get_db), admin=Depends(is_admin)):
    """Get available delivery persons (admin view)"""
    return DeliveryAdminController(db).getAvailableDeliveryPersons()


@router.get("/delivery-pool")
def get_delivery_pool(db: Session = Depends(get_db), admin=Depends(is_admin)):
    """Get available deliveries in pool (admin view)"""
    return DeliveryAdminController(db).getDeliveryPool()


@router.post("/notify-delivery-person")
def notify_delivery_person(
    payload: NotificationSchema, 
    db: Session = Depends(get_db), 
    admin=Depends(is_admin)
):
    """Admin manually sends notification to specific delivery person"""
    return DeliveryAdminController(db).notifyDeliveryPerson(payload.dict())

@router.post("/{delivery_id}/cancel")
def cancel_delivery_admin(
    delivery_id: int,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin cancels delivery (makes it available again)"""
    return DeliveryAdminController(db).cancelDeliveryAdmin(delivery_id)