import sys
import os
from datetime import datetime
from decimal import Decimal
import logging

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import SessionLocal, init_db
from services.order_service import OrderService
from schemas.order_schema import OrderCreate
from models.product_catalog.product_variant import ProductVariant
from models.user import User
from models.order.order import Order
from models.delivery.delivery import Delivery

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_delivery_creation():
    db = SessionLocal()
    try:
        print("🚀 Starting Delivery Creation Test...")
        
        # 1. Get a test user
        user = db.query(User).first()
        if not user:
            print("❌ No users found in DB. Cannot test.")
            return

        print(f"👤 Using User: {user.username} (ID: {user.user_id})")

        # 2. Get a test product variant
        variant = db.query(ProductVariant).first()
        if not variant:
            print("❌ No variants found. Cannot test.")
            return

        print(f"📦 Using Variant: {variant.variant_name} (ID: {variant.variant_id}, Price: {variant.price})")
        
        # Ensure stock
        if variant.stock_quantity < 1:
            variant.stock_quantity = 10
            db.commit()

        # 3. Get a valid address for user
        from models.address import Address
        address = db.query(Address).filter(Address.user_id == user.user_id).first()
        if not address:
            print("❌ User has no address. Cannot test.")
            # Create dummy address? 
            # Skipping for now, assuming user has address
            return
            
        print(f"🏠 Using Address ID: {address.address_id}")

        # 4. Prepare Order Data
        # Calculate totals
        item_price = Decimal(str(variant.price))
        qty = 1
        subtotal = item_price * qty
        
        # Fixed amounts for test
        discount = Decimal('0.0')
        delivery_fee = Decimal('10.0')
        tax = Decimal('5.0')
        total = subtotal + tax + delivery_fee - discount

        # 4. Prepare Order Data
        order_data = OrderCreate(
            address_id=address.address_id,
            items=[
                {
                    "variant_id": variant.variant_id,
                    "quantity": qty,
                    "price": float(variant.price)
                }
            ],
            subtotal=subtotal,
            total_amount=total,
            discount_amount=discount,
            delivery_fee=delivery_fee,
            tax_amount=tax,
            coupon_code=None
        )

        # 5. Create Order
        print("🛒 Creating Order...")
        service = OrderService(db)
        
        # Mock Email Service to avoid errors
        service.email_service.send_to_user_by_id = lambda *args: print("📧 Validating Email to User skipped")
        service.email_service.send_to_all_admins = lambda *args: {"success": []}
        service.email_service.send_to_all_delivery_persons = lambda *args: print("📧 Validating Notification to Delivery Persons skipped")
        
        result = service.create_order(order_data, user.user_id)
        order_id = result['order_id']
        print(f"✅ Order Created! ID: {order_id}")

        # 6. Verify Delivery Creation
        delivery = db.query(Delivery).filter(Delivery.order_id == order_id).first()
        
        if delivery:
            print("\n🎊 SUCCESS: Delivery Record Found!")
            print(f"   - Delivery ID: {delivery.delivery_id}")
            print(f"   - Status: {delivery.status}")
            print(f"   - Is Available: {delivery.is_available}")
            print(f"   - Available Since: {delivery.available_since}")
            
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
    test_delivery_creation()
