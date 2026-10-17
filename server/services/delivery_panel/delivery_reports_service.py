# services/delivery_reports_service.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Tuple
import io
import csv
import json
from repositories.delivery_panel.delivery_reports_repository import DeliveryReportsRepository
from schemas.delivery_panel.delivery_reports_schema import (
    ReportRange,
    ReportFormat,
    DeliverySummary,
    TrendData,
    PeriodBreakdown,
    OrderReportItem,
    DeliveryReportsResponse
)


class DeliveryReportsService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryReportsRepository()
    
    def get_delivery_reports(
        self,
        user_id: int,
        report_range: ReportRange = ReportRange.OVERALL,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status_filter: Optional[str] = None,
        limit: int = 100
    ) -> DeliveryReportsResponse:
        """Get comprehensive delivery reports"""
        
        # Get delivery person ID
        delivery_person_id = self.repository.get_delivery_person_id(self.db, user_id)
        if not delivery_person_id:
            raise ValueError("User is not a delivery person")
        
        # Validate and adjust date ranges
        start_date, end_date = self._resolve_date_range(report_range, start_date, end_date)
        
        # Get overall summary
        summary_data = self.repository.get_overall_summary(
            self.db, delivery_person_id, start_date, end_date
        )
        
        # Get period breakdown based on report range
        if report_range == ReportRange.WEEKLY:
            period_data = self.repository.get_weekly_summary(self.db, delivery_person_id)
        elif report_range == ReportRange.MONTHLY:
            period_data = self.repository.get_monthly_summary(self.db, delivery_person_id)
        else:
            period_data = self.repository.get_period_breakdown(
                self.db, delivery_person_id, report_range, start_date, end_date
            )
        
        # Get trend data (last 30 days for all ranges)
        trend_raw = self.repository.get_trend_data(self.db, delivery_person_id, days=30)
        
        # Get order-wise report
        orders_raw = self.repository.get_order_wise_report(
            self.db, delivery_person_id, status_filter, start_date, end_date, limit
        )
        
        # Convert to Pydantic models
        summary = DeliverySummary(**summary_data)
        
        period_breakdown = [
            PeriodBreakdown(**period) for period in period_data[:10]  # Limit to 10 periods
        ]
        
        trend = TrendData(
            labels=trend_raw['labels'],
            delivery_data=trend_raw['delivery_data'],
            earnings_data=trend_raw['earnings_data']
        )
        
        orders = [
            OrderReportItem(**order) for order in orders_raw
        ]
        
        # Build response
        filters_applied = {
            'report_range': report_range.value,
            'status_filter': status_filter,
            'date_range_applied': start_date is not None and end_date is not None
        }
        
        return DeliveryReportsResponse(
            summary=summary,
            period_breakdown=period_breakdown,
            trend=trend,
            orders=orders,
            filters_applied=filters_applied,
            report_range=report_range,
            period_start=start_date,
            period_end=end_date
        )
    
    def _resolve_date_range(
        self,
        report_range: ReportRange,
        start_date: Optional[datetime],
        end_date: Optional[datetime]
    ) -> tuple[Optional[datetime], Optional[datetime]]:
        """Resolve date ranges based on report type"""
        
        now = datetime.now()
        
        if report_range == ReportRange.WEEKLY:
            # Default to current week
            if not start_date:
                start_date = now - timedelta(days=now.weekday())
                start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            if not end_date:
                end_date = start_date + timedelta(days=6)
                end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        elif report_range == ReportRange.MONTHLY:
            # Default to current month
            if not start_date:
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if not end_date:
                # Last day of month
                next_month = start_date.replace(day=28) + timedelta(days=4)
                end_date = next_month - timedelta(days=next_month.day)
                end_date = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        elif report_range == ReportRange.CUSTOM:
            # Validate custom dates
            if not start_date or not end_date:
                raise ValueError("Both start_date and end_date are required for custom range")
            
            if start_date > end_date:
                raise ValueError("start_date cannot be after end_date")
            
            # Cap end_date to today if future
            if end_date > now:
                end_date = now
        
        else:  # OVERALL
            # No date constraints for overall
            start_date = None
            end_date = None
        
        return start_date, end_date
    
    def get_quick_summary(self, user_id: int) -> Dict[str, Any]:
        """Get quick summary for dashboard"""
        
        delivery_person_id = self.repository.get_delivery_person_id(self.db, user_id)
        if not delivery_person_id:
            raise ValueError("User is not a delivery person")
        
        # Today's summary
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = datetime.now().replace(hour=23, minute=59, second=59, microsecond=999999)
        
        today_data = self.repository.get_overall_summary(
            self.db, delivery_person_id, today_start, today_end
        )
        
        # This week's summary
        week_start = datetime.now() - timedelta(days=datetime.now().weekday())
        week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
        
        week_data = self.repository.get_overall_summary(
            self.db, delivery_person_id, week_start, datetime.now()
        )
        
        # This month's summary
        month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        month_data = self.repository.get_overall_summary(
            self.db, delivery_person_id, month_start, datetime.now()
        )
        
        return {
            'today': today_data,
            'this_week': week_data,
            'this_month': month_data,
            'delivery_person_id': delivery_person_id
        }
    
    def export_delivery_report(
        self,
        user_id: int,
        report_format: ReportFormat,
        report_range: ReportRange = ReportRange.OVERALL,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        status_filter: Optional[str] = None,
        export_type: str = "summary"  # "summary", "orders", or "full"
    ) -> Tuple[bytes, str]:
        """Export delivery report in specified format"""
        
        # Get delivery person ID
        delivery_person_id = self.repository.get_delivery_person_id(self.db, user_id)
        if not delivery_person_id:
            raise ValueError("User is not a delivery person")
        
        # Validate and adjust date ranges
        start_date, end_date = self._resolve_date_range(report_range, start_date, end_date)
        
        if export_type == "orders":
            # Export only order data
            orders_data = self.repository.get_order_wise_report(
                self.db, delivery_person_id, status_filter, start_date, end_date, limit=1000
            )
            # Convert to list of dicts for export
            orders_list = [order.__dict__ for order in orders_data] if hasattr(orders_data[0], '__dict__') else orders_data
            # Convert to list of dicts for export
            orders_list = [order.__dict__ for order in orders_data] if hasattr(orders_data[0], '__dict__') else orders_data
            return orders_list, "application/json"
        
        elif export_type == "summary":
            # Export summary data
            summary_data = self.repository.get_overall_summary(
                self.db, delivery_person_id, start_date, end_date
            )
            period_data = self.repository.get_period_breakdown(
                self.db, delivery_person_id, report_range, start_date, end_date
            )
            
            # Convert to exportable format
            export_data = {
                "summary": summary_data,
                "periods": period_data[:10],
                "report_range": report_range.value,
                "date_range": {
                    "start": start_date.isoformat() if start_date else None,
                    "end": end_date.isoformat() if end_date else None
                }
            }
            
            export_data = {
                "summary": summary_data,
                "periods": period_data[:10],
                "report_range": report_range.value,
                "date_range": {
                    "start": start_date.isoformat() if start_date else None,
                    "end": end_date.isoformat() if end_date else None
                }
            }
            
            return export_data, "application/json"
        
        else:  # "full" export
            # Get all data
            summary_data = self.repository.get_overall_summary(
                self.db, delivery_person_id, start_date, end_date
            )
            period_data = self.repository.get_period_breakdown(
                self.db, delivery_person_id, report_range, start_date, end_date
            )
            orders_data = self.repository.get_order_wise_report(
                self.db, delivery_person_id, status_filter, start_date, end_date, limit=1000
            )
            trend_data = self.repository.get_trend_data(self.db, delivery_person_id, days=30)
            
            # Convert orders to dicts if needed
            orders_list = orders_data
            if orders_data and hasattr(orders_data[0], '__dict__'):
                orders_list = [order.__dict__ for order in orders_data]
            
            export_data = {
                "summary": summary_data,
                "periods": period_data,
                "orders": orders_list,
                "trend": trend_data,
                "metadata": {
                    "report_range": report_range.value,
                    "generated_at": datetime.now().isoformat(),
                    "delivery_person_id": delivery_person_id,
                    "filters": {
                        "status": status_filter,
                        "date_range": {
                            "start": start_date.isoformat() if start_date else None,
                            "end": end_date.isoformat() if end_date else None
                        }
                    }
                }
            }
            
            export_data = {
                "summary": summary_data,
                "periods": period_data,
                "orders": orders_list,
                "trend": trend_data,
                "metadata": {
                    "report_range": report_range.value,
                    "generated_at": datetime.now().isoformat(),
                    "delivery_person_id": delivery_person_id,
                    "filters": {
                        "status": status_filter,
                        "date_range": {
                            "start": start_date.isoformat() if start_date else None,
                            "end": end_date.isoformat() if end_date else None
                        }
                    }
                }
            }
            
            return export_data, "application/json"