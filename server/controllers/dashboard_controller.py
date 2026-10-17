from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any

# Import get_current_user if you have it, otherwise remove
from config.dependencies import get_db, get_current_user
from services.dashboard_service import DashboardService


class DashboardController:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DashboardService(db)

    def get_overview(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.overview()
            return {"success": True, "message": "Overview retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_sales(self, period: str = "month", current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.sales_analytics(period)
            return {"success": True, "message": "Sales analytics retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_revenue(self, days: int = 30, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.revenue_trends(days)
            return {"success": True, "message": "Revenue trends retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_recent_orders(self, limit: int = 10, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.recent_orders(limit)
            return {"success": True, "message": "Recent orders retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_top_products(self, limit: int = 10, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.top_products(limit)
            return {"success": True, "message": "Top products retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_low_stock(self, threshold: int = 10, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.low_stock(threshold)
            return {"success": True, "message": "Low stock alerts retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_system_alerts(self, limit: int = 20, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.system_alerts(limit)
            return {"success": True, "message": "System alerts retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_category_performance(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.category_performance()
            return {"success": True, "message": "Category performance retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_order_status_distribution(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.order_status_distribution()
            return {"success": True, "message": "Order distribution retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_customer_stats(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.customer_stats()
            return {"success": True, "message": "Customer stats retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_stock_alerts(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.stock_alerts()
            return {"success": True, "message": "Stock alerts retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_traffic(self, current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.traffic_data()
            return {"success": True, "message": "Traffic data retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def get_return_rate(self, period: str = "month", current_user = Depends(get_current_user)) -> Dict[str, Any]:
        try:
            data = self.service.return_rate(period)
            return {"success": True, "message": "Return rate retrieved", "data": data}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))