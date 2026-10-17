from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, extract, case, text
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal

# Import models (same as dashboard)
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.user import User
from models.payment import Payment

# Import schemas
from schemas.delivery_panel.delivery_earnings_schema import (
    EarningsPeriod, TransactionType, TransactionStatus,
    DateFilterRequest, ChartFilterRequest, TransactionFilterRequest
)


class DeliveryEarningsRepository:
    
    @staticmethod
    def _apply_date_filters(query, start_date: Optional[date], end_date: Optional[date], period: Optional[EarningsPeriod] = None):
        """Apply date filters to query - matches dashboard logic"""
        if period:
            today = date.today()
            if period == EarningsPeriod.TODAY:
                query = query.filter(func.date(DeliveryEarnings.earned_at) == today)
            elif period == EarningsPeriod.WEEK:
                week_start = today - timedelta(days=today.weekday())
                week_end = week_start + timedelta(days=6)
                query = query.filter(
                    func.date(DeliveryEarnings.earned_at) >= week_start,
                    func.date(DeliveryEarnings.earned_at) <= week_end
                )
            elif period == EarningsPeriod.MONTH:
                month_start = today.replace(day=1)
                next_month = month_start.replace(
                    month=month_start.month % 12 + 1,
                    year=month_start.year + (month_start.month // 12)
                )
                month_end = next_month - timedelta(days=1)
                query = query.filter(
                    func.date(DeliveryEarnings.earned_at) >= month_start,
                    func.date(DeliveryEarnings.earned_at) <= month_end
                )
        
        # Apply custom date range
        if start_date:
            query = query.filter(func.date(DeliveryEarnings.earned_at) >= start_date)
        if end_date:
            query = query.filter(func.date(DeliveryEarnings.earned_at) <= end_date)
        
        return query
    
    @staticmethod
    def _apply_delivery_date_filters(query, start_date: Optional[date], end_date: Optional[date], period: Optional[EarningsPeriod] = None):
        """Apply date filters using delivery dates (for deliveries without earnings records)"""
        if period:
            today = date.today()
            if period == EarningsPeriod.TODAY:
                query = query.filter(func.date(Delivery.delivered_at) == today)
            elif period == EarningsPeriod.WEEK:
                week_start = today - timedelta(days=today.weekday())
                week_end = week_start + timedelta(days=6)
                query = query.filter(
                    func.date(Delivery.delivered_at) >= week_start,
                    func.date(Delivery.delivered_at) <= week_end
                )
            elif period == EarningsPeriod.MONTH:
                month_start = today.replace(day=1)
                next_month = month_start.replace(
                    month=month_start.month % 12 + 1,
                    year=month_start.year + (month_start.month // 12)
                )
                month_end = next_month - timedelta(days=1)
                query = query.filter(
                    func.date(Delivery.delivered_at) >= month_start,
                    func.date(Delivery.delivered_at) <= month_end
                )
        
        # Apply custom date range
        if start_date:
            query = query.filter(func.date(Delivery.delivered_at) >= start_date)
        if end_date:
            query = query.filter(func.date(Delivery.delivered_at) <= end_date)
        
        return query
    
    @staticmethod
    def get_earnings_overview(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Get earnings overview - matches dashboard calculation logic"""
        today = date.today()
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())
        
        # Today's earnings (from DeliveryEarnings table)
        today_earnings_result = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            DeliveryEarnings.earned_at >= today_start,
            DeliveryEarnings.earned_at <= today_end
        ).scalar()
        
        today_earnings = float(today_earnings_result or 0)
        
        # Today's deliveries (for average calculation)
        today_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivered_at >= today_start,
            Delivery.delivered_at <= today_end,
            Delivery.status == "DELIVERED"
        ).count()
        
        # This week (Monday to Sunday)
        week_start = today - timedelta(days=today.weekday())
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        # End of week
        week_end = week_start + timedelta(days=6)
        week_end_dt = datetime.combine(week_end, datetime.max.time())
        
        week_earnings_result = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            DeliveryEarnings.earned_at >= week_start_dt,
            DeliveryEarnings.earned_at <= week_end_dt
        ).scalar()
        
        week_earnings = float(week_earnings_result or 0)
        week_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivered_at >= week_start_dt,
            Delivery.delivered_at <= week_end_dt,
            Delivery.status == "DELIVERED"
        ).count()
        
        # This month
        month_start = today.replace(day=1)
        month_start_dt = datetime.combine(month_start, datetime.min.time())
        
        next_month = month_start.replace(
            month=month_start.month % 12 + 1,
            year=month_start.year + (month_start.month // 12)
        )
        month_end = next_month - timedelta(days=1)
        month_end_dt = datetime.combine(month_end, datetime.max.time())
        
        month_earnings_result = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            DeliveryEarnings.earned_at >= month_start_dt,
            DeliveryEarnings.earned_at <= month_end_dt
        ).scalar()
        
        month_earnings = float(month_earnings_result or 0)
        month_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivered_at >= month_start_dt,
            Delivery.delivered_at <= month_end_dt,
            Delivery.status == "DELIVERED"
        ).count()
        
        # Total earnings
        total_earnings_result = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).scalar()
        
        total_earnings = float(total_earnings_result or 0)
        
        # Pending settlement (delivered but no earnings record yet)
        pending_earnings_query = db.query(
            func.coalesce(func.sum(Order.delivery_fee), 0)
        ).select_from(Delivery).join(Order).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            ~Delivery.earnings.any()  # No earnings record exists
        )
        pending_earnings = float(pending_earnings_query.scalar() or 0)
        
        # Settled amount (total - pending)
        settled_amount = total_earnings
        
        # Last settlement date
        last_settlement = db.query(DeliveryEarnings).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).order_by(desc(DeliveryEarnings.earned_at)).first()
        
        last_settlement_date = None
        if last_settlement and last_settlement.earned_at:
            last_settlement_date = last_settlement.earned_at.date()
        
        # Next payout date
        next_payout_date = None
        if today.weekday() == 0:  # Monday
            next_payout_date = today + timedelta(days=7)
        else:
            days_until_monday = (7 - today.weekday()) % 7
            if days_until_monday == 0:
                days_until_monday = 7
            next_payout_date = today + timedelta(days=days_until_monday)
        
        # Average per delivery
        avg_per_delivery = 0
        if today_deliveries > 0:
            avg_per_delivery = today_earnings / today_deliveries
        
        return {
            "total_earnings": total_earnings,
            "today_earnings": today_earnings,
            "week_earnings": week_earnings,
            "month_earnings": month_earnings,
            "pending_settlement": pending_earnings,
            "settled_amount": settled_amount,
            "last_settlement_date": last_settlement_date,
            "next_payout_date": next_payout_date,
            "today_deliveries": today_deliveries,
            "week_deliveries": week_deliveries,
            "month_deliveries": month_deliveries,
            "average_per_delivery": avg_per_delivery
        }
    
    @staticmethod
    def get_earnings_breakdown(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, float]:
        """Get breakdown of earnings by type"""
        query = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        if start_date:
            start_dt = datetime.combine(start_date, datetime.min.time())
            query = query.filter(DeliveryEarnings.earned_at >= start_dt)
        if end_date:
            end_dt = datetime.combine(end_date, datetime.max.time())
            query = query.filter(DeliveryEarnings.earned_at <= end_dt)
        
        delivery_fees = float(query.scalar() or 0)
        
        return {
            "delivery_fees": delivery_fees,
            "peak_bonus": 0.0,
            "distance_bonus": 0.0,
            "rating_bonus": 0.0,
            "incentives": 0.0,
            "penalties": 0.0
        }
    
    @staticmethod
    def get_chart_data(
        db: Session,
        delivery_person_id: int,
        start_date: date,
        end_date: date,
        grouping: str = "daily"
    ) -> List[Dict[str, Any]]:
        """Get earnings data for charts - grouped by time period"""
        
        start_dt = datetime.combine(start_date, datetime.min.time())
        end_dt = datetime.combine(end_date, datetime.max.time())

        if grouping == "daily":
            # For SQLite compatibility and general safety, we will pull data and group in Python for daily, week, month
            # Or use extract('year'), extract('month'), extract('day')
            
            # Using Python grouping is safer for cross-DB compatibility for simple charts
            
            records = db.query(DeliveryEarnings).join(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                DeliveryEarnings.earned_at >= start_dt,
                DeliveryEarnings.earned_at <= end_dt
            ).all()
            
            # Process in Python
            data_map = {}
            current_date = start_date
            while current_date <= end_date:
                data_map[current_date.isoformat()] = {"amount": 0.0, "deliveries": 0}
                current_date += timedelta(days=1)
            
            for record in records:
                r_date = record.earned_at.date().isoformat()
                if r_date in data_map:
                    data_map[r_date]["amount"] += float(record.amount)
                    data_map[r_date]["deliveries"] += 1
            
            chart_data = []
            for d in sorted(data_map.keys()):
                d_obj = datetime.strptime(d, "%Y-%m-%d").date()
                chart_data.append({
                    "date": d,
                    "label": d_obj.strftime("%b %d"),
                    "amount": data_map[d]["amount"],
                    "deliveries": data_map[d]["deliveries"],
                    "average_per_delivery": data_map[d]["amount"] / data_map[d]["deliveries"] if data_map[d]["deliveries"] else 0
                })
                
            return chart_data
            
        elif grouping == "weekly":
            records = db.query(DeliveryEarnings).join(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                DeliveryEarnings.earned_at >= start_dt,
                DeliveryEarnings.earned_at <= end_dt
            ).all()
            
            # Group by week
            data_map = {} # Key: "Year-Week"
            
            for record in records:
                # ISO week
                year, week, _ = record.earned_at.isocalendar()
                key = f"{year}-{week}"
                
                if key not in data_map:
                    # Find start of week
                    week_start = date.fromisocalendar(year, week, 1)
                    data_map[key] = {
                         "date": week_start.isoformat(),
                         "label": f"Week {week}",
                         "amount": 0.0,
                         "deliveries": 0,
                         "year": year, 
                         "week": week
                    }
                
                data_map[key]["amount"] += float(record.amount)
                data_map[key]["deliveries"] += 1
                
            # Convert to list and sort
            chart_data = []
            # We should probably fill gaps, but for weekly/monthly maybe just showing active ones matches user expectation or sorted 
            for key in sorted(data_map.keys()):
                 item = data_map[key]
                 chart_data.append({
                    "date": item["date"],
                    "label": item["label"],
                    "amount": item["amount"],
                    "deliveries": item["deliveries"],
                    "average_per_delivery": item["amount"] / item["deliveries"] if item["deliveries"] else 0
                })
            
            return chart_data
            
        else:  # monthly
            records = db.query(DeliveryEarnings).join(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                DeliveryEarnings.earned_at >= start_dt,
                DeliveryEarnings.earned_at <= end_dt
            ).all()
            
            data_map = {}
            for record in records:
                year = record.earned_at.year
                month = record.earned_at.month
                key = f"{year}-{month:02d}"
                
                if key not in data_map:
                     month_date = date(year, month, 1)
                     data_map[key] = {
                         "date": month_date.isoformat(),
                         "label": month_date.strftime("%b %Y"),
                         "amount": 0.0,
                         "deliveries": 0
                     }
                
                data_map[key]["amount"] += float(record.amount)
                data_map[key]["deliveries"] += 1
                
            chart_data = []
            for key in sorted(data_map.keys()):
                 item = data_map[key]
                 chart_data.append({
                    "date": item["date"],
                    "label": item["label"],
                    "amount": item["amount"],
                    "deliveries": item["deliveries"],
                    "average_per_delivery": item["amount"] / item["deliveries"] if item["deliveries"] else 0
                })
            
            return chart_data
    
    @staticmethod
    def get_transactions(
        db: Session,
        delivery_person_id: int,
        filters: Optional[TransactionFilterRequest] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get transaction history - using earnings records as transactions"""
        
        # Base query for earnings transactions
        query = db.query(
            DeliveryEarnings,
            Delivery
        ).join(
            Delivery, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply date filters
        if filters and filters.date_filter:
            # Re-implement date filter logic locally to match python objects
            df = filters.date_filter
            if df.start_date:
                query = query.filter(DeliveryEarnings.earned_at >= datetime.combine(df.start_date, datetime.min.time()))
            if df.end_date:
                query = query.filter(DeliveryEarnings.earned_at <= datetime.combine(df.end_date, datetime.max.time()))
                
            if df.period == EarningsPeriod.TODAY:
                today = date.today()
                query = query.filter(
                    DeliveryEarnings.earned_at >= datetime.combine(today, datetime.min.time()),
                    DeliveryEarnings.earned_at <= datetime.combine(today, datetime.max.time())
                )
            # ... (other periods omitted for brevity, logic follows same pattern if needed)
        
        # Order by date
        query = query.order_by(desc(DeliveryEarnings.earned_at))
        
        # Count total
        total_count = query.count()
        
        # Apply pagination
        if filters:
            offset = (filters.page - 1) * filters.per_page
            query = query.offset(offset).limit(filters.per_page)
        
        results = query.all()
        
        # Format transactions
        transactions = []
        for idx, (earning, delivery) in enumerate(results):
            transaction_id = f"TXN-{earning.earning_id:06d}"
            
            # Get order for reference
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            order_ref = f"ORD-{order.order_id:05d}" if order else None
            
            transactions.append({
                "transaction_id": transaction_id,
                "reference_id": order_ref,
                "type": TransactionType.DELIVERY_FEE,
                "description": f"Delivery fee for {order_ref}" if order_ref else "Delivery fee",
                "amount": float(earning.amount),
                "status": TransactionStatus.SETTLED,  # Earnings record means settled
                "transaction_date": earning.earned_at,
                "settled_date": earning.earned_at,  # Same as earned date in this model
                "payment_method": None,  # Will be updated when payment tracking is added
                "bank_reference": None
            })
        
        return transactions, total_count
    
    @staticmethod
    def get_bank_info(
        db: Session,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get bank account information from delivery person"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person: # or not delivery_person.documents: # Relax check for now
            return None
        
        # Placeholder bank info
        return {
            "account_holder": f"{delivery_person.user.first_name} {delivery_person.user.last_name}",
            "bank_name": "HDFC Bank",
            "account_number_masked": "••••••••5678",
            "ifsc_code": "HDFC0001234",
            "account_type": "Savings",
            "branch_name": "Main Branch",
            "is_verified": True,
            "verified_at": delivery_person.joined_at,
            "last_updated": delivery_person.joined_at
        }
    
    @staticmethod
    def get_payout_history(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get payout history - using earnings as payouts in this simplified model"""
        
        query = db.query(DeliveryEarnings).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        if start_date:
            query = query.filter(DeliveryEarnings.earned_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(DeliveryEarnings.earned_at <= datetime.combine(end_date, datetime.max.time()))
        
        # Load all logic in python for simplicity in this grouping
        # (For production, SQL grouping is better but requires cross-db compatible SQL)
        all_earnings = query.all()
        
        # Group by date
        payouts_map = {}
        for earning in all_earnings:
            d = earning.earned_at.date()
            if d not in payouts_map:
                payouts_map[d] = {"amount": 0.0, "count": 0}
            payouts_map[d]["amount"] += float(earning.amount)
            payouts_map[d]["count"] += 1
            
        # Convert to list
        results = []
        for d in sorted(payouts_map.keys(), reverse=True):
             results.append({
                 "payout_date": d,
                 "amount": payouts_map[d]["amount"],
                 "transaction_count": payouts_map[d]["count"]
             })
             
        total_count = len(results)
        
        # Pagination
        start = (page - 1) * per_page
        end = start + per_page
        paginated = results[start:end]
        
        payouts = []
        for idx, result in enumerate(paginated):
            payout_id = f"PAY-{idx + 1 + start:06d}"
            payouts.append({
                "payout_id": payout_id,
                "amount": result['amount'],
                "status": TransactionStatus.SETTLED,
                "payout_date": result['payout_date'],
                "settlement_date": result['payout_date'],
                "transaction_count": result['transaction_count'],
                "bank_reference": None,
                "payment_method": "BANK_TRANSFER"
            })
        
        return payouts, total_count

    @staticmethod
    def get_statement_data(
        db: Session,
        delivery_person_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Get data for earnings statement"""
        # Reuse existing methods with dates
        overview = DeliveryEarningsRepository.get_earnings_overview(db, delivery_person_id)
        
        # For statement we usually want specific range, so logic duplicates a bit but ok.
        # ... (rest of implementation can stay similar or rely on helpers)
        
        # Simplified for now:
        filters = TransactionFilterRequest(
            date_filter=DateFilterRequest(start_date=start_date, end_date=end_date),
            page=1, per_page=1000
        )
        transactions, _ = DeliveryEarningsRepository.get_transactions(db, delivery_person_id, filters)
        
        payouts, _ = DeliveryEarningsRepository.get_payout_history(db, delivery_person_id, start_date, end_date, 1, 1000)
        
        bank_info = DeliveryEarningsRepository.get_bank_info(db, delivery_person_id)
        
        delivery_person = db.query(DeliveryPerson).filter(DeliveryPerson.delivery_person_id == delivery_person_id).first()
        delivery_person_name = f"{delivery_person.user.first_name} {delivery_person.user.last_name}"
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "generated_at": datetime.now(),
            "delivery_person_id": delivery_person_id,
            "delivery_person_name": delivery_person_name,
            "overview": overview,
            "transactions": transactions,
            "payouts": payouts,
            "bank_info": bank_info
        }
    
    @staticmethod
    def get_period_comparison(
        db: Session,
        delivery_person_id: int,
        current_start: date,
        current_end: date,
        previous_start: date,
        previous_end: date
    ) -> Dict[str, Any]:
        # Pythonic implementation for safety
        current_start_dt = datetime.combine(current_start, datetime.min.time())
        current_end_dt = datetime.combine(current_end, datetime.max.time())
        previous_start_dt = datetime.combine(previous_start, datetime.min.time())
        previous_end_dt = datetime.combine(previous_end, datetime.max.time())
        
        current_earnings = db.query(func.coalesce(func.sum(DeliveryEarnings.amount), 0)).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            DeliveryEarnings.earned_at >= current_start_dt,
            DeliveryEarnings.earned_at <= current_end_dt
        ).scalar() or 0
        
        current_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivered_at >= current_start_dt,
            Delivery.delivered_at <= current_end_dt,
            Delivery.status == "DELIVERED"
        ).count()
        
        previous_earnings = db.query(func.coalesce(func.sum(DeliveryEarnings.amount), 0)).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            DeliveryEarnings.earned_at >= previous_start_dt,
            DeliveryEarnings.earned_at <= previous_end_dt
        ).scalar() or 0
        
        previous_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivered_at >= previous_start_dt,
            Delivery.delivered_at <= previous_end_dt,
            Delivery.status == "DELIVERED"
        ).count()
        
        earnings_change = 0
        if previous_earnings > 0:
            earnings_change = ((float(current_earnings) - float(previous_earnings)) / float(previous_earnings)) * 100
            
        deliveries_change = 0
        if previous_deliveries > 0:
            deliveries_change = ((current_deliveries - previous_deliveries) / previous_deliveries) * 100
            
        return {
            "current_period": {
                "start_date": current_start,
                "end_date": current_end,
                "earnings": float(current_earnings),
                "deliveries": current_deliveries
            },
            "previous_period": {
                "start_date": previous_start,
                "end_date": previous_end,
                "earnings": float(previous_earnings),
                "deliveries": previous_deliveries
            },
            "comparison": {
                "earnings_change": earnings_change,
                "deliveries_change": deliveries_change,
                "is_improvement": earnings_change > 0
            }
        }
    
    @staticmethod
    def get_transactions(
        db: Session,
        delivery_person_id: int,
        filters: Optional[TransactionFilterRequest] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get transaction history - using earnings records as transactions"""
        
        # Base query for earnings transactions
        query = db.query(
            DeliveryEarnings,
            Delivery
        ).join(
            Delivery, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply date filters
        if filters and filters.date_filter:
            query = DeliveryEarningsRepository._apply_date_filters(
                query,
                filters.date_filter.start_date,
                filters.date_filter.end_date,
                filters.date_filter.period
            )
        
        # Order by date
        query = query.order_by(desc(DeliveryEarnings.earned_at))
        
        # Count total
        total_count = query.count()
        
        # Apply pagination
        if filters:
            offset = (filters.page - 1) * filters.per_page
            query = query.offset(offset).limit(filters.per_page)
        
        results = query.all()
        
        # Format transactions
        transactions = []
        for idx, (earning, delivery) in enumerate(results):
            transaction_id = f"TXN-{earning.earning_id:06d}"
            
            # Get order for reference
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            order_ref = f"ORD-{order.order_id:05d}" if order else None
            
            transactions.append({
                "transaction_id": transaction_id,
                "reference_id": order_ref,
                "type": TransactionType.DELIVERY_FEE,
                "description": f"Delivery fee for {order_ref}" if order_ref else "Delivery fee",
                "amount": float(earning.amount),
                "status": TransactionStatus.SETTLED,  # Earnings record means settled
                "transaction_date": earning.earned_at,
                "settled_date": earning.earned_at,  # Same as earned date in this model
                "payment_method": None,  # Will be updated when payment tracking is added
                "bank_reference": None
            })
        
        return transactions, total_count
    
    @staticmethod
    def get_bank_info(
        db: Session,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get bank account information from delivery person"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.documents:
            return None
        
        # Extract bank info from documents (assuming structure)
        documents = delivery_person.documents or {}
        
        # This is a placeholder - actual implementation depends on document structure
        # In real app, you might have separate bank details table
        return {
            "account_holder": f"{delivery_person.user.first_name} {delivery_person.user.last_name}",
            "bank_name": "HDFC Bank",  # Placeholder - should come from DB
            "account_number_masked": "••••••••5678",  # Placeholder
            "ifsc_code": "HDFC0001234",  # Placeholder
            "account_type": "Savings",
            "branch_name": "Gandhinagar Branch",
            "is_verified": True,
            "verified_at": delivery_person.joined_at,
            "last_updated": delivery_person.joined_at
        }
    
    @staticmethod
    def get_payout_history(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get payout history - using earnings as payouts in this simplified model"""
        
        # In this model, each earnings record is treated as a payout
        # In real app, you'd have a separate payouts table
        
        query = db.query(DeliveryEarnings).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        if start_date:
            query = query.filter(func.date(DeliveryEarnings.earned_at) >= start_date)
        if end_date:
            query = query.filter(func.date(DeliveryEarnings.earned_at) <= end_date)
        
        # Group by date to simulate payouts
        subquery = query.subquery()
        
        payout_query = db.query(
            func.date(subquery.c.earned_at).label('payout_date'),
            func.sum(subquery.c.amount).label('amount'),
            func.count(subquery.c.earning_id).label('transaction_count')
        ).group_by(
            func.date(subquery.c.earned_at)
        ).order_by(
            desc(func.date(subquery.c.earned_at))
        )
        
        # Count total
        total_count = payout_query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        payout_query = payout_query.offset(offset).limit(per_page)
        
        results = payout_query.all()
        
        payouts = []
        for idx, result in enumerate(results):
            payout_id = f"PAY-{idx + 1 + offset:06d}"
            
            payouts.append({
                "payout_id": payout_id,
                "amount": float(result.amount or 0),
                "status": TransactionStatus.SETTLED,
                "payout_date": result.payout_date,
                "settlement_date": result.payout_date,
                "transaction_count": result.transaction_count or 0,
                "bank_reference": None,
                "payment_method": "BANK_TRANSFER"
            })
        
        return payouts, total_count
    
    @staticmethod
    def get_statement_data(
        db: Session,
        delivery_person_id: int,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """Get data for earnings statement"""
        # Get overview
        overview = DeliveryEarningsRepository.get_earnings_overview(db, delivery_person_id)
        
        # Get transactions
        filters = TransactionFilterRequest(
            date_filter=DateFilterRequest(
                start_date=start_date,
                end_date=end_date
            ),
            page=1,
            per_page=1000  # Large limit for statement
        )
        transactions, _ = DeliveryEarningsRepository.get_transactions(db, delivery_person_id, filters)
        
        # Get payouts
        payouts, _ = DeliveryEarningsRepository.get_payout_history(
            db, delivery_person_id, start_date, end_date, 1, 1000
        )
        
        # Get bank info
        bank_info = DeliveryEarningsRepository.get_bank_info(db, delivery_person_id)
        
        # Get delivery person info
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        delivery_person_name = ""
        if delivery_person and delivery_person.user:
            delivery_person_name = f"{delivery_person.user.first_name} {delivery_person.user.last_name}"
        
        return {
            "start_date": start_date,
            "end_date": end_date,
            "generated_at": datetime.now(),
            "delivery_person_id": delivery_person_id,
            "delivery_person_name": delivery_person_name,
            "overview": overview,
            "transactions": transactions,
            "payouts": payouts,
            "bank_info": bank_info
        }
    
    @staticmethod
    def get_period_comparison(
        db: Session,
        delivery_person_id: int,
        current_start: date,
        current_end: date,
        previous_start: date,
        previous_end: date
    ) -> Dict[str, Any]:
        """Compare earnings between two periods"""
        
        # Current period earnings
        current_query = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) >= current_start,
            func.date(DeliveryEarnings.earned_at) <= current_end
        )
        current_earnings = float(current_query.scalar() or 0)
        
        current_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.delivered_at) >= current_start,
            func.date(Delivery.delivered_at) <= current_end,
            Delivery.status == "DELIVERED"
        ).count()
        
        # Previous period earnings
        previous_query = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) >= previous_start,
            func.date(DeliveryEarnings.earned_at) <= previous_end
        )
        previous_earnings = float(previous_query.scalar() or 0)
        
        previous_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.delivered_at) >= previous_start,
            func.date(Delivery.delivered_at) <= previous_end,
            Delivery.status == "DELIVERED"
        ).count()
        
        # Calculate changes
        earnings_change = 0
        if previous_earnings > 0:
            earnings_change = ((current_earnings - previous_earnings) / previous_earnings) * 100
        
        deliveries_change = 0
        if previous_deliveries > 0:
            deliveries_change = ((current_deliveries - previous_deliveries) / previous_deliveries) * 100
        
        return {
            "current_period": {
                "start_date": current_start,
                "end_date": current_end,
                "earnings": current_earnings,
                "deliveries": current_deliveries
            },
            "previous_period": {
                "start_date": previous_start,
                "end_date": previous_end,
                "earnings": previous_earnings,
                "deliveries": previous_deliveries
            },
            "comparison": {
                "earnings_change": earnings_change,
                "deliveries_change": deliveries_change,
                "is_improvement": earnings_change > 0
            }
        }