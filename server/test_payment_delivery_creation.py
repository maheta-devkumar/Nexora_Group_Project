import sys
import os
from datetime import datetime
from decimal import Decimal
import logging
from unittest.mock import MagicMock, patch

# Add server directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config.database import SessionLocal
from services.payment_service import PaymentService
from schemas.payment_schema import PaymentVerifyRequest
from models.user import User
from models.order.order import Order
from models.payment import Payment
from models.delivery.delivery import Delivery

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_payment_delivery_creation():
    db = SessionLocal()
    order_id = None
    payment_id = None
    
    try:
        print("🚀 Starting Payment Service Delivery Creation Test (Razorpay)...")
        
        # 1. Get a test user
        user = db.query(User).first()
        if not user:
            print("❌ No users found.")
            return

        # 2. Create a Mock Order (Pending Payment)
        # We manually create it to simulate the state before payment verification
        order = Order(
            user_id=user.user_id,
            address_id=1, # Mock address ID
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            order_status="PENDING_PAYMENT",
            payment_status="PENDING"
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        order_id = order.order_id
        print(f"📦 Created Pending Order ID: {order_id}")
        
        # 3. Create a Payment Record
        payment = Payment(
            user_id=user.user_id,
            order_id=order_id,
            payment_method="RAZORPAY",
            amount_paid=Decimal('100.00'),
            payment_status="PENDING",
            transaction_reference="order_test_123"
        )
        db.add(payment)
        db.commit()
        db.refresh(payment)
        payment_id = payment.payment_id
        print(f"💳 Created Pending Payment ID: {payment_id}")

        # 4. Verify Payment (Mocking Razorpay)
        verify_data = PaymentVerifyRequest(
            payment_id=payment_id,
            razorpay_order_id="order_test_123",
            razorpay_payment_id="pay_test_123",
            razorpay_signature="mock_sig"
        )

        service = PaymentService(db)
        
        # Mock the external Razorpay client usage inside the service
        # We need to patch where razorpay.Client is called or used
        with patch('razorpay.Client') as MockClient:
            mock_instance = MockClient.return_value
            # Mock utility.verify_payment_signature to return None (success) or True
            mock_instance.utility.verify_payment_signature.return_value = True
            
            print("🔄 CALLING verify_payment...")
            result = service.verify_payment(verify_data, user.user_id)
            print("✅ Payment Verified Result:", result)

        # 5. Verify Delivery Creation
        db.expire_all() # Refresh data
        
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
            print("\n🔥 FAILURE: No Delivery Record Created for Paid Order.")

    except Exception as e:
        print(f"\n🔥 EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        # if order_id:
        #    # Maybe delete test data? Left for manual inspection.
        #    pass
        db.close()

if __name__ == "__main__":
    test_payment_delivery_creation()
