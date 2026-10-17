# services/order_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.order_repository import OrderRepository
from repositories.user_repository import UserRepository
from repositories.address_repository import AddressRepository
from repositories.product_catalog.variant_repository import VariantRepository
from repositories.delivery_repository import DeliveryRepository
from services.notification_service import NotificationService
from schemas.order_schema import OrderCreate
from datetime import datetime
from decimal import Decimal
from typing import Dict, Any, Optional, List
from utils.send_email import EmailService
from models.order.order import Order as OrderModel
from models.order.order_item import OrderItem as OrderItemModel
from models.order.order_history import OrderHistory as OrderHistoryModel
from models.delivery.delivery import Delivery as DeliveryModel
from models.user import User
from sqlalchemy import or_

import logging
logger = logging.getLogger(__name__)

class OrderService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = OrderRepository()
        self.user_repo = UserRepository()
        self.address_repo = AddressRepository()
        self.variant_repo = VariantRepository()
        self.delivery_repo = DeliveryRepository()
        self.notification_service = NotificationService(db)
        self.email_service = EmailService(db_session=db)
    
    def create_order(self, order_data: OrderCreate, user_id: int) -> Dict[str, Any]:
        try:
            # Validate address
            address = self.address_repo.get_address_by_id(self.db, order_data.address_id)
            if not address or address.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Address not found"
                )

            # Validate items and calculate totals
            subtotal = Decimal('0')
            validated_items = []
            items_summary_list = []
            
            for item in order_data.items:
                variant = self.variant_repo.get_variant_by_id(self.db, item['variant_id'])
                if not variant:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail=f"Variant {item['variant_id']} not found"
                    )
                if variant.stock_quantity < item['quantity']:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for variant {item['variant_id']}"
                    )

                item_total = Decimal(str(variant.price)) * Decimal(int(item['quantity']))
                subtotal += item_total
                validated_items.append((variant, int(item['quantity'])))
                
                # Prepare items summary for email
                product_name = variant.product.product_name if variant.product else "Unknown Product"
                items_summary_list.append(f"{product_name} ({variant.variant_name}) x {item['quantity']} = ${item_total}")

            # Calculate totals
            discount_amount = order_data.discount_amount or Decimal('0.00')
            delivery_fee = order_data.delivery_fee or Decimal('0.00')
            tax_amount = order_data.tax_amount or Decimal('0.00')
            
            # Calculate total from our calculated subtotal
            calculated_total = subtotal + tax_amount + delivery_fee - discount_amount
            
            # Create Order model instance
            new_order_model = OrderModel(
                user_id=user_id,
                address_id=order_data.address_id,
                subtotal=subtotal,
                discount_amount=discount_amount,
                delivery_fee=delivery_fee,
                tax_amount=tax_amount,
                total_amount=calculated_total,
                coupon_code=order_data.coupon_code,
                order_status="PLACED",
                payment_status="PENDING"
            )

            # Persist order
            self.db.add(new_order_model)
            self.db.flush()

            # Create order items and decrement stock
            for variant_obj, qty in validated_items:
                oi = OrderItemModel(
                    order_id=new_order_model.order_id,
                    variant_id=variant_obj.variant_id,
                    quantity=qty,
                    price=variant_obj.price,
                    total=variant_obj.price * qty
                )
                self.db.add(oi)

                # Update stock
                variant_obj.stock_quantity -= qty
                self.db.add(variant_obj)

            # Create initial history
            history = OrderHistoryModel(
                order_id=new_order_model.order_id,
                status="PLACED",
                updated_by=user_id
            )
            self.db.add(history)
            
            # ============================================
            # AUTOMATIC DELIVERY CREATION
            # ============================================
            # ============================================
            # AUTOMATIC DELIVERY CREATION (MANDATORY)
            # ============================================
            # Get current timestamp
            current_time = datetime.now()
            
            # Create delivery automatically for the order
            # Note: We let delivery_person_id and assigned_at be None/null by default
            delivery_data = {
                "order_id": new_order_model.order_id,
                "status": "AVAILABLE",
                "available_since": current_time,
                "is_available": True
            }
            
            # Create delivery using the model directly
            delivery = DeliveryModel(**delivery_data)
            self.db.add(delivery)
            self.db.flush()
            
            logger.info(f"✅ Delivery #{delivery.delivery_id} created automatically for order #{new_order_model.order_id}")

            # Commit everything
            self.db.commit()
            self.db.refresh(new_order_model)
            
            # ============================================
            # SEND EMAIL NOTIFICATIONS (IN BACKGROUND)
            # ============================================
            try:
                self._send_order_placement_emails(new_order_model, user_id, address, items_summary_list)
            except Exception as email_error:
                logger.error(f"Email sending failed but order created: {str(email_error)}")
            
            # ============================================
            # SEND DATABASE NOTIFICATIONS FOR ORDER CREATION
            # ============================================
            try:
                self._send_order_creation_notifications(new_order_model, user_id, address, len(validated_items))
            except Exception as notif_error:
                logger.error(f"Order creation notification failed: {str(notif_error)}")

            return self._serialize_order(new_order_model)

        except HTTPException:
            self.db.rollback()
            raise
        except Exception as e:
            logger.error(f"ORDER CREATION ERROR: {str(e)}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail="Order creation failed")
    
    def _send_order_placement_emails(self, order, user_id, address, items_summary_list):
        """Send order placement emails"""
        try:
            # Get customer details
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Customer"
            
            # Prepare order details
            order_details = {
                "order_id": order.order_id,
                "order_date": order.placed_at.strftime("%Y-%m-%d %H:%M:%S") if order.placed_at else datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "total_amount": float(order.total_amount),
                "subtotal": float(order.subtotal),
                "discount_amount": float(order.discount_amount),
                "delivery_fee": float(order.delivery_fee),
                "tax_amount": float(order.tax_amount),
                "customer_name": customer_name,
                "customer_id": user_id,
                "shipping_address": f"{address.line1}, {address.line2 if address.line2 else ''}, {address.area.area_name if address.area else ''}",
                "items_summary": "\n".join(items_summary_list)
            }
            
            # 1. Send email to customer
            customer_subject = f"🎉 Order Confirmed - #{order.order_id}"
            customer_message = f"""
Dear {customer_name},

Thank you for your order! Here are your order details:

Order ID: #{order.order_id}
Date: {order_details['order_date']}
Total Amount: ${order_details['total_amount']:.2f}

Shipping Address:
{order_details['shipping_address']}

Items Ordered:
{order_details['items_summary']}

Delivery Status: Your order is now available for delivery pickup.
Expected Delivery: 3-5 business days

You can track your order from your account dashboard.

Thank you for shopping with us!

Best regards,
Customer Support Team
"""
            self.email_service.send_to_user_by_id(user_id, customer_subject, customer_message)
            
            # 2. Send email to all admins
            admin_subject = f"📦 New Order Placed - #{order.order_id}"
            admin_message = f"""
NEW ORDER ALERT

Order ID: #{order.order_id}
Customer: {customer_name} (ID: {user_id})
Total Amount: ${order_details['total_amount']:.2f}
Order Date: {order_details['order_date']}

Items:
{order_details['items_summary']}

Shipping Address:
{order_details['shipping_address']}

Delivery Status: Delivery created automatically with status=AVAILABLE, is_available=true
Delivery persons can now see and accept this delivery.

Best regards,
Order Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 3. Send notification to all delivery persons about available delivery
            delivery_person_subject = f"📦 New Delivery Available - Order #{order.order_id}"
            delivery_person_message = f"""
NEW DELIVERY AVAILABLE

Order ID: #{order.order_id}
Customer: {customer_name}
Delivery Area: {address.area.area_name if address and address.area else 'Unknown Area'}
Order Amount: ${order_details['total_amount']:.2f}
Order Date: {order_details['order_date']}

Status: AVAILABLE for pickup (is_available=true)

Log in to the delivery app to accept this delivery.

Best regards,
Delivery Management System
"""
            try:
                # Send notification to all active delivery persons
                self.email_service.send_to_all_delivery_persons(delivery_person_subject, delivery_person_message)
                logger.info(f"Delivery available notification sent for order #{order.order_id}")
            except Exception as dp_email_error:
                logger.error(f"Failed to send delivery person notification: {str(dp_email_error)}")
            
            logger.info(f"✅ Order #{order.order_id} emails sent. Customer: Success, Admins: {len(admin_results.get('success', []))} sent")
            
        except Exception as e:
            logger.error(f"Failed to send order emails: {str(e)}")
            raise
    
    def get_user_orders(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all orders for a user"""
        try:
            # Call repository method
            result = self.repository.get_orders_by_user_id(self.db, user_id, page, per_page)
            
            if not result:
                return {
                    "orders": [],
                    "total_orders": 0,
                    "total_pages": 0
                }
            
            # Serialize each order
            orders_data = []
            for order in result["orders"]:
                try:
                    serialized_order = self._serialize_order(order)
                    orders_data.append(serialized_order)
                except Exception as e:
                    print(f"⚠️ Error serializing order {order.order_id}: {e}")
                    orders_data.append({
                        "order_id": order.order_id,
                        "order_status": order.order_status,
                        "payment_status": order.payment_status,
                        "total_amount": float(order.total_amount),
                        "subtotal": float(order.subtotal),
                        "discount_amount": float(order.discount_amount),
                        "delivery_fee": float(order.delivery_fee),
                        "tax_amount": float(order.tax_amount),
                        "placed_at": order.placed_at,
                        "items": [],
                        "histories": [],
                        "address": None
                    })
            
            return {
                "orders": orders_data,
                "total_orders": result["total_orders"],
                "total_pages": result["total_pages"]
            }
        except Exception as e:
            print(f"🔥 Error in get_user_orders: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch orders: {str(e)}"
            )
    
    def get_order_by_id(self, order_id: int, user_id: int, is_admin: bool = False) -> Dict[str, Any]:
        """Get order details by ID"""
        order = self.repository.get_order_by_id(self.db, order_id)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if not is_admin and order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return self._serialize_order(order)
    
    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, str]:
        """Cancel an order and send notification"""
        order = self.repository.get_order_by_id(self.db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if order.order_status in ["SHIPPED", "DELIVERED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel shipped or delivered order"
            )
        
        # Store old status for notification
        old_status = order.order_status
        
        # Update order status
        order.order_status = "CANCELLED"
        
        # Also cancel the delivery if it exists
        delivery = self.delivery_repo.get_delivery_by_order_id(self.db, order_id)
        if delivery:
            delivery.status = "CANCELLED"
            delivery.is_available = False
        
        # Restore stock
        items = order.items
        for item in items:
            variant = self.variant_repo.get_variant_by_id(self.db, item.variant_id)
            if variant:
                variant.stock_quantity += item.quantity
        
        # Add history
        history_data = {
            "order_id": order_id,
            "status": "CANCELLED",
            "updated_by": user_id
        }
        self.repository.create_order_history(self.db, history_data)
        
        self.db.commit()
        
        # ============================================
        # SEND CANCELLATION EMAIL NOTIFICATION
        # ============================================
        try:
            customer_subject = f"❌ Order #{order_id} Cancelled"
            customer_message = f"""
Dear Customer,

Your order #{order_id} has been cancelled successfully.

Any payment made will be refunded to your original payment method within 5-7 business days.

If you have any questions, please contact our support team.

Best regards,
Customer Support Team
"""
            self.email_service.send_to_user_by_id(user_id, customer_subject, customer_message)
            
            # Also notify admins
            admin_subject = f"⚠️ Order #{order_id} Cancelled by Customer"
            admin_message = f"""
ORDER CANCELLATION NOTIFICATION

Order ID: #{order_id}
Customer ID: {user_id}
Cancelled by: Customer
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

The order has been cancelled and:
1. Stock has been restored
2. Delivery has been cancelled and marked as not available (is_available=false)
3. Delivery persons have been notified (if assigned)

Best regards,
Order Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            logger.info(f"Cancellation emails sent for order #{order_id}")
            
        except Exception as email_error:
            logger.error(f"Failed to send cancellation emails: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR ORDER CANCELLATION
        # ============================================
        try:
            self._send_order_cancellation_notifications(order, user_id, old_status)
        except Exception as notif_error:
            logger.error(f"Order cancellation notification failed: {notif_error}")
        
        return {"message": "Order cancelled successfully"}
    
    def create_return_request(self, order_id: int, user_id: int, return_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a return request for an order"""
        # Verify order exists and belongs to user
        order = self.repository.get_order_by_id(self.db, order_id)
        if not order or order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if order can be returned
        if order.order_status not in ["DELIVERED"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order cannot be returned"
            )
        
        # Validate items and calculate refund amount
        total_refund = Decimal('0.00')
        return_items = []
        
        for item in return_data["items"]:
            if not item.get("variant_id") or item["variant_id"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Invalid variant ID: {item.get('variant_id')}"
                )
            
            if not item.get("quantity") or item["quantity"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quantity for variant {item['variant_id']}"
                )
            
            variant = self.variant_repo.get_variant_by_id(self.db, item["variant_id"])
            if not variant:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail=f"Product variant with ID {item['variant_id']} not found"
                )
            
            order_item = next((oi for oi in order.items if oi.variant_id == item["variant_id"]), None)
            if not order_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Variant {item['variant_id']} not found in order {order_id}"
                )
            
            if item["quantity"] > order_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Return quantity ({item['quantity']}) exceeds ordered quantity ({order_item.quantity})"
                )
            
            item_refund = order_item.price * item["quantity"]
            total_refund += item_refund
            
            return_items.append({
                "variant_id": item["variant_id"],
                "quantity": item["quantity"],
                "unit_price": float(order_item.price),
                "refund_amount": float(item_refund),
                "variant_name": variant.variant_name,
                "product_name": variant.product.product_name if variant.product else "Unknown"
            })
        
        # Create return request
        return_request_data = {
            "order_id": order_id,
            "reason": return_data["reason"],
            "status": "REQUESTED"
        }
        
        return_request = self.repository.create_return_request(self.db, return_request_data)
        
        # Create return items
        for item in return_items:
            return_product_data = {
                "return_id": return_request.return_id,
                "variant_id": item["variant_id"],
                "quantity": item["quantity"]
            }
            self.repository.create_return_product(self.db, return_product_data)
        
        self.db.commit()
        
        # ============================================
        # SEND NOTIFICATIONS FOR RETURN REQUEST
        # ============================================
        try:
            self._send_return_request_notifications(return_request, order, user_id, return_items)
        except Exception as notif_error:
            logger.error(f"Return request notification failed: {notif_error}")
        
        return {
            "return_id": return_request.return_id,
            "order_id": return_request.order_id,
            "reason": return_request.reason,
            "status": return_request.status,
            "requested_at": return_request.requested_at,
            "total_refund_amount": float(total_refund),
            "items": return_items
        }
    
    def get_all_orders(self, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all orders"""
        result = self.repository.get_all_orders(self.db, page, per_page, status)
        
        orders_data = [
            self._serialize_order(order) for order in result["orders"]
        ]
        
        return {
            "orders": orders_data,
            "total_orders": result["total_orders"],
            "total_pages": result["total_pages"]
        }
    
    def update_order_status(self, order_id: int, status: str, admin_id: int) -> Dict[str, Any]:
        """Update order status and send notifications"""
        order = self.repository.update_order_status(self.db, order_id, status)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Store old status for notification
        old_status = order.order_status
        
        # Add history
        history_data = {
            "order_id": order_id,
            "status": status,
            "updated_by": admin_id
        }
        self.repository.create_order_history(self.db, history_data)
        
        # If order status is SHIPPED, ensure delivery exists with is_available=true
        if status == "SHIPPED":
            try:
                current_time = datetime.now()
                
                # Check if delivery already exists
                existing_delivery = self.delivery_repo.get_delivery_by_order_id(self.db, order_id)
                if not existing_delivery:
                    # Create delivery if it doesn't exist
                    delivery_data = {
                        "order_id": order_id,
                        "delivery_person_id": None,
                        "status": "AVAILABLE",
                        "assigned_at": None,
                        "available_since": current_time,
                        "is_available": True
                    }
                    
                    delivery = DeliveryModel(**delivery_data)
                    self.db.add(delivery)
                    logger.info(f"Created delivery for shipped order #{order_id}")
                else:
                    # Update existing delivery to be available
                    existing_delivery.status = "AVAILABLE"
                    existing_delivery.is_available = True
                    existing_delivery.available_since = current_time
                    logger.info(f"Updated existing delivery #{existing_delivery.delivery_id} for shipped order #{order_id}")
                    
            except Exception as e:
                logger.error(f"Failed to create/update delivery for shipped order #{order_id}: {str(e)}")
        
        self.db.commit()
        self.db.refresh(order)
        
        # ============================================
        # SEND EMAIL NOTIFICATION FOR STATUS UPDATE
        # ============================================
        try:
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            customer_name = f"{customer.first_name} {customer.last_name}" if customer else "Customer"
            
            status_messages = {
                "PROCESSING": {
                    "subject": f"🔄 Order #{order_id} is Being Processed",
                    "body": f"Your order #{order_id} is now being processed and will be shipped soon."
                },
                "SHIPPED": {
                    "subject": f"🚚 Order #{order_id} Has Been Shipped",
                    "body": f"Great news! Your order #{order_id} has been shipped and is on its way to you."
                },
                "DELIVERED": {
                    "subject": f"✅ Order #{order_id} Has Been Delivered",
                    "body": f"Your order #{order_id} has been successfully delivered!"
                },
                "CANCELLED": {
                    "subject": f"❌ Order #{order_id} Has Been Cancelled",
                    "body": f"Your order #{order_id} has been cancelled."
                }
            }
            
            message_config = status_messages.get(status, {
                "subject": f"Order #{order_id} Status Updated",
                "body": f"Your order #{order_id} status has been updated to {status}."
            })
            
            customer_message = f"""
Dear {customer_name},

{message_config['body']}

You can view your order details in your account dashboard.

Thank you for shopping with us!

Best regards,
Customer Support Team
"""
            
            # Send to customer
            self.email_service.send_to_user_by_id(
                order.user_id,
                message_config['subject'],
                customer_message
            )
            
            # If order is shipped, notify delivery team
            if status == "SHIPPED":
                delivery_subject = f"📦 New Delivery Available - Order #{order_id}"
                delivery_message = f"""
New Delivery Available for Pickup

Order ID: #{order_id}
Customer: {customer_name}

The order has been shipped and is now AVAILABLE for delivery pickup.

Delivery persons can accept this delivery from the delivery app.

Best regards,
Delivery Management System
"""
                self.email_service.send_to_all_delivery_persons(delivery_subject, delivery_message)
            
            logger.info(f"Order status update emails sent for order #{order_id}")
            
        except Exception as email_error:
            logger.error(f"Failed to send status update emails: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR STATUS UPDATE
        # ============================================
        try:
            self._send_order_status_notifications(order, old_status, status, admin_id)
        except Exception as notif_error:
            logger.error(f"Order status notification failed: {notif_error}")
        
        return self._serialize_order(order)
    
    def _serialize_order_item(self, item: OrderItemModel) -> Dict[str, Any]:
        """Serialize order item with product details"""
        variant = self.variant_repo.get_variant_by_id(self.db, item.variant_id)
        
        product_name = "Unknown Product"
        variant_name = None
        
        if variant:
            variant_name = variant.variant_name
            if variant.product:
                product_name = variant.product.product_name
        
        return {
            "variant_id": item.variant_id,
            "product_name": product_name,
            "variant_name": variant_name,
            "price": float(item.price),
            "quantity": item.quantity,
            "total": float(item.total)
        }
    
    def _serialize_order_history(self, history: OrderHistoryModel) -> Dict[str, Any]:
        """Serialize order history"""
        user = self.user_repo.get_user_by_id(self.db, history.updated_by)
        return {
            "history_id": history.history_id,
            "status": history.status,
            "updated_at": history.updated_at,
            "updated_by_name": f"{user.first_name} {user.last_name}" if user else "System"
        }
    
    def _serialize_order(self, order: OrderModel) -> Dict[str, Any]:
        """Serialize order with all related data"""
        address = self.address_repo.get_address_by_id(self.db, order.address_id)
        
        items = order.items
        histories = order.histories
        
        # Get delivery information
        delivery = self.delivery_repo.get_delivery_by_order_id(self.db, order.order_id)
        delivery_status = delivery.status if delivery else None
        delivery_id = delivery.delivery_id if delivery else None
        is_available = delivery.is_available if delivery else None
        available_since = delivery.available_since if delivery else None
        
        return {
            "order_id": order.order_id,
            "order_status": order.order_status,
            "payment_status": order.payment_status,
            "total_amount": float(order.total_amount),
            "subtotal": float(order.subtotal),
            "discount_amount": float(order.discount_amount),
            "delivery_fee": float(order.delivery_fee),
            "tax_amount": float(order.tax_amount),
            "placed_at": order.placed_at,
            "delivery_status": delivery_status,
            "delivery_id": delivery_id,
            "is_available": is_available,
            "available_since": available_since,
            "items": [self._serialize_order_item(item) for item in items],
            "histories": [self._serialize_order_history(history) for history in histories],
            "address": {
                "address_id": address.address_id,
                "line1": address.line1,
                "line2": address.line2,
                "area_name": address.area.area_name if address.area else None,
                "city_name": address.area.city.city_name if address.area and address.area.city else None,
                "state_name": address.area.city.state.state_name if address.area and address.area.city and address.area.city.state else None,
                "pincode": address.area.pincode if address.area else None
            } if address else None
        }
    
    # ===== NOTIFICATION HELPER METHODS (USING WORKING METHODS FROM FIRST FILE) =====
    
    def _send_order_creation_notifications(self, order: OrderModel, user_id: int, address, item_count: int):
        """Send database notifications when order is created"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            if not customer:
                print("❌ Customer not found for notification")
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Get area name for notification
            area_name = address.area.area_name if address and address.area else "Unknown Area"
            
            customer_notif = self.notification_service.send_notification(
                user_id=customer.user_id,
                title="🎉 Order Confirmed",
                message=f"Your order #{order.order_id} has been placed successfully. Total: ${order.total_amount:.2f}",
                type="ORDER",
                reference_id=order.order_id
            )
            
            if customer_notif:
                print(f"  ✅ Customer notification created: ID {getattr(customer_notif, 'notification_id', 'unknown')}")
            else:
                print("  ❌ Failed to create customer notification")
            
            # 2. Send notifications to admin users
            # Using the working _get_admin_users() method from first file
            admin_users = self._get_admin_users()
            
            for admin in admin_users:
                admin_notif = self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📦 New Order Placed",
                    message=f"New order #{order.order_id} from {customer_name}. Amount: ${order.total_amount:.2f}, Items: {item_count}, Area: {area_name}",
                    type="ORDER",
                    reference_id=order.order_id
                )
                
                if admin_notif:
                    print(f"  ✅ Admin notification created: ID {getattr(admin_notif, 'notification_id', 'unknown')}")
                else:
                    print(f"  ❌ Failed to create admin notification for admin ID {admin.user_id}")
            
            logger.info(f"✅ Order creation notifications sent for order #{order.order_id}")
                
        except Exception as e:
            print(f"❌ Failed to send order creation notifications: {e}")
            logger.error(f"❌ Failed to send order creation notifications: {e}")

    def _send_order_cancellation_notifications(self, order: OrderModel, user_id: int, old_status: str):
        """Send database notifications when order is cancelled"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            if not customer:
                print("❌ Customer not found for cancellation notification")
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            customer_notif = self.notification_service.send_notification(
                user_id=customer.user_id,
                title="❌ Order Cancelled",
                message=f"Your order #{order.order_id} has been cancelled. Status changed from {old_status} to CANCELLED.",
                type="ORDER",
                reference_id=order.order_id
            )
            
            if customer_notif:
                print(f"  ✅ Customer cancellation notification created")
            
            # 2. Send notifications to admin users
            admin_users = self._get_admin_users()
            
            for admin in admin_users:
                print(f"  - Sending cancellation to admin: {admin.first_name}")
                admin_notif = self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="⚠️ Order Cancelled by Customer",
                    message=f"Order #{order.order_id} from {customer_name} cancelled by customer. Was: {old_status}.",
                    type="ORDER",
                    reference_id=order.order_id
                )
                
                if admin_notif:
                    print(f"  ✅ Admin cancellation notification created")
            
            logger.info(f"✅ Order cancellation notifications sent for order #{order.order_id}")
                
        except Exception as e:
            print(f"❌ Failed to send order cancellation notifications: {e}")
            logger.error(f"❌ Failed to send order cancellation notifications: {e}")

    def _send_return_request_notifications(self, return_request, order: OrderModel, user_id: int, return_items: list):
        """Send database notifications when return request is created"""
        try:
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, user_id)
            if not customer:
                print("❌ Customer not found for return notification")
                return
            
            customer_name = f"{customer.first_name} {customer.last_name}"
            
            # Calculate total refund amount
            total_refund = sum(item['refund_amount'] for item in return_items)
            
            customer_notif = self.notification_service.send_notification(
                user_id=customer.user_id,
                title="🔄 Return Requested",
                message=f"Return request #{return_request.return_id} created for Order #{order.order_id}. Total refund: ${total_refund:.2f}",
                type="RETURN",
                reference_id=return_request.return_id
            )
            
            if customer_notif:
                print(f"  ✅ Customer return notification created")
            
            # 2. Send notifications to admin users
            admin_users = self._get_admin_users()
            
            for admin in admin_users:
                item_count = len(return_items)
                admin_notif = self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🔄 New Return Request",
                    message=f"New return request #{return_request.return_id} from {customer_name} for Order #{order.order_id}. Items: {item_count}, Refund: ${total_refund:.2f}",
                    type="RETURN",
                    reference_id=return_request.return_id
                )
                
                if admin_notif:
                    print(f"  ✅ Admin return notification created")
            
            logger.info(f"✅ Return request notifications sent for return #{return_request.return_id}")
                
        except Exception as e:
            print(f"❌ Failed to send return request notifications: {e}")
            logger.error(f"❌ Failed to send return request notifications: {e}")

    def _send_order_status_notifications(self, order: OrderModel, old_status: str, new_status: str, admin_id: int):
        """Send database notifications when order status is updated"""
        try:
            # Get admin user who made the change
            admin_user = self.user_repo.get_user_by_id(self.db, admin_id)
            if not admin_user:
                print("❌ Admin not found for status update notification")
                return
            
            admin_name = f"{admin_user.first_name} {admin_user.last_name}"
            
            # Get customer user
            customer = self.user_repo.get_user_by_id(self.db, order.user_id)
            
            # Status emoji mapping
            status_emojis = {
                "PLACED": "📝",
                "PROCESSING": "🔄",
                "SHIPPED": "🚚",
                "DELIVERED": "✅",
                "CANCELLED": "❌"
            }
            
            old_emoji = status_emojis.get(old_status, "📊")
            new_emoji = status_emojis.get(new_status, "📊")
            
            
            # Get admin users (excluding the one who made the change)
            admin_users = self._get_admin_users()
            other_admins = [admin for admin in admin_users if admin.user_id != admin_id]
            
            # 1. Send notifications to other admin users
            for admin in other_admins:
                print(f"  - Sending status update to admin: {admin.first_name}")
                admin_notif = self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title=f"{new_emoji} Order Status Updated",
                    message=f"Order #{order.order_id}: Status changed from {old_status} to {new_status} by {admin_name}.",
                    type="ORDER",
                    reference_id=order.order_id
                )
                
                if admin_notif:
                    print(f"  ✅ Admin status notification created")
            
            # 2. Send notification to customer if status is SHIPPED or DELIVERED
            if customer and new_status in ["SHIPPED", "DELIVERED"]:
                customer_message = f"Your order #{order.order_id} status has been updated to {new_status}."
                if new_status == "SHIPPED":
                    customer_message += " It has been shipped and is now available for delivery."
                elif new_status == "DELIVERED":
                    customer_message += " It has been successfully delivered!"
                
                customer_notif = self.notification_service.send_notification(
                    user_id=customer.user_id,
                    title=f"{new_emoji} Order Status Updated",
                    message=customer_message,
                    type="ORDER",
                    reference_id=order.order_id
                )
                
                if customer_notif:
                    print(f"  ✅ Customer status notification created")
            
            # 3. Send notification to delivery persons if status is SHIPPED
            if new_status == "SHIPPED":
                # Get all active delivery persons
                delivery_persons = self._get_delivery_persons()
                for dp in delivery_persons:
                    print(f"  - Sending delivery notification to: {dp.first_name} {dp.last_name}")
                    dp_notif = self.notification_service.send_notification(
                        user_id=dp.user_id,
                        title="📦 New Delivery Available",
                        message=f"Order #{order.order_id} is now available for delivery pickup. Status: {new_status}",
                        type="DELIVERY",
                        reference_id=order.order_id
                    )
                    
                    if dp_notif:
                        print(f"  ✅ Delivery person notification created")
            
            logger.info(f"✅ Order status notifications sent for order #{order.order_id}")
                
        except Exception as e:
            print(f"❌ Failed to send order status notifications: {e}")
            logger.error(f"❌ Failed to send order status notifications: {e}")
    
    def _get_admin_users(self):
        """Get admin users directly from database"""
        try:
            # First, let's check what fields your User model actually has
            user_fields = dir(User)
            
            # Try different possible field names for admin status
            admin_users = []
            
            # Check if User has an 'is_admin' field
            if hasattr(User, 'is_admin'):
                admin_users = self.db.query(User).filter(User.is_admin == True).all()
            
            # Check if User has a 'role' field  
            elif hasattr(User, 'role'):
                admin_users = self.db.query(User).filter(
                    or_(
                        User.role == 'ADMIN',
                        User.role == 'admin',
                        User.role.ilike('%admin%')
                    )
                ).all()
            
            # Check if User has a 'user_type' field
            elif hasattr(User, 'user_type'):
                admin_users = self.db.query(User).filter(
                    or_(
                        User.user_type == 'ADMIN',
                        User.user_type == 'admin'
                    )
                ).all()
            
            # If no admin field found, get all users as fallback
            if not admin_users:
                print("⚠️ No specific admin field found, getting all users as fallback")
                admin_users = self.db.query(User).limit(3).all()
            
            return admin_users
            
        except Exception as e:
            print(f"⚠️ Error getting admin users: {e}")
            return []
    
    def _get_delivery_persons(self):
        """Get delivery persons directly from database"""
        try:
            # Try to get users with delivery role
            delivery_persons = self.db.query(User).filter(
                or_(
                    User.role == 'DELIVERY_PERSON',
                    User.role == 'DELIVERY',
                    User.role == 'delivery',
                    User.user_type == 'DELIVERY_PERSON'
                )
            ).all()
            
            if not delivery_persons:
                print("⚠️ No delivery persons found")
                return []
            
            return delivery_persons
            
        except Exception as e:
            print(f"⚠️ Error getting delivery persons: {e}")
            return []