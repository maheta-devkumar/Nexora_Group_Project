import sys
import os
from datetime import datetime
from decimal import Decimal
import logging

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import SessionLocal
from services.checkout_service import CheckoutService
from schemas.checkout_schema import ConfirmCheckoutRequest
from models.user import User
from models.product_catalog.product_variant import ProductVariant
from models.address import Address
from models.cart import Cart
from models.delivery.delivery import Delivery
from models.order.order import Order

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_checkout_delivery_cod():
    db = SessionLocal()
    try:
        print("🚀 Starting Checkout Service Delivery Creation Test (COD)...")
        
        # 1. Get a test user
        user = db.query(User).first()
        if not user:
            print("❌ No users found.")
            return

        print(f"👤 Using User: {user.username} (ID: {user.user_id})")

        # 2. Get a test product variant
        variant = db.query(ProductVariant).first()
        if not variant:
            print("❌ No variants found.")
            return

        # Ensure stock
        if variant.stock_quantity < 1:
            variant.stock_quantity = 10
            db.add(variant)
            db.commit()

        # 3. Get address
        address = db.query(Address).filter(Address.user_id == user.user_id).first()
        if not address:
            print("❌ User has no address.")
            return

        # 4. Add item to Cart
        # Check if item exists in cart
        cart_item = db.query(Cart).filter(Cart.user_id == user.user_id, Cart.variant_id == variant.variant_id).first()
        if not cart_item:
            cart_item = Cart(user_id=user.user_id, variant_id=variant.variant_id, quantity=1, price=variant.price)
            db.add(cart_item)
            db.commit()
            print("🛒 Added item to cart")
        else:
            print("🛒 Item already in cart")

        # 5. Prepare Checkout Data
        checkout_data = ConfirmCheckoutRequest(
            address_id=address.address_id,
            coupon_code=None,
            shipping_method="Standard",
            payment_method="COD"
        )
        
        # Mock Email Service inside CheckoutService if needed
        # (CheckoutService imports EmailService dynamically, so we might need to mock sys.modules or just let it fail/catch)
        # The service has try-except for email, so it should be fine.

        # 6. Create Order via CheckoutService
        print("💳 Confirming Order via CheckoutService...")
        result = CheckoutService.confirm_order(db, user.user_id, checkout_data)
        
        # Result might be dict or Order object depending on implementation
        if isinstance(result, dict):
            order_id = result.get('order_id') or result.get('data', {}).get('order_id')
        else:
            order_id = result.order_id
            
        print(f"✅ Order Created! ID: {order_id}")

        # 7. Verify Delivery Creation
        delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
        
        if delivery:
            print("\n🎊 SUCCESS: Delivery Record Found!")
            print(f"   - Delivery ID: {delivery.delivery_id}")
            print(f"   - Status: {delivery.status}")
            print(f"   - Is Available: {delivery.is_available}")
            
            if delivery.status == "AVAILABLE" and delivery.is_available:
                print("✅ Delivery is correctly marked AVAILABLE.")
            else:
                print("❌ Delivery exists but status/availability is WRONG.")
        else:
            print("\n🔥 FAILURE: No Delivery Record Created for Order.")

    except Exception as e:
        print(f"\n🔥 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_checkout_delivery_cod()
