from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from config.database import get_db
from services.order_admin_service import OrderAdminService
from typing import Dict, Any, List

class OrderAdminController:

    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = OrderAdminService(db)

    def get_all_orders(self, page: int, per_page: int, status: str | None):
        return self.service.get_all_orders(page, per_page, status)

    def get_order_admin(self, order_id: int):
        return self.service.get_order_admin(order_id)

    def update_order_admin(self, order_id: int, data: Dict[str, Any], admin_id: int):
        return self.service.update_order_admin(order_id, data, admin_id)

    def admin_cancel_order(self, order_id: int, admin_id: int):
        return self.service.admin_cancel_order(order_id, admin_id)

    def delete_order(self, order_id: int):
        return self.service.delete_order(order_id)

    def get_order_items(self, order_id: int):
        return self.service.get_order_items(order_id)

    def update_order_item_qty(self, order_id, variant_id, qty):
        return self.service.update_order_item_qty(
            order_id, variant_id, qty
        )

    def remove_order_item(self, order_id: int, variant_id: int):
        return self.service.remove_order_item(order_id, variant_id)

    def get_order_history(self, order_id: int):
        return self.service.get_order_history(order_id)

    def add_order_history(self, order_id, status, admin_id):
        return self.service.add_order_history(order_id, status, admin_id)

    def list_all_returns(self):
        return self.service.list_all_returns()

    def get_return_request(self, return_id: int):
        return self.service.get_return_request(return_id)

    def approve_return(self, return_id: int, admin_id: int):
        return self.service.approve_return(return_id, admin_id)

    def reject_return(self, return_id: int, admin_id: int, reason: str):
        return self.service.reject_return(return_id, admin_id, reason)

    def get_return_items(self, return_id: int):
        return self.service.get_return_items(return_id)

    def list_all_refunds(self):
        return self.service.list_all_refunds()

    def get_refund(self, refund_id: int):
        return self.service.get_refund(refund_id)

    def create_refund(self, return_id: int, admin_id: int):
        return self.service.create_refund(return_id, admin_id)

    def update_refund_status(self, refund_id: int, status: str, admin_id: int):
        return self.service.update_refund_status(refund_id, status, admin_id)

    def retry_refund(self, refund_id: int, admin_id: int):
        return self.service.retry_refund(refund_id, admin_id)

    def get_order_stats(self):
        return self.service.get_order_stats()

    def get_orders_by_date(self, start_date, end_date):
        return self.service.get_orders_by_date(start_date, end_date)

    def get_orders_by_payment_status(self, status: str):
        return self.service.get_orders_by_payment_status(status)

    def get_orders_by_delivery_status(self, status: str):
        return self.service.get_orders_by_delivery_status(status)

    # ADD THESE MISSING METHODS:
    def assign_delivery(self, order_id: int, delivery_user_id: int):
        return self.service.assign_delivery(order_id, delivery_user_id)

    def update_delivery_person(self, order_id: int, delivery_user_id: int):
        return self.service.update_delivery_person(order_id, delivery_user_id)

    def get_delivery_details(self, order_id: int):
        return self.service.get_delivery_details(order_id)

    def get_order_issues(self, order_id: int):
        return self.service.get_order_issues(order_id)

    def resolve_order_issue(self, issue_id: int, resolution_note: str):
        return self.service.resolve_order_issue(issue_id, resolution_note)

    def get_order_feedback(self, order_id: int):
        return self.service.get_order_feedback(order_id)