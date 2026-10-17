from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.account_repository import AccountRepository
from schemas.account_schema import (
    AccountDashboard, AccountOverview, QuickStats, RecentActivity, 
    AccountCard, OrderSummary, NotificationItem, UserProfile, Preferences
)
from datetime import datetime, timedelta
from typing import Dict, Any

class AccountService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = AccountRepository()
    
    def get_account_dashboard(self, user_id: int) -> Dict[str, Any]:
        """Get comprehensive account dashboard data"""
        user = self.repository.get_user_by_id(self.db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # User profile data for frontend
        user_profile = UserProfile(
            first_name=user.first_name or "User",
            last_name=user.last_name or "",
            email=user.email,
            membership_tier="Gold Member",
            status="Active",
            join_date=user.created_at,
            phone=getattr(user, 'phone', None),
            profile_img_url=user.profile_img_url
        )
        
        # Overview with user data
        overview = AccountOverview(
            user_id=user.user_id,
            name=f"{user.first_name} {user.last_name}".strip(),
            email=user.email,
            membership_tier="Gold Member",
            joined_date=user.created_at,
            loyalty_points=1250,
            account_status="Active",
            profile_img_url=user.profile_img_url
        )
        
        # Quick Stats with mock data (replace with actual queries)
        stats = QuickStats(
            total_orders=45,
            pending_orders=3,
            wishlist_items=12,
            wallet_balance=1250.50,
            unread_notifications=5,
            saved_addresses=3,
            reviews_given=8,
            coupons_available=2,
            total_spent=45250.00,  # Added for frontend
            loyalty_points=1250    # Added for frontend
        )
        
        # Recent Activities with mock data
        recent_activities = [
            RecentActivity(
                id=1,
                activity_type="order",
                title="Order Delivered",
                description="Order #ORD-78945 delivered successfully",
                timestamp=datetime.now() - timedelta(hours=2),
                action_url="/orders/ORD-78945",
                icon="📦"
            ),
            RecentActivity(
                id=2,
                activity_type="security",
                title="New Login",
                description="New login from Delhi, India",
                timestamp=datetime.now() - timedelta(days=1),
                action_url="/security",
                icon="🔐"
            ),
            RecentActivity(
                id=3,
                activity_type="payment",
                title="Payment Updated",
                description="Credit card ending with 4242 was updated",
                timestamp=datetime.now() - timedelta(days=2),
                action_url="/payments",
                icon="💳"
            ),
            RecentActivity(
                id=4,
                activity_type="review",
                title="Review Submitted",
                description="You reviewed 'Sony Wireless Headphones'",
                timestamp=datetime.now() - timedelta(days=3),
                action_url="/reviews",
                icon="⭐"
            ),
            RecentActivity(
                id=5,
                activity_type="wishlist",
                title="Wishlist Item",
                description="iPhone 15 Pro added to your wishlist",
                timestamp=datetime.now() - timedelta(days=4),
                action_url="/wishlist",
                icon="❤️"
            )
        ]
        
        # Quick Access Cards with mock data
        quick_access_cards = [
            AccountCard(
                id=1,
                title="Orders & Returns",
                description="Track orders, manage returns and exchanges",
                icon="📦",
                route="/orders",
                badge_count=stats.pending_orders,
                category="shopping"
            ),
            AccountCard(
                id=2,
                title="Address Book",
                description="Manage delivery and billing addresses",
                icon="🏠",
                route="/addresses",
                badge_count=stats.saved_addresses,
                category="shopping"
            ),
            AccountCard(
                id=3,
                title="Payment Methods",
                description="Saved cards, wallets and payment options",
                icon="💳",
                route="/payments",
                status="Verified",
                category="payments"
            ),
            AccountCard(
                id=4,
                title="Wishlist",
                description="Saved items and purchase lists",
                icon="❤️",
                route="/wishlist",
                badge_count=stats.wishlist_items,
                category="shopping"
            ),
            AccountCard(
                id=5,
                title="Security",
                description="Password, 2FA and login security",
                icon="🔒",
                route="/security",
                status="Protected",
                category="security"
            ),
            AccountCard(
                id=6,
                title="Notifications",
                description="Email, SMS and push notification settings",
                icon="🔔",
                route="/notifications",
                badge_count=stats.unread_notifications,
                category="preferences"
            ),
            AccountCard(
                id=7,
                title="Preferences",
                description="Language, currency and display settings",
                icon="⚙️",
                route="/preferences",
                category="preferences"
            ),
            AccountCard(
                id=8,
                title="Support & Help",
                description="Contact support, FAQs and help center",
                icon="📞",
                route="/support",
                category="support"
            )
        ]
        
        # Recent Orders with mock data
        recent_orders = [
            OrderSummary(
                order_id="ORD-78945",
                date=datetime.now() - timedelta(days=1),
                status="Delivered",
                items_count=3,
                total_amount=24599.99,
                tracking_url="/orders/ORD-78945"
            ),
            OrderSummary(
                order_id="ORD-78944",
                date=datetime.now() - timedelta(days=3),
                status="Shipped",
                items_count=1,
                total_amount=1599.00,
                tracking_url="/orders/ORD-78944"
            ),
            OrderSummary(
                order_id="ORD-78942",
                date=datetime.now() - timedelta(days=5),
                status="Processing",
                items_count=2,
                total_amount=8999.50,
                tracking_url="/orders/ORD-78942"
            ),
            OrderSummary(
                order_id="ORD-78940",
                date=datetime.now() - timedelta(days=10),
                status="Delivered",
                items_count=5,
                total_amount=45250.00,
                tracking_url="/orders/ORD-78940"
            )
        ]
        
        # Notifications with mock data
        notifications = [
            NotificationItem(
                id=1,
                title="Special Offer",
                message="Get 20% off on electronics. Limited time offer!",
                type="promotional",
                timestamp=datetime.now() - timedelta(hours=1),
                is_read=False,
                action_url="/offers/electronics"
            ),
            NotificationItem(
                id=2,
                title="Order Shipped",
                message="Your order #ORD-78944 has been shipped",
                type="order",
                timestamp=datetime.now() - timedelta(days=1),
                is_read=True,
                action_url="/orders/ORD-78944"
            ),
            NotificationItem(
                id=3,
                title="Price Drop Alert",
                message="Samsung Galaxy Watch price dropped by 15%",
                type="price_alert",
                timestamp=datetime.now() - timedelta(days=2),
                is_read=False,
                action_url="/product/samsung-watch"
            ),
            NotificationItem(
                id=4,
                title="Security Alert",
                message="New login detected from Mumbai",
                type="security",
                timestamp=datetime.now() - timedelta(days=3),
                is_read=True,
                action_url="/security"
            ),
            NotificationItem(
                id=5,
                title="Review Reminder",
                message="Rate your recent purchase: Wireless Earbuds",
                type="review",
                timestamp=datetime.now() - timedelta(days=4),
                is_read=False,
                action_url="/reviews/wireless-earbuds"
            )
        ]
        
        # Preferences for frontend
        preferences = Preferences(
            email_notifications=True,
            sms_notifications=False,
            newsletter=True,
            marketing_emails=False
        )
        
        # Return as dictionary for serialization
        return AccountDashboard(
            user=user_profile,
            overview=overview,
            stats=stats,
            recent_activities=recent_activities,
            quick_access_cards=quick_access_cards,
            recent_orders=recent_orders,
            notifications=notifications,
            preferences=preferences
        ).model_dump()