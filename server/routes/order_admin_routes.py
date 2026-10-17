from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date

from config.database import get_db
from config.dependencies import is_admin
from controllers.order_admin_controller import OrderAdminController
from models.user import User

from schemas.order_admin_schema import (
    AdminOrderUpdateSchema,
    UpdateOrderItemQtySchema,
    AddOrderHistorySchema,
    RejectReturnSchema,
    UpdateRefundStatusSchema,
    AssignDeliverySchema,
    UpdateDeliveryPersonSchema,
    ResolveIssueSchema
)

router = APIRouter(
    prefix="/api/v1/admin/orders",
    tags=["Admin Orders"]
)

# ============================================================
# RETURNS - MUST BE BEFORE /{order_id} TO AVOID CONFLICT
# ============================================================

@router.get("/returns")
def list_all_returns(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).list_all_returns()


@router.get("/returns/{return_id}")
def get_return_request(
    return_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_return_request(return_id)


@router.get("/returns/{return_id}/items")
def get_return_items(
    return_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_return_items(return_id)


@router.patch("/returns/{return_id}/approve")
def approve_return(
    return_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).approve_return(return_id, admin.user_id)


@router.patch("/returns/{return_id}/reject")
def reject_return(
    return_id: int,
    payload: RejectReturnSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).reject_return(
        return_id, admin.user_id, payload.reason
    )


# ============================================================
# REFUNDS - ALSO BEFORE /{order_id} TO AVOID CONFLICT
# ============================================================

@router.get("/refunds")
def list_all_refunds(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).list_all_refunds()


@router.get("/refunds/{refund_id}")
def get_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_refund(refund_id)


@router.post("/returns/{return_id}/refund")
def create_refund(
    return_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).create_refund(return_id, admin.user_id)


@router.patch("/refunds/{refund_id}/status")
def update_refund_status(
    refund_id: int,
    payload: UpdateRefundStatusSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).update_refund_status(
        refund_id, payload.status, admin.user_id
    )


@router.post("/refunds/{refund_id}/retry")
def retry_refund(
    refund_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).retry_refund(refund_id, admin.user_id)


# ============================================================
# ORDERS – CORE
# ============================================================

@router.get("/")
def list_all_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_all_orders(page, per_page, status)


@router.get("/{order_id}")
def get_order_admin(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_admin(order_id)


@router.patch("/{order_id}")
def update_order_admin(
    order_id: int,
    payload: AdminOrderUpdateSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).update_order_admin(
        order_id, payload.model_dump(exclude_unset=True), admin.user_id
    )


@router.patch("/{order_id}/cancel")
def admin_cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).admin_cancel_order(order_id, admin.user_id)


@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).delete_order(order_id)


# ============================================================
# ORDER ITEMS
# ============================================================

@router.get("/{order_id}/items")
def get_order_items(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_items(order_id)


@router.patch("/{order_id}/items/{variant_id}")
def update_order_item_quantity(
    order_id: int,
    variant_id: int,
    payload: UpdateOrderItemQtySchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).update_order_item_qty(
        order_id, variant_id, payload.quantity
    )


@router.delete("/{order_id}/items/{variant_id}")
def remove_order_item(
    order_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).remove_order_item(order_id, variant_id)


# ============================================================
# ORDER HISTORY
# ============================================================

@router.get("/{order_id}/history")
def get_order_history(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_history(order_id)


@router.post("/{order_id}/history")
def add_order_history(
    order_id: int,
    payload: AddOrderHistorySchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).add_order_history(
        order_id, payload.status, admin.user_id
    )


# ============================================================
# DELIVERY
# ============================================================

@router.post("/{order_id}/assign-delivery")
def assign_delivery_person(
    order_id: int,
    payload: AssignDeliverySchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).assign_delivery(
        order_id, payload.delivery_user_id
    )


@router.patch("/{order_id}/delivery")
def update_delivery_person(
    order_id: int,
    payload: UpdateDeliveryPersonSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).update_delivery_person(
        order_id, payload.delivery_user_id
    )


@router.get("/{order_id}/delivery")
def get_delivery_details(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_delivery_details(order_id)


# ============================================================
# ISSUES & FEEDBACK
# ============================================================

@router.get("/{order_id}/issues")
def get_order_issues(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_issues(order_id)


# FIXED: Changed from "/issues/{issue_id}/resolve" to "/{order_id}/issues/{issue_id}/resolve"
@router.patch("/{order_id}/issues/{issue_id}/resolve")
def resolve_order_issue(
    order_id: int,
    issue_id: int,
    payload: ResolveIssueSchema,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).resolve_order_issue(
        issue_id, payload.resolution_note
    )


@router.get("/{order_id}/feedback")
def get_order_feedback(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_feedback(order_id)


# ============================================================
# DASHBOARD & FILTERS - CHANGED FROM "/stats" TO "/state" (ACCORDING TO IMAGE)
# ============================================================

@router.get("/state/overview")  # Changed from "/stats/overview"
def get_order_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_order_stats()


@router.get("/state/by-date")  # Changed from "/stats/by-date"
def get_orders_by_date(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_orders_by_date(start_date, end_date)


@router.get("/state/by-payment-status")  # Changed from "/stats/by-payment-status"
def get_orders_by_payment_status(
    payment_status: str,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_orders_by_payment_status(payment_status)


@router.get("/state/by-delivery-status")  # Changed from "/stats/by-delivery-status"
def get_orders_by_delivery_status(
    delivery_status: str,
    db: Session = Depends(get_db),
    admin: User = Depends(is_admin)
):
    return OrderAdminController(db).get_orders_by_delivery_status(delivery_status)