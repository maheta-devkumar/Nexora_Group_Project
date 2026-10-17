from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from config.dependencies import get_db, get_current_user, is_admin
from services.analytics_service import AnalyticsService
from schemas.analytics import (
    DashboardSummary, SalesReport, TopSellingProducts, ProductPerformance,
    CustomerInsights, InventoryStatus, SearchAnalytics, UserBehavior,
    AdminActivityLogOut, Period, DateRange, AnalyticsResponse
)
from models.user import User

class AnalyticsController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = AnalyticsService(db)
    
    # ===== DASHBOARD =====
    
    def get_dashboard_summary(self, current_user: User) -> DashboardSummary:
        """Get admin dashboard summary"""
        try:
            return self.service.generate_dashboard_summary()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate dashboard summary: {str(e)}"
            )
    
    # ===== SALES ANALYTICS =====
    
    def get_sales_report(
        self, 
        period: Period = Period.MONTH,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        current_user: User = None
    ) -> SalesReport:
        """Get sales report for the given period"""
        try:
            date_range = None
            if start_date and end_date:
                date_range = DateRange(start_date=start_date, end_date=end_date)
            
            return self.service.get_sales_report(period, date_range)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate sales report: {str(e)}"
            )
    
    # ===== PRODUCT ANALYTICS =====
    
    def get_top_selling_products(
        self, 
        limit: int = 10,
        current_user: User = None
    ) -> List[TopSellingProducts]:
        """Get top selling products"""
        try:
            return self.service.get_top_selling_products(limit)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch top products: {str(e)}"
            )
    
    def get_product_analytics(
        self, 
        variant_id: Optional[int] = None,
        current_user: User = None
    ) -> List[ProductPerformance]:
        """Get product performance analytics"""
        try:
            return self.service.get_product_analytics(variant_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch product analytics: {str(e)}"
            )
    
    # ===== CUSTOMER ANALYTICS =====
    
    def get_customer_insights(self, current_user: User) -> CustomerInsights:
        """Get customer insights"""
        try:
            return self.service.get_customer_insights()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch customer insights: {str(e)}"
            )
    
    # ===== INVENTORY ANALYTICS =====
    
    def get_inventory_status(self, current_user: User) -> List[InventoryStatus]:
        """Get inventory status with alerts"""
        try:
            return self.service.get_inventory_status()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch inventory status: {str(e)}"
            )
    
    # ===== SEARCH & BEHAVIOR ANALYTICS =====
    
    def get_search_analytics(self, current_user: User) -> SearchAnalytics:
        """Get search analytics"""
        try:
            return self.service.get_search_analytics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch search analytics: {str(e)}"
            )
    
    def get_user_behavior(self, current_user: User) -> UserBehavior:
        """Get user behavior analytics"""
        try:
            return self.service.get_user_behavior()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch user behavior: {str(e)}"
            )
    
    # ===== ADMIN ACTIVITY =====
    
    def get_admin_activity_logs(
        self, 
        admin_id: Optional[int] = None,
        limit: int = 50,
        current_user: User = None
    ) -> List[AdminActivityLogOut]:
        """Get admin activity logs"""
        try:
            return self.service.get_admin_activity_logs(admin_id, limit)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch admin activity logs: {str(e)}"
            )
    
    # ===== DATA REFRESH =====
    
    def refresh_analytics_data(self, current_user: User) -> AnalyticsResponse:
        """Refresh analytics data"""
        try:
            return self.service.refresh_analytics_data()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to refresh analytics data: {str(e)}"
            )