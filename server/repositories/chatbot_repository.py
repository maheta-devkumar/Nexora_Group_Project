# chatbot_repository.py
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime


class ChatbotRepository:
    
    @staticmethod
    def get_current_user_data(db: Session, user_id: int) -> Dict[str, Any]:
        """Get current user and their roles"""
        print(f"\n=== DEBUG: Getting user data for user_id: {user_id} ===")
        
        from models.user import User
        from models.role import UserRole, Role
        
        # Use simpler query
        user = db.query(User).filter(User.user_id == user_id).first()
        print(f"DEBUG: User query result - found: {user is not None}")
        
        if not user:
            print("DEBUG: No user found!")
            return None
        
        print(f"DEBUG: User found: {user.user_id}, {user.first_name} {user.last_name}")
        
        # Get user roles
        roles = db.query(Role).join(UserRole, UserRole.role_id == Role.role_id)\
            .filter(UserRole.user_id == user_id).all()
        
        role_names = [role.role_name for role in roles]
        print(f"DEBUG: User roles: {role_names}")
        
        return {
            "user": user,
            "roles": role_names
        }
    
    @staticmethod
    def get_all_users(db: Session) -> List[Any]:
        """Get all users"""
        print(f"\n=== DEBUG: Getting all users ===")
        
        from models.user import User
        
        users = db.query(User).all()
        print(f"DEBUG: Found {len(users)} users")
        
        if users:
            print(f"DEBUG: First 3 users: {[(u.user_id, u.first_name) for u in users[:3]]}")
        
        return users
    
    @staticmethod
    def get_user_addresses(db: Session, user_id: int) -> List[Any]:
        """Get user addresses"""
        print(f"\n=== DEBUG: Getting addresses for user_id: {user_id} ===")
        
        from models.address import Address, Area, City, State
        
        addresses = db.query(Address).filter(Address.user_id == user_id).all()
        print(f"DEBUG: Found {len(addresses)} addresses for user")
        
        result = []
        
        for addr in addresses:
            print(f"DEBUG: Processing address ID: {addr.address_id}")
            
            area = db.query(Area).filter(Area.area_id == addr.area_id).first()
            print(f"DEBUG: Area found: {area is not None}")
            
            city = None
            state = None
            
            if area:
                city = db.query(City).filter(City.city_id == area.city_id).first()
                print(f"DEBUG: City found: {city is not None}")
                
                if city:
                    state = db.query(State).filter(State.state_id == city.state_id).first()
                    print(f"DEBUG: State found: {state is not None}")
            
            result.append({
                "address": addr,
                "area_name": area.area_name if area else "Unknown",
                "city_name": city.city_name if city else "Unknown",
                "state_name": state.state_name if state else "Unknown",
                "pincode": area.pincode if area else None
            })
        
        print(f"DEBUG: Returning {len(result)} address entries")
        return result
    
    @staticmethod
    def get_user_cart_items(db: Session, user_id: int) -> List[Any]:
        """Get user cart items"""
        print(f"\n=== DEBUG: Getting cart items for user_id: {user_id} ===")
        
        from models.cart import Cart
        from models.product_catalog.product_variant import ProductVariant
        from models.product_catalog.product import Product
        
        cart_items = db.query(Cart).filter(Cart.user_id == user_id).all()
        print(f"DEBUG: Found {len(cart_items)} cart items")
        
        result = []
        
        for item in cart_items:
            print(f"DEBUG: Processing cart item ID: {item.cart_id}")
            
            variant = db.query(ProductVariant).filter(
                ProductVariant.variant_id == item.variant_id
            ).first()
            
            if variant:
                product = db.query(Product).filter(
                    Product.product_id == variant.product_id
                ).first()
                
                print(f"DEBUG: Found product: {product.product_name if product else 'No product'}")
                
                result.append({
                    "cart_item": item,
                    "product_name": product.product_name if product else "Unknown",
                    "variant": variant
                })
            else:
                print(f"DEBUG: No variant found for variant_id: {item.variant_id}")
        
        print(f"DEBUG: Returning {len(result)} cart entries")
        return result
    
    @staticmethod
    def get_user_orders(db: Session, user_id: int) -> List[Any]:
        """Get user orders with items"""
        print(f"\n=== DEBUG: Getting orders for user_id: {user_id} ===")
        
        from models.order.order import Order
        from models.order.order_item import OrderItem
        from models.product_catalog.product_variant import ProductVariant
        from models.product_catalog.product import Product
        
        orders = db.query(Order).filter(Order.user_id == user_id).all()
        print(f"DEBUG: Found {len(orders)} orders")
        
        result = []
        
        for order in orders:
            print(f"DEBUG: Processing order ID: {order.order_id}")
            
            order_items = []
            items = db.query(OrderItem).filter(OrderItem.order_id == order.order_id).all()
            print(f"DEBUG: Found {len(items)} items for order {order.order_id}")
            
            for item in items:
                variant = db.query(ProductVariant).filter(
                    ProductVariant.variant_id == item.variant_id
                ).first()
                
                if variant:
                    product = db.query(Product).filter(
                        Product.product_id == variant.product_id
                    ).first()
                    
                    order_items.append({
                        "item": item,
                        "product_name": product.product_name if product else "Unknown",
                        "variant": variant
                    })
                else:
                    print(f"DEBUG: No variant found for item variant_id: {item.variant_id}")
            
            result.append({
                "order": order,
                "items": order_items
            })
        
        print(f"DEBUG: Returning {len(result)} order entries")
        return result
    
    @staticmethod
    def get_user_payments(db: Session, user_id: int) -> List[Any]:
        """Get user payments"""
        print(f"\n=== DEBUG: Getting payments for user_id: {user_id} ===")
        
        from models.payment import Payment
        
        payments = db.query(Payment).filter(Payment.user_id == user_id).all()
        print(f"DEBUG: Found {len(payments)} payments")
        
        if payments:
            print(f"DEBUG: Payment IDs: {[p.payment_id for p in payments]}")
        
        return payments
    
    @staticmethod
    def get_user_reviews(db: Session, user_id: int) -> List[Any]:
        """Get user reviews"""
        print(f"\n=== DEBUG: Getting reviews for user_id: {user_id} ===")
        
        from models.product_catalog.product_review import ProductReview
        from models.product_catalog.product_variant import ProductVariant
        from models.product_catalog.product import Product
        
        reviews = db.query(ProductReview).filter(ProductReview.user_id == user_id).all()
        print(f"DEBUG: Found {len(reviews)} reviews")
        
        result = []
        
        for review in reviews:
            variant = db.query(ProductVariant).filter(
                ProductVariant.variant_id == review.variant_id
            ).first()
            
            if variant:
                product = db.query(Product).filter(
                    Product.product_id == variant.product_id
                ).first()
                
                result.append({
                    "review": review,
                    "product_name": product.product_name if product else "Unknown",
                    "variant": variant
                })
            else:
                print(f"DEBUG: No variant found for review variant_id: {review.variant_id}")
        
        print(f"DEBUG: Returning {len(result)} review entries")
        return result
    
    @staticmethod
    def get_categories(db: Session) -> List[Any]:
        """Get all categories"""
        print(f"\n=== DEBUG: Getting all categories ===")
        
        from models.product_catalog.category import Category
        
        categories = db.query(Category).all()
        print(f"DEBUG: Found {len(categories)} categories")
        
        if categories:
            print(f"DEBUG: Category names: {[c.category_name for c in categories[:5]]}")
        
        return categories
    
    @staticmethod
    def get_products(db: Session) -> List[Any]:
        """Get all products with brand and category"""
        print(f"\n=== DEBUG: Getting all products ===")
        
        from models.product_catalog.product import Product
        from models.product_catalog.product_brand import ProductBrand
        from models.product_catalog.sub_category import SubCategory
        from models.product_catalog.category import Category
        
        products = db.query(Product).all()
        print(f"DEBUG: Found {len(products)} products")
        
        result = []
        
        for product in products[:5]:  # Just print first 5 for debugging
            print(f"DEBUG: Processing product ID: {product.product_id}, Name: {product.product_name}")
            
            brand = None
            if product.brand_id:
                brand = db.query(ProductBrand).filter(
                    ProductBrand.brand_id == product.brand_id
                ).first()
                print(f"DEBUG: Brand found: {brand.brand_name if brand else 'No brand'}")
            
            category_name = None
            if product.sub_category_id:
                sub_category = db.query(SubCategory).filter(
                    SubCategory.sub_category_id == product.sub_category_id
                ).first()
                if sub_category:
                    category = db.query(Category).filter(
                        Category.category_id == sub_category.category_id
                    ).first()
                    if category:
                        category_name = category.category_name
                    print(f"DEBUG: Sub-category: {sub_category.sub_category_name if sub_category else 'No sub-cat'}")
            
            result.append({
                "product": product,
                "brand": brand,
                "brand_name": brand.brand_name if brand else None,
                "category_name": category_name,
                "sub_category_id": product.sub_category_id
            })
        
        # Process remaining products without debug prints
        for product in products[5:]:
            brand = None
            if product.brand_id:
                brand = db.query(ProductBrand).filter(
                    ProductBrand.brand_id == product.brand_id
                ).first()
            
            category_name = None
            if product.sub_category_id:
                sub_category = db.query(SubCategory).filter(
                    SubCategory.sub_category_id == product.sub_category_id
                ).first()
                if sub_category:
                    category = db.query(Category).filter(
                        Category.category_id == sub_category.category_id
                    ).first()
                    if category:
                        category_name = category.category_name
            
            result.append({
                "product": product,
                "brand": brand,
                "brand_name": brand.brand_name if brand else None,
                "category_name": category_name,
                "sub_category_id": product.sub_category_id
            })
        
        print(f"DEBUG: Returning {len(result)} product entries")
        return result
    
    @staticmethod
    def get_variants(db: Session) -> List[Any]:
        """Get all variants with product info, attributes, images, brand, and category"""
        print(f"\n=== DEBUG: Getting all variants ===")
        
        from models.product_catalog.product_variant import ProductVariant
        from models.product_catalog.product import Product
        from models.product_catalog.attribute_variant import AttributeVariant
        from models.product_catalog.product_attribute import ProductAttribute
        from models.product_catalog.product_image import ProductImage
        from models.product_catalog.product_brand import ProductBrand
        from models.product_catalog.sub_category import SubCategory
        from models.product_catalog.category import Category
        
        variants = db.query(ProductVariant).all()
        print(f"DEBUG: Found {len(variants)} variants")
        
        result = []
        
        for variant in variants[:3]:  # Just print first 3 for debugging
            print(f"DEBUG: Processing variant ID: {variant.variant_id}")
            
            product = db.query(Product).filter(
                Product.product_id == variant.product_id
            ).first()
            
            if not product:
                print(f"DEBUG: No product found for variant {variant.variant_id}")
                continue
            
            print(f"DEBUG: Product found: {product.product_name}")
            
            # Get brand
            brand = None
            if product.brand_id:
                brand = db.query(ProductBrand).filter(
                    ProductBrand.brand_id == product.brand_id
                ).first()
                print(f"DEBUG: Brand found: {brand.brand_name if brand else 'No brand'}")
            
            # Get category
            category_name = None
            if product.sub_category_id:
                sub_category = db.query(SubCategory).filter(
                    SubCategory.sub_category_id == product.sub_category_id
                ).first()
                if sub_category:
                    category = db.query(Category).filter(
                        Category.category_id == sub_category.category_id
                    ).first()
                    if category:
                        category_name = category.category_name
                    print(f"DEBUG: Sub-category: {sub_category.sub_category_name if sub_category else 'No sub-cat'}")
            
            # Get attributes
            attributes = {}
            attr_variants = db.query(AttributeVariant).filter(
                AttributeVariant.variant_id == variant.variant_id
            ).all()
            print(f"DEBUG: Found {len(attr_variants)} attributes")
            
            for av in attr_variants:
                attribute = db.query(ProductAttribute).filter(
                    ProductAttribute.attribute_id == av.attribute_id
                ).first()
                if attribute:
                    attributes[attribute.attribute_name] = av.value
            
            # Get images
            images = db.query(ProductImage).filter(
                ProductImage.variant_id == variant.variant_id
            ).order_by(ProductImage.is_default.desc()).all()
            image_urls = [img.url for img in images]
            print(f"DEBUG: Found {len(images)} images")
            
            result.append({
                "variant": variant,
                "product": product,
                "product_name": product.product_name,
                "product_description": product.description,
                "brand": brand,
                "brand_name": brand.brand_name if brand else None,
                "category_name": category_name,
                "attributes": attributes,
                "images": image_urls
            })
        
        # Process remaining variants without debug prints
        for variant in variants[3:]:
            product = db.query(Product).filter(
                Product.product_id == variant.product_id
            ).first()
            
            if not product:
                continue
            
            # Get brand
            brand = None
            if product.brand_id:
                brand = db.query(ProductBrand).filter(
                    ProductBrand.brand_id == product.brand_id
                ).first()
            
            # Get category
            category_name = None
            if product.sub_category_id:
                sub_category = db.query(SubCategory).filter(
                    SubCategory.sub_category_id == product.sub_category_id
                ).first()
                if sub_category:
                    category = db.query(Category).filter(
                        Category.category_id == sub_category.category_id
                    ).first()
                    if category:
                        category_name = category.category_name
            
            # Get attributes
            attributes = {}
            attr_variants = db.query(AttributeVariant).filter(
                AttributeVariant.variant_id == variant.variant_id
            ).all()
            
            for av in attr_variants:
                attribute = db.query(ProductAttribute).filter(
                    ProductAttribute.attribute_id == av.attribute_id
                ).first()
                if attribute:
                    attributes[attribute.attribute_name] = av.value
            
            # Get images
            images = db.query(ProductImage).filter(
                ProductImage.variant_id == variant.variant_id
            ).order_by(ProductImage.is_default.desc()).all()
            image_urls = [img.url for img in images]
            
            result.append({
                "variant": variant,
                "product": product,
                "product_name": product.product_name,
                "product_description": product.description,
                "brand": brand,
                "brand_name": brand.brand_name if brand else None,
                "category_name": category_name,
                "attributes": attributes,
                "images": image_urls
            })
        
        print(f"DEBUG: Returning {len(result)} variant entries")
        return result
    
    @staticmethod
    def get_delivery_person_info(db: Session, user_id: int) -> Optional[Any]:
        """Get delivery person info if user is a delivery person"""
        print(f"\n=== DEBUG: Getting delivery person info for user_id: {user_id} ===")
        
        from models.delivery.delivery_person import DeliveryPerson
        
        delivery_person = db.query(DeliveryPerson).filter(DeliveryPerson.user_id == user_id).first()
        
        if delivery_person:
            print(f"DEBUG: Found delivery person: ID={delivery_person.delivery_person_id}")
        else:
            print(f"DEBUG: No delivery person found for user_id: {user_id}")
        
        return delivery_person
    
    @staticmethod
    def get_deliveries(db: Session, delivery_person_id: int) -> List[Any]:
        """Get deliveries for a delivery person"""
        print(f"\n=== DEBUG: Getting deliveries for delivery_person_id: {delivery_person_id} ===")
        
        from models.delivery.delivery import Delivery
        
        deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).all()
        
        print(f"DEBUG: Found {len(deliveries)} deliveries")
        
        if deliveries:
            print(f"DEBUG: Delivery IDs: {[d.delivery_id for d in deliveries]}")
        
        return deliveries