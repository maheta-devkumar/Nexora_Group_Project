import sys
import os
from datetime import datetime
from decimal import Decimal
import logging
import time

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import SessionLocal
from services.delivery_service import DeliveryService
from services.checkout_service import CheckoutService
from schemas.checkout_schema import ConfirmCheckoutRequest
from models.user import User
from models.product_catalog.product_variant import ProductVariant
from models.address import Address
from models.cart import Cart
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.order.order import Order

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_full_lifecycle():
    db = SessionLocal()
    try:
        print("\n🚀 Starting FULL DELIVERY LIFECYCLE Test...")
        
        # 1. SETUP: Create Order (COD) -> Creates Delivery
        print("\n[1] Creating Order (COD)...")
        user = db.query(User).first()
        variant = db.query(ProductVariant).first()
        address = db.query(Address).filter(Address.user_id == user.user_id).first()
        
        # Ensure cart
        cart_item = db.query(Cart).filter(Cart.user_id == user.user_id, Cart.variant_id == variant.variant_id).first()
        if not cart_item:
            cart_item = Cart(user_id=user.user_id, variant_id=variant.variant_id, quantity=1, price=variant.price)
            db.add(cart_item)
            db.commit()

        checkout_data = ConfirmCheckoutRequest(
            address_id=address.address_id,
            coupon_code=None,
            shipping_method="Standard",
            payment_method="COD"
        )
        
        # Create order
        result = CheckoutService.confirm_order(db, user.user_id, checkout_data)
        if isinstance(result, dict):
            order_id = result.get('order_id')
        else:
            order_id = result.order_id
            
        print(f"✅ Order Created! ID: {order_id}")
        
        # Verify Delivery is AVAILABLE
        delivery_service = DeliveryService(db)
        delivery = delivery_service.repository.get_delivery_by_order_id(db, order_id)
        
        if not delivery or delivery.status != "AVAILABLE":
            print("❌ FATAL: Delivery not created or not AVAILABLE.")
            return

        print(f"✅ Delivery Created! ID: {delivery.delivery_id}, Status: {delivery.status}")


        # 2. SETUP: Get/Create Delivery Person
        print("\n[2] Setting up Delivery Person...")
        # Check for existing active delivery person
        dp = db.query(DeliveryPerson).filter(DeliveryPerson.status == "ACTIVE").first()
        
        if not dp:
             # Create one for test
             # Assuming there is another user to be DP, or we reuse same user (logic might fail if same user, but let's try)
             # Better to find a user who is NOT the customer if possible, but for simplicity:
             active_user = db.query(User).filter(User.user_id != user.user_id).first()
             if not active_user:
                 print("⚠️ No other user found for DP. Creating DP for current user (might be weird but logic allows).")
                 active_user = user
            
             dp = DeliveryPerson(
                 user_id=active_user.user_id,
                 status="ACTIVE",
                 license_number="TEST_LIC_123",
                 rating=5.0,
                 total_deliveries=0,
                 total_earnings=0.0
             )
             db.add(dp)
             db.commit()
             print(f"   Created new Delivery Person (ID: {dp.delivery_person_id})")
        else:
            print(f"   Using existing Delivery Person (ID: {dp.delivery_person_id})")


        # 3. ACTION: Get Available Deliveries
        print("\n[3] Fetching Available Deliveries...")
        available = delivery_service.get_available_deliveries(page=1, per_page=50)
        found = False
        for d in available['deliveries']:
            if d['delivery_id'] == delivery.delivery_id:
                found = True
                break
        
        if found:
            print("✅ Newly created delivery appeared in 'Available Deliveries' list.")
        else:
            print("❌ Delivery NOT found in available list!")
            return


        # 4. ACTION: Accept Delivery
        print(f"\n[4] Accepting Delivery #{delivery.delivery_id} by DP #{dp.delivery_person_id}...")
        accepted_delivery = delivery_service.accept_delivery(delivery.delivery_id, dp.delivery_person_id)
        
        print(f"   Status: {accepted_delivery['status']}")
        print(f"   Delivery Person: {accepted_delivery['delivery_person_name']}")
        print(f"   Pickup OTP: {accepted_delivery['pickup_otp']}")
        print(f"   Delivery OTP: {accepted_delivery['delivery_otp']}")
        
        if accepted_delivery['status'] == "ASSIGNED":
            print("✅ Delivery Accepted successfully (Status: ASSIGNED).")
        else:
            print(f"❌ Failed to accept. Status: {accepted_delivery['status']}")
            return


        # 5. ACTION: Confirm Pickup
        print(f"\n[5] Confirming Pickup...")
        picked_up = delivery_service.confirm_pickup(delivery.delivery_id, dp.delivery_person_id)
        
        if picked_up['status'] == 'PICKED_UP':
             print("✅ Pickup Confirmed (Status: PICKED_UP).")
        else:
             print(f"❌ Failed to pickup. Status: {picked_up['status']}")
             return


        # 6. ACTION: Verify OTP (Complete Delivery)
        print(f"\n[6] Verifying OTP and Completing Delivery...")
        otp = accepted_delivery['delivery_otp'] # In real app, customer gives this to DP
        completed = delivery_service.verify_delivery_otp(delivery.delivery_id, otp, dp.delivery_person_id)
        
        if completed['status'] == 'DELIVERED':
             print("✅ Delivery Completed (Status: DELIVERED).")
             print(f"   Delivered At: {completed['delivered_at']}")
        else:
             print(f"❌ Failed to complete. Status: {completed['status']}")
             return

        print("\n🎉 FULL LIFECYCLE TEST PASSED!")

    except Exception as e:
        print(f"\n🔥 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_full_lifecycle()
