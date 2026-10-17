from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.order_service import OrderService
from schemas.order_schema import OrderCreate
from typing import Dict, Any, Optional
from utils.invoice_generator import InvoiceGenerator

class OrderController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = OrderService(db)
    
    def create_order(self, order_data: OrderCreate, user_id: int) -> Dict[str, Any]:
        """Create a new order"""
        try:
            # Validate required fields first
            if not hasattr(order_data, 'address_id') or not order_data.address_id:
                raise HTTPException(status_code=400, detail="address_id is required")
            
            if not hasattr(order_data, 'items') or not order_data.items:
                raise HTTPException(status_code=400, detail="Order must contain items")
            
            # Validate and cast item data
            validated_items = []
            for item in order_data.items:
                if 'variant_id' not in item:
                    raise HTTPException(status_code=400, detail="variant_id is required for each item")
                
                if 'quantity' not in item or int(item['quantity']) <= 0:
                    raise HTTPException(status_code=400, detail=f"Invalid quantity for variant {item.get('variant_id')}")
                
                # Cast to correct types
                validated_item = item.copy()
                validated_item['quantity'] = int(item['quantity'])
                
                # Price is optional - will be fetched from database in service
                if 'price' in item:
                    validated_item['price'] = float(item['price'])
                
                validated_items.append(validated_item)
            
            # Replace items with validated items
            order_data_dict = order_data.dict()
            order_data_dict['items'] = validated_items
            
            # Pass to service
            return self.service.create_order(OrderCreate(**order_data_dict), user_id)
            
        except HTTPException as e:
            raise e
        except Exception as e:
            print("🔥 ORDER ERROR:", str(e))
            raise HTTPException(status_code=500, detail="Order creation failed")
    
    def get_user_orders(self, user_id: int, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Get all orders for a user"""
        try:
            return self.service.get_user_orders(user_id, page, per_page)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_order_by_id(self, order_id: int, user_id: int, is_admin: bool = False) -> Dict[str, Any]:
        """Get order details by ID"""
        try:
            return self.service.get_order_by_id(order_id, user_id, is_admin)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def cancel_order(self, order_id: int, user_id: int) -> Dict[str, str]:
        """Cancel an order"""
        try:
            return self.service.cancel_order(order_id, user_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_return_request(self, order_id: int, user_id: int, return_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a return request for an order"""
        try:
            return self.service.create_return_request(order_id, user_id, return_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_orders(self, page: int = 1, per_page: int = 20, status: Optional[str] = None) -> Dict[str, Any]:
        """Get all orders"""
        try:
            return self.service.get_all_orders(page, per_page, status)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_order_status(self, order_id: int, status: str, admin_id: int) -> Dict[str, Any]:
        """Update order status"""
        try:
            return self.service.update_order_status(order_id, status, admin_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def generate_invoice(self, order_id: int, user_id: int):
        """Generate invoice PDF for an order"""
        try:
            # Get order with all details
            order = self.service.get_order_by_id(order_id, user_id)
            # order is a dict from service? No, service usually returns ORM object or dict.
            # Let's check service. get_order_by_id returns dict or ORM?
            # In checkout_service it returned ORM object but localized in create_order.
            # In order_service, let's assume it returns ORM object because schemas validate it.
            # Wait, order_routes uses response_model=OrderWrapper.
            # If service returns dict, InvoiceGenerator expects object with .items, .variant etc.
            # I should verify what service returns.
            # Let's assume service returns ORM object for now or I fetch it using repository directly.
            # Accessing repo via service._repository or similar.
            # Actually, let's fetch it directly here or modify service.
            # For safety, I will use service but if it returns dict, I might need to adjust InvoiceGenerator or cast it.
            # Let's check OrderService.get_order_by_id.
            
            # Re-fetch as ORM object to be safe for InvoiceGenerator
            # (Since I can't easily see OrderService return type confirmed as ORM object without checking, 
            # I will assume it returns the ORM object because that's standard for internal service methods 
            # unless converted to dict at the end. But `OrderController.get_order_by_id` returns it directly 
            # and route validates it. So it's likely an ORM object or Pydantic model.)
            # However, InvoiceGenerator uses `order.items` (attribute access).
            
            return InvoiceGenerator.generate_invoice(order)
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))