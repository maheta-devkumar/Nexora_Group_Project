from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

DB_URI = os.getenv("DB_URI", "postgresql+psycopg2://postgres:root@localhost:5432/nexora2")

# SQLAlchemy Base + Engine
Base = declarative_base()
engine = create_engine(DB_URI, echo=True, pool_pre_ping=True)

# Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

try:
    # Import all models in dependency order
    
    # 1. Core models first
    from models.user import User
    from models.role import Role, Permission, UserRole, RolePermission
    
    # 2. Address system
    from models.address import State, City, Area, Address
    
    # 3. Product catalog (independent)
    from models.product_catalog.category import Category
    from models.product_catalog.sub_category import SubCategory
    from models.product_catalog.product_brand import ProductBrand
    from models.product_catalog.product_attribute import ProductAttribute
    from models.product_catalog.product import Product
    from models.product_catalog.product_variant import ProductVariant
    from models.product_catalog.attribute_variant import AttributeVariant
    from models.product_catalog.product_image import ProductImage
    from models.product_catalog.product_video import ProductVideo
    from models.product_catalog.product_review import ProductReview
    
    # 4. Shopping models
    from models.cart import Cart
    from models.wishlist import Wishlist
    
    # 5. Order system
    from models.order.order import Order
    from models.order.order_item import OrderItem
    from models.order.order_history import OrderHistory
    from models.order.order_return import OrderReturn
    from models.order.return_product import ReturnProduct
    from models.order.order_refund import OrderRefund
    
    # 6. Payment & Delivery
    from models.payment import Payment
    from models.delivery.delivery_person import DeliveryPerson
    from models.delivery.delivery import Delivery
    from models.delivery.delivery_earnings import DeliveryEarnings
    
    # 7. Marketing
    from models.marketing.coupon import Coupon
    from models.marketing.coupon_variant import CouponVariant
    from models.marketing.offer import Offer
    from models.marketing.offer_variant import OfferVariant
    
    # 8. Inventory
    from models.inventory.company import Company
    from models.inventory.supplier import Supplier
    from models.inventory.purchase import Purchase
    from models.inventory.purchase_item import PurchaseItem
    from models.inventory.product_batch import ProductBatch
    from models.inventory.batch_item import BatchItem
    from models.inventory.stock_movement import StockMovement

    from models.feedback.feedback import Feedback, FeedbackResponse
    from models.feedback.user_issue import UserIssue
    
    # 9. Analytics & Support
    from models.analytics.product_analytics import ProductAnalytics
    from models.analytics.recently_viewed import RecentlyViewed
    from models.analytics.review_vote import ReviewVote
    from models.analytics.search_history import SearchHistory
    from models.analytics.admin_activity_log import AdminActivityLog
    from models.analytics.user_sessions import UserSession
    from models.analytics.user_sessions import UserSession
    from models.feedback.feedback import Feedback, FeedbackResponse
    from models.notification import Notification
    from models.feedback.user_issue import UserIssue
    
    # 10. System Settings
    from models.settings_model import Settings
    
except Exception as e:
    
    import traceback
    traceback.print_exc()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """
    Initialize database tables manually.
    """
    try:
        # Drop all tables first (for development only)
        # Base.metadata.drop_all(bind=engine)
        # print("✅ Dropped existing tables")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
    except Exception as e:
        import traceback
        traceback.print_exc()
    """
    Initialize database tables manually.
    """
    try:
        Base.metadata.create_all(bind=engine)
        
        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
    except Exception as e:
        import traceback
        traceback.print_exc()