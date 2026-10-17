from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import date

from repositories.reports_repository import ReportsRepository

class ReportsService:
    
    def __init__(self, db: Session):
        self.db = db
        # Repository methods are static, but we can keep instance for convention
    
    def get_overview_stats(self) -> Dict:
        return ReportsRepository.get_overview_stats(self.db)
    
    def get_sales_analytics(self) -> List[Dict]:
        return ReportsRepository.get_sales_analytics(self.db)
    
    def get_product_performance(self) -> List[Dict]:
        return ReportsRepository.get_product_performance(self.db)
    
    def get_category_performance(self) -> List[Dict]:
        return ReportsRepository.get_category_performance_list(self.db)
    
    def get_customer_insights(self) -> List[Dict]:
        return ReportsRepository.get_customer_insights_list(self.db)
    
    def get_payment_analytics(self) -> List[Dict]:
        return ReportsRepository.get_payment_analytics_list(self.db)
    
    def get_delivery_analytics(self) -> List[Dict]:
        return ReportsRepository.get_delivery_analytics_list(self.db)