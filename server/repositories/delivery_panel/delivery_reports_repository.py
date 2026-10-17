# repositories/delivery_reports_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract, and_, or_, case, cast, Date
from sqlalchemy.sql import label
from datetime import datetime, timedelta
from typing import List, Optional, Tuple, Dict, Any
from models.delivery.delivery import Delivery
from models.delivery.delivery_earnings import DeliveryEarnings
from models.delivery.delivery_person import DeliveryPerson
from models.order.order import Order
from models.user import User
from models.address import Address, Area, City
from schemas.delivery_panel.delivery_reports_schema import ReportRange, DeliveryStatus


class DeliveryReportsRepository:
    
    @staticmethod
    def get_delivery_person_id(db: Session, user_id: int) -> Optional[int]:
        """Get delivery_person_id for a user"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == user_id
        ).first()
        return delivery_person.delivery_person_id if delivery_person else None
    
    @staticmethod
    def get_overall_summary(
        db: Session, 
        delivery_person_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get overall delivery summary statistics"""
        
        query = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply date filters if provided
        if start_date:
            query = query.filter(Delivery.assigned_at >= start_date)
        if end_date:
            query = query.filter(Delivery.assigned_at <= end_date)
        
        # Get all deliveries for calculations
        deliveries = query.all()
        
        if not deliveries:
            return {
                'total_deliveries': 0,
                'completed_deliveries': 0,
                'pending_deliveries': 0,
                'failed_deliveries': 0,
                'cancelled_deliveries': 0,
                'total_earnings': 0.0,
                'average_delivery_time': None,
                'success_rate': 0.0
            }
        
        # Calculate status counts
        status_counts = {
            'DELIVERED': 0,
            'ASSIGNED': 0,
            'PICKED_UP': 0,
            'OUT_FOR_DELIVERY': 0,
            'FAILED': 0,
            'CANCELLED': 0
        }
        
        delivery_times = []
        total_earnings = 0.0
        
        for delivery in deliveries:
            status_counts[delivery.status] = status_counts.get(delivery.status, 0) + 1
            
            # Calculate delivery time for completed deliveries
            if delivery.status == 'DELIVERED' and delivery.assigned_at and delivery.delivered_at:
                delivery_time = (delivery.delivered_at - delivery.assigned_at).total_seconds() / 3600  # hours
                delivery_times.append(delivery_time)
            
            # Get earnings
            earnings = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery.delivery_id
            ).first()
            
            if earnings:
                total_earnings += float(earnings.amount or 0)
        
        completed_deliveries = status_counts['DELIVERED']
        total_deliveries = len(deliveries)
        
        return {
            'total_deliveries': total_deliveries,
            'completed_deliveries': completed_deliveries,
            'pending_deliveries': status_counts['ASSIGNED'] + status_counts['PICKED_UP'] + status_counts['OUT_FOR_DELIVERY'],
            'failed_deliveries': status_counts['FAILED'],
            'cancelled_deliveries': status_counts['CANCELLED'],
            'total_earnings': total_earnings,
            'average_delivery_time': sum(delivery_times) / len(delivery_times) if delivery_times else None,
            'success_rate': (completed_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0.0
        }
    
    @staticmethod
    def get_period_breakdown(
        db: Session,
        delivery_person_id: int,
        report_range: ReportRange,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """Get breakdown by period (weekly/monthly)"""
        
        base_query = db.query(
            func.date_trunc('day', Delivery.assigned_at).label('period'),
            func.count(Delivery.delivery_id).label('total_orders'),
            func.sum(case((Delivery.status == 'DELIVERED', 1), else_=0)).label('completed'),
            func.sum(case((Delivery.status == 'FAILED', 1), else_=0)).label('failed'),
            func.sum(case((Delivery.status == 'CANCELLED', 1), else_=0)).label('cancelled'),
            func.coalesce(func.sum(DeliveryEarnings.amount), 0).label('earnings')
        ).outerjoin(
            DeliveryEarnings, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply date filters
        if start_date:
            base_query = base_query.filter(Delivery.assigned_at >= start_date)
        if end_date:
            base_query = base_query.filter(Delivery.assigned_at <= end_date)
        
        if report_range == ReportRange.WEEKLY:
            base_query = base_query.group_by(
                func.date_trunc('week', Delivery.assigned_at)
            ).order_by(func.date_trunc('week', Delivery.assigned_at).desc())
        elif report_range == ReportRange.MONTHLY:
            base_query = base_query.group_by(
                func.date_trunc('month', Delivery.assigned_at)
            ).order_by(func.date_trunc('month', Delivery.assigned_at).desc())
        else:  # daily for custom/overall
            base_query = base_query.group_by(
                func.date_trunc('day', Delivery.assigned_at)
            ).order_by(func.date_trunc('day', Delivery.assigned_at).desc())
        
        results = base_query.all()
        
        period_breakdown = []
        for period, total, completed, failed, cancelled, earnings in results:
            if period:
                period_breakdown.append({
                    'period': period.strftime('%Y-%m-%d'),
                    'period_start': period,
                    'period_end': period + timedelta(days=6) if report_range == ReportRange.WEEKLY else 
                                 period.replace(day=28) if report_range == ReportRange.MONTHLY else 
                                 period,
                    'total_orders': total or 0,
                    'completed': completed or 0,
                    'failed': failed or 0,
                    'cancelled': cancelled or 0,
                    'earnings': float(earnings or 0)
                })
        
        return period_breakdown
    
    @staticmethod
    def get_trend_data(
        db: Session,
        delivery_person_id: int,
        days: int = 30
    ) -> Dict[str, List]:
        """Get trend data for the last N days"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Get daily trend
        daily_trend = db.query(
            func.date(Delivery.assigned_at).label('date'),
            func.count(Delivery.delivery_id).label('deliveries'),
            func.coalesce(func.sum(DeliveryEarnings.amount), 0).label('earnings')
        ).outerjoin(
            DeliveryEarnings, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.assigned_at >= start_date,
            Delivery.assigned_at <= end_date
        ).group_by(
            func.date(Delivery.assigned_at)
        ).order_by(
            func.date(Delivery.assigned_at)
        ).all()
        
        # Fill missing dates
        dates = []
        delivery_counts = []
        earnings_data = []
        
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            dates.append(date_str)
            
            # Find data for this date
            found = False
            for trend in daily_trend:
                if trend.date and trend.date.strftime('%Y-%m-%d') == date_str:
                    delivery_counts.append(trend.deliveries or 0)
                    earnings_data.append(float(trend.earnings or 0))
                    found = True
                    break
            
            if not found:
                delivery_counts.append(0)
                earnings_data.append(0.0)
            
            current_date += timedelta(days=1)
        
        return {
            'labels': dates,
            'delivery_data': delivery_counts,
            'earnings_data': earnings_data
        }
    
    @staticmethod
    def get_order_wise_report(
        db: Session,
        delivery_person_id: int,
        status_filter: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get detailed order-wise delivery report"""
        
        query = db.query(
            Delivery,
            DeliveryEarnings,
            Order,
            User,
            Address,
            Area,
            City
        ).join(
            Order, Delivery.order_id == Order.order_id
        ).join(
            User, Order.user_id == User.user_id
        ).outerjoin(
            DeliveryEarnings, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).outerjoin(
            Address, Order.address_id == Address.address_id
        ).outerjoin(
            Area, Address.area_id == Area.area_id
        ).outerjoin(
            City, Area.city_id == City.city_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply filters
        if status_filter:
            query = query.filter(Delivery.status == status_filter)
        
        if start_date:
            query = query.filter(Delivery.assigned_at >= start_date)
        if end_date:
            query = query.filter(Delivery.assigned_at <= end_date)
        
        results = query.order_by(
            desc(Delivery.assigned_at)
        ).limit(limit).all()
        
        order_reports = []
        for delivery, earnings, order, user, address, area, city in results:
            # Calculate delivery time in minutes
            delivery_time = None
            if delivery.status == 'DELIVERED' and delivery.assigned_at and delivery.delivered_at:
                delivery_time = int((delivery.delivered_at - delivery.assigned_at).total_seconds() / 60)
            
            # Build address string
            address_str = None
            if address and area and city:
                address_str = f"{address.line1}, {area.area_name}, {city.city_name}"
            
            order_reports.append({
                'order_id': order.order_id,
                'delivery_id': delivery.delivery_id,
                'customer_name': f"{user.first_name} {user.last_name}",
                'delivery_date': delivery.assigned_at,
                'status': delivery.status,
                'distance_km': float(delivery.distance_km) if delivery.distance_km else None,
                'earning_amount': float(earnings.amount) if earnings else 0.0,
                'delivery_time_minutes': delivery_time,
                'address': address_str
            })
        
        return order_reports
    
    @staticmethod
    def get_weekly_summary(
        db: Session,
        delivery_person_id: int
    ) -> List[Dict[str, Any]]:
        """Get weekly summary for the last 8 weeks"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(weeks=8)
        
        weekly_data = db.query(
            func.date_trunc('week', Delivery.assigned_at).label('week_start'),
            func.count(Delivery.delivery_id).label('total_orders'),
            func.sum(case((Delivery.status == 'DELIVERED', 1), else_=0)).label('completed'),
            func.sum(case((Delivery.status == 'FAILED', 1), else_=0)).label('failed'),
            func.sum(case((Delivery.status == 'CANCELLED', 1), else_=0)).label('cancelled'),
            func.coalesce(func.sum(DeliveryEarnings.amount), 0).label('earnings')
        ).outerjoin(
            DeliveryEarnings, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.assigned_at >= start_date,
            Delivery.assigned_at <= end_date
        ).group_by(
            func.date_trunc('week', Delivery.assigned_at)
        ).order_by(
            desc(func.date_trunc('week', Delivery.assigned_at))
        ).all()
        
        return [
            {
                'period': f"Week {i+1}",
                'period_start': week_start,
                'period_end': week_start + timedelta(days=6),
                'total_orders': total_orders or 0,
                'completed': completed or 0,
                'failed': failed or 0,
                'cancelled': cancelled or 0,
                'earnings': float(earnings or 0)
            }
            for i, (week_start, total_orders, completed, failed, cancelled, earnings) in enumerate(weekly_data)
            if week_start
        ]
    
    @staticmethod
    def get_monthly_summary(
        db: Session,
        delivery_person_id: int
    ) -> List[Dict[str, Any]]:
        """Get monthly summary for the last 6 months"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=180)  # ~6 months
        
        monthly_data = db.query(
            func.date_trunc('month', Delivery.assigned_at).label('month_start'),
            func.count(Delivery.delivery_id).label('total_orders'),
            func.sum(case((Delivery.status == 'DELIVERED', 1), else_=0)).label('completed'),
            func.sum(case((Delivery.status == 'FAILED', 1), else_=0)).label('failed'),
            func.sum(case((Delivery.status == 'CANCELLED', 1), else_=0)).label('cancelled'),
            func.coalesce(func.sum(DeliveryEarnings.amount), 0).label('earnings')
        ).outerjoin(
            DeliveryEarnings, Delivery.delivery_id == DeliveryEarnings.delivery_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.assigned_at >= start_date,
            Delivery.assigned_at <= end_date
        ).group_by(
            func.date_trunc('month', Delivery.assigned_at)
        ).order_by(
            desc(func.date_trunc('month', Delivery.assigned_at))
        ).all()
        
        return [
            {
                'period': month_start.strftime('%b %Y'),
                'period_start': month_start,
                'period_end': month_start.replace(day=28) + timedelta(days=4),  # Approximate month end
                'total_orders': total_orders or 0,
                'completed': completed or 0,
                'failed': failed or 0,
                'cancelled': cancelled or 0,
                'earnings': float(earnings or 0)
            }
            for month_start, total_orders, completed, failed, cancelled, earnings in monthly_data
            if month_start
        ]