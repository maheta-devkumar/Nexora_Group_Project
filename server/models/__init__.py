from config.database import Base

# Import all models in correct order to avoid circular imports

# 1. Core Authentication & Authorization
from models.user import User
from models.role import Role, UserRole, RolePermission
from models.role import Permission

# 2. Address System
from models.address import State, City, Area, Address

# 3. Product Catalog
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

# 4. Shopping & Orders
from models.cart import Cart
from models.wishlist import Wishlist
from models.order.order import Order
from models.order.order_item import OrderItem
from models.order.order_history import OrderHistory
from models.order.order_return import OrderReturn
from models.order.return_product import ReturnProduct
from models.order.order_refund import OrderRefund

# 5. Payment & Delivery
from models.payment import Payment
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery import Delivery
from models.delivery.delivery_earnings import DeliveryEarnings

# 6. Marketing
from models.marketing.coupon import Coupon
from models.marketing.coupon_variant import CouponVariant
from models.marketing.offer import Offer
from models.marketing.offer_variant import OfferVariant

# 7. Inventory
from models.inventory.company import Company
from models.inventory.supplier import Supplier
from models.inventory.purchase import Purchase
from models.inventory.purchase_item import PurchaseItem
from models.inventory.product_batch import ProductBatch
from models.inventory.batch_item import BatchItem
from models.inventory.stock_movement import StockMovement
from models.inventory.purchase_return import PurchaseReturn

# 8. Analytics & Support
from models.analytics.product_analytics import ProductAnalytics
from models.analytics.recently_viewed import RecentlyViewed
from models.analytics.review_vote import ReviewVote
from models.analytics.search_history import SearchHistory
from models.feedback.feedback import Feedback, FeedbackResponse
from models.notification import Notification
from models.feedback.user_issue import UserIssue

__all__ = [
    # Core
    'Base', 'User',
    
    # Authorization
    'Role', 'UserRole', 'RolePermission', 'Permission',
    
    # Address
    'State', 'City', 'Area', 'Address',
    
    # Product Catalog
    'Category', 'SubCategory', 'ProductBrand', 'ProductAttribute',
    'Product', 'ProductVariant', 'AttributeVariant',
    'ProductImage', 'ProductVideo', 'ProductReview',
    
    # Shopping & Orders
    'Cart', 'Wishlist', 'Order', 'OrderItem', 'OrderHistory',
    'OrderReturn', 'ReturnProduct', 'OrderRefund',
    
    # Payment & Delivery
    'Payment', 'DeliveryPerson', 'Delivery', 'DeliveryEarnings',
    
    # Marketing
    'Coupon', 'CouponVariant', 'Offer', 'OfferVariant',
    
    # Inventory
    'Company', 'Supplier', 'Purchase', 'PurchaseItem',
    'ProductBatch', 'BatchItem', 'StockMovement', 'PurchaseReturn',
    
    # Analytics & Support
    'ProductAnalytics', 'RecentlyViewed', 'ReviewVote', 'SearchHistory',
    'Feedback', 'FeedbackResponse', 'Notification', 'UserIssue'
]