import sys
import os
from datetime import datetime
import logging

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import SessionLocal
from models.delivery.delivery import Delivery
from models.order.order import Order
from models.user import User
from models.address import Address

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_insert_delivery():
    db = SessionLocal()
    try:
        print("🧪 Testing Delivery Insertion...")
        
        # 1. Get/Create Dummy User
        user = db.query(User).first()
        if not user:
            print("❌ No user found")
            return

        # 2. Get/Create Dummy Address
        address = db.query(Address).filter(Address.user_id == user.user_id).first()
        if not address:
            print("❌ No address found")
            return

        # 3. Create Dummy Order
        print("Creating Dummy Order...")
        order = Order(
            user_id=user.user_id,
            address_id=address.address_id,
            subtotal=100.0,
            total_amount=100.0,
            order_status="TEST_PENDING",
            payment_status="PENDING"
        )
        db.add(order)
        db.flush()
        print(f"✅ Order Created: {order.order_id}")

        # 4. Create Delivery (Mimic logic from order_service.py)
        # CASE 1: With delivery_person_id=None, assigned_at=None, is_available=True
        print("Creating Delivery (Standard Case)...")
        try:
            delivery_data = {
                "order_id": order.order_id,
                "delivery_person_id": None,
                "status": "AVAILABLE",
                "assigned_at": None,
                "available_since": datetime.now(),
                "is_available": True
            }
            delivery = Delivery(**delivery_data)
            db.add(delivery)
            db.commit()
            print(f"✅ Delivery Inserted Successfully: {delivery.delivery_id}")
            
            # Verify Read
            d = db.query(Delivery).filter(Delivery.delivery_id == delivery.delivery_id).first()
            print(f"🔍 Read Verification: status={d.status}, is_available={d.is_available}")

        except Exception as e:
            print(f"❌ Delivery Insertion FAILED: {e}")
            import traceback
            traceback.print_exc()
            db.rollback()

    except Exception as e:
        print(f"❌ Test Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_insert_delivery()
