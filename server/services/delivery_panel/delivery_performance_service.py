# delivery_panel/performance/delivery_performance_service.py
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
import math

# Import repository and schemas
from repositories.delivery_panel.delivery_performance_repository import DeliveryPerformanceRepository
from schemas.delivery_panel.delivery_performance_schema import (
    PerformanceMetrics, PerformanceMetricsResponse, DateRangeFilter,
    PerformancePeriod, DataPoint, TimeSeriesData, PerformanceChartData,
    PerformanceChartsResponse, CustomerRating, RatingDistribution,
    RatingHistoryResponse, PerformanceBadge, BadgeType, BadgeTier,
    BadgeRequirement, BadgesResponse, PerformanceTrend, TrendAnalysisResponse,
    PeerComparison, ComparisonResponse, PerformanceDeliveryRecord,
    DeliveryRecordsResponse, PeriodSummary, PeriodSummaryResponse,
    AchievementMilestone, MilestonesResponse, CompletePerformanceResponse,
    PerformanceFilters, BadgeDefinition
)

from services.notification_service import NotificationService


class DeliveryPerformanceService:
    """Service layer for performance calculations and business logic"""
    
    # Badge definitions (dynamically calculated, not stored in DB)
    BADGE_DEFINITIONS = [
        # Milestone badges
        BadgeDefinition(
            badge_id="first_delivery",
            badge_type=BadgeType.MILESTONE,
            badge_tier=BadgeTier.BRONZE,
            title="First Delivery",
            description="Completed your first delivery",
            icon_key="package",
            requirements=[
                BadgeRequirement(metric="total_deliveries", threshold=1)
            ],
            priority=1
        ),
        BadgeDefinition(
            badge_id="ten_deliveries",
            badge_type=BadgeType.MILESTONE,
            badge_tier=BadgeTier.BRONZE,
            title="Ten Deliveries",
            description="Completed 10 deliveries",
            icon_key="package",
            requirements=[
                BadgeRequirement(metric="total_deliveries", threshold=10)
            ],
            priority=2
        ),
        BadgeDefinition(
            badge_id="fifty_deliveries",
            badge_type=BadgeType.MILESTONE,
            badge_tier=BadgeTier.SILVER,
            title="Fifty Deliveries",
            description="Completed 50 deliveries",
            icon_key="package",
            requirements=[
                BadgeRequirement(metric="total_deliveries", threshold=50)
            ],
            priority=3
        ),
        BadgeDefinition(
            badge_id="hundred_deliveries",
            badge_type=BadgeType.MILESTONE,
            badge_tier=BadgeTier.GOLD,
            title="Hundred Deliveries",
            description="Completed 100 deliveries",
            icon_key="package",
            requirements=[
                BadgeRequirement(metric="total_deliveries", threshold=100)
            ],
            priority=4
        ),
        BadgeDefinition(
            badge_id="five_hundred_deliveries",
            badge_type=BadgeType.MILESTONE,
            badge_tier=BadgeTier.PLATINUM,
            title="Five Hundred Deliveries",
            description="Completed 500 deliveries",
            icon_key="package",
            requirements=[
                BadgeRequirement(metric="total_deliveries", threshold=500)
            ],
            priority=5
        ),
        
        # Rating badges
        BadgeDefinition(
            badge_id="four_star_rating",
            badge_type=BadgeType.RATING,
            badge_tier=BadgeTier.SILVER,
            title="Four Star Rating",
            description="Maintain 4.0+ average rating",
            icon_key="star",
            requirements=[
                BadgeRequirement(metric="average_rating", threshold=4.0)
            ],
            priority=6
        ),
        BadgeDefinition(
            badge_id="four_point_five_star",
            badge_type=BadgeType.RATING,
            badge_tier=BadgeTier.GOLD,
            title="Four Point Five Star",
            description="Maintain 4.5+ average rating",
            icon_key="star",
            requirements=[
                BadgeRequirement(metric="average_rating", threshold=4.5)
            ],
            priority=7
        ),
        BadgeDefinition(
            badge_id="perfect_rating",
            badge_type=BadgeType.RATING,
            badge_tier=BadgeTier.PLATINUM,
            title="Perfect Rating",
            description="Maintain 5.0 average rating for 30 days",
            icon_key="star",
            requirements=[
                BadgeRequirement(metric="average_rating", threshold=4.9),
                BadgeRequirement(metric="recent_perfect_ratings", threshold=10, period="30_days")
            ],
            priority=8
        ),
        
        # Consistency badges
        BadgeDefinition(
            badge_id="on_time_streak_10",
            badge_type=BadgeType.CONSISTENCY,
            badge_tier=BadgeTier.SILVER,
            title="On-Time Streak",
            description="10 consecutive on-time deliveries",
            icon_key="clock",
            requirements=[
                BadgeRequirement(metric="on_time_streak", threshold=10)
            ],
            priority=9
        ),
        BadgeDefinition(
            badge_id="on_time_streak_20",
            badge_type=BadgeType.CONSISTENCY,
            badge_tier=BadgeTier.GOLD,
            title="On-Time Master",
            description="20 consecutive on-time deliveries",
            icon_key="clock",
            requirements=[
                BadgeRequirement(metric="on_time_streak", threshold=20)
            ],
            priority=10
        ),
        BadgeDefinition(
            badge_id="no_cancellation_month",
            badge_type=BadgeType.CONSISTENCY,
            badge_tier=BadgeTier.GOLD,
            title="No Cancellation Month",
            description="No cancellations for 30 days",
            icon_key="x-circle",
            requirements=[
                BadgeRequirement(metric="no_cancellation_streak", threshold=30, period="30_days")
            ],
            priority=11
        ),
        
        # Speed badges
        BadgeDefinition(
            badge_id="same_day_delivery_10",
            badge_type=BadgeType.SPEED,
            badge_tier=BadgeTier.SILVER,
            title="Same Day Specialist",
            description="10 same-day deliveries",
            icon_key="zap",
            requirements=[
                BadgeRequirement(metric="same_day_deliveries", threshold=10)
            ],
            priority=12
        ),
        BadgeDefinition(
            badge_id="fast_delivery",
            badge_type=BadgeType.SPEED,
            badge_tier=BadgeTier.GOLD,
            title="Fast Delivery Expert",
            description="Average delivery time under 30 minutes",
            icon_key="zap",
            requirements=[
                BadgeRequirement(metric="average_delivery_time", threshold=30)
            ],
            priority=13
        ),
        
        # Earnings badges
        BadgeDefinition(
            badge_id="earnings_10000",
            badge_type=BadgeType.EFFICIENCY,
            badge_tier=BadgeTier.GOLD,
            title="₹10,000 Earnings",
            description="Earned ₹10,000 total",
            icon_key="dollar-sign",
            requirements=[
                BadgeRequirement(metric="total_earnings", threshold=10000)
            ],
            priority=14
        ),
        BadgeDefinition(
            badge_id="earnings_50000",
            badge_type=BadgeType.EFFICIENCY,
            badge_tier=BadgeTier.PLATINUM,
            title="₹50,000 Earnings",
            description="Earned ₹50,000 total",
            icon_key="dollar-sign",
            requirements=[
                BadgeRequirement(metric="total_earnings", threshold=50000)
            ],
            priority=15
        ),
    ]
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryPerformanceRepository()
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
    
    # ===== DATE RANGE CALCULATION =====
    
    def _calculate_date_range(self, period_filter: DateRangeFilter) -> Tuple[date, date]:
        """Calculate start and end dates based on period filter"""
        today = date.today()
        
        if period_filter.period == PerformancePeriod.TODAY:
            start_date = today
            end_date = today
            
        elif period_filter.period == PerformancePeriod.LAST_7_DAYS:
            start_date = today - timedelta(days=6)
            end_date = today
            
        elif period_filter.period == PerformancePeriod.LAST_30_DAYS:
            start_date = today - timedelta(days=29)
            end_date = today
            
        elif period_filter.period == PerformancePeriod.THIS_MONTH:
            start_date = today.replace(day=1)
            end_date = today
            
        elif period_filter.period == PerformancePeriod.LAST_MONTH:
            first_day_current = today.replace(day=1)
            last_month_last_day = first_day_current - timedelta(days=1)
            start_date = last_month_last_day.replace(day=1)
            end_date = last_month_last_day
            
        elif period_filter.period == PerformancePeriod.CUSTOM:
            if not period_filter.start_date or not period_filter.end_date:
                raise ValueError("Custom period requires both start_date and end_date")
            start_date = period_filter.start_date
            end_date = period_filter.end_date
            
        else:
            # Default to last 7 days
            start_date = today - timedelta(days=6)
            end_date = today
        
        return start_date, end_date
    
    # ===== PERFORMANCE METRICS =====
    
    def get_performance_metrics(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter
    ) -> PerformanceMetricsResponse:
        """Get comprehensive performance metrics"""
        
        start_date, end_date = self._calculate_date_range(period_filter)
        
        # Get metrics from repository
        metrics_data = self.repository.get_performance_metrics(
            self.db, delivery_person_id, start_date, end_date
        )
        
        # Create metrics object
        metrics = PerformanceMetrics(**metrics_data)
        
        # Format date range for response
        date_range = None
        if start_date != end_date:
            date_range = {
                "start_date": start_date,
                "end_date": end_date
            }
        
        return PerformanceMetricsResponse(
            metrics=metrics,
            period=period_filter.period,
            date_range=date_range,
            last_updated=datetime.now()
        )
    
    # ===== CHART DATA =====
    
    def get_performance_charts(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter,
        group_by: str = 'day'
    ) -> PerformanceChartsResponse:
        """Get chart data for performance visualization"""
        
        start_date, end_date = self._calculate_date_range(period_filter)
        
        # Get time series data for different metrics
        rating_data = self.repository.get_time_series_data(
            self.db, delivery_person_id, 'rating', start_date, end_date, group_by
        )
        deliveries_data = self.repository.get_time_series_data(
            self.db, delivery_person_id, 'deliveries', start_date, end_date, group_by
        )
        on_time_data = self.repository.get_time_series_data(
            self.db, delivery_person_id, 'on_time', start_date, end_date, group_by
        )
        earnings_data = self.repository.get_time_series_data(
            self.db, delivery_person_id, 'earnings', start_date, end_date, group_by
        )
        distance_data = self.repository.get_time_series_data(
            self.db, delivery_person_id, 'distance', start_date, end_date, group_by
        )
        
        # Create TimeSeriesData objects
        rating_trend = TimeSeriesData(
            data_points=[DataPoint(**dp) for dp in rating_data],
            metric_name="average_rating",
            metric_label="Average Rating",
            unit="stars"
        )
        
        deliveries_trend = TimeSeriesData(
            data_points=[DataPoint(**dp) for dp in deliveries_data],
            metric_name="deliveries_count",
            metric_label="Deliveries Completed",
            unit="deliveries"
        )
        
        on_time_trend = TimeSeriesData(
            data_points=[DataPoint(**dp) for dp in on_time_data],
            metric_name="on_time_rate",
            metric_label="On-Time Rate",
            unit="%"
        )
        
        earnings_trend = TimeSeriesData(
            data_points=[DataPoint(**dp) for dp in earnings_data],
            metric_name="earnings",
            metric_label="Earnings",
            unit="₹"
        )
        
        distance_trend = TimeSeriesData(
            data_points=[DataPoint(**dp) for dp in distance_data],
            metric_name="average_distance",
            metric_label="Average Distance",
            unit="km"
        )
        
        # Create chart data
        chart_data = PerformanceChartData(
            rating_trend=rating_trend,
            deliveries_trend=deliveries_trend,
            on_time_trend=on_time_trend,
            earnings_trend=earnings_trend,
            distance_trend=distance_trend
        )
        
        # Format date range for response
        date_range = None
        if start_date != end_date:
            date_range = {
                "start_date": start_date,
                "end_date": end_date
            }
        
        return PerformanceChartsResponse(
            charts=chart_data,
            period=period_filter.period,
            date_range=date_range
        )
    
    # ===== RATING HISTORY =====
    
    def get_rating_history(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter,
        limit: int = 50,
        offset: int = 0
    ) -> RatingHistoryResponse:
        """Get detailed rating history with distribution"""
        
        start_date, end_date = self._calculate_date_range(period_filter)
        
        # Get ratings from repository
        ratings_list, distribution_data = self.repository.get_rating_history(
            self.db, delivery_person_id, start_date, end_date, limit, offset
        )
        
        # Calculate average rating
        if ratings_list:
            average_rating = sum(r['rating'] for r in ratings_list) / len(ratings_list)
        else:
            average_rating = 0.0
        
        # Create rating objects
        ratings = [CustomerRating(**rating) for rating in ratings_list]
        
        # Create distribution object
        distribution = RatingDistribution(**distribution_data)
        
        # Format date range for response
        date_range = None
        if start_date != end_date:
            date_range = {
                "start_date": start_date,
                "end_date": end_date
            }
        
        return RatingHistoryResponse(
            ratings=ratings,
            distribution=distribution,
            average_rating=round(average_rating, 1),
            total_ratings=sum(distribution_data.values()),
            period=period_filter.period,
            date_range=date_range
        )
    
    # ===== BADGE CALCULATION =====
    
    def _check_badge_requirements(
        self,
        badge_def: BadgeDefinition,
        badge_data: Dict[str, Any]
    ) -> Tuple[bool, float]:
        """Check if badge requirements are met and calculate progress"""
        
        is_earned = True
        progress = 0.0
        
        for req in badge_def.requirements:
            metric_value = badge_data.get(req.metric, 0)
            
            if metric_value >= req.threshold:
                # Requirement met
                req_progress = 1.0
            else:
                # Requirement not met
                is_earned = False
                req_progress = min(metric_value / req.threshold, 1.0) if req.threshold > 0 else 0.0
            
            # Update overall progress (average of all requirements)
            progress = (progress + req_progress) / 2 if progress > 0 else req_progress
        
        return is_earned, progress
    
    def _get_earned_badge_ids(self, delivery_person_id: int) -> List[str]:
        """Get list of already earned badge IDs (from database or cache)"""
        # In a real implementation, this would query a table that stores earned badges
        # For now, we'll check a session-based cache
        # You should implement proper badge storage in production
        return []  # Empty for now - would need badge storage table
    
    def _save_earned_badge(self, delivery_person_id: int, badge_id: str):
        """Save earned badge to database"""
        # In a real implementation, this would save to a 'delivery_person_badges' table
        # For now, we'll just print/log
        print(f"✅ Badge earned: {badge_id} by delivery person {delivery_person_id}")
        # TODO: Implement badge storage table
    
    def calculate_badges(
        self,
        delivery_person_id: int,
        check_for_new: bool = False
    ) -> List[PerformanceBadge]:
        """Calculate earned badges based on performance data"""
        
        # Get badge calculation data
        badge_data = self.repository.get_badge_calculation_data(
            self.db, delivery_person_id
        )
        
        # Add derived metrics
        # Recent perfect ratings (last 30 days)
        badge_data["recent_perfect_ratings"] = badge_data.get("perfect_ratings", 0)
        
        # Calculate average delivery time (needs to be fetched)
        metrics = self.repository.get_performance_metrics(
            self.db, delivery_person_id, None, None
        )
        badge_data["average_delivery_time"] = metrics.get("average_delivery_time", 0)
        
        # Get already earned badges
        earned_badge_ids = self._get_earned_badge_ids(delivery_person_id)
        
        earned_badges = []
        newly_earned_badges = []
        
        for badge_def in self.BADGE_DEFINITIONS:
            is_earned, progress = self._check_badge_requirements(badge_def, badge_data)
            
            # Check if already recorded as earned
            already_recorded = badge_def.badge_id in earned_badge_ids
            
            # Determine if this is newly earned
            is_newly_earned = is_earned and not already_recorded
            
            # If newly earned and we're checking for new badges, save it
            if is_newly_earned and check_for_new:
                self._save_earned_badge(delivery_person_id, badge_def.badge_id)
                newly_earned_badges.append(badge_def)
            
            badge = PerformanceBadge(
                badge_id=badge_def.badge_id,
                badge_type=badge_def.badge_type,
                badge_tier=badge_def.badge_tier,
                title=badge_def.title,
                description=badge_def.description,
                icon_key=badge_def.icon_key,
                earned_date=date.today() if is_earned else None,
                is_new=is_newly_earned,  # Mark as new if just earned
                requirements=badge_def.requirements,
                progress=progress if not is_earned else None,
                is_earned=is_earned
            )
            
            earned_badges.append(badge)
        
        # ============================================
        # SEND NOTIFICATIONS FOR NEWLY EARNED BADGES
        # ============================================
        if newly_earned_badges and check_for_new:
            self._send_badge_notifications(delivery_person_id, newly_earned_badges)
        
        # Sort badges: earned first, then by progress, then by priority
        earned_badges.sort(key=lambda x: (
            not x.is_earned,  # Earned first
            -x.progress if x.progress else 0,  # Higher progress first
            -next((b.priority for b in self.BADGE_DEFINITIONS if b.badge_id == x.badge_id), 0)
        ))
        
        return earned_badges
    
    def get_badges(
        self,
        delivery_person_id: int
    ) -> BadgesResponse:
        """Get earned badges and next achievable badges"""
        
        # Calculate badges with new badge checking
        badges = self.calculate_badges(delivery_person_id, check_for_new=True)
        
        # Separate earned and next badges
        earned = [b for b in badges if b.is_earned]
        next_badges = [b for b in badges if not b.is_earned]
        
        # Sort next badges by progress (closest to earning)
        next_badges.sort(key=lambda x: -x.progress if x.progress else 0)
        
        # Limit next badges to top 5
        next_badges = next_badges[:5]
        
        return BadgesResponse(
            badges=badges,
            total_badges=len(badges),
            earned_badges=len(earned),
            next_badges=next_badges
        )
    
    # ===== BADGE NOTIFICATION METHODS =====
    
    def _send_badge_notifications(self, delivery_person_id: int, new_badges: List[BadgeDefinition]):
        """Send notifications for newly earned badges"""
        try:
            # Get delivery person details to find their user_id
            # Assuming DeliveryPerson model has user_id field
            from models.delivery.delivery_person import DeliveryPerson
            delivery_person = self.db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person or not hasattr(delivery_person, 'user_id'):
                print(f"⚠️ Cannot send badge notification: No user_id found for delivery person {delivery_person_id}")
                return
            
            delivery_person_user_id = delivery_person.user_id
            
            # Send notification for each new badge
            for badge in new_badges:
                try:
                    # Determine badge tier emoji
                    tier_emojis = {
                        BadgeTier.BRONZE: "🥉",
                        BadgeTier.SILVER: "🥈", 
                        BadgeTier.GOLD: "🥇",
                        BadgeTier.PLATINUM: "💎"
                    }
                    
                    tier_emoji = tier_emojis.get(badge.badge_tier, "🏅")
                    
                    self.notification_service.send_notification(
                        user_id=delivery_person_user_id,
                        title=f"{tier_emoji} New Achievement Unlocked!",
                        message=f"Congratulations! You've earned the '{badge.title}' badge: {badge.description}",
                        type="ACHIEVEMENT",
                        reference_id=delivery_person_id
                    )
                    print(f"✅ Badge notification sent for '{badge.title}' to user {delivery_person_user_id}")
                    
                except Exception as badge_error:
                    print(f"⚠️ Failed to send notification for badge {badge.badge_id}: {badge_error}")
                    
        except Exception as e:
            print(f"⚠️ Error in badge notification system: {e}")
    
    def check_and_notify_new_badges(self, delivery_person_id: int):
        """Check for new badges and send notifications (call this after delivery completion)"""
        try:
            # Calculate badges with new badge checking enabled
            badges = self.calculate_badges(delivery_person_id, check_for_new=True)
            
            # Return count of new badges
            new_badges_count = len([b for b in badges if b.is_new])
            
            if new_badges_count > 0:
                print(f"🎉 {new_badges_count} new badge(s) earned by delivery person {delivery_person_id}")
            
            return new_badges_count
            
        except Exception as e:
            print(f"⚠️ Error checking for new badges: {e}")
            return 0
    
    # ===== TREND ANALYSIS =====
    
    def get_performance_trends(
        self,
        delivery_person_id: int
    ) -> TrendAnalysisResponse:
        """Analyze performance trends"""
        
        trend_data = self.repository.get_performance_trends(
            self.db, delivery_person_id
        )
        
        # Check if we have valid trend data
        if not trend_data or "trends" not in trend_data:
            # Return empty trends if no data
            return TrendAnalysisResponse(
                trends=[],
                overall_trend="stable",
                period="No data available"
            )
        
        # Create trend objects
        trends = []
        for trend in trend_data["trends"]:
            # Generate insight based on trend
            direction = trend.get("direction", "stable")
            metric = trend.get("metric", "")
            change = trend.get("change", 0)
            
            insights = {
                "on_time_rate": {
                    "improving": f"On-time rate improved by {abs(change):.1f}%",
                    "declining": f"On-time rate decreased by {abs(change):.1f}%",
                    "stable": "On-time rate remains stable"
                },
                "average_rating": {
                    "improving": f"Customer ratings improved by {abs(change):.1f}%",
                    "declining": f"Customer ratings decreased by {abs(change):.1f}%",
                    "stable": "Customer ratings remain stable"
                },
                "average_delivery_time": {
                    "improving": f"Delivery speed improved by {abs(change):.1f}%",
                    "declining": f"Delivery speed decreased by {abs(change):.1f}%",
                    "stable": "Delivery speed remains stable"
                },
                "completed_deliveries": {
                    "improving": f"Deliveries increased by {abs(change):.1f}%",
                    "declining": f"Deliveries decreased by {abs(change):.1f}%",
                    "stable": "Delivery volume remains stable"
                },
                "total_earnings": {
                    "improving": f"Earnings increased by {abs(change):.1f}%",
                    "declining": f"Earnings decreased by {abs(change):.1f}%",
                    "stable": "Earnings remain stable"
                }
            }
            
            metric_insights = insights.get(metric, {})
            insight = metric_insights.get(direction, "Performance analysis")
            
            trend_obj = PerformanceTrend(
                trend_direction=direction,
                trend_percentage=abs(change),
                comparison_period=f"vs {trend_data.get('previous_month', 'previous period')}",
                metric=metric,
                insight=insight
            )
            trends.append(trend_obj)
        
        return TrendAnalysisResponse(
            trends=trends,
            overall_trend=trend_data.get("overall_trend", "stable"),
            period=f"{trend_data.get('current_month', 'Current period')} vs {trend_data.get('previous_month', 'Previous period')}"
            # date_range is optional and not needed for month-to-month comparison
        )
    
    # ===== PEER COMPARISON =====
    
    def get_peer_comparison(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter
    ) -> ComparisonResponse:
        """Compare performance with peers"""
        
        start_date, end_date = self._calculate_date_range(period_filter)
        
        comparison_data = self.repository.get_peer_comparison(
            self.db, delivery_person_id, start_date, end_date
        )
        
        if "error" in comparison_data:
            # No peers to compare with
            return ComparisonResponse(
                comparisons=[],
                overall_percentile=50.0,
                period=period_filter.period
            )
        
        # Create comparison objects
        comparisons = []
        
        metrics_to_compare = [
            ("on_time_rate", "On-Time Rate", "%"),
            ("average_rating", "Average Rating", "stars"),
            ("average_delivery_time", "Average Delivery Time", "minutes"),
            ("completed_deliveries", "Completed Deliveries", "deliveries"),
            ("total_earnings", "Total Earnings", "₹")
        ]
        
        for metric_key, metric_name, unit in metrics_to_compare:
            your_value = comparison_data["current_metrics"].get(metric_key, 0)
            avg_value = comparison_data["averages"].get(metric_key, 0)
            percentile = comparison_data["percentiles"].get(metric_key, 50.0)
            
            # For delivery time, lower is better, so invert percentile
            if metric_key == "average_delivery_time":
                percentile = 100 - percentile
            
            comparison = PeerComparison(
                metric=metric_name,
                your_value=your_value,
                average_value=avg_value,
                percentile=percentile,
                rank=comparison_data.get("rank"),
                total_peers=comparison_data.get("total_peers")
            )
            comparisons.append(comparison)
        
        # Calculate overall percentile (average of all percentiles)
        percentiles = [c.percentile for c in comparisons]
        overall_percentile = sum(percentiles) / len(percentiles) if percentiles else 50.0
        
        return ComparisonResponse(
            comparisons=comparisons,
            overall_percentile=overall_percentile,
            period=period_filter.period
        )
    
    # ===== DETAILED DELIVERY RECORDS =====
    
    def get_detailed_delivery_records(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter,
        status_filter: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 50
    ) -> DeliveryRecordsResponse:
        """Get detailed delivery records with pagination"""
        
        start_date, end_date = self._calculate_date_range(period_filter)
        
        offset = (page - 1) * page_size
        
        records, total_count = self.repository.get_detailed_delivery_records(
            self.db, delivery_person_id, start_date, end_date,
            status_filter, page_size, offset
        )
        
        # Calculate total pages
        total_pages = math.ceil(total_count / page_size) if page_size > 0 else 1
        
        # Create record objects
        deliveries = [PerformanceDeliveryRecord(**record) for record in records]
        
        # Format date range for response
        date_range = None
        if start_date != end_date:
            date_range = {
                "start_date": start_date,
                "end_date": end_date
            }
        
        return DeliveryRecordsResponse(
            deliveries=deliveries,
            total_records=total_count,
            period=period_filter.period,
            date_range=date_range,
            page=page,
            total_pages=total_pages
        )
    
    # ===== PERIOD SUMMARY =====
    
    # delivery_panel/performance/delivery_performance_service.py (updated get_period_summary method)
    # ===== PERIOD SUMMARY =====
    
    def get_period_summary(
        self,
        delivery_person_id: int,
        period_type: str = 'monthly',
        months: int = 6
    ) -> PeriodSummaryResponse:
        """Get performance summaries for multiple periods"""
        
        today = date.today()
        summaries = []
        
        for i in range(months):
            if period_type == 'monthly':
                # Calculate month start and end
                month_offset = i
                month_start = (today.replace(day=1) - timedelta(days=month_offset * 28)).replace(day=1)
                if month_start.month == 12:
                    month_end = month_start.replace(year=month_start.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = month_start.replace(month=month_start.month + 1, day=1) - timedelta(days=1)
                
                period_label = month_start.strftime("%b %Y")
                
            elif period_type == 'weekly':
                # Calculate week start and end
                week_offset = i
                week_start = today - timedelta(days=today.weekday() + week_offset * 7)
                week_end = week_start + timedelta(days=6)
                
                period_label = f"Week {week_start.isocalendar().week}, {week_start.year}"
            
            else:
                continue
            
            # Get metrics for this period
            metrics = self.repository.get_performance_metrics(
                self.db, delivery_person_id, week_start if period_type == 'weekly' else month_start,
                week_end if period_type == 'weekly' else month_end
            )
            
            summary = PeriodSummary(
                period=period_label,
                total_deliveries=metrics.get("total_deliveries", 0),
                completed_deliveries=metrics.get("completed_deliveries", 0),
                on_time_rate=metrics.get("on_time_rate", 0),
                average_rating=metrics.get("average_rating", 0),
                total_earnings=metrics.get("total_earnings", 0),
                average_delivery_time=metrics.get("average_delivery_time", 0)
            )
            
            summaries.append(summary)
        
        # Calculate actual date range for the entire period covered
        if summaries:
            if period_type == 'monthly':
                # Parse the first and last month labels to get actual dates
                first_period = summaries[-1].period  # Oldest period
                last_period = summaries[0].period    # Most recent period
                
                # Try to parse the month labels - but date_range expects date objects
                # Instead, we'll calculate actual start and end dates
                oldest_month_start = (today.replace(day=1) - timedelta(days=(months-1) * 28)).replace(day=1)
                recent_month_end = today
                
                date_range = {
                    "start_date": oldest_month_start,
                    "end_date": recent_month_end
                }
            elif period_type == 'weekly':
                # Calculate actual start and end dates
                oldest_week_start = today - timedelta(days=today.weekday() + (months-1) * 7)
                recent_week_end = today
                
                date_range = {
                    "start_date": oldest_week_start,
                    "end_date": recent_week_end
                }
            else:
                date_range = None
        else:
            date_range = None
        
        return PeriodSummaryResponse(
            summaries=summaries,
            period_type=period_type,
            date_range=date_range  # Now passing actual date objects
        )
    
    # ===== ACHIEVEMENT MILESTONES =====
    
        
    def get_achievement_milestones(
        self,
        delivery_person_id: int
    ) -> MilestonesResponse:
        """Get achievement milestones"""
        
        # Get current metrics
        metrics = self.repository.get_performance_metrics(
            self.db, delivery_person_id, None, None
        )
        
        # Define milestones - using float values for all
        milestone_definitions = [
            {
                "id": "deliveries_50",
                "title": "50 Deliveries",
                "description": "Complete 50 deliveries",
                "target": 50.0,  # Changed to float
                "unit": "deliveries",
                "current_metric": "total_deliveries"
            },
            {
                "id": "deliveries_100",
                "title": "100 Deliveries",
                "description": "Complete 100 deliveries",
                "target": 100.0,  # Changed to float
                "unit": "deliveries",
                "current_metric": "total_deliveries"
            },
            {
                "id": "rating_4.5",
                "title": "4.5 Star Rating",
                "description": "Achieve 4.5 average rating",
                "target": 4.5,
                "unit": "stars",
                "current_metric": "average_rating"
            },
            {
                "id": "earnings_10000",
                "title": "₹10,000 Earnings",
                "description": "Earn ₹10,000 total",
                "target": 10000.0,  # Changed to float
                "unit": "₹",
                "current_metric": "total_earnings"
            },
            {
                "id": "on_time_90",
                "title": "90% On-Time Rate",
                "description": "Achieve 90% on-time delivery rate",
                "target": 90.0,  # Changed to float
                "unit": "%",
                "current_metric": "on_time_rate"
            }
        ]
        
        milestones = []
        next_milestone = None
        
        for defn in milestone_definitions:
            current_value = float(metrics.get(defn["current_metric"], 0))
            target_value = defn["target"]
            
            is_achieved = current_value >= target_value
            progress = min(current_value / target_value, 1.0) if target_value > 0 else 0.0
            
            milestone = AchievementMilestone(
                milestone_id=defn["id"],
                title=defn["title"],
                description=defn["description"],
                target_value=target_value,
                current_value=current_value,
                unit=defn["unit"],
                achieved_date=date.today() if is_achieved else None,
                is_achieved=is_achieved,
                progress_percentage=progress * 100
            )
            
            milestones.append(milestone)
            
            # Find next milestone (first unachieved)
            if not is_achieved and not next_milestone:
                next_milestone = milestone
        
        return MilestonesResponse(
            milestones=milestones,
            next_milestone=next_milestone
        )
    
    # ===== COMPLETE PERFORMANCE DATA =====
    
    def get_complete_performance_data(
        self,
        delivery_person_id: int,
        period_filter: DateRangeFilter
    ) -> CompletePerformanceResponse:
        """Get complete performance data in one response"""
        
        # Get all data in parallel (in a real app, you might want to use async)
        metrics_response = self.get_performance_metrics(delivery_person_id, period_filter)
        charts_response = self.get_performance_charts(delivery_person_id, period_filter)
        badges_response = self.get_badges(delivery_person_id)
        ratings_response = self.get_rating_history(delivery_person_id, period_filter, limit=10)
        trends_response = self.get_performance_trends(delivery_person_id)
        comparison_response = self.get_peer_comparison(delivery_person_id, period_filter)
        
        return CompletePerformanceResponse(
            metrics=metrics_response.metrics,
            charts=charts_response.charts,
            badges=badges_response.badges,
            ratings=ratings_response,
            trends=trends_response,
            comparison=comparison_response,
            period=period_filter.period,
            date_range=period_filter.start_date and period_filter.end_date and {
                "start_date": period_filter.start_date,
                "end_date": period_filter.end_date
            },
            last_updated=datetime.now()
        )