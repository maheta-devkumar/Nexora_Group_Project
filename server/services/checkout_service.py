from sqlalchemy.orm import Session
from decimal import Decimal
from repositories.checkout_repository import CheckoutRepository
from models.order.order import Order
from models.order.order_item import OrderItem
from models.delivery.delivery import Delivery
from datetime import datetime

# ADD NOTIFICATION IMPORTS
from repositories.notification_repository import NotificationRepository
from schemas.notification import NotificationCreate
from repositories.user_repository import UserRepository
from services.payment_service import PaymentService
from schemas.payment_schema import PaymentInitiateRequest
from services.notification_service import NotificationService
# from utils.send_email import EmailService # Moved to local scope to prevent circular import

class CheckoutService:

    @staticmethod
    def calculate_shipping(address):
        # simple flat rate for now
        return Decimal("40.00")

    @staticmethod
    def calculate_tax(subtotal):
        tax_percentage = Decimal("0.18")  # 18%
        return (subtotal * tax_percentage).quantize(Decimal("0.01"))

    @staticmethod
    def validate_cart(db: Session, user_id: int):
        items = CheckoutRepository.get_cart_items(db, user_id)
        if not items:
            raise Exception("Cart is empty")

        return items

    @staticmethod
    def generate_checkout_summary(db: Session, user_id: int, address_id: int, coupon_code=None):
        items = CheckoutService.validate_cart(db, user_id)
        address = CheckoutRepository.get_address(db, user_id, address_id)
        if not address:
            raise Exception("Invalid address")

        subtotal = sum(Decimal(str(i.variant.price)) * i.quantity for i in items)
        discount = Decimal("0.00")

        # Apply coupon
        if coupon_code:
            coupon = CheckoutRepository.get_coupon(db, coupon_code)
            if coupon:
                discount = Decimal(str(coupon.discount_amount))

        delivery_fee = CheckoutService.calculate_shipping(address)
        tax = CheckoutService.calculate_tax(subtotal - discount)

        total = subtotal - discount + delivery_fee + tax

        detailed_items = [
            {
                "variant_id": i.variant_id,
                "quantity": i.quantity,
                "price": float(i.variant.price),
                "total": float(i.variant.price * i.quantity),
                "product_name": i.variant.product.product_name if i.variant and i.variant.product else "Unknown Product",
                "variant_name": i.variant.variant_name if i.variant else "Unknown Variant"
            }
            for i in items
        ]

        return {
            "subtotal": float(subtotal),
            "discount_amount": float(discount),
            "delivery_fee": float(delivery_fee),
            "tax_amount": float(tax),
            "total_amount": float(total),
            "coupon_code": coupon_code,
            "items": detailed_items,
            "address_id": address_id,
            "address_details": address
        }

    @staticmethod
    def confirm_order(db: Session, user_id: int, data):
        summary = CheckoutService.generate_checkout_summary(
            db,
            user_id,
            data.address_id,
            data.coupon_code
        )

        # Get user details
        user = UserRepository.get_user_by_id(db, user_id)
        if not user:
            raise Exception("User not found")

        # Get address details for email
        address = summary["address_details"]
        area_name = address.area.area_name if address.area else "Unknown Area"
        city_name = address.area.city.city_name if address.area and address.area.city else "Unknown City"
        state_name = address.area.city.state.state_name if address.area and address.area.city and address.area.city.state else "Unknown State"
        full_address = f"{address.line1}, {address.line2 if address.line2 else ''}, {area_name}, {city_name}, {state_name}"

        # Determine initial status based on payment method
        # NORMALIZE: Check for ONLINE or RAZORPAY (case-insensitive)
        pm_upper = data.payment_method.upper()
        initial_order_status = "PENDING_PAYMENT" if pm_upper in ["ONLINE", "RAZORPAY"] else "PLACED"
        
        order = Order(
            user_id=user_id,
            address_id=data.address_id,
            subtotal=summary["subtotal"],
            discount_amount=summary["discount_amount"],
            delivery_fee=summary["delivery_fee"],
            tax_amount=summary["tax_amount"],
            total_amount=summary["total_amount"],
            coupon_code=data.coupon_code,
            payment_status="PENDING",
            order_status=initial_order_status,
        )

        # OrderItems
        order_items = []
        for item in summary["items"]:
            order_items.append(
                OrderItem(
                    variant_id=item["variant_id"],
                    quantity=item["quantity"],
                    price=item["price"],
                    total=item["total"],
                )
            )

        # Create order in repository
        created_order = CheckoutRepository.create_order(db, order, order_items)
        
        # ============================================
        # AUTOMATIC DELIVERY CREATION (For COD/Direct Orders)
        # ============================================
        if created_order.order_status == "PLACED":
            try:
                delivery_data = {
                    "order_id": created_order.order_id,
                    "status": "AVAILABLE",
                    "available_since": datetime.now(),
                    "is_available": True
                }
                delivery = Delivery(**delivery_data)
                db.add(delivery)
                db.commit()
                # print(f"✅ Delivery created for order #{created_order.order_id}")
            except Exception as e:
                print(f"Failed to create delivery: {e}")
                # Don't rollback order for this, but log it

        
        # ============================================
        # INITIATE PAYMENT
        # ============================================
        try:
            payment_service = PaymentService(db)
            payment_request = PaymentInitiateRequest(
                order_id=created_order.order_id,
                payment_method=data.payment_method,
                amount=float(created_order.total_amount)
            )
            
            payment_result = payment_service.initiate_payment(payment_request, user_id)
            
            # Combine order info with payment result
            response_data = {
                "order_id": created_order.order_id,
                "message": "Order created successfully",
                "payment": payment_result,
                "order_status": created_order.order_status
            }

            # ============================================
            # SEND EMAIL NOTIFICATIONS (Restored)
            # ============================================
            try:
                from utils.send_email import EmailService
                email_service = EmailService(db_session=db)
                
                # Format items for email
                items_summary = "\n".join([
                    f"- {item['product_name']} ({item['variant_name']}): {item['quantity']} x ${item['price']:.2f} = ${item['total']:.2f}"
                    for item in summary["items"]
                ])
                
                # 1. Send email to customer
                email_subject = f"Order Received - #{created_order.order_id}"
                email_body = f"""
Dear {user.first_name},

Your order has been received.

Order ID: #{created_order.order_id}
Status: {created_order.order_status}
Payment: {created_order.payment_status}
Total: ${summary['total_amount']:.2f}

Items:
{items_summary}

We will update you once your order is processed.
"""
                email_service.send_to_user_by_id(user_id, email_subject, email_body)
                
            except Exception as e:
                print(f"Failed to send order email: {e}")

            # ============================================
            # SEND SYSTEM NOTIFICATION
            # ============================================
            try:
                notification_service = NotificationService(db)
                notification_service.send_notification(
                    user_id=user_id,
                    title="📦 Order Placed Successfully",
                    message=f"Your Order #{created_order.order_id} has been placed. Status: {created_order.order_status}.",
                    type="ORDER",
                    reference_id=created_order.order_id
                )
                
                # Notify Admins
                admin_users = UserRepository().get_admin_users(db)
                for admin in admin_users:
                     notification_service.send_notification(
                        user_id=admin.user_id,
                        title="🛒 New Order Received",
                        message=f"New Order #{created_order.order_id} from {user.first_name} {user.last_name}. Total: ${summary['total_amount']:.2f}",
                        type="ORDER",
                        reference_id=created_order.order_id
                    )

            except Exception as e:
                print(f"Failed to send order notification: {e}")

            return response_data
            
        except Exception as e:
            print(f"Payment initiation failed: {e}")
            # If payment initiation fails, we might want to fail the order or keep it as pending
            # For now, let's re-raise to rollback or handle
            raise e
        
        return created_order