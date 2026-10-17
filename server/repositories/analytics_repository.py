from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case, text
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from decimal import Decimal

# Import your exact models
from models.order.order import Order
from models.order.order_item import OrderItem
from models.order.order_refund import OrderRefund
from models.order.order_return import OrderReturn
from models.payment import Payment
from models.user import User
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.analytics.product_analytics import ProductAnalytics
from models.analytics.recently_viewed import RecentlyViewed
from models.analytics.search_history import SearchHistory
from models.analytics.user_sessions import UserSession
from models.analytics.admin_activity_log import AdminActivityLog
from models.inventory.batch_item import BatchItem
from schemas.analytics import Period, DateRange

class AnalyticsRepository:
    
    # ===== SALES ANALYTICS =====
    
    @staticmethod
    def get_sales_summary(db: Session, date_range: Optional[DateRange] = None) -> dict:
        """Get overall sales summary with optional date filtering"""
        query = db.query(Order)
        
        if date_range:
            query = query.filter(
                Order.placed_at >= date_range.start_date,
                Order.placed_at <= date_range.end_date
            )
        
        total_orders = query.count()
        completed_orders = query.filter(Order.order_status == "DELIVERED").count()
        cancelled_orders = query.filter(Order.order_status == "CANCELLED").count()
        
        # Revenue calculation (only from completed orders)
        revenue_query = db.query(func.coalesce(func.sum(Order.total_amount), 0)).filter(
            Order.order_status == "DELIVERED"
        )
        if date_range:
            revenue_query = revenue_query.filter(
                Order.placed_at >= date_range.start_date,
                Order.placed_at <= date_range.end_date
            )
        total_revenue = float(revenue_query.scalar() or 0)
        
        # Refunds calculation
        refund_query = db.query(func.coalesce(func.sum(OrderRefund.amount), 0))
        if date_range:
            refund_query = refund_query.join(Order).filter(
                Order.placed_at >= date_range.start_date,
                Order.placed_at <= date_range.end_date
            )
        refunded_amount = float(refund_query.scalar() or 0)
        
        # Average Order Value
        avg_order_value = total_revenue / completed_orders if completed_orders > 0 else 0
        
        return {
            "total_revenue": total_revenue,
            "total_orders": total_orders,
            "completed_orders": completed_orders,
            "cancelled_orders": cancelled_orders,
            "refunded_amount": refunded_amount,
            "average_order_value": avg_order_value
        }
    
    @staticmethod
    def get_sales_trends(db: Session, period: Period = Period.MONTH) -> List[dict]:
        """Get sales trends for the given period"""
        if period == Period.WEEK:
            group_by = func.date_trunc('day', Order.placed_at)
            days = 7
        elif period == Period.MONTH:
            group_by = func.date_trunc('week', Order.placed_at)
            days = 30
        elif period == Period.QUARTER:
            group_by = func.date_trunc('month', Order.placed_at)
            days = 90
        else:  # YEAR
            group_by = func.date_trunc('month', Order.placed_at)
            days = 365
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        trends = db.query(
            group_by.label('period'),
            func.coalesce(func.sum(Order.total_amount), 0).label('revenue'),
            func.count(Order.order_id).label('orders')
        ).filter(
            Order.placed_at >= start_date,
            Order.placed_at <= end_date,
            Order.order_status == "DELIVERED"
        ).group_by(group_by).order_by('period').all()
        
        return [
            {
                "period": trend.period.strftime('%Y-%m-%d'),
                "revenue": float(trend.revenue or 0),
                "orders": trend.orders,
                "date": trend.period
            }
            for trend in trends
        ]
    
    # ===== PRODUCT ANALYTICS =====
    
    @staticmethod
    def get_top_selling_products(db: Session, limit: int = 10) -> List[dict]:
        """Get top selling products by quantity and revenue"""
        top_products = db.query(
            ProductVariant.variant_id,
            Product.product_name,
            ProductVariant.variant_name,
            func.sum(OrderItem.quantity).label('total_sold'),
            func.sum(OrderItem.quantity * OrderItem.price).label('total_revenue'),
            ProductVariant.stock_quantity
        ).join(
            OrderItem, OrderItem.variant_id == ProductVariant.variant_id
        ).join(
            Order, Order.order_id == OrderItem.order_id
        ).join(
            Product, Product.product_id == ProductVariant.product_id
        ).filter(
            Order.order_status == "DELIVERED"
        ).group_by(
            ProductVariant.variant_id,
            Product.product_name,
            ProductVariant.variant_name,
            ProductVariant.stock_quantity
        ).order_by(
            desc('total_sold')
        ).limit(limit).all()
        
        return [
            {
                "variant_id": product.variant_id,
                "product_name": product.product_name,
                "variant_name": product.variant_name,
                "total_sold": product.total_sold or 0,
                "total_revenue": float(product.total_revenue or 0),
                "stock_quantity": product.stock_quantity
            }
            for product in top_products
        ]
    
    @staticmethod
    def get_product_performance(db: Session, variant_id: Optional[int] = None) -> List[dict]:
        """Get product performance analytics"""
        query = db.query(
            ProductAnalytics.variant_id,
            Product.product_name,
            ProductVariant.variant_name,
            ProductAnalytics.view_count,
            ProductAnalytics.cart_add_count,
            ProductAnalytics.purchase_count,
            case(
                (ProductAnalytics.view_count > 0, 
                 (ProductAnalytics.purchase_count * 100.0) / ProductAnalytics.view_count),
                else_=0.0
            ).label('conversion_rate'),
            func.coalesce(
                db.query(func.sum(OrderItem.quantity * OrderItem.price))
                .join(Order).filter(
                    OrderItem.variant_id == ProductAnalytics.variant_id,
                    Order.order_status == "DELIVERED"
                ).scalar(), 0
            ).label('revenue')
        ).join(
            ProductVariant, ProductVariant.variant_id == ProductAnalytics.variant_id
        ).join(
            Product, Product.product_id == ProductVariant.product_id
        )
        
        if variant_id:
            query = query.filter(ProductAnalytics.variant_id == variant_id)
        
        results = query.all()
        
        return [
            {
                "variant_id": result.variant_id,
                "product_name": result.product_name,
                "variant_name": result.variant_name,
                "views": result.view_count,
                "cart_adds": result.cart_add_count,
                "purchases": result.purchase_count,
                "conversion_rate": float(result.conversion_rate or 0),
                "revenue": float(result.revenue or 0)
            }
            for result in results
        ]
    
    # ===== CUSTOMER ANALYTICS =====
    
    @staticmethod
    def get_customer_insights(db: Session) -> dict:
        """Get customer insights and behavior analytics"""
        # Total customers
        total_customers = db.query(User).count()
        
        # New customers (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        new_customers = db.query(User).filter(
            User.created_at >= thirty_days_ago
        ).count()
        
        # Customers with multiple orders (returning customers)
        returning_customers_query = db.query(Order.user_id).filter(
            Order.order_status == "DELIVERED"
        ).group_by(Order.user_id).having(func.count(Order.order_id) > 1)
        
        returning_customers = returning_customers_query.count()
        
        # Repeat purchase rate
        repeat_purchase_rate = (returning_customers / total_customers * 100) if total_customers > 0 else 0
        
        # Average order frequency (orders per customer)
        orders_per_customer = db.query(
            Order.user_id,
            func.count(Order.order_id).label('order_count')
        ).filter(Order.order_status == "DELIVERED").group_by(Order.user_id).subquery()
        
        avg_order_frequency = db.query(
            func.avg(orders_per_customer.c.order_count)
        ).scalar() or 0
        
        # Top customers by spending
        top_customers = db.query(
            User.user_id,
            User.first_name,
            User.last_name,
            User.email,
            func.count(Order.order_id).label('total_orders'),
            func.sum(Order.total_amount).label('total_spent')
        ).join(Order, Order.user_id == User.user_id).filter(
            Order.order_status == "DELIVERED"
        ).group_by(
            User.user_id, User.first_name, User.last_name, User.email
        ).order_by(desc('total_spent')).limit(10).all()
        
        return {
            "total_customers": total_customers,
            "new_customers": new_customers,
            "returning_customers": returning_customers,
            "repeat_purchase_rate": float(repeat_purchase_rate),
            "average_order_frequency": float(avg_order_frequency),
            "top_customers": [
                {
                    "user_id": customer.user_id,
                    "name": f"{customer.first_name} {customer.last_name}",
                    "email": customer.email,
                    "total_orders": customer.total_orders,
                    "total_spent": float(customer.total_spent or 0)
                }
                for customer in top_customers
            ]
        }
    
    # ===== INVENTORY ANALYTICS =====
    
    @staticmethod
    def get_inventory_status(db: Session) -> List[dict]:
        """Get inventory status with alerts"""
        inventory_status = db.query(
            ProductVariant.variant_id,
            Product.product_name,
            ProductVariant.variant_name,
            ProductVariant.stock_quantity,
            case(
                (ProductVariant.stock_quantity == 0, "OUT_OF_STOCK"),
                (ProductVariant.stock_quantity <= 5, "LOW_STOCK"),  # Using 5 as default minimum
                else_="IN_STOCK"
            ).label('status')
        ).join(
            Product, Product.product_id == ProductVariant.product_id
        ).filter(
            or_(
                ProductVariant.stock_quantity == 0,
                ProductVariant.stock_quantity <= 5
            )
        ).order_by(
            ProductVariant.stock_quantity
        ).all()
        
        return [
            {
                "variant_id": item.variant_id,
                "product_name": item.product_name,
                "variant_name": item.variant_name,
                "current_stock": item.stock_quantity,
                "status": item.status
            }
            for item in inventory_status
        ]
    
    # ===== SEARCH & BEHAVIOR ANALYTICS =====
    
    @staticmethod
    def get_search_analytics(db: Session) -> dict:
        """Get search query analytics"""
        # Top searches
        top_searches = db.query(
            SearchHistory.search_query,
            func.count(SearchHistory.search_id).label('search_count'),
            func.avg(SearchHistory.results_count).label('avg_results')
        ).group_by(SearchHistory.search_query).order_by(
            desc('search_count')
        ).limit(10).all()
        
        total_searches = db.query(SearchHistory).count()
        no_result_searches = db.query(SearchHistory).filter(
            SearchHistory.results_count == 0
        ).count()
        
        search_success_rate = ((total_searches - no_result_searches) / total_searches * 100) if total_searches > 0 else 0
        
        return {
            "top_searches": [
                {
                    "query": search.search_query,
                    "count": search.search_count,
                    "avg_results": float(search.avg_results or 0)
                }
                for search in top_searches
            ],
            "total_searches": total_searches,
            "no_result_searches": no_result_searches,
            "search_success_rate": float(search_success_rate)
        }
    
    @staticmethod
    def get_user_behavior(db: Session) -> dict:
        """Get user behavior analytics"""
        # Active sessions (last 30 minutes)
        thirty_minutes_ago = datetime.now() - timedelta(minutes=30)
        active_sessions = db.query(UserSession).filter(
            UserSession.last_activity >= thirty_minutes_ago
        ).count()
        
        # Device breakdown
        device_breakdown = db.query(
            UserSession.device_info,
            func.count(UserSession.session_id).label('session_count')
        ).group_by(UserSession.device_info).all()
        
        total_sessions = sum(device.session_count for device in device_breakdown)
        device_percentages = {
            device.device_info or 'Unknown': (device.session_count / total_sessions * 100) if total_sessions > 0 else 0
            for device in device_breakdown
        }
        
        return {
            "active_sessions": active_sessions,
            "device_breakdown": device_percentages
        }
    
    # ===== ADMIN ACTIVITY =====
    
    @staticmethod
    def get_admin_activity_logs(db: Session, admin_id: Optional[int] = None, limit: int = 50) -> List[dict]:
        """Get admin activity logs"""
        query = db.query(AdminActivityLog)
        
        if admin_id:
            query = query.filter(AdminActivityLog.admin_id == admin_id)
        
        logs = query.order_by(desc(AdminActivityLog.created_at)).limit(limit).all()
        
        return [
            {
                "log_id": log.log_id,
                "admin_id": log.admin_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "created_at": log.created_at
            }
            for log in logs
        ]
    
    # ===== DASHBOARD SUMMARY =====
    
    @staticmethod
    def get_dashboard_summary(db: Session) -> dict:
        """Get complete dashboard summary"""
        sales_summary = AnalyticsRepository.get_sales_summary(db)
        top_products = AnalyticsRepository.get_top_selling_products(db, 5)
        customer_insights = AnalyticsRepository.get_customer_insights(db)
        inventory_alerts = AnalyticsRepository.get_inventory_status(db)
        recent_activity = AnalyticsRepository.get_admin_activity_logs(db, limit=10)
        
        return {
            "sales_summary": sales_summary,
            "top_products": top_products,
            "customer_insights": customer_insights,
            "inventory_alerts": inventory_alerts,
            "recent_activity": recent_activity
        }