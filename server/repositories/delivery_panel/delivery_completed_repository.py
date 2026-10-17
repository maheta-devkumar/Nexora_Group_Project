from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, between, extract, case
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal

# Import models (same as dashboard)
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.order.order_item import OrderItem
from models.user import User
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.address import Address, Area, City
from models.payment import Payment
from models.feedback.feedback import Feedback

# Import schemas
from schemas.delivery_panel.delivery_completed_schema import (
    DeliveryStatus, DateFilterRequest, PaginationRequest,
    CompletedDeliveriesFilter
)


class DeliveryCompletedRepository:
    
    @staticmethod
    def _apply_date_filters(query, start_date: Optional[datetime], end_date: Optional[datetime], period: Optional[str] = None):
        """Apply date filters to query"""
        if period:
            today = date.today()
            if period == "today":
                query = query.filter(func.date(Delivery.delivered_at) == today)
            elif period == "week":
                week_start = today - timedelta(days=today.weekday())
                week_end = week_start + timedelta(days=6)
                query = query.filter(
                    func.date(Delivery.delivered_at) >= week_start,
                    func.date(Delivery.delivered_at) <= week_end
                )
            elif period == "month":
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
            query = query.filter(Delivery.delivered_at >= start_date)
        if end_date:
            # Include full end date
            end_date_with_time = datetime.combine(end_date, datetime.max.time())
            query = query.filter(Delivery.delivered_at <= end_date_with_time)
        
        return query
    
    @staticmethod
    def _get_base_query(db: Session, delivery_person_id: int):
        """Get base query matching dashboard repository style"""
        return db.query(
            Delivery,
            Order,
            User,
            Address,
            Area,
            City
        ).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            User, User.user_id == Order.user_id
        ).join(
            Address, Address.address_id == Order.address_id
        ).join(
            Area, Area.area_id == Address.area_id
        ).join(
            City, City.city_id == Area.city_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == DeliveryStatus.DELIVERED,
            Delivery.delivered_at.isnot(None)
        )
    
    @staticmethod
    def get_completed_deliveries(
        db: Session,
        delivery_person_id: int,
        filters: Optional[CompletedDeliveriesFilter] = None
    ) -> Tuple[List[Tuple], int]:
        """Get completed deliveries with pagination and filters"""
        # Base query
        query = DeliveryCompletedRepository._get_base_query(db, delivery_person_id)
        
        # Apply filters
        if filters:
            if filters.date_filter:
                query = DeliveryCompletedRepository._apply_date_filters(
                    query,
                    filters.date_filter.start_date,
                    filters.date_filter.end_date,
                    filters.date_filter.period
                )
            
            if filters.status:
                query = query.filter(Delivery.status == filters.status)
        
        # Order by delivered date (newest first)
        query = query.order_by(desc(Delivery.delivered_at))
        
        # Count total before pagination
        total_count = query.count()
        
        # Apply pagination
        if filters and filters.pagination:
            page = filters.pagination.page
            per_page = filters.pagination.per_page
            offset = (page - 1) * per_page
            query = query.offset(offset).limit(per_page)
        
        results = query.all()
        return results, total_count
    
    @staticmethod
    def get_completed_delivery_by_id(
        db: Session,
        delivery_person_id: int,
        delivery_id: int
    ) -> Optional[Tuple]:
        """Get a specific completed delivery by ID"""
        query = DeliveryCompletedRepository._get_base_query(db, delivery_person_id)
        
        result = query.filter(
            Delivery.delivery_id == delivery_id
        ).first()
        
        return result
    
    @staticmethod
    def get_delivery_earnings(
        db: Session,
        delivery_id: int,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get earnings for a specific delivery"""
        earnings = db.query(DeliveryEarnings).filter(
            DeliveryEarnings.delivery_id == delivery_id,
            DeliveryEarnings.delivery_person_id == delivery_person_id
        ).first()
        
        if earnings:
            return {
                "earning_id": earnings.earning_id,
                "amount": float(earnings.amount),
                "earned_at": earnings.earned_at,
                "is_settled": True  # Earnings record exists means it's settled
            }
        
        # Check if delivery has earnings via order delivery fee
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).first()
        
        if delivery:
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if order and order.delivery_fee:
                return {
                    "amount": float(order.delivery_fee),
                    "is_settled": False  # Not yet in earnings table
                }
        
        return None
    
    @staticmethod
    def get_customer_rating(
        db: Session,
        order_id: int,
        delivery_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get customer rating for a delivery"""
        # Look for delivery feedback
        feedback = db.query(Feedback).filter(
            Feedback.order_id == order_id,
            Feedback.feedback_type == "DELIVERY_FEEDBACK",
            Feedback.rating.isnot(None)
        ).first()
        
        if feedback:
            return {
                "rating": float(feedback.rating),
                "review_id": feedback.feedback_id,
                "review_text": feedback.message,
                "created_at": feedback.created_at
            }
        
        # Look for product reviews related to this order
        # (Note: This assumes product reviews might have delivery rating context)
        order_items = db.query(OrderItem).filter(
            OrderItem.order_id == order_id
        ).all()
        
        if order_items:
            variant_ids = [item.variant_id for item in order_items]
            avg_rating = db.query(
                func.avg(Feedback.rating)
            ).filter(
                Feedback.order_id == order_id,
                Feedback.rating.isnot(None)
            ).scalar()
            
            if avg_rating:
                return {
                    "rating": float(avg_rating),
                    "review_id": None,
                    "review_text": None,
                    "created_at": None
                }
        
        return None
    
    @staticmethod
    def get_proof_of_delivery(
        db: Session,
        delivery_id: int,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get Proof of Delivery for a completed delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).first()
        
        if not delivery:
            return None
        
        has_pod = bool(delivery.pod_image_url or delivery.signature_url)
        
        return {
            "pod_image_url": delivery.pod_image_url,
            "signature_url": delivery.signature_url,
            "delivery_notes": delivery.delivery_notes,
            "has_pod": has_pod
        }
    
    @staticmethod
    def get_delivery_items_count(
        db: Session,
        order_id: int
    ) -> int:
        """Get total items count for an order"""
        count = db.query(
            func.sum(OrderItem.quantity)
        ).filter(
            OrderItem.order_id == order_id
        ).scalar()
        
        return count or 0
    
    @staticmethod
    def get_payment_info(
        db: Session,
        order_id: int
    ) -> Dict[str, Any]:
        """Get payment information for an order"""
        payment = db.query(Payment).filter(
            Payment.order_id == order_id
        ).first()
        
        if payment:
            return {
                "payment_type": "PREPAID" if payment.payment_status == "COMPLETED" else "COD",
                "amount_paid": float(payment.amount_paid) if payment.amount_paid else 0.0
            }
        
        # Fallback to order total if no payment record
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if order:
            return {
                "payment_type": "COD",  # Assume COD if no payment record
                "amount_paid": float(order.total_amount) if order.total_amount else 0.0
            }
        
        return {"payment_type": "COD", "amount_paid": 0.0}
    
    @staticmethod
    def get_summary_statistics(
        db: Session,
        delivery_person_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Get summary statistics for completed deliveries"""
        base_query = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == DeliveryStatus.DELIVERED
        )
        
        # Apply date filters if provided
        if start_date:
            base_query = base_query.filter(Delivery.delivered_at >= start_date)
        if end_date:
            end_date_with_time = datetime.combine(end_date, datetime.max.time())
            base_query = base_query.filter(Delivery.delivered_at <= end_date_with_time)
        
        # Total deliveries
        total_deliveries = base_query.count()
        
        # Total earnings
        earnings_subquery = base_query.join(
            DeliveryEarnings, DeliveryEarnings.delivery_id == Delivery.delivery_id
        ).with_entities(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        )
        total_earnings = earnings_subquery.scalar() or 0
        
        # Today's deliveries
        today = date.today()
        today_deliveries = base_query.filter(
            func.date(Delivery.delivered_at) == today
        ).count()
        
        # Today's earnings
        today_earnings_query = base_query.filter(
            func.date(Delivery.delivered_at) == today
        ).join(
            DeliveryEarnings, DeliveryEarnings.delivery_id == Delivery.delivery_id
        ).with_entities(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        )
        today_earnings = today_earnings_query.scalar() or 0
        
        # Average rating (from delivery person)
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        avg_rating = float(delivery_person.rating) if delivery_person and delivery_person.rating else 0.0
        
        # On-time rate (simplified - assumes delivered_at is on time)
        if total_deliveries > 0:
            # Calculate based on expected vs actual delivery time
            on_time_query = base_query.filter(
                Delivery.expected_delivery_time.isnot(None),
                Delivery.actual_delivery_time.isnot(None)
            )
            
            on_time_count = 0
            for delivery in on_time_query.all():
                if delivery.expected_delivery_time and delivery.actual_delivery_time:
                    time_diff = (delivery.actual_delivery_time - delivery.expected_delivery_time).total_seconds() / 60
                    if time_diff <= 30:  # Within 30 minutes is on-time
                        on_time_count += 1
            
            on_time_rate = (on_time_count / total_deliveries * 100) if total_deliveries > 0 else 0
        else:
            on_time_rate = 0
        
        return {
            "total_deliveries": total_deliveries,
            "total_earnings": float(total_earnings),
            "average_rating": avg_rating,
            "on_time_rate": on_time_rate,
            "completed_today": today_deliveries,
            "earnings_today": float(today_earnings)
        }
    
    @staticmethod
    def validate_delivery_access(
        db: Session,
        delivery_id: int,
        delivery_person_id: int
    ) -> bool:
        """Validate that delivery belongs to delivery person and is completed"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == DeliveryStatus.DELIVERED
        ).first()
        
        return delivery is not None
    
    @staticmethod
    def get_delivery_performance_metrics(
        db: Session,
        delivery_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get performance metrics for a specific delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id
        ).first()
        
        if not delivery or not delivery.assigned_at or not delivery.delivered_at:
            return None
        
        # Calculate delivery duration
        duration_seconds = (delivery.delivered_at - delivery.assigned_at).total_seconds()
        duration_minutes = int(duration_seconds / 60)
        
        # Check if on time
        is_on_time = None
        if delivery.expected_delivery_time and delivery.actual_delivery_time:
            time_diff = (delivery.actual_delivery_time - delivery.expected_delivery_time).total_seconds() / 60
            is_on_time = time_diff <= 30  # Within 30 minutes
        
        return {
            "delivery_duration_minutes": duration_minutes,
            "is_on_time": is_on_time,
            "assigned_at": delivery.assigned_at,
            "picked_up_at": None,  # Not in current model, could be added
            "expected_delivery_time": delivery.expected_delivery_time,
            "actual_delivery_time": delivery.actual_delivery_time
        }