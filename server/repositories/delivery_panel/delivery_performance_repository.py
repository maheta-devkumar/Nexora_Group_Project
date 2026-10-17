# delivery_panel/performance/delivery_performance_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, case, text, extract, Date, cast
from sqlalchemy.sql import label, literal_column
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal
import calendar

# Import models from the provided structure
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.order.order_item import OrderItem
from models.user import User
from models.address import Address, Area, City
from models.payment import Payment
from models.feedback.feedback import Feedback, FeedbackType
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.analytics.review_vote import ReviewVote
from models.product_catalog.product_review import ProductReview

# Import schemas
from schemas.delivery_panel.delivery_performance_schema import PerformanceFilters, DateRangeFilter, PerformancePeriod


class DeliveryPerformanceRepository:
    """Repository for performance-related database operations"""
    
    # ===== CORE METRICS METHODS =====
    
    @staticmethod
    def get_performance_metrics(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get comprehensive performance metrics for a delivery person"""
        
        # Base query for deliveries
        base_filter = and_(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status.in_(["DELIVERED", "CANCELLED", "FAILED"])
        )
        
        if start_date:
            base_filter = and_(base_filter, Delivery.assigned_at >= start_date)
        if end_date:
            base_filter = and_(base_filter, Delivery.assigned_at <= end_date)
        
        # Total deliveries count
        total_query = db.query(func.count(Delivery.delivery_id)).filter(base_filter)
        total_deliveries = total_query.scalar() or 0
        
        # Delivery status breakdown
        status_counts = db.query(
            Delivery.status,
            func.count(Delivery.delivery_id).label('count')
        ).filter(base_filter).group_by(Delivery.status).all()
        
        completed_deliveries = 0
        cancelled_deliveries = 0
        failed_deliveries = 0
        
        for status, count in status_counts:
            if status == "DELIVERED":
                completed_deliveries = count
            elif status == "CANCELLED":
                cancelled_deliveries = count
            elif status == "FAILED":
                failed_deliveries = count
        
        # On-time deliveries (within expected time)
        on_time_deliveries = db.query(func.count(Delivery.delivery_id)).filter(
            and_(
                base_filter,
                Delivery.status == "DELIVERED",
                Delivery.actual_delivery_time.isnot(None),
                Delivery.expected_delivery_time.isnot(None),
                Delivery.actual_delivery_time <= Delivery.expected_delivery_time + timedelta(minutes=30)
            )
        ).scalar() or 0
        
        # On-time rate
        on_time_rate = 0.0
        if completed_deliveries > 0:
            on_time_rate = (on_time_deliveries / completed_deliveries) * 100
        
        # Average rating from feedback
        rating_query = db.query(
            func.avg(Feedback.rating).label('avg_rating'),
            func.count(Feedback.feedback_id).label('rating_count')
        ).join(Order).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                Feedback.rating.isnot(None)
            )
        )
        
        if start_date:
            rating_query = rating_query.filter(Feedback.created_at >= start_date)
        if end_date:
            rating_query = rating_query.filter(Feedback.created_at <= end_date)
        
        rating_result = rating_query.first()
        average_rating = float(rating_result.avg_rating) if rating_result and rating_result.avg_rating else 0.0
        total_rating_count = rating_result.rating_count if rating_result else 0
        
        # Delivery time statistics
        time_stats = db.query(
            func.avg(
                func.extract('epoch', Delivery.actual_delivery_time) -
                func.extract('epoch', Delivery.assigned_at)
            ).label('avg_time'),
            func.min(
                func.extract('epoch', Delivery.actual_delivery_time) -
                func.extract('epoch', Delivery.assigned_at)
            ).label('min_time'),
            func.max(
                func.extract('epoch', Delivery.actual_delivery_time) -
                func.extract('epoch', Delivery.assigned_at)
            ).label('max_time')
        ).filter(
            and_(
                base_filter,
                Delivery.status == "DELIVERED",
                Delivery.actual_delivery_time.isnot(None),
                Delivery.assigned_at.isnot(None)
            )
        ).first()
        
        average_delivery_time = float(time_stats.avg_time / 60) if time_stats and time_stats.avg_time else 0.0
        fastest_delivery_time = float(time_stats.min_time / 60) if time_stats and time_stats.min_time else 0.0
        slowest_delivery_time = float(time_stats.max_time / 60) if time_stats and time_stats.max_time else 0.0
        
        # Distance statistics
        distance_stats = db.query(
            func.sum(Delivery.distance_km).label('total_distance'),
            func.avg(Delivery.distance_km).label('avg_distance')
        ).filter(
            and_(
                base_filter,
                Delivery.status == "DELIVERED",
                Delivery.distance_km.isnot(None)
            )
        ).first()
        
        total_distance_km = float(distance_stats.total_distance) if distance_stats and distance_stats.total_distance else 0.0
        average_distance_km = float(distance_stats.avg_distance) if distance_stats and distance_stats.avg_distance else 0.0
        
        # Earnings statistics
        earnings_stats = db.query(
            func.sum(DeliveryEarnings.amount).label('total_earnings'),
            func.avg(DeliveryEarnings.amount).label('avg_earnings')
        ).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED"
            )
        )
        
        if start_date:
            earnings_stats = earnings_stats.filter(DeliveryEarnings.earned_at >= start_date)
        if end_date:
            earnings_stats = earnings_stats.filter(DeliveryEarnings.earned_at <= end_date)
        
        earnings_result = earnings_stats.first()
        total_earnings = float(earnings_result.total_earnings) if earnings_result and earnings_result.total_earnings else 0.0
        average_earnings_per_delivery = float(earnings_result.avg_earnings) if earnings_result and earnings_result.avg_earnings else 0.0
        
        # Pending deliveries
        pending_deliveries = db.query(func.count(Delivery.delivery_id)).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
        ).scalar() or 0
        
        return {
            "total_deliveries": total_deliveries,
            "completed_deliveries": completed_deliveries,
            "pending_deliveries": pending_deliveries,
            "cancelled_deliveries": cancelled_deliveries,
            "failed_deliveries": failed_deliveries,
            "on_time_deliveries": on_time_deliveries,
            "on_time_rate": on_time_rate,
            "average_rating": average_rating,
            "total_rating_count": total_rating_count,
            "average_delivery_time": average_delivery_time,
            "fastest_delivery_time": fastest_delivery_time,
            "slowest_delivery_time": slowest_delivery_time,
            "total_distance_km": total_distance_km,
            "average_distance_km": average_distance_km,
            "total_earnings": total_earnings,
            "average_earnings_per_delivery": average_earnings_per_delivery
        }
    
    # ===== TIME SERIES DATA =====
    
    @staticmethod
    def get_time_series_data(
        db: Session,
        delivery_person_id: int,
        metric: str,
        start_date: date,
        end_date: date,
        group_by: str = 'day'
    ) -> List[Dict[str, Any]]:
        """Get time series data for charts"""
        
        # PostgreSQL date formatting functions
        if group_by == 'day':
            date_trunc = func.date_trunc('day', Delivery.assigned_at)
            date_format = lambda col: func.to_char(col, 'YYYY-MM-DD')
        elif group_by == 'week':
            date_trunc = func.date_trunc('week', Delivery.assigned_at)
            date_format = lambda col: func.to_char(col, 'IYYY"-W"IW')
        elif group_by == 'month':
            date_trunc = func.date_trunc('month', Delivery.assigned_at)
            date_format = lambda col: func.to_char(col, 'YYYY-MM')
        else:
            date_trunc = func.date_trunc('day', Delivery.assigned_at)
            date_format = lambda col: func.to_char(col, 'YYYY-MM-DD')
        
        base_query = db.query(
            label('period', date_format(Delivery.assigned_at)),
            label('date', func.date(Delivery.assigned_at))
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.assigned_at >= start_date,
                Delivery.assigned_at <= end_date
            )
        ).group_by(date_format(Delivery.assigned_at), func.date(Delivery.assigned_at))
        
        if metric == 'deliveries':
            result = base_query.add_columns(
                func.count(Delivery.delivery_id).label('value')
            ).order_by('date').all()
        
        elif metric == 'rating':
            # Rating comes from feedback
            result = db.query(
                label('period', date_format(Feedback.created_at)),
                label('date', func.date(Feedback.created_at)),
                label('value', func.avg(Feedback.rating))
            ).join(Order).join(Delivery).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                    Feedback.rating.isnot(None),
                    Feedback.created_at >= start_date,
                    Feedback.created_at <= end_date
                )
            ).group_by(
                date_format(Feedback.created_at),
                func.date(Feedback.created_at)
            ).order_by('date').all()
        
        elif metric == 'on_time':
            result = db.query(
                label('period', date_format(Delivery.assigned_at)),
                label('date', func.date(Delivery.assigned_at)),
                label('value', 
                    func.avg(
                        case(
                            (
                                and_(
                                    Delivery.actual_delivery_time.isnot(None),
                                    Delivery.expected_delivery_time.isnot(None),
                                    Delivery.actual_delivery_time <= Delivery.expected_delivery_time + timedelta(minutes=30)
                                ),
                                100.0
                            ),
                            else_=0.0
                        )
                    )
                )
            ).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    Delivery.status == "DELIVERED",
                    Delivery.assigned_at >= start_date,
                    Delivery.assigned_at <= end_date
                )
            ).group_by(date_format(Delivery.assigned_at), func.date(Delivery.assigned_at)).order_by('date').all()
        
        elif metric == 'earnings':
            result = db.query(
                label('period', date_format(DeliveryEarnings.earned_at)),
                label('date', func.date(DeliveryEarnings.earned_at)),
                label('value', func.sum(DeliveryEarnings.amount))
            ).join(Delivery).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    Delivery.status == "DELIVERED",
                    DeliveryEarnings.earned_at >= start_date,
                    DeliveryEarnings.earned_at <= end_date
                )
            ).group_by(date_format(DeliveryEarnings.earned_at), func.date(DeliveryEarnings.earned_at)).order_by('date').all()
        
        elif metric == 'distance':
            result = db.query(
                label('period', date_format(Delivery.assigned_at)),
                label('date', func.date(Delivery.assigned_at)),
                label('value', func.avg(Delivery.distance_km))
            ).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    Delivery.status == "DELIVERED",
                    Delivery.distance_km.isnot(None),
                    Delivery.assigned_at >= start_date,
                    Delivery.assigned_at <= end_date
                )
            ).group_by(date_format(Delivery.assigned_at), func.date(Delivery.assigned_at)).order_by('date').all()
        
        elif metric == 'delivery_time':
            result = db.query(
                label('period', date_format(Delivery.assigned_at)),
                label('date', func.date(Delivery.assigned_at)),
                label('value', 
                    func.avg(
                        func.extract('epoch', Delivery.actual_delivery_time) -
                        func.extract('epoch', Delivery.assigned_at)
                    ) / 60  # Convert to minutes
                )
            ).filter(
                and_(
                    Delivery.delivery_person_id == delivery_person_id,
                    Delivery.status == "DELIVERED",
                    Delivery.actual_delivery_time.isnot(None),
                    Delivery.assigned_at.isnot(None),
                    Delivery.assigned_at >= start_date,
                    Delivery.assigned_at <= end_date
                )
            ).group_by(date_format(Delivery.assigned_at), func.date(Delivery.assigned_at)).order_by('date').all()
        
        else:
            return []
        
        # Format results
        formatted_results = []
        for row in result:
            value = float(row.value) if row.value is not None else 0.0
            formatted_results.append({
                "date": row.date.strftime('%Y-%m-%d') if hasattr(row.date, 'strftime') else str(row.date),
                "value": value,
                "period": str(row.period)
            })
        
        return formatted_results
    
    # ===== RATING HISTORY =====
    
    @staticmethod
    def get_rating_history(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], Dict[str, int]]:
        """Get detailed rating history with distribution"""
        
        # Base query for ratings
        base_query = db.query(
            Feedback,
            Order,
            User,
            Delivery
        ).join(
            Order, Order.order_id == Feedback.order_id
        ).join(
            User, User.user_id == Order.user_id
        ).join(
            Delivery, Delivery.order_id == Order.order_id
        ).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                Feedback.rating.isnot(None)
            )
        )
        
        if start_date:
            base_query = base_query.filter(Feedback.created_at >= start_date)
        if end_date:
            base_query = base_query.filter(Feedback.created_at <= end_date)
        
        # Get paginated results
        ratings_data = base_query.order_by(
            desc(Feedback.created_at)
        ).offset(offset).limit(limit).all()
        
        # Get distribution
        distribution_query = db.query(
            Feedback.rating,
            func.count(Feedback.feedback_id).label('count')
        ).join(Order).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                Feedback.rating.isnot(None)
            )
        )
        
        if start_date:
            distribution_query = distribution_query.filter(Feedback.created_at >= start_date)
        if end_date:
            distribution_query = distribution_query.filter(Feedback.created_at <= end_date)
        
        distribution_results = distribution_query.group_by(Feedback.rating).all()
        
        # Initialize distribution
        distribution = {
            "one_star": 0,
            "two_stars": 0,
            "three_stars": 0,
            "four_stars": 0,
            "five_stars": 0
        }
        
        for rating_val, count in distribution_results:
            if rating_val == 1:
                distribution["one_star"] = count
            elif rating_val == 2:
                distribution["two_stars"] = count
            elif rating_val == 3:
                distribution["three_stars"] = count
            elif rating_val == 4:
                distribution["four_stars"] = count
            elif rating_val == 5:
                distribution["five_stars"] = count
        
        # Format ratings
        formatted_ratings = []
        for feedback, order, user, delivery in ratings_data:
            # Calculate delivery time
            delivery_time_minutes = None
            if delivery.assigned_at and delivery.actual_delivery_time:
                time_diff = (delivery.actual_delivery_time - delivery.assigned_at).total_seconds() / 60
                delivery_time_minutes = round(time_diff, 1)
            
            # Check if on-time
            is_on_time = False
            if delivery.expected_delivery_time and delivery.actual_delivery_time:
                is_on_time = delivery.actual_delivery_time <= delivery.expected_delivery_time + timedelta(minutes=30)
            
            formatted_ratings.append({
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer_name": f"{user.first_name} {user.last_name}",
                "rating": feedback.rating,
                "review_text": feedback.message,
                "review_date": feedback.created_at,
                "delivery_time_minutes": delivery_time_minutes,
                "is_on_time": is_on_time
            })
        
        return formatted_ratings, distribution
    
    # ===== BADGE CALCULATION DATA =====
    
    @staticmethod
    def get_badge_calculation_data(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Get data needed for badge calculations"""
        
        today = date.today()
        thirty_days_ago = today - timedelta(days=30)
        
        # Total deliveries
        total_deliveries = db.query(func.count(Delivery.delivery_id)).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED"
            )
        ).scalar() or 0
        
        # Last 30 days deliveries
        recent_deliveries = db.query(func.count(Delivery.delivery_id)).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.assigned_at >= thirty_days_ago
            )
        ).scalar() or 0
        
        # Average rating
        avg_rating = db.query(func.avg(Feedback.rating)).join(Order).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                Feedback.rating.isnot(None)
            )
        ).scalar() or 0.0
        
        # On-time streak (consecutive on-time deliveries)
        # Get last 20 deliveries ordered by date
        recent_deliveries_list = db.query(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.actual_delivery_time.isnot(None),
                Delivery.expected_delivery_time.isnot(None)
            )
        ).order_by(desc(Delivery.delivered_at)).limit(20).all()
        
        on_time_streak = 0
        for delivery in recent_deliveries_list:
            if delivery.actual_delivery_time <= delivery.expected_delivery_time + timedelta(minutes=30):
                on_time_streak += 1
            else:
                break
        
        # Same day deliveries (deliveries completed on the same day they were assigned)
        same_day_deliveries = db.query(func.count(Delivery.delivery_id)).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                func.date(Delivery.assigned_at) == func.date(Delivery.delivered_at)
            )
        ).scalar() or 0
        
        # Perfect ratings (5-star)
        perfect_ratings = db.query(func.count(Feedback.feedback_id)).join(Order).join(Delivery).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK,
                Feedback.rating == 5
            )
        ).scalar() or 0
        
        # No cancellation streak
        cancelled_recently = db.query(func.count(Delivery.delivery_id)).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "CANCELLED",
                Delivery.assigned_at >= thirty_days_ago
            )
        ).scalar() or 0
        
        no_cancellation_streak = 30 if cancelled_recently == 0 else 0
        
        # Earnings milestones
        total_earnings = db.query(func.sum(DeliveryEarnings.amount)).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).scalar() or 0.0
        
        # Distance milestones
        total_distance = db.query(func.sum(Delivery.distance_km)).filter(
            and_(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.distance_km.isnot(None)
            )
        ).scalar() or 0.0
        
        return {
            "total_deliveries": total_deliveries,
            "recent_deliveries": recent_deliveries,
            "average_rating": float(avg_rating),
            "on_time_streak": on_time_streak,
            "same_day_deliveries": same_day_deliveries,
            "perfect_ratings": perfect_ratings,
            "no_cancellation_streak": no_cancellation_streak,
            "total_earnings": float(total_earnings),
            "total_distance_km": float(total_distance),
            "has_cancellations_recently": cancelled_recently > 0
        }
    
    # ===== PEER COMPARISON =====
    
    @staticmethod
    def get_peer_comparison(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get comparison data with other delivery persons"""
        
        # Get all delivery persons (excluding inactive)
        all_delivery_persons = db.query(DeliveryPerson).filter(
            DeliveryPerson.status == "ACTIVE"
        ).all()
        
        if not all_delivery_persons:
            return {"error": "No delivery persons found"}
        
        comparison_data = {}
        
        for dp in all_delivery_persons:
            metrics = DeliveryPerformanceRepository.get_performance_metrics(
                db, dp.delivery_person_id, start_date, end_date
            )
            comparison_data[dp.delivery_person_id] = metrics
        
        # Calculate averages
        total_persons = len(comparison_data)
        
        averages = {
            "on_time_rate": sum(data["on_time_rate"] for data in comparison_data.values()) / total_persons,
            "average_rating": sum(data["average_rating"] for data in comparison_data.values()) / total_persons,
            "average_delivery_time": sum(data["average_delivery_time"] for data in comparison_data.values()) / total_persons,
            "completed_deliveries": sum(data["completed_deliveries"] for data in comparison_data.values()) / total_persons,
            "total_earnings": sum(data["total_earnings"] for data in comparison_data.values()) / total_persons,
        }
        
        # Get current person's metrics
        current_metrics = comparison_data.get(delivery_person_id, {})
        
        # Calculate percentiles
        def calculate_percentile(current_value, all_values):
            if not all_values:
                return 50.0
            sorted_values = sorted(all_values)
            less_than = sum(1 for v in sorted_values if v < current_value)
            equal_to = sum(1 for v in sorted_values if v == current_value)
            return (less_than + 0.5 * equal_to) / len(sorted_values) * 100
        
        on_time_values = [data["on_time_rate"] for data in comparison_data.values()]
        rating_values = [data["average_rating"] for data in comparison_data.values()]
        delivery_time_values = [data["average_delivery_time"] for data in comparison_data.values()]
        deliveries_values = [data["completed_deliveries"] for data in comparison_data.values()]
        earnings_values = [data["total_earnings"] for data in comparison_data.values()]
        
        percentiles = {
            "on_time_rate": calculate_percentile(current_metrics.get("on_time_rate", 0), on_time_values),
            "average_rating": calculate_percentile(current_metrics.get("average_rating", 0), rating_values),
            "average_delivery_time": calculate_percentile(current_metrics.get("average_delivery_time", 0), delivery_time_values),
            "completed_deliveries": calculate_percentile(current_metrics.get("completed_deliveries", 0), deliveries_values),
            "total_earnings": calculate_percentile(current_metrics.get("total_earnings", 0), earnings_values),
        }
        
        # Calculate rank
        sorted_by_rating = sorted(
            comparison_data.items(),
            key=lambda x: x[1].get("average_rating", 0),
            reverse=True
        )
        
        rank = next(
            (i + 1 for i, (dp_id, _) in enumerate(sorted_by_rating) if dp_id == delivery_person_id),
            total_persons + 1
        )
        
        return {
            "averages": averages,
            "percentiles": percentiles,
            "rank": rank,
            "total_peers": total_persons - 1,  # Excluding self
            "current_metrics": current_metrics
        }
    
    # ===== TREND ANALYSIS =====
    
    @staticmethod
    def get_performance_trends(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Analyze performance trends over time"""
        
        today = date.today()
        current_month_start = today.replace(day=1)
        last_month_start = (current_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = current_month_start - timedelta(days=1)
        
        # Current month metrics
        current_month_metrics = DeliveryPerformanceRepository.get_performance_metrics(
            db, delivery_person_id, current_month_start, today
        )
        
        # Last month metrics
        last_month_metrics = DeliveryPerformanceRepository.get_performance_metrics(
            db, delivery_person_id, last_month_start, last_month_end
        )
        
        # Calculate trends
        trends = []
        
        def calculate_trend(current, previous, metric_name, unit=""):
            if previous == 0:
                # If no previous data, we can't calculate a trend
                return {
                    "metric": metric_name,
                    "current": current,
                    "previous": previous,
                    "change": 0,
                    "direction": "new" if current > 0 else "stable",
                    "unit": unit
                }
            
            change = ((current - previous) / previous) * 100
            
            if change > 10:
                direction = "improving"
            elif change < -10:
                direction = "declining"
            else:
                direction = "stable"
            
            return {
                "metric": metric_name,
                "current": current,
                "previous": previous,
                "change": change,
                "direction": direction,
                "unit": unit
            }
        
        # On-time rate trend
        on_time_trend = calculate_trend(
            current_month_metrics.get("on_time_rate", 0),
            last_month_metrics.get("on_time_rate", 0),
            "on_time_rate",
            "%"
        )
        trends.append(on_time_trend)
        
        # Rating trend
        rating_trend = calculate_trend(
            current_month_metrics.get("average_rating", 0),
            last_month_metrics.get("average_rating", 0),
            "average_rating",
            "stars"
        )
        trends.append(rating_trend)
        
        # Delivery time trend (lower is better)
        current_time = current_month_metrics.get("average_delivery_time", 0)
        previous_time = last_month_metrics.get("average_delivery_time", 0)
        
        if previous_time == 0:
            time_change = 0
        else:
            time_change = ((previous_time - current_time) / previous_time) * 100
        
        time_trend = {
            "metric": "average_delivery_time",
            "current": current_time,
            "previous": previous_time,
            "change": time_change,
            "direction": "improving" if time_change > 5 else "declining" if time_change < -5 else "stable",
            "unit": "minutes"
        }
        trends.append(time_trend)
        
        # Deliveries trend
        deliveries_trend = calculate_trend(
            current_month_metrics.get("completed_deliveries", 0),
            last_month_metrics.get("completed_deliveries", 0),
            "completed_deliveries",
            "deliveries"
        )
        trends.append(deliveries_trend)
        
        # Earnings trend
        earnings_trend = calculate_trend(
            current_month_metrics.get("total_earnings", 0),
            last_month_metrics.get("total_earnings", 0),
            "total_earnings",
            "₹"
        )
        trends.append(earnings_trend)
        
        # Overall trend (weighted average)
        positive_trends = sum(1 for t in trends if t.get("direction") == "improving")
        negative_trends = sum(1 for t in trends if t.get("direction") == "declining")
        
        if positive_trends > negative_trends:
            overall_trend = "improving"
        elif negative_trends > positive_trends:
            overall_trend = "declining"
        else:
            overall_trend = "stable"
        
        return {
            "trends": trends,
            "overall_trend": overall_trend,
            "current_month": current_month_start.strftime("%B %Y"),
            "previous_month": last_month_start.strftime("%B %Y")
        }



    # ===== DETAILED DELIVERY RECORDS =====
    
    @staticmethod
    def get_detailed_delivery_records(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        status_filter: Optional[List[str]] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Tuple[List[Dict[str, Any]], int]:
        """Get detailed delivery records for performance analysis"""
        
        base_query = db.query(
            Delivery,
            Order,
            User
        ).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            User, User.user_id == Order.user_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply date filters
        if start_date:
            base_query = base_query.filter(Delivery.assigned_at >= start_date)
        if end_date:
            base_query = base_query.filter(Delivery.assigned_at <= end_date)
        
        # Apply status filter
        if status_filter:
            base_query = base_query.filter(Delivery.status.in_(status_filter))
        
        # Get total count
        total_count = base_query.count()
        
        # Get paginated results
        results = base_query.order_by(
            desc(Delivery.assigned_at)
        ).offset(offset).limit(limit).all()
        
        # Format results
        formatted_results = []
        for delivery, order, user in results:
            # Get rating if exists
            rating_query = db.query(Feedback).filter(
                Feedback.order_id == order.order_id,
                Feedback.feedback_type == FeedbackType.DELIVERY_FEEDBACK
            ).first()
            
            # Calculate delivery time
            actual_time = None
            if delivery.assigned_at and delivery.actual_delivery_time:
                time_diff = (delivery.actual_delivery_time - delivery.assigned_at).total_seconds() / 60
                actual_time = round(time_diff, 1)
            
            # Check if on-time
            is_on_time = False
            if delivery.expected_delivery_time and delivery.actual_delivery_time:
                is_on_time = delivery.actual_delivery_time <= delivery.expected_delivery_time + timedelta(minutes=30)
            
            # Get earnings
            earnings = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery.delivery_id
            ).first()
            
            formatted_results.append({
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer_name": f"{user.first_name} {user.last_name}",
                "delivery_date": delivery.assigned_at,
                "status": delivery.status,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else 0.0,
                "estimated_time_minutes": None,  # Not available in model
                "actual_time_minutes": actual_time,
                "is_on_time": is_on_time,
                "earnings": float(earnings.amount) if earnings else 0.0,
                "rating": rating_query.rating if rating_query else None,
                "feedback_type": rating_query.feedback_type if rating_query else None
            })
        
        return formatted_results, total_count