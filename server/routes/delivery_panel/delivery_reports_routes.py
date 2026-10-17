# routes/delivery_reports_routes.py
from fastapi import APIRouter, Depends, Query, status
from typing import Optional
from datetime import datetime
from config.dependencies import get_current_user, is_delivery_person
from controllers.delivery_panel.delivery_reports_controller import DeliveryReportsController
from schemas.delivery_panel.delivery_reports_schema import (
    ReportRange,
    ReportFormat,
    DeliverySummary,
    TrendData,
    PeriodBreakdown,
    OrderReportItem,
    DeliveryReportsResponse
)
from services.delivery_panel.delivery_reports_service import DeliveryReportsService
from config.dependencies import get_db
    
from models.user import User

router = APIRouter(prefix="/api/v1/delivery_panel", tags=["Delivery Reports"])


# ✅ GET /api/v1/delivery/reports - Get delivery reports
@router.get("/reports", response_model=DeliveryReportsResponse)
def get_delivery_reports(
    report_range: ReportRange = Query(
        ReportRange.OVERALL, 
        description="Report time range: overall, weekly, monthly, or custom"
    ),
    start_date: Optional[datetime] = Query(
        None, 
        description="Start date for custom range (YYYY-MM-DD)"
    ),
    end_date: Optional[datetime] = Query(
        None, 
        description="End date for custom range (YYYY-MM-DD)"
    ),
    status_filter: Optional[str] = Query(
        None, 
        description="Filter by delivery status"
    ),
    limit: int = Query(
        100, 
        ge=1, 
        le=500, 
        description="Maximum number of orders to return"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryReportsController = Depends()
):
    """
    Get comprehensive delivery reports for the authenticated delivery person.
    
    **Available Report Ranges:**
    - `overall`: All-time statistics
    - `weekly`: Grouped by week
    - `monthly`: Grouped by month  
    - `custom`: User-defined date range (requires start_date and end_date)
    
    **Response Includes:**
    - Summary statistics
    - Period-wise breakdown
    - Delivery & earnings trends
    - Order-wise detailed report
    """
    return controller.get_delivery_reports(
        current_user=current_user,
        report_range=report_range,
        start_date=start_date,
        end_date=end_date,
        status_filter=status_filter,
        limit=limit
    )


# ✅ GET /api/v1/delivery/reports/summary - Quick summary for dashboard
@router.get("/reports/summary")
def get_delivery_summary(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryReportsController = Depends()
):
    """
    Get quick delivery summary for dashboard display.
    Returns today's, this week's, and this month's statistics.
    """
    return controller.get_quick_summary(current_user)


# ✅ GET /api/v1/delivery/reports/orders - Order-wise report only
@router.get("/reports/orders")
def get_order_wise_report(
    start_date: Optional[datetime] = Query(
        None, 
        description="Start date (YYYY-MM-DD)"
    ),
    end_date: Optional[datetime] = Query(
        None, 
        description="End date (YYYY-MM-DD)"
    ),
    status: Optional[str] = Query(
        None, 
        description="Filter by delivery status"
    ),
    limit: int = Query(50, ge=1, le=200, description="Number of orders to return"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryReportsController = Depends()
):
    """
    Get detailed order-wise delivery report only.
    Useful for when you need just the order list without summary data.
    """
    # Reuse the main reports endpoint but might want a dedicated method
    # For now, using the main endpoint with default range
    reports = controller.get_delivery_reports(
        current_user=current_user,
        report_range=ReportRange.CUSTOM if start_date and end_date else ReportRange.OVERALL,
        start_date=start_date,
        end_date=end_date,
        status_filter=status,
        limit=limit
    )
    
    # Return only orders data for this specific endpoint
    return {
        "orders": reports.orders,
        "total_orders": len(reports.orders),
        "filters_applied": {
            "start_date": start_date,
            "end_date": end_date,
            "status": status
        }
    }


# ✅ GET /api/v1/delivery/reports/trend - Trend data only
@router.get("/reports/trend")
def get_delivery_trend(
    days: int = Query(30, ge=7, le=365, description="Number of days for trend"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryReportsController = Depends()
):
    """
    Get delivery and earnings trend data only.
    Returns data for the specified number of days.
    """

    db = next(get_db())
    service = DeliveryReportsService(db)
    
    delivery_person_id = service.repository.get_delivery_person_id(db, current_user.user_id)
    if not delivery_person_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not a delivery person"
        )
    
    trend_data = service.repository.get_trend_data(db, delivery_person_id, days)
    
    return {
        "trend": trend_data,
        "days": days,
        "delivery_person_id": delivery_person_id
    }

@router.get("/reports/export")
def export_delivery_report(
    report_format: ReportFormat = Query(
        ReportFormat.PDF, 
        description="Export format: csv, json, or pdf"
    ),
    report_range: ReportRange = Query(
        ReportRange.OVERALL, 
        description="Report time range"
    ),
    start_date: Optional[datetime] = Query(
        None, 
        description="Start date for custom range"
    ),
    end_date: Optional[datetime] = Query(
        None, 
        description="End date for custom range"
    ),
    status_filter: Optional[str] = Query(
        None, 
        description="Filter by delivery status"
    ),
    export_type: str = Query(
        "summary", 
        description="Export type: summary, orders, or full"
    ),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryReportsController = Depends()
):
    """
    Export delivery report in CSV, JSON, or PDF format.
    
    **Export Types:**
    - `summary`: Summary statistics only
    - `orders`: Order-wise details only
    - `full`: Comprehensive report with all data
    
    **Formats:**
    - CSV: Comma-separated values
    - JSON: JavaScript Object Notation
    - PDF: Portable Document Format (with formatted report)
    """
    
    try:
        file_content, content_type, filename = controller.export_delivery_report(
            current_user=current_user,
            report_format=report_format,
            report_range=report_range,
            start_date=start_date,
            end_date=end_date,
            status_filter=status_filter,
            export_type=export_type
        )
        
        # Return file as response
        from fastapi.responses import Response
        return Response(
            content=file_content,
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": content_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )