from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import List, Dict

from config.dependencies import get_db
from services.reports_service import ReportsService

class ReportsController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = ReportsService(db)
    
    def get_overview_stats(self) -> Dict:
        try:
            return self.service.get_overview_stats()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch overview: {str(e)}"
            )

    def get_sales_analytics(self) -> List[Dict]:
        try:
            return self.service.get_sales_analytics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch sales report: {str(e)}"
            )

    def get_product_performance(self) -> List[Dict]:
        try:
            return self.service.get_product_performance()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch product report: {str(e)}"
            )

    def get_category_performance(self) -> List[Dict]:
        try:
            return self.service.get_category_performance()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch category report: {str(e)}"
            )

    def get_customer_insights(self) -> List[Dict]:
        try:
            return self.service.get_customer_insights()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch customer report: {str(e)}"
            )

    def get_payment_analytics(self) -> List[Dict]:
        try:
            return self.service.get_payment_analytics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch payment report: {str(e)}"
            )

    def get_delivery_analytics(self) -> List[Dict]:
        try:
            return self.service.get_delivery_analytics()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch delivery report: {str(e)}"
            )