from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List, Dict, Any

# Import dependencies
from config.dependencies import get_current_user, is_delivery_person

# Import controller
from controllers.delivery_panel.delivery_earnings_controller import DeliveryEarningsController

# Import schemas
from schemas.delivery_panel.delivery_earnings_schema import (
    EarningsOverviewResponse, ChartDataApiResponse, TransactionsResponse,
    BankInfoResponse, PayoutsResponse, StatementResponse, EarningsSummaryResponse,
    StatementDownloadRequest, EarningsPeriod, TransactionType,
    TransactionStatus, StatementFormat
)
from services.delivery_panel.delivery_earnings_service import DeliveryEarningsService
from fastapi.responses import Response
from datetime import datetime as dt

# Import models
from models.user import User

# Create router with prefix
router = APIRouter(prefix="/api/v1/delivery_panel/earnings", tags=["Delivery - Earnings"])

# ===== ROUTES (IN SAFE ORDER) =====

# 1. STATIC ROUTES FIRST
@router.get("/overview", response_model=EarningsOverviewResponse)
def get_earnings_overview(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get earnings overview with totals and breakdown
    
    Returns:
    - Total earnings
    - Today's earnings
    - Weekly earnings
    - Monthly earnings
    - Pending settlement
    - Breakdown by type
    """
    return controller.get_earnings_overview(current_user)


@router.get("/summary", response_model=EarningsSummaryResponse)
def get_earnings_summary(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get comprehensive earnings summary for dashboard
    
    Includes:
    - Overview
    - Chart data (last 7 days)
    - Recent transactions
    - Bank info
    """
    return controller.get_earnings_summary(current_user)


@router.get("/chart", response_model=ChartDataApiResponse)
def get_chart_data(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    grouping: str = Query("daily", description="Grouping: daily, weekly, monthly"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get chart data for earnings visualization
    
    - **start_date**: Start date for chart data
    - **end_date**: End date for chart data
    - **grouping**: Time period grouping (daily, weekly, monthly)
    
    Returns time-series data for rendering charts
    """
    return controller.get_chart_data(current_user, start_date, end_date, grouping)


@router.get("/transactions", response_model=TransactionsResponse)
def get_transactions(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    period: Optional[EarningsPeriod] = Query(None, description="Period filter"),
    type: Optional[TransactionType] = Query(None, description="Transaction type filter"),
    status: Optional[TransactionStatus] = Query(None, description="Status filter"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get transaction history
    
    - **start_date**: Filter transactions from this date
    - **end_date**: Filter transactions until this date
    - **period**: Quick period filter
    - **type**: Filter by transaction type
    - **status**: Filter by transaction status
    - **page**: Page number for pagination
    - **per_page**: Number of items per page
    """
    return controller.get_transactions(
        current_user, start_date, end_date, period, type, status, page, per_page
    )


@router.get("/bank", response_model=BankInfoResponse)
def get_bank_info(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get bank account information
    
    Returns:
    - Account holder name
    - Bank name
    - Masked account number
    - IFSC code
    - Verification status
    - Payout schedule
    """
    return controller.get_bank_info(current_user)


@router.get("/payouts", response_model=PayoutsResponse)
def get_payout_history(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get payout history
    
    - **start_date**: Filter payouts from this date
    - **end_date**: Filter payouts until this date
    - **page**: Page number for pagination
    - **per_page**: Number of items per page
    """
    return controller.get_payout_history(
        current_user, start_date, end_date, page, per_page
    )


@router.get("/today", response_model=Dict[str, Any])
def get_today_earnings(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get today's earnings summary
    """
    return controller.get_today_earnings(current_user)


@router.get("/week", response_model=Dict[str, Any])
def get_weekly_earnings(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get this week's earnings summary
    """
    return controller.get_weekly_earnings(current_user)


@router.get("/month", response_model=Dict[str, Any])
def get_monthly_earnings(
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get this month's earnings summary
    """
    return controller.get_monthly_earnings(current_user)


@router.get("/period/{period}", response_model=Dict[str, Any])
def get_period_earnings(
    period: EarningsPeriod,
    custom_start: Optional[str] = Query(None, description="Custom start date (YYYY-MM-DD)"),
    custom_end: Optional[str] = Query(None, description="Custom end date (YYYY-MM-DD)"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get earnings for specific period
    
    - **period**: Period type (today, week, month, custom)
    - **custom_start**: Required for custom period
    - **custom_end**: Required for custom period
    """
    return controller.get_period_earnings(period, current_user, custom_start, custom_end)


@router.get("/custom", response_model=Dict[str, Any])
def get_custom_period_earnings(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Get earnings for custom date range
    
    - **start_date**: Required start date
    - **end_date**: Required end date
    """
    return controller.get_custom_period_earnings(start_date, end_date, current_user)


# 2. DYNAMIC/ACTION ROUTES (AFTER STATIC)
@router.post("/statement/download", response_model=StatementResponse)
def download_statement(
    request: StatementDownloadRequest,
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Download earnings statement
    
    - **start_date**: Start date for statement
    - **end_date**: End date for statement
    - **format**: Statement format (csv, pdf, excel)
    - **include_pending**: Include pending transactions
    
    Returns statement data for export
    """
    return controller.download_statement(request, current_user)

# ===== CSV EXPORT ENDPOINT (Optional) =====
@router.get("/export/csv")
def export_csv_statement(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(is_delivery_person),
    controller: DeliveryEarningsController = Depends()
):
    """
    Export earnings statement as CSV (direct download)
    
    - **start_date**: Required start date
    - **end_date**: Required end date
    
    Returns CSV file for download
    """
    try:
        start_date_obj = dt.strptime(start_date, "%Y-%m-%d").date()
        end_date_obj = dt.strptime(end_date, "%Y-%m-%d").date()
        
        request = StatementDownloadRequest(
            start_date=start_date_obj,
            end_date=end_date_obj,
            format=StatementFormat.CSV
        )
        
        result = controller.download_statement(request, current_user)
        
        # Generate CSV content
        service = DeliveryEarningsService(controller.db)
        csv_content = service.generate_csv_statement(result.statement)
        
        filename = f"earnings_{start_date}_{end_date}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export CSV: {str(e)}"
        )