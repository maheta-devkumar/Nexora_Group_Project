from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
import csv
import io
from sqlalchemy import func

# Import repository
from repositories.delivery_panel.delivery_earnings_repository import DeliveryEarningsRepository
from models.delivery.delivery_earnings import DeliveryEarnings
from models.delivery.delivery import Delivery

# Import schemas
from schemas.delivery_panel.delivery_earnings_schema import (
    EarningsOverviewResponse, ChartDataApiResponse, TransactionsResponse,
    BankInfoResponse, PayoutsResponse, StatementResponse, EarningsSummaryResponse,
    EarningsOverview, EarningsBreakdown, ChartDataResponse, ChartDataPoint,
    TransactionItem, BankInfo, PayoutHistoryItem, StatementData,
    DateFilterRequest, ChartFilterRequest, TransactionFilterRequest,
    StatementDownloadRequest, EarningsPeriod, TransactionType,
    TransactionStatus, PaymentMethod, StatementFormat,
    EarningsErrorResponse
)


class DeliveryEarningsService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryEarningsRepository()
    
    def _format_transaction_id(self, earning_id: int) -> str:
        """Format transaction ID"""
        return f"TXN-{earning_id:06d}"
    
    def _format_payout_id(self, payout_num: int) -> str:
        """Format payout ID"""
        return f"PAY-{payout_num:06d}"
    
    def _get_default_chart_date_range(self) -> Tuple[date, date]:
        """Get default date range for charts (last 7 days)"""
        end_date = date.today()
        start_date = end_date - timedelta(days=6)
        return start_date, end_date
    
    def get_earnings_overview(
        self,
        delivery_person_id: int
    ) -> EarningsOverviewResponse:
        """Get earnings overview with breakdown"""
        try:
            # Get overview data
            overview_data = self.repository.get_earnings_overview(
                self.db, delivery_person_id
            )
            
            # Get breakdown
            breakdown_data = self.repository.get_earnings_breakdown(
                self.db, delivery_person_id
            )
            
            # Calculate period comparison (this week vs last week)
            today = date.today()
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            last_week_start = week_start - timedelta(days=7)
            last_week_end = week_end - timedelta(days=7)
            
            comparison = self.repository.get_period_comparison(
                self.db, delivery_person_id,
                week_start, week_end,
                last_week_start, last_week_end
            )
            
            # Build response
            overview = EarningsOverview(**overview_data)
            breakdown = EarningsBreakdown(**breakdown_data)
            
            return EarningsOverviewResponse(
                overview=overview,
                breakdown=breakdown,
                period_comparison=comparison
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting earnings overview: {str(e)}")
            return EarningsOverviewResponse(
                success=False,
                message=f"Failed to get earnings overview: {str(e)}",
                overview=EarningsOverview(
                    total_earnings=0,
                    today_earnings=0,
                    week_earnings=0,
                    month_earnings=0,
                    pending_settlement=0,
                    settled_amount=0,
                    today_deliveries=0,
                    week_deliveries=0,
                    month_deliveries=0,
                    average_per_delivery=0
                ),
                breakdown=EarningsBreakdown()
            )
    
    def get_chart_data(
        self,
        delivery_person_id: int,
        chart_filter: Optional[ChartFilterRequest] = None
    ) -> ChartDataApiResponse:
        """Get chart data for earnings visualization"""
        try:
            # Default to last 7 days if no date range provided
            if not chart_filter or (not chart_filter.start_date and not chart_filter.end_date):
                start_date, end_date = self._get_default_chart_date_range()
            else:
                start_date = chart_filter.start_date or (date.today() - timedelta(days=6))
                end_date = chart_filter.end_date or date.today()
            
            # Ensure start_date <= end_date
            if start_date > end_date:
                start_date, end_date = end_date, start_date
            
            # Limit to reasonable range
            max_days = 365  # 1 year max
            if (end_date - start_date).days > max_days:
                start_date = end_date - timedelta(days=max_days)
            
            grouping = "daily"
            if chart_filter:
                grouping = chart_filter.grouping
            
            # Get chart data from repository
            chart_points = self.repository.get_chart_data(
                self.db, delivery_person_id,
                start_date, end_date, grouping
            )
            
            # Calculate totals
            total_amount = sum(point["amount"] for point in chart_points)
            total_deliveries = sum(point["deliveries"] for point in chart_points)
            
            # Convert to ChartDataPoint objects
            data_points = [
                ChartDataPoint(**point) for point in chart_points
            ]
            
            chart_data = ChartDataResponse(
                period=grouping,
                data_points=data_points,
                total_amount=total_amount,
                total_deliveries=total_deliveries,
                start_date=start_date,
                end_date=end_date
            )
            
            return ChartDataApiResponse(data=chart_data)
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting chart data: {str(e)}")
            return ChartDataApiResponse(
                success=False,
                message=f"Failed to get chart data: {str(e)}",
                data=ChartDataResponse(
                    period="daily",
                    data_points=[],
                    total_amount=0,
                    total_deliveries=0,
                    start_date=date.today(),
                    end_date=date.today()
                )
            )
    
    def get_transactions(
        self,
        delivery_person_id: int,
        filters: Optional[TransactionFilterRequest] = None
    ) -> TransactionsResponse:
        """Get transaction history"""
        try:
            # Use default filters if not provided
            if not filters:
                filters = TransactionFilterRequest(
                    page=1,
                    per_page=20
                )
            
            # Get transactions from repository
            transactions_data, total_count = self.repository.get_transactions(
                self.db, delivery_person_id, filters
            )
            
            # Convert to TransactionItem objects
            transactions = [
                TransactionItem(**txn_data) for txn_data in transactions_data
            ]
            
            # Calculate summary
            total_amount = sum(txn.amount for txn in transactions)
            settled_amount = sum(txn.amount for txn in transactions if txn.status == TransactionStatus.SETTLED)
            pending_amount = sum(txn.amount for txn in transactions if txn.status == TransactionStatus.PENDING)
            
            summary = {
                "total_transactions": len(transactions),
                "total_amount": total_amount,
                "settled_amount": settled_amount,
                "pending_amount": pending_amount,
                "average_transaction": total_amount / len(transactions) if transactions else 0
            }
            
            # Build pagination info
            pagination = None
            if filters:
                total_pages = (total_count + filters.per_page - 1) // filters.per_page if filters.per_page > 0 else 1
                pagination = {
                    "page": filters.page,
                    "per_page": filters.per_page,
                    "total_items": total_count,
                    "total_pages": total_pages,
                    "has_next": filters.page < total_pages,
                    "has_previous": filters.page > 1
                }
            
            return TransactionsResponse(
                transactions=transactions,
                pagination=pagination,
                summary=summary
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting transactions: {str(e)}")
            return TransactionsResponse(
                success=False,
                message=f"Failed to get transactions: {str(e)}",
                transactions=[],
                summary={
                    "total_transactions": 0,
                    "total_amount": 0,
                    "settled_amount": 0,
                    "pending_amount": 0,
                    "average_transaction": 0
                }
            )
    
    def get_bank_info(
        self,
        delivery_person_id: int
    ) -> BankInfoResponse:
        """Get bank account information"""
        try:
            bank_data = self.repository.get_bank_info(self.db, delivery_person_id)
            
            if not bank_data:
                # Return empty/default bank info
                bank_info = BankInfo(
                    account_holder="",
                    bank_name="",
                    account_number_masked="",
                    ifsc_code="",
                    is_verified=False
                )
            else:
                bank_info = BankInfo(**bank_data)
            
            # Payout schedule (assuming weekly on Monday)
            today = date.today()
            next_payout = None
            if today.weekday() == 0:  # Monday
                next_payout = today
            else:
                days_until_monday = (7 - today.weekday()) % 7
                if days_until_monday == 0:
                    days_until_monday = 7
                next_payout = today + timedelta(days=days_until_monday)
            
            payout_schedule = {
                "frequency": "weekly",
                "day_of_week": "monday",
                "next_payout_date": next_payout,
                "cutoff_time": "23:59:59",  # End of day
                "processing_days": 2  # Days to process after cutoff
            }
            
            return BankInfoResponse(
                bank_info=bank_info,
                payout_schedule=payout_schedule
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting bank info: {str(e)}")
            return BankInfoResponse(
                success=False,
                message=f"Failed to get bank information: {str(e)}",
                bank_info=BankInfo(
                    account_holder="",
                    bank_name="",
                    account_number_masked="",
                    ifsc_code="",
                    is_verified=False
                ),
                payout_schedule={}
            )
    
    def get_payout_history(
        self,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        per_page: int = 20
    ) -> PayoutsResponse:
        """Get payout history"""
        try:
            # Get payouts from repository
            payouts_data, total_count = self.repository.get_payout_history(
                self.db, delivery_person_id, start_date, end_date, page, per_page
            )
            
            # Convert to PayoutHistoryItem objects
            payouts = [
                PayoutHistoryItem(**payout_data) for payout_data in payouts_data
            ]
            
            # Calculate summary
            total_amount = sum(payout.amount for payout in payouts)
            total_transactions = sum(payout.transaction_count for payout in payouts)
            
            summary = {
                "total_payouts": len(payouts),
                "total_amount": total_amount,
                "total_transactions": total_transactions,
                "average_payout": total_amount / len(payouts) if payouts else 0
            }
            
            # Build pagination info
            total_pages = (total_count + per_page - 1) // per_page if per_page > 0 else 1
            pagination = {
                "page": page,
                "per_page": per_page,
                "total_items": total_count,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1
            }
            
            return PayoutsResponse(
                payouts=payouts,
                pagination=pagination,
                summary=summary
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting payout history: {str(e)}")
            return PayoutsResponse(
                success=False,
                message=f"Failed to get payout history: {str(e)}",
                payouts=[],
                summary={
                    "total_payouts": 0,
                    "total_amount": 0,
                    "total_transactions": 0,
                    "average_payout": 0
                }
            )
    
    def get_statement(
        self,
        delivery_person_id: int,
        request: StatementDownloadRequest
    ) -> StatementResponse:
        """Generate earnings statement"""
        try:
            # Get statement data
            statement_data = self.repository.get_statement_data(
                self.db, delivery_person_id,
                request.start_date, request.end_date
            )
            
            # Create StatementData object
            statement = StatementData(**statement_data)
            
            # Generate filename
            filename = f"earnings_statement_{request.start_date}_{request.end_date}.{request.format.value}"
            
            # In a real implementation, you might:
            # 1. Save the statement to storage and return URL
            # 2. Generate CSV/PDF content and return as response
            # 3. Queue background job for large statements
            
            # For now, return the data with instructions for download
            content_type = {
                "csv": "text/csv",
                "pdf": "application/pdf",
                "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }.get(request.format.value, "text/csv")
            
            return StatementResponse(
                statement=statement,
                content_type=content_type,
                filename=filename
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error generating statement: {str(e)}")
            return StatementResponse(
                success=False,
                message=f"Failed to generate statement: {str(e)}",
                statement=StatementData(
                    start_date=request.start_date,
                    end_date=request.end_date,
                    generated_at=datetime.now(),
                    delivery_person_id=delivery_person_id,
                    delivery_person_name="",
                    overview={},
                    transactions=[],
                    payouts=[],
                    bank_info=None
                ),
                content_type="text/plain",
                filename="error.txt"
            )
    
    def generate_csv_statement(
        self,
        statement_data: StatementData
    ) -> str:
        """Generate CSV content from statement data"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Earnings Statement"])
        writer.writerow([f"Period: {statement_data.start_date} to {statement_data.end_date}"])
        writer.writerow([f"Generated: {statement_data.generated_at}"])
        writer.writerow([f"Delivery Person: {statement_data.delivery_person_name}"])
        writer.writerow([])
        
        # Overview
        writer.writerow(["OVERVIEW"])
        writer.writerow(["Total Earnings", f"₹{statement_data.overview.total_earnings:.2f}"])
        writer.writerow(["Settled Amount", f"₹{statement_data.overview.settled_amount:.2f}"])
        writer.writerow(["Pending Settlement", f"₹{statement_data.overview.pending_settlement:.2f}"])
        writer.writerow([])
        
        # Transactions
        writer.writerow(["TRANSACTIONS"])
        writer.writerow(["Date", "Transaction ID", "Description", "Amount", "Status"])
        for txn in statement_data.transactions:
            writer.writerow([
                txn.formatted_date,
                txn.transaction_id,
                txn.description,
                f"₹{txn.amount:.2f}",
                txn.status.value
            ])
        writer.writerow([])
        
        # Payouts
        writer.writerow(["PAYOUTS"])
        writer.writerow(["Date", "Payout ID", "Amount", "Transactions", "Status"])
        for payout in statement_data.payouts:
            writer.writerow([
                payout.formatted_payout_date,
                payout.payout_id,
                f"₹{payout.amount:.2f}",
                payout.transaction_count,
                payout.status.value
            ])
        
        return output.getvalue()
    
    def get_earnings_summary(
        self,
        delivery_person_id: int
    ) -> EarningsSummaryResponse:
        """Get comprehensive earnings summary for dashboard"""
        try:
            # Get overview
            overview_response = self.get_earnings_overview(delivery_person_id)
            
            # Get chart data (last 7 days)
            chart_filter = ChartFilterRequest(
                start_date=date.today() - timedelta(days=6),
                end_date=date.today(),
                grouping="daily"
            )
            chart_response = self.get_chart_data(delivery_person_id, chart_filter)
            
            # Get recent transactions (last 5)
            transaction_filter = TransactionFilterRequest(
                page=1,
                per_page=5
            )
            transactions_response = self.get_transactions(delivery_person_id, transaction_filter)
            
            # Get bank info
            bank_response = self.get_bank_info(delivery_person_id)
            
            return EarningsSummaryResponse(
                overview=overview_response.overview,
                breakdown=overview_response.breakdown,
                chart_data=chart_response.data,
                recent_transactions=transactions_response.transactions[:5],  # Limit to 5
                bank_info=bank_response.bank_info
            )
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting earnings summary: {str(e)}")
            return EarningsSummaryResponse(
                success=False,
                message=f"Failed to get earnings summary: {str(e)}",
                overview=EarningsOverview(
                    total_earnings=0,
                    today_earnings=0,
                    week_earnings=0,
                    month_earnings=0,
                    pending_settlement=0,
                    settled_amount=0,
                    today_deliveries=0,
                    week_deliveries=0,
                    month_deliveries=0,
                    average_per_delivery=0
                ),
                chart_data=ChartDataResponse(
                    period="daily",
                    data_points=[],
                    total_amount=0,
                    total_deliveries=0,
                    start_date=date.today(),
                    end_date=date.today()
                ),
                recent_transactions=[],
                bank_info=None
            )
    
    def get_period_earnings(
        self,
        delivery_person_id: int,
        period: EarningsPeriod,
        custom_start: Optional[date] = None,
        custom_end: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get earnings for a specific period"""
        try:
            today = date.today()
            start_date = None
            end_date = None
            
            if period == EarningsPeriod.TODAY:
                start_date = today
                end_date = today
            elif period == EarningsPeriod.WEEK:
                start_date = today - timedelta(days=today.weekday())
                end_date = start_date + timedelta(days=6)
            elif period == EarningsPeriod.MONTH:
                start_date = today.replace(day=1)
                next_month = start_date.replace(
                    month=start_date.month % 12 + 1,
                    year=start_date.year + (start_date.month // 12)
                )
                end_date = next_month - timedelta(days=1)
            else:  # CUSTOM
                start_date = custom_start or today
                end_date = custom_end or today
            
            # Get earnings for period
            query = self.db.query(
                func.coalesce(func.sum(DeliveryEarnings.amount), 0)
            ).join(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(DeliveryEarnings.earned_at) >= start_date,
                func.date(DeliveryEarnings.earned_at) <= end_date
            )
            
            earnings = float(query.scalar() or 0)
            
            # Get deliveries for period
            deliveries = self.db.query(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                func.date(Delivery.delivered_at) >= start_date,
                func.date(Delivery.delivered_at) <= end_date,
                Delivery.status == "DELIVERED"
            ).count()
            
            return {
                "success": True,
                "period": period.value,
                "start_date": start_date,
                "end_date": end_date,
                "earnings": earnings,
                "deliveries": deliveries,
                "average_per_delivery": earnings / deliveries if deliveries > 0 else 0
            }
            
        except Exception as e:
            # Log error in production
            # logger.error(f"Error getting period earnings: {str(e)}")
            return {
                "success": False,
                "message": f"Failed to get period earnings: {str(e)}",
                "period": period.value,
                "earnings": 0,
                "deliveries": 0,
                "average_per_delivery": 0
            }