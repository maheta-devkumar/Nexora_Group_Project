from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from config.dependencies import (
    get_db, 
    get_current_user, 
    is_admin, 
    is_delivery_person, 
    get_delivery_person_or_none
)

# Import both controllers
from controllers.delivery_controller import DeliveryController
from controllers.delivery_admin_controller import DeliveryAdminController
from controllers.delivery_panel.delivery_available_controller import DeliveryAvailableController

# Import all schemas
from schemas.delivery_schema import (
    DeliveryWrapper, 
    DeliveryListWrapper, 
    DeliveryPersonListWrapper,
    DeliveryEarningsWrapper, 
    MessageWrapper, 
    DeliveryStatusUpdate
)

from schemas.delivery_admin_schema import *
from schemas.delivery_panel.delivery_available_schema import *
from pydantic import BaseModel

# Import models
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery import Delivery
from models.order.order import Order

router = APIRouter(prefix="/api/v1/delivery", tags=["Delivery"])

# ====================
# ADMIN ENDPOINTS - NEW AUTO ASSIGNMENT ROUTES
# ====================

@router.post("/admin/webhook/order-created")
def handle_order_created_webhook(
    payload: OrderWebhookSchema, 
    db: Session = Depends(get_db), 
    admin=Depends(is_admin)
):
    """Admin: Webhook for order creation - create delivery in pool & auto-send notifications"""
    return DeliveryAdminController(db).handleOrderCreatedWebhook(payload.dict())


@router.get("/admin/available-delivery-persons")
def get_available_delivery_persons(db: Session = Depends(get_db), admin=Depends(is_admin)):
    """Admin: Get available delivery persons (admin view)"""
    return DeliveryAdminController(db).getAvailableDeliveryPersons()


@router.get("/admin/delivery-pool")
def get_delivery_pool(db: Session = Depends(get_db), admin=Depends(is_admin)):
    """Admin: Get available deliveries in pool (admin view)"""
    return DeliveryAdminController(db).getDeliveryPool()


@router.post("/admin/notify-delivery-person")
def notify_delivery_person(
    payload: NotificationSchema, 
    db: Session = Depends(get_db), 
    admin=Depends(is_admin)
):
    """Admin: Manually send notification to specific delivery person"""
    return DeliveryAdminController(db).notifyDeliveryPerson(payload.dict())


@router.post("/admin/{delivery_id}/cancel")
def cancel_delivery_admin(
    delivery_id: int,
    db: Session = Depends(get_db),
    admin=Depends(is_admin)
):
    """Admin: Cancel delivery (makes it available again)"""
    return DeliveryAdminController(db).cancelDeliveryAdmin(delivery_id)


# ====================
# ADMIN ENDPOINTS - EXISTING DELIVERY MANAGEMENT
# ====================

