from sqlalchemy.orm import Session
from typing import Dict, Any, List
from repositories.dashboard_repository import DashboardRepository


class DashboardService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DashboardRepository()

    def overview(self) -> Dict[str, Any]:
        stats = self.repo.get_overview_stats(self.db)
        # Add growth calculations (you can implement real growth logic later)
        stats.update({
            "revenueGrowth": 12.5,
            "ordersGrowth": 8.3,
            "customersGrowth": 5.7,
            "productsGrowth": 3.2
        })
        return stats

    def sales_analytics(self, period: str = "month") -> List[Dict[str, Any]]:
        return self.repo.get_sales_analytics(self.db, period)

    def revenue_trends(self, days: int = 30) -> List[Dict[str, Any]]:
        return self.repo.get_revenue_trends(self.db, days)

    def recent_orders(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.repo.get_recent_orders(self.db, limit)

    def top_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self.repo.get_top_products(self.db, limit)

    def low_stock(self, threshold: int = 10) -> List[Dict[str, Any]]:
        return self.repo.get_low_stock_alerts(self.db, threshold)

    def system_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        return self.repo.get_system_alerts(self.db, limit)

    def category_performance(self) -> List[Dict[str, Any]]:
        return self.repo.get_category_performance(self.db)

    def order_status_distribution(self) -> List[Dict[str, Any]]:
        return self.repo.get_order_status_distribution(self.db)

    def customer_stats(self) -> Dict[str, Any]:
        return self.repo.get_customer_stats(self.db)

    def stock_alerts(self) -> List[Dict[str, Any]]:
        return self.repo.get_stock_alerts(self.db)

    def traffic_data(self) -> List[Dict[str, Any]]:
        return self.repo.get_traffic_data(self.db)

    def return_rate(self, period: str = "month") -> List[Dict[str, Any]]:
        return self.repo.get_return_rate(self.db, period)