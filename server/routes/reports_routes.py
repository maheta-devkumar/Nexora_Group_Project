from fastapi import APIRouter, Depends
from typing import List, Dict

from config.dependencies import is_admin
from controllers.reports_controller import ReportsController
from models.user import User

router = APIRouter(prefix="/api/v1/admin/reports", tags=["Admin Reports"])

@router.get("/overview")
def get_overview(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_overview_stats()

@router.get("/sales")
def get_sales(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_sales_analytics()

@router.get("/products")
def get_products(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_product_performance()

@router.get("/categories")
def get_categories(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_category_performance()

@router.get("/customers")
def get_customers(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_customer_insights()

@router.get("/payments")
def get_payments(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_payment_analytics()

@router.get("/delivery")
def get_delivery(
    current_user: User = Depends(is_admin),
    controller: ReportsController = Depends()
):
    return controller.get_delivery_analytics()

@router.get("/health")
def reports_health():
    return {"status": "active", "message": "New Reports Engine Online 2.0"}