# controllers/delivery_reports_controller.py
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from config.dependencies import get_db, get_current_user
from services.delivery_panel.delivery_reports_service import DeliveryReportsService
from schemas.delivery_panel.delivery_reports_schema import (
    DeliveryReportsResponse,
    ReportRange,
    ReportFormat
)
from models.user import User


class DeliveryReportsController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryReportsService(db)
    
    def get_delivery_reports(
        self,
        current_user: User,
        report_range: ReportRange = ReportRange.OVERALL,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status_filter: Optional[str] = None,
        limit: int = 100
    ) -> DeliveryReportsResponse:
        """Get delivery reports for the authenticated delivery person"""
        
        try:
            # Verify user is a delivery person
            from config.dependencies import is_delivery_person
            is_delivery_person(current_user)
            
            return self.service.get_delivery_reports(
                user_id=current_user.user_id,
                report_range=report_range,
                start_date=start_date,
                end_date=end_date,
                status_filter=status_filter,
                limit=limit
            )
            
        except ValueError as e:
            if "User is not a delivery person" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access restricted to delivery personnel only"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate delivery reports: {str(e)}"
            )
    
    def get_quick_summary(self, current_user: User) -> dict:
        """Get quick summary for delivery dashboard"""
        
        try:
            # Verify user is a delivery person
            from config.dependencies import is_delivery_person
            is_delivery_person(current_user)
            
            return self.service.get_quick_summary(current_user.user_id)
            
        except ValueError as e:
            if "User is not a delivery person" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access restricted to delivery personnel only"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get delivery summary: {str(e)}"
            )
    def export_delivery_report(
        self,
        current_user: User,
        report_format: ReportFormat,
        report_range: ReportRange = ReportRange.OVERALL,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status_filter: Optional[str] = None,
        export_type: str = "summary"
    ) -> Tuple[bytes, str, str]:
        """Export delivery report in specified format"""
        
        try:
            # Verify user is a delivery person
            from config.dependencies import is_delivery_person
            is_delivery_person(current_user)
            
            # Generate export
            file_content, content_type = self.service.export_delivery_report(
                user_id=current_user.user_id,
                report_format=report_format,
                report_range=report_range,
                start_date=start_date,
                end_date=end_date,
                status_filter=status_filter,
                export_type=export_type
            )
            
            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"delivery_report_{export_type}_{timestamp}.{report_format}"
            
            return file_content, content_type, filename
            
        except ValueError as e:
            if "User is not a delivery person" in str(e):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access restricted to delivery personnel only"
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to export delivery report: {str(e)}"
            )