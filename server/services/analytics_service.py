from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.analytics_repository import AnalyticsRepository
from schemas.analytics import (
    SalesSummary, SalesTrend, TopSellingProducts, ProductPerformance,
    CustomerInsights, InventoryStatus, SearchAnalytics, UserBehavior,
    AdminActivityLogOut, DashboardSummary, SalesReport, Period, DateRange,
    AnalyticsResponse
)
from datetime import datetime, timedelta

class AnalyticsService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = AnalyticsRepository()
    
    # ===== DASHBOARD =====
    
    def generate_dashboard_summary(self) -> DashboardSummary:
        """Generate complete dashboard summary"""
        raw_data = self.repository.get_dashboard_summary(self.db)
        
        return DashboardSummary(
            sales_summary=SalesSummary(**raw_data["sales_summary"]),
            top_products=[TopSellingProducts(**product) for product in raw_data["top_products"]],
            customer_insights=CustomerInsights(**raw_data["customer_insights"]),
            inventory_alerts=[InventoryStatus(**alert) for alert in raw_data["inventory_alerts"]],
            recent_activity=[AdminActivityLogOut(**activity) for activity in raw_data["recent_activity"]]
        )
    
    # ===== SALES ANALYTICS =====
    
    def get_sales_report(self, period: Period = Period.MONTH, date_range: Optional[DateRange] = None) -> SalesReport:
        """Get sales report for the given period"""
        sales_summary_data = self.repository.get_sales_summary(self.db, date_range)
        trends_data = self.repository.get_sales_trends(self.db, period)
        
        # Calculate growth if possible
        if len(trends_data) >= 2:
            current_revenue = trends_data[-1]["revenue"] if trends_data else 0
            previous_revenue = trends_data[-2]["revenue"] if len(trends_data) > 1 else 0
            growth = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
            sales_summary_data["revenue_growth"] = growth
        
        return SalesReport(
            summary=SalesSummary(**sales_summary_data),
            trends=[SalesTrend(**trend) for trend in trends_data],
            period=period,
            date_range=date_range
        )
    
    # ===== PRODUCT ANALYTICS =====
    
    def get_top_selling_products(self, limit: int = 10) -> List[TopSellingProducts]:
        """Get top selling products"""
        products_data = self.repository.get_top_selling_products(self.db, limit)
        return [TopSellingProducts(**product) for product in products_data]
    
    def get_product_analytics(self, variant_id: Optional[int] = None) -> List[ProductPerformance]:
        """Get product performance analytics"""
        performance_data = self.repository.get_product_performance(self.db, variant_id)
        return [ProductPerformance(**performance) for performance in performance_data]
    
    # ===== CUSTOMER ANALYTICS =====
    
    def get_customer_insights(self) -> CustomerInsights:
        """Get customer insights"""
        insights_data = self.repository.get_customer_insights(self.db)
        return CustomerInsights(**insights_data)
    
    # ===== INVENTORY ANALYTICS =====
    
    def get_inventory_status(self) -> List[InventoryStatus]:
        """Get inventory status with alerts"""
        status_data = self.repository.get_inventory_status(self.db)
        return [InventoryStatus(**status) for status in status_data]
    
    # ===== SEARCH & BEHAVIOR ANALYTICS =====
    
    def get_search_analytics(self) -> SearchAnalytics:
        """Get search analytics"""
        search_data = self.repository.get_search_analytics(self.db)
        return SearchAnalytics(**search_data)
    
    def get_user_behavior(self) -> UserBehavior:
        """Get user behavior analytics"""
        behavior_data = self.repository.get_user_behavior(self.db)
        return UserBehavior(**behavior_data)
    
    # ===== ADMIN ACTIVITY =====
    
    def get_admin_activity_logs(self, admin_id: Optional[int] = None, limit: int = 50) -> List[AdminActivityLogOut]:
        """Get admin activity logs"""
        logs_data = self.repository.get_admin_activity_logs(self.db, admin_id, limit)
        return [AdminActivityLogOut(**log) for log in logs_data]
    
    # ===== DATA REFRESH =====
    
    def refresh_analytics_data(self) -> AnalyticsResponse:
        """Refresh analytics data"""
        try:
            # In future, this could refresh materialized views or caches
            return AnalyticsResponse(
                success=True,
                message="Analytics data refresh initiated successfully"
            )
        except Exception as e:
            return AnalyticsResponse(
                success=False,
                message=f"Failed to refresh analytics data: {str(e)}"
            )