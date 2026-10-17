# chatbot_service.py
from sqlalchemy.orm import Session
from typing import Optional
from repositories.chatbot_repository import ChatbotRepository
from schemas.chatbot_schema import (
    ChatbotDataResponse, UserInfo, AddressInfo, CategoryInfo, ProductInfo,
    ProductVariantInfo, CartItemInfo, OrderInfo, OrderItemInfo,
    ReviewInfo, DeliveryPersonInfo, DeliveryInfo, PaymentInfo
)
from datetime import datetime
from decimal import Decimal


class ChatbotService:
    def __init__(self):
        self.repository = ChatbotRepository()
    
    def get_all_data_for_chatbot(self, db: Session, current_user_id: Optional[int] = None) -> ChatbotDataResponse:
        """
        Get all relevant data for chatbot
        """
        
        # Get current user info
        current_user_info = None
        current_user_roles = []
        
        if current_user_id:
            user_data = self.repository.get_current_user_data(db, current_user_id)
            if user_data:
                current_user_info = self._create_user_info(user_data["user"])
                current_user_roles = user_data["roles"]
        
        # Get all data
        try:
            # 1. Users
            all_users = self.repository.get_all_users(db)
            users_info = [self._create_user_info(user) for user in all_users]
            
            # 2. Categories
            categories = self.repository.get_categories(db)
            categories_info = [self._create_category_info(cat) for cat in categories]
            
            # 3. Products
            products_data = self.repository.get_products(db)
            products_info = [self._create_product_info(data) for data in products_data]
            
            # 4. Variants
            variants_data = self.repository.get_variants(db)
            variants_info = [self._create_variant_info(data) for data in variants_data]
            
            # 5. Current user specific data (if logged in)
            cart_items_info = []
            orders_info = []
            payments_info = []
            reviews_info = []
            addresses_info = []
            delivery_person_info = None
            deliveries_info = []
            
            if current_user_id:
                # Addresses
                addresses_data = self.repository.get_user_addresses(db, current_user_id)
                addresses_info = [self._create_address_info(data) for data in addresses_data]
                
                # Cart items
                cart_data = self.repository.get_user_cart_items(db, current_user_id)
                cart_items_info = [self._create_cart_item_info(data) for data in cart_data]
                
                # Orders
                orders_data = self.repository.get_user_orders(db, current_user_id)
                orders_info = [self._create_order_info(data) for data in orders_data]
                
                # Payments
                payments = self.repository.get_user_payments(db, current_user_id)
                payments_info = [self._create_payment_info(payment) for payment in payments]
                
                # Reviews
                reviews_data = self.repository.get_user_reviews(db, current_user_id)
                reviews_info = [self._create_review_info(data) for data in reviews_data]
                
                # Delivery data (if delivery person)
                delivery_person = self.repository.get_delivery_person_info(db, current_user_id)
                if delivery_person:
                    delivery_person_info = self._create_delivery_person_info(delivery_person)
                    deliveries = self.repository.get_deliveries(db, delivery_person.delivery_person_id)
                    deliveries_info = [self._create_delivery_info(delivery) for delivery in deliveries]
            
            # Create response
            response = ChatbotDataResponse(
                success=True,
                message=f"Chatbot data retrieved successfully for user {current_user_id if current_user_id else 'anonymous'}",
                timestamp=datetime.utcnow(),
                current_user=current_user_info,
                current_user_roles=current_user_roles,
                users=users_info,
                categories=categories_info,
                products=products_info,
                variants=variants_info,
                addresses=addresses_info,
                cart_items=cart_items_info,
                orders=orders_info,
                payments=payments_info,
                reviews=reviews_info,
                delivery_person_info=delivery_person_info,
                deliveries=deliveries_info
            )
            
            return response
            
        except Exception as e:
            print(f"Error preparing chatbot data: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Return basic response on error
            return ChatbotDataResponse(
                success=True,
                message=f"Chatbot data retrieved with some errors: {str(e)}",
                timestamp=datetime.utcnow(),
                current_user=current_user_info,
                current_user_roles=current_user_roles
            )
    
    # ==================== TRANSFORMATION METHODS ====================
    
    def _create_user_info(self, user):
        return UserInfo(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            profile_img_url=user.profile_img_url,
            gender=user.gender,
            dob=user.dob,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at,
            last_login=user.last_login
        )
    
    def _create_address_info(self, data):
        return AddressInfo(
            address_id=data["address"].address_id,
            user_id=data["address"].user_id,
            address_type=data["address"].address_type,
            line1=data["address"].line1,
            line2=data["address"].line2,
            area_name=data["area_name"],
            city_name=data["city_name"],
            state_name=data["state_name"],
            pincode=data["pincode"],
            is_default=data["address"].is_default,
            created_at=data["address"].created_at
        )
    
    def _create_category_info(self, category):
        return CategoryInfo(
            category_id=category.category_id,
            category_name=category.category_name,
            description=category.description
        )
    
    def _create_product_info(self, data):
        return ProductInfo(
            product_id=data["product"].product_id,
            product_name=data["product"].product_name,
            description=data["product"].description,
            brand_name=data["brand_name"],
            category_name=data["category_name"],
            created_at=data["product"].created_at
        )
    
    def _create_variant_info(self, data):
        return ProductVariantInfo(
            variant_id=data["variant"].variant_id,
            variant_name=data["variant"].variant_name,
            product_id=data["variant"].product_id,
            product_name=data["product_name"],
            product_description=data.get("product_description"),
            price=Decimal(str(data["variant"].price)) if data["variant"].price else Decimal('0'),
            stock_quantity=data["variant"].stock_quantity or 0,
            discount_type=data["variant"].discount_type or 'NONE',
            discount_value=Decimal(str(data["variant"].discount_value)) if data["variant"].discount_value else Decimal('0'),
            status=data["variant"].status or 'ACTIVE',
            attributes=data.get("attributes", {}),
            images=data.get("images", []),
            brand_name=data.get("brand_name"),
            category_name=data.get("category_name")
        )
    
    def _create_cart_item_info(self, data):
        return CartItemInfo(
            user_id=data["cart_item"].user_id,
            variant_id=data["cart_item"].variant_id,
            product_name=data["product_name"],
            price=Decimal(str(data["cart_item"].price)) if data["cart_item"].price else Decimal('0'),
            quantity=data["cart_item"].quantity or 1,
            added_at=data["cart_item"].added_at
        )
    
    def _create_order_info(self, data):
        order_items = []
        for item_data in data["items"]:
            order_items.append(OrderItemInfo(
                order_id=item_data["item"].order_id,
                variant_id=item_data["item"].variant_id,
                product_name=item_data["product_name"],
                quantity=item_data["item"].quantity or 0,
                price=Decimal(str(item_data["item"].price)) if item_data["item"].price else Decimal('0'),
                discount_per_unit=Decimal(str(item_data["item"].discount_per_unit)) if item_data["item"].discount_per_unit else Decimal('0'),
                total=Decimal(str(item_data["item"].total)) if item_data["item"].total else Decimal('0')
            ))
        
        return OrderInfo(
            order_id=data["order"].order_id,
            user_id=data["order"].user_id,
            subtotal=Decimal(str(data["order"].subtotal)) if data["order"].subtotal else Decimal('0'),
            discount_amount=Decimal(str(data["order"].discount_amount)) if data["order"].discount_amount else Decimal('0'),
            delivery_fee=Decimal(str(data["order"].delivery_fee)) if data["order"].delivery_fee else Decimal('0'),
            tax_amount=Decimal(str(data["order"].tax_amount)) if data["order"].tax_amount else Decimal('0'),
            total_amount=Decimal(str(data["order"].total_amount)) if data["order"].total_amount else Decimal('0'),
            coupon_code=data["order"].coupon_code,
            payment_status=data["order"].payment_status or 'PENDING',
            order_status=data["order"].order_status or 'PLACED',
            placed_at=data["order"].placed_at,
            items=order_items
        )
    
    def _create_payment_info(self, payment):
        return PaymentInfo(
            payment_id=payment.payment_id,
            user_id=payment.user_id,
            order_id=payment.order_id,
            payment_method=payment.payment_method,
            payment_status=payment.payment_status or 'PENDING',
            amount_paid=Decimal(str(payment.amount_paid)) if payment.amount_paid else Decimal('0'),
            payment_date=payment.payment_date
        )
    
    def _create_review_info(self, data):
        return ReviewInfo(
            review_id=data["review"].review_id,
            user_id=data["review"].user_id,
            variant_id=data["review"].variant_id,
            product_name=data["product_name"],
            rating=data["review"].rating or 0,
            title=data["review"].title,
            body=data["review"].body,
            created_at=data["review"].created_at
        )
    
    def _create_delivery_person_info(self, dp):
        return DeliveryPersonInfo(
            delivery_person_id=dp.delivery_person_id,
            user_id=dp.user_id,
            license_number=dp.license_number,
            status=dp.status or 'ACTIVE',
            rating=Decimal(str(dp.rating)) if dp.rating else Decimal('0'),
            is_online=dp.is_online or False
        )
    
    def _create_delivery_info(self, delivery):
        return DeliveryInfo(
            delivery_id=delivery.delivery_id,
            order_id=delivery.order_id,
            status=delivery.status or 'ASSIGNED',
            assigned_at=delivery.assigned_at,
            delivered_at=delivery.delivered_at
        )