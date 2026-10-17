from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.cart_repository import CartRepository
from decimal import Decimal
from typing import Dict, Any, List
from datetime import datetime

class CartService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = CartRepository()
    
    def calculate_final_price(self, variant) -> Decimal:
        """Calculate final price after discount"""
        if not variant:
            return Decimal("0.00")
            
        final_price = variant.price
        
        # Apply discount if exists
        if hasattr(variant, 'discount_type') and hasattr(variant, 'discount_value'):
            if variant.discount_type == "PERCENT" and variant.discount_value:
                final_price = variant.price * (Decimal("1.00") - variant.discount_value / Decimal("100.00"))
            elif variant.discount_type == "FLAT" and variant.discount_value:
                final_price = max(variant.price - variant.discount_value, Decimal("0.00"))
        
        return final_price
    
    def get_user_cart(self, user_id: int) -> Dict[str, Any]:
        """Get all items in user's cart with totals"""
        cart_items = self.repository.get_user_cart_items(self.db, user_id)
        
        cart_data = []
        subtotal = Decimal("0.00")
        
        for item in cart_items:
            variant = item.variant
            if not variant:
                # Skip items with deleted variants
                continue
            
            product = variant.product if hasattr(variant, 'product') else None
            final_price = self.calculate_final_price(variant)
            item_total = final_price * item.quantity
            subtotal += item_total
            
            cart_data.append({
                "variant_id": item.variant_id,
                "product_name": product.product_name if product else "Unknown Product",
                "variant_name": variant.variant_name if variant.variant_name else "Default",
                "price": float(variant.price),
                "final_price": float(final_price),
                "quantity": item.quantity,
                "item_total": float(item_total),
                "stock_quantity": variant.stock_quantity if hasattr(variant, 'stock_quantity') else 0,
                "status": variant.status if hasattr(variant, 'status') else "ACTIVE"
            })
        
        return {
            "items": cart_data,
            "subtotal": float(subtotal),
            "total_items": len(cart_data)
        }
    
    def add_to_cart(self, user_id: int, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Add item to cart or update quantity"""
        # Validate quantity
        if quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        
        # Check if variant exists
        variant = self.repository.get_product_variant(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Product variant not found")
        
        # Check if variant is active
        if hasattr(variant, 'status') and variant.status != 'ACTIVE':
            raise HTTPException(status_code=400, detail="This product is currently unavailable")
        
        # Check existing cart item
        existing_cart = self.repository.get_cart_item(self.db, user_id, variant_id)
        
        if existing_cart:
            # Update existing cart item
            new_quantity = existing_cart.quantity + quantity
            
            # Check stock availability
            if hasattr(variant, 'stock_quantity') and variant.stock_quantity < new_quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Insufficient stock. Only {variant.stock_quantity} items available"
                )
            
            updated_cart = self.repository.update_cart_item(
                self.db, 
                existing_cart, 
                {"quantity": new_quantity}
            )
            
            return {
                "user_id": updated_cart.user_id,
                "variant_id": updated_cart.variant_id,
                "quantity": updated_cart.quantity,
                "price": float(updated_cart.price),
                "added_at": updated_cart.added_at
            }
        
        # Create new cart item
        if hasattr(variant, 'stock_quantity') and variant.stock_quantity < quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock. Only {variant.stock_quantity} items available"
            )
        
        cart_item = self.repository.create_cart_item(self.db, {
            "user_id": user_id,
            "variant_id": variant_id,
            "price": variant.price,
            "quantity": quantity,
            "added_at": datetime.now()
        })
        
        return {
            "user_id": cart_item.user_id,
            "variant_id": cart_item.variant_id,
            "quantity": cart_item.quantity,
            "price": float(cart_item.price),
            "added_at": cart_item.added_at
        }
    
    def update_cart_item(self, user_id: int, variant_id: int, quantity: int) -> Dict[str, Any]:
        """Update cart item quantity"""
        if quantity < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        
        cart_item = self.repository.get_cart_item(self.db, user_id, variant_id)
        if not cart_item:
            raise HTTPException(status_code=404, detail="Cart item not found")
        
        variant = self.repository.get_product_variant(self.db, variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Product variant not found")
        
        # Check stock availability
        if hasattr(variant, 'stock_quantity') and variant.stock_quantity < quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock. Only {variant.stock_quantity} items available"
            )
        
        updated_cart = self.repository.update_cart_item(
            self.db, 
            cart_item, 
            {"quantity": quantity}
        )
        
        return {
            "user_id": updated_cart.user_id,
            "variant_id": updated_cart.variant_id,
            "quantity": updated_cart.quantity,
            "price": float(updated_cart.price),
            "added_at": updated_cart.added_at
        }
    
    def remove_from_cart(self, user_id: int, variant_id: int) -> Dict[str, str]:
        """Remove item from cart"""
        cart_item = self.repository.get_cart_item(self.db, user_id, variant_id)
        if not cart_item:
            # Return success even if not found (idempotent delete)
            return {"message": "Item removed from cart"}
        
        self.repository.delete_cart_item(self.db, cart_item)
        return {"message": "Item removed from cart"}
    
    def clear_cart(self, user_id: int) -> Dict[str, str]:
        """Clear user's cart"""
        self.repository.clear_user_cart(self.db, user_id)
        return {"message": "Cart cleared successfully"}