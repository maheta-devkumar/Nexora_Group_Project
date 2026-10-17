from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any

# Import dependencies
from config.dependencies import get_db, get_current_user, is_delivery_person

# Import service
from services.delivery_panel.delivery_earnings_service import DeliveryEarningsService

# Import schemas
from schemas.delivery_panel.delivery_earnings_schema import (
    EarningsOverviewResponse, ChartDataApiResponse, TransactionsResponse,
    BankInfoResponse, PayoutsResponse, StatementResponse, EarningsSummaryResponse,
    DateFilterRequest, ChartFilterRequest, TransactionFilterRequest,
    StatementDownloadRequest, EarningsPeriod, TransactionType,
    TransactionStatus, StatementFormat
)

# Import models
from models.user import User
from models.delivery.delivery_person import DeliveryPerson


class DeliveryEarningsController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryEarningsService(db)
    
    # ===== HELPER METHOD =====
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    # ===== EARNINGS OVERVIEW =====
    
    def get_earnings_overview(
        self,
        current_user: User
    ) -> EarningsOverviewResponse:
        """Get earnings overview"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_earnings_overview(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get earnings overview: {str(e)}"
            )
    
    # ===== CHART DATA =====
    
    def get_chart_data(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        grouping: str = "daily"
    ) -> ChartDataApiResponse:
        """Get chart data for earnings"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse dates
            start_date_obj = None
            end_date_obj = None
            
            if start_date:
                from datetime import datetime as dt
                start_date_obj = dt.strptime(start_date, "%Y-%m-%d").date()
            
            if end_date:
                from datetime import datetime as dt
                end_date_obj = dt.strptime(end_date, "%Y-%m-%d").date()
            
            chart_filter = ChartFilterRequest(
                start_date=start_date_obj,
                end_date=end_date_obj,
                grouping=grouping
            )
            
            return self.service.get_chart_data(delivery_person_id, chart_filter)
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get chart data: {str(e)}"
            )
    
    # ===== TRANSACTIONS =====
    
    def get_transactions(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: Optional[EarningsPeriod] = None,
        type: Optional[TransactionType] = None,
        status: Optional[TransactionStatus] = None,
        page: int = 1,
        per_page: int = 20
    ) -> TransactionsResponse:
        """Get transaction history"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse dates
            start_date_obj = None
            end_date_obj = None
            
            if start_date:
                from datetime import datetime as dt
                start_date_obj = dt.strptime(start_date, "%Y-%m-%d").date()
            
            if end_date:
                from datetime import datetime as dt
                end_date_obj = dt.strptime(end_date, "%Y-%m-%d").date()
            
            date_filter = None
            if start_date or end_date or period:
                date_filter = DateFilterRequest(
                    start_date=start_date_obj,
                    end_date=end_date_obj,
                    period=period
                )
            
            filters = TransactionFilterRequest(
                date_filter=date_filter,
                type=type,
                status=status,
                page=page,
                per_page=per_page
            )
            
            return self.service.get_transactions(delivery_person_id, filters)
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get transactions: {str(e)}"
            )
    
    # ===== BANK INFORMATION =====
    
    def get_bank_info(
        self,
        current_user: User
    ) -> BankInfoResponse:
        """Get bank account information"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_bank_info(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get bank information: {str(e)}"
            )
    
    # ===== PAYOUT HISTORY =====
    
    def get_payout_history(
        self,
        current_user: User,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> PayoutsResponse:
        """Get payout history"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse dates
            start_date_obj = None
            end_date_obj = None
            
            if start_date:
                from datetime import datetime as dt
                start_date_obj = dt.strptime(start_date, "%Y-%m-%d").date()
            
            if end_date:
                from datetime import datetime as dt
                end_date_obj = dt.strptime(end_date, "%Y-%m-%d").date()
            
            return self.service.get_payout_history(
                delivery_person_id, start_date_obj, end_date_obj, page, per_page
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get payout history: {str(e)}"
            )
    
    # ===== STATEMENT DOWNLOAD =====
    
    def download_statement(
        self,
        request: StatementDownloadRequest,
        current_user: User
    ) -> StatementResponse:
        """Download earnings statement"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_statement(delivery_person_id, request)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid request: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate statement: {str(e)}"
            )
    
    # ===== EARNINGS SUMMARY =====
    
    def get_earnings_summary(
        self,
        current_user: User
    ) -> EarningsSummaryResponse:
        """Get comprehensive earnings summary"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_earnings_summary(delivery_person_id)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get earnings summary: {str(e)}"
            )
    
    # ===== PERIOD EARNINGS =====
    
    def get_period_earnings(
        self,
        period: EarningsPeriod,
        current_user: User,
        custom_start: Optional[str] = None,
        custom_end: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get earnings for specific period"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            # Parse custom dates if provided
            custom_start_obj = None
            custom_end_obj = None
            
            if custom_start:
                from datetime import datetime as dt
                custom_start_obj = dt.strptime(custom_start, "%Y-%m-%d").date()
            
            if custom_end:
                from datetime import datetime as dt
                custom_end_obj = dt.strptime(custom_end, "%Y-%m-%d").date()
            
            return self.service.get_period_earnings(
                delivery_person_id, period, custom_start_obj, custom_end_obj
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get period earnings: {str(e)}"
            )
    
    # ===== TODAY'S EARNINGS =====
    
    def get_today_earnings(
        self,
        current_user: User
    ) -> Dict[str, Any]:
        """Get today's earnings"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_period_earnings(
                delivery_person_id, EarningsPeriod.TODAY
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get today's earnings: {str(e)}"
            )
    
    # ===== WEEKLY EARNINGS =====
    
    def get_weekly_earnings(
        self,
        current_user: User
    ) -> Dict[str, Any]:
        """Get weekly earnings"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_period_earnings(
                delivery_person_id, EarningsPeriod.WEEK
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get weekly earnings: {str(e)}"
            )
    
    # ===== MONTHLY EARNINGS =====
    
    def get_monthly_earnings(
        self,
        current_user: User
    ) -> Dict[str, Any]:
        """Get monthly earnings"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_period_earnings(
                delivery_person_id, EarningsPeriod.MONTH
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get monthly earnings: {str(e)}"
            )
    
    # ===== CUSTOM PERIOD EARNINGS =====
    
    def get_custom_period_earnings(
        self,
        start_date: str,
        end_date: str,
        current_user: User
    ) -> Dict[str, Any]:
        """Get earnings for custom period"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            
            from datetime import datetime as dt
            start_date_obj = dt.strptime(start_date, "%Y-%m-%d").date()
            end_date_obj = dt.strptime(end_date, "%Y-%m-%d").date()
            
            return self.service.get_period_earnings(
                delivery_person_id,
                EarningsPeriod.CUSTOM,
                start_date_obj,
                end_date_obj
            )
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid date format. Use YYYY-MM-DD: {str(e)}"
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get custom period earnings: {str(e)}"
            )