@router.post("/admin/assign")
def admin_assign_delivery(
    payload: AssignDeliverySchema, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Assign delivery person to order"""
    return DeliveryAdminController(db).assignDeliveryPerson(
        payload.order_id, 
        payload.delivery_person_id
    )


@router.get("/admin/overview")
def admin_delivery_overview(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get optimized delivery overview"""
    return DeliveryAdminController(db).getOverview()


@router.get("/admin/all")
def admin_all_deliveries(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Admin: Get all deliveries"""
    # Using the admin controller for detailed admin view
    if page == 1 and per_page == 20 and not status:
        # Original admin endpoint
        return DeliveryAdminController(db).getAllDeliveries()
    else:
        # Using delivery controller for paginated response
        controller = DeliveryController(db)
        deliveries = controller.get_all_deliveries(page, per_page, status)
        return {
            "success": True,
            "message": "Deliveries retrieved successfully",
            "data": deliveries["deliveries"]
        }


@router.get("/admin/stats")
def admin_delivery_stats(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get delivery statistics"""
    return DeliveryAdminController(db).getDeliveryStats()


@router.patch("/admin/{delivery_id}/status")
def admin_update_delivery_status(
    delivery_id: int, 
    payload: UpdateDeliveryStatusSchema, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Update delivery status"""
    return DeliveryAdminController(db).updateDeliveryStatus(
        delivery_id, 
        payload.status
    )


@router.put("/admin/reassign")
def admin_reassign_delivery(
    payload: ReassignDeliverySchema, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Reassign delivery person"""
    return DeliveryAdminController(db).reassignDeliveryPerson(
        payload.delivery_id, 
        payload.new_delivery_person_id
    )


@router.get("/admin/earnings")
def admin_delivery_earnings(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get delivery earnings overview"""
    return DeliveryAdminController(db).getDeliveryEarnings()


@router.get("/admin/performance")
def admin_delivery_performance(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get delivery person performance metrics"""
    return DeliveryAdminController(db).getDeliveryPersonPerformance()


@router.post("/admin/search")
def admin_search_deliveries(
    payload: SearchDeliverySchema, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Search deliveries"""
    return DeliveryAdminController(db).searchDeliveries(payload.dict())


@router.get("/admin/{delivery_id}/timeline")
def admin_delivery_timeline(
    delivery_id: int, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get delivery timeline"""
    return DeliveryAdminController(db).getDeliveryTimeline(delivery_id)


@router.delete("/admin/{delivery_id}")
def admin_cancel_delivery(
    delivery_id: int, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Cancel delivery"""
    return DeliveryAdminController(db).cancelDelivery(delivery_id)


@router.post("/admin/{delivery_id}/validate")
def admin_validate_delivery(
    delivery_id: int, 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Validate delivery completion"""
    return DeliveryAdminController(db).validateDeliveryCompletion(delivery_id)


@router.get("/admin/issues")
def admin_delivery_issues(
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Get delivery issues"""
    return DeliveryAdminController(db).getDeliveryIssues()


@router.get("/admin/persons", response_model=DeliveryPersonListWrapper)
def admin_get_all_delivery_persons(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Admin: Get all delivery persons"""
    from controllers.delivery_person_controller import DeliveryPersonController
    controller = DeliveryPersonController(db)
    delivery_persons = controller.get_all_delivery_persons(page, per_page)
    return {
        "success": True,
        "message": "Delivery persons retrieved successfully",
        "data": delivery_persons["delivery_persons"]
    }

# ====================
# DELIVERY PERSON ENDPOINTS - EXISTING
# ====================

@router.get("/my-orders", response_model=DeliveryListWrapper)
def delivery_person_my_orders(
    delivery_person: DeliveryPerson = Depends(get_delivery_person_or_none),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Delivery Person: Get assigned orders"""
    try:
        if not delivery_person:
            # Return empty list if user is not a delivery person
            return {
                "success": True,
                "message": "No assigned orders found",
                "data": []
            }
        
        if delivery_person.status != "ACTIVE":
            raise HTTPException(
                status_code=403, 
                detail="Your delivery account is not active. Please contact admin."
            )
        
        controller = DeliveryController(db)
        orders = controller.get_delivery_person_orders(
            delivery_person.delivery_person_id, 
            page, 
            per_page
        )
        return {
            "success": True,
            "message": "Assigned orders retrieved successfully",
            "data": orders["deliveries"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-earnings", response_model=DeliveryEarningsWrapper)
def delivery_person_my_earnings(
    delivery_person: DeliveryPerson = Depends(get_delivery_person_or_none),
    db: Session = Depends(get_db)
):
    """Delivery Person: Get earnings summary"""
    try:
        if not delivery_person:
            # Return zero earnings if user is not a delivery person
            return {
                "success": True,
                "message": "Earnings retrieved successfully",
                "data": {
                    "total_earnings": 0.0,
                    "completed_deliveries": 0,
                    "pending_earnings": 0.0,
                    "current_month_earnings": 0.0
                }
            }
        
        controller = DeliveryController(db)
        earnings = controller.get_delivery_person_earnings(
            delivery_person.delivery_person_id
        )
        return {
            "success": True,
            "message": "Earnings retrieved successfully",
            "data": earnings
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{delivery_id}/status", response_model=DeliveryWrapper)
def delivery_person_update_status(
    delivery_id: int,
    status_update: DeliveryStatusUpdate,
    delivery_person: DeliveryPerson = Depends(is_delivery_person),
    db: Session = Depends(get_db)
):
    """Delivery Person: Update delivery status"""
    controller = DeliveryController(db)
    delivery = controller.update_delivery_status(
        delivery_id, 
        status_update.status, 
        delivery_person.delivery_person_id
    )
    return {
        "success": True,
        "message": "Delivery status updated successfully",
        "data": delivery
    }


@router.get("/available", response_model=DeliveryListWrapper)
def get_available_deliveries(
    db: Session = Depends(get_db),
    # delivery_person: DeliveryPerson = Depends(is_delivery_person), # Maybe optional so they can see before auth? Keeping it secure.
    delivery_person: DeliveryPerson = Depends(get_delivery_person_or_none),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Delivery Person: Get available deliveries for pickup"""
    if not delivery_person:
         # For now allow seeing available if logged in as any user? No, restrict to DP or Admin.
         # Actually user rules say "Delivery Person sees deliveries".
         raise HTTPException(status_code=403, detail="Access denied")

    controller = DeliveryController(db)
    # Exposing the service method via controller (assuming controller just proxies)
    # We need to add these methods to DeliveryController too.
    # Result is dict with 'deliveries' list and 'total_deliveries'
    result = controller.service.get_available_deliveries(page, per_page)
    
    return {
        "success": True,
        "message": "Available deliveries retrieved",
        "data": result["deliveries"]
    }

@router.post("/{delivery_id}/accept", response_model=DeliveryWrapper)
def accept_delivery(
    delivery_id: int,
    delivery_person: DeliveryPerson = Depends(is_delivery_person),
    db: Session = Depends(get_db)
):
    """Delivery Person: Accept a delivery"""
    controller = DeliveryController(db)
    # Call service directly for now as Controller might not have wrapper yet
    delivery = controller.service.accept_delivery(delivery_id, delivery_person.delivery_person_id)
    return {
        "success": True,
        "message": "Delivery accepted successfully",
        "data": delivery
    }

@router.post("/{delivery_id}/confirm-pickup", response_model=DeliveryWrapper)
def confirm_pickup(
    delivery_id: int,
    delivery_person: DeliveryPerson = Depends(is_delivery_person),
    db: Session = Depends(get_db)
):
    """Delivery Person: Confirm pickup"""
    controller = DeliveryController(db)
    delivery = controller.service.confirm_pickup(delivery_id, delivery_person.delivery_person_id)
    return {
        "success": True,
        "message": "Pickup confirmed",
        "data": delivery
    }

class VerifyOtpSchema(BaseModel):
    otp: str

@router.post("/{delivery_id}/verify-otp", response_model=DeliveryWrapper)
def verify_delivery_otp(
    delivery_id: int,
    payload: VerifyOtpSchema,
    delivery_person: DeliveryPerson = Depends(is_delivery_person),
    db: Session = Depends(get_db)
):
    """Delivery Person: Verify OTP and Complete Delivery"""
    controller = DeliveryController(db)
    delivery = controller.service.verify_delivery_otp(delivery_id, payload.otp, delivery_person.delivery_person_id)
    return {
        "success": True,
        "message": "Delivery completed successfully",
        "data": delivery
    }


# ====================
# CUSTOMER ENDPOINTS
# ====================

@router.get("/track/{order_id}", response_model=DeliveryWrapper)
def customer_track_delivery(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Customer: Track delivery status"""
    try:
        # Get delivery for order
        delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
        if not delivery:
            raise HTTPException(status_code=404, detail="Delivery not found for this order")
        
        # Verify order belongs to user
        order = db.query(Order).filter(
            Order.order_id == order_id,
            Order.user_id == current_user.user_id
        ).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        controller = DeliveryController(db)
        delivery_data = controller.serialize_delivery(delivery, db)
        return {
            "success": True,
            "message": "Delivery tracking retrieved successfully",
            "data": delivery_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ====================
# LEGACY ENDPOINTS (for backward compatibility)
# ====================

@router.post("/assign/{order_id}", response_model=DeliveryWrapper)
def legacy_assign_delivery(
    order_id: int,
    delivery_person_id: int = Query(..., description="Delivery Person ID"),
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    """Admin: Assign delivery person to order (legacy endpoint)"""
    controller = DeliveryController(db)
    delivery = controller.assign_delivery_person(order_id, delivery_person_id)
    return {
        "success": True,
        "message": "Delivery person assigned successfully",
        "data": delivery
    }


@router.get("/all", response_model=DeliveryListWrapper)
def legacy_get_all_deliveries_admin(
    db: Session = Depends(get_db),
    admin = Depends(is_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None)
):
    """Admin: Get all deliveries (legacy endpoint)"""
    controller = DeliveryController(db)
    deliveries = controller.get_all_deliveries(page, per_page, status)
    return {
        "success": True,
        "message": "Deliveries retrieved successfully",
        "data": deliveries["deliveries"]
    }