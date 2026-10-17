from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List, Dict, Any
from datetime import datetime
from config.dependencies import get_current_user, is_admin
from controllers.analytics_controller import AnalyticsController
from schemas.analytics import (
    DashboardSummary, SalesReport, TopSellingProducts, ProductPerformance,
    CustomerInsights, InventoryStatus, SearchAnalytics, UserBehavior,
    AdminActivityLogOut, Period, AnalyticsResponse
)
from models.user import User

router = APIRouter(prefix="/api/v1/admin/analytics", tags=["Admin Analytics"])

# ===== DASHBOARD ENDPOINTS =====

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get comprehensive dashboard summary for admin
    """
    return controller.get_dashboard_summary(current_user)

# ===== SALES ANALYTICS ENDPOINTS =====

@router.get("/sales-summary", response_model=SalesReport)
def get_sales_report(
    period: Period = Query(Period.MONTH, description="Time period for report"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get sales report with trends for the specified period
    """
    return controller.get_sales_report(period, start_date, end_date, current_user)

# ===== PRODUCT ANALYTICS ENDPOINTS =====

@router.get("/top-products", response_model=List[TopSellingProducts])
def get_top_selling_products(
    limit: int = Query(10, ge=1, le=50, description="Number of top products to return"),
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get top selling products by quantity and revenue
    """
    return controller.get_top_selling_products(limit, current_user)

@router.get("/product-performance", response_model=List[ProductPerformance])
def get_product_analytics(
    variant_id: Optional[int] = Query(None, description="Specific product variant ID"),
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get product performance analytics (views, conversions, revenue)
    """
    return controller.get_product_analytics(variant_id, current_user)

# ===== CUSTOMER ANALYTICS ENDPOINTS =====

@router.get("/customer-insights", response_model=CustomerInsights)
def get_customer_insights(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get customer insights and behavior analytics
    """
    return controller.get_customer_insights(current_user)

# ===== INVENTORY ANALYTICS ENDPOINTS =====

@router.get("/inventory-status", response_model=List[InventoryStatus])
def get_inventory_status(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get inventory status with low stock and out-of-stock alerts
    """
    return controller.get_inventory_status(current_user)

# ===== SEARCH & BEHAVIOR ANALYTICS ENDPOINTS =====

@router.get("/search-analytics", response_model=SearchAnalytics)
def get_search_analytics(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get search query analytics and trends
    """
    return controller.get_search_analytics(current_user)

@router.get("/user-behavior", response_model=UserBehavior)
def get_user_behavior(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get user behavior analytics (sessions, devices, etc.)
    """
    return controller.get_user_behavior(current_user)

# ===== ADMIN ACTIVITY ENDPOINTS =====

@router.get("/activity-log", response_model=List[AdminActivityLogOut])
def get_admin_activity_logs(
    admin_id: Optional[int] = Query(None, description="Filter by specific admin ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of logs to return"),
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Get admin activity logs for audit trail
    """
    return controller.get_admin_activity_logs(admin_id, limit, current_user)

# ===== DATA MANAGEMENT ENDPOINTS =====

@router.post("/refresh", response_model=AnalyticsResponse)
def refresh_analytics_data(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Refresh analytics data (useful for cache updates)
    """
    return controller.refresh_analytics_data(current_user)

# ===== HEALTH CHECK ENDPOINT =====

@router.get("/health")
def analytics_health_check(
    current_user: User = Depends(is_admin),
    controller: AnalyticsController = Depends()
):
    """
    Health check for analytics module
    """
    try:
        # Try to get a simple query to verify database connection
        test_data = controller.get_dashboard_summary(current_user)
        return {
            "status": "healthy",
            "message": "Analytics module is working correctly",
            "data_available": True
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Analytics module health check failed: {str(e)}"
        )