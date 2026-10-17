from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case, text
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any, Union
from decimal import Decimal

# Import models
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.order.order import Order
from models.order.order_item import OrderItem
from models.user import User
from models.address import Address, Area, City
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.product_catalog.product_brand import ProductBrand
from models.payment import Payment
from models.inventory.supplier import Supplier
from models.inventory.company import Company

# Import schemas
from schemas.delivery_panel.delivery_pickup_schema import (
    PickupStatus, VendorType, PendingPickup, 
    VendorDetails, PickupLocation, PickupItem,
    PickupLocationGroup
)


class DeliveryPickupRepository:
    
    # ===== PENDING PICKUPS =====
    
    @staticmethod
    def get_pickups_by_status(
        db: Session, 
        delivery_person_id: int,
        status: Union[str, List[str]] = "ASSIGNED",  # Accept single status or list
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get pickups by status for delivery person
        - status can be: "ASSIGNED", "PICKED_UP", or ["ASSIGNED", "PICKED_UP"]
        """
        # Base query matching dashboard repository pattern
        query = db.query(
            Delivery,
            Order,
            User,
            Address,
            Area,
            City
        ).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            User, User.user_id == Order.user_id
        ).join(
            Address, Address.address_id == Order.address_id
        ).join(
            Area, Area.area_id == Address.area_id
        ).join(
            City, City.city_id == Area.city_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id
        )
        
        # Apply status filter - FIXED: Handle both single status and list
        if isinstance(status, list):
            query = query.filter(Delivery.status.in_(status))
        else:
            query = query.filter(Delivery.status == status)
        
        # Apply filters if provided
        if filters:
            if filters.get("vendor_type"):
                # Filter by vendor type (store, warehouse, etc.)
                # This would join with appropriate vendor tables
                pass
            
            if filters.get("pickup_location_id"):
                # Filter by specific pickup location
                # Would join with pickup location table
                pass
            
            # Sorting
            sort_by = filters.get("sort_by", "nearest")
            if sort_by == "nearest":
                # Sort by distance (requires delivery_person.current_location)
                query = query.order_by(Delivery.distance_km.asc())
            elif sort_by == "time":
                query = query.order_by(Delivery.expected_delivery_time.asc())
            elif sort_by == "priority":
                # Priority would need to be defined in Delivery model
                query = query.order_by(desc(Delivery.assigned_at))
        
        # Default sorting by assignment time
        if not filters or not filters.get("sort_by"):
            query = query.order_by(Delivery.assigned_at.asc())
        
        results = query.all()
        
        pickups = []
        for delivery, order, user, address, area, city in results:
            # Get vendor/supplier info
            vendor_info = DeliveryPickupRepository._get_vendor_info(db, order)
            
            # Get pickup location info
            pickup_location = DeliveryPickupRepository._get_pickup_location(db, order, vendor_info)
            
            # Get items in order
            items = DeliveryPickupRepository._get_pickup_items(db, order.order_id)
            
            # Format delivery and order numbers
            delivery_number = f"DLV-{delivery.delivery_id:05d}"
            order_number = f"ORD-{order.order_id:05d}"
            
            # Determine payment type
            payment_type = DeliveryPickupRepository._get_payment_type(db, order.order_id)
            
            # Calculate total items
            total_items = sum(item['quantity'] for item in items)
            
            # Get priority (if available)
            priority = DeliveryPickupRepository._get_priority(delivery)
            
            # Expected pickup time (using expected_delivery_time or assigned_at + buffer)
            expected_pickup_time = delivery.expected_delivery_time
            if not expected_pickup_time:
                # Default to assigned_at + 2 hours
                expected_pickup_time = delivery.assigned_at + timedelta(hours=2)
            
            # Format pickup time slot
            pickup_time_slot = None
            if expected_pickup_time:
                end_time = expected_pickup_time + timedelta(hours=2)
                pickup_time_slot = f"{expected_pickup_time.strftime('%I:%M %p')} - {end_time.strftime('%I:%M %p')}"
            
            # Available actions - DIFFERENT based on status
            available_actions = []
            if delivery.status == "ASSIGNED":
                available_actions = ["scan_qr", "confirm", "navigate", "call"]
            elif delivery.status == "PICKED_UP":
                available_actions = ["navigate", "call"]  # Can navigate to delivery address
            elif delivery.status == "OUT_FOR_DELIVERY":
                available_actions = ["navigate", "call"]
            elif delivery.status == "DELIVERED":
                available_actions = []  # No actions after delivery
            
            if not vendor_info.get("phone"):
                available_actions = [a for a in available_actions if a != "call"]
            
            # Distance calculation (if delivery_person has current location)
            distance_info = DeliveryPickupRepository._calculate_distance(
                db, delivery_person_id, pickup_location
            )
            
            # Determine status text based on actual status
            status_text_mapping = {
                "ASSIGNED": "Pending Pickup",
                "PICKED_UP": "Picked Up",
                "OUT_FOR_DELIVERY": "Out for Delivery",
                "DELIVERED": "Delivered",
                "CANCELLED": "Cancelled"
            }
            status_text = status_text_mapping.get(delivery.status, delivery.status)
            
            # Check if QR already verified
            qr_verified = delivery.status in ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]
            qr_verified_at = delivery.assigned_at if qr_verified else None
            
            pickups.append({
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "delivery_number": delivery_number,
                "order_number": order_number,
                "vendor": vendor_info,
                "pickup_location": pickup_location,
                "items": items,
                "total_items": total_items,
                "order_amount": float(order.total_amount) if order.total_amount else None,
                "payment_type": payment_type,
                "status": delivery.status,  # Use actual status
                "status_text": status_text,
                "assigned_at": delivery.assigned_at,
                "expected_pickup_time": expected_pickup_time,
                "pickup_time_slot": pickup_time_slot,
                "available_actions": available_actions,
                "qr_verified": qr_verified,
                "qr_verified_at": qr_verified_at,
                "priority": priority,
                "notes": delivery.delivery_notes,
                "distance_info": distance_info
            })
        
        return pickups
    
    @staticmethod
    def get_pending_pickups(
        db: Session, 
        delivery_person_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get only pending (ASSIGNED) pickups"""
        return DeliveryPickupRepository.get_pickups_by_status(
            db, delivery_person_id, "ASSIGNED", filters
        )
    
    @staticmethod
    def get_all_active_pickups(
        db: Session, 
        delivery_person_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get all active pickups (ASSIGNED and PICKED_UP)"""
        return DeliveryPickupRepository.get_pickups_by_status(
            db, delivery_person_id, ["ASSIGNED", "PICKED_UP"], filters
        )
    
    @staticmethod
    def get_completed_pickups(
        db: Session, 
        delivery_person_id: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get completed pickups (PICKED_UP)"""
        return DeliveryPickupRepository.get_pickups_by_status(
            db, delivery_person_id, "PICKED_UP", filters
        )
    
    @staticmethod
    def get_pickup_by_id(
        db: Session,
        delivery_person_id: int,
        delivery_id: int,
        allow_all_statuses: bool = False  # NEW: Allow viewing pickups in other statuses
    ) -> Optional[Dict[str, Any]]:
        """Get specific pickup details"""
        query = db.query(
            Delivery,
            Order,
            User,
            Address,
            Area,
            City
        ).join(
            Order, Order.order_id == Delivery.order_id
        ).join(
            User, User.user_id == Order.user_id
        ).join(
            Address, Address.address_id == Order.address_id
        ).join(
            Area, Area.area_id == Address.area_id
        ).join(
            City, City.city_id == Area.city_id
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.delivery_id == delivery_id
        )
        
        # Only filter by ASSIGNED status if not allowing all statuses
        if not allow_all_statuses:
            query = query.filter(Delivery.status.in_(["ASSIGNED", "PICKED_UP"]))  # FIXED: Include PICKED_UP
        
        result = query.first()
        
        if not result:
            return None
        
        delivery, order, user, address, area, city = result
        
        # Get detailed information
        vendor_info = DeliveryPickupRepository._get_vendor_info(db, order, detailed=True)
        pickup_location = DeliveryPickupRepository._get_pickup_location(db, order, vendor_info, detailed=True)
        items = DeliveryPickupRepository._get_pickup_items(db, order.order_id, detailed=True)
        
        delivery_number = f"DLV-{delivery.delivery_id:05d}"
        order_number = f"ORD-{order.order_id:05d}"
        payment_type = DeliveryPickupRepository._get_payment_type(db, order.order_id)
        total_items = sum(item['quantity'] for item in items)
        priority = DeliveryPickupRepository._get_priority(delivery)
        
        # Determine status text based on delivery status
        status_mapping = {
            "ASSIGNED": "Pending Pickup",
            "PICKED_UP": "Picked Up",
            "OUT_FOR_DELIVERY": "Out for Delivery",
            "DELIVERED": "Delivered",
            "CANCELLED": "Cancelled"
        }
        status_text = status_mapping.get(delivery.status, delivery.status)
        
        # Available actions based on status
        available_actions = []
        if delivery.status == "ASSIGNED":
            available_actions = ["scan_qr", "confirm", "navigate", "call"]
        elif delivery.status == "PICKED_UP":
            available_actions = ["navigate", "call"]  # Can still navigate and call
        elif delivery.status == "OUT_FOR_DELIVERY":
            available_actions = ["navigate", "call"]
        
        if not vendor_info.get("phone"):
            available_actions = [a for a in available_actions if a != "call"]
        
        # Check if QR already verified (based on status)
        qr_verified = delivery.status in ["PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"]
        qr_verified_at = delivery.assigned_at if qr_verified else None
        
        return {
            "delivery_id": delivery.delivery_id,
            "order_id": order.order_id,
            "delivery_number": delivery_number,
            "order_number": order_number,
            "vendor": vendor_info,
            "pickup_location": pickup_location,
            "items": items,
            "total_items": total_items,
            "order_amount": float(order.total_amount) if order.total_amount else None,
            "payment_type": payment_type,
            "status": delivery.status,
            "status_text": status_text,
            "assigned_at": delivery.assigned_at,
            "expected_pickup_time": delivery.expected_delivery_time,
            "pickup_time_slot": f"{delivery.expected_delivery_time.strftime('%I:%M %p')} - {(delivery.expected_delivery_time + timedelta(hours=2)).strftime('%I:%M %p')}" if delivery.expected_delivery_time else None,
            "available_actions": available_actions,
            "qr_verified": qr_verified,
            "qr_verified_at": qr_verified_at,
            "priority": priority,
            "notes": delivery.delivery_notes,
            "order_details": {
                "customer_name": f"{user.first_name} {user.last_name}",
                "customer_phone": user.phone,
                "order_placed_at": order.placed_at,
                "order_status": order.order_status,
                "special_instructions": order.coupon_code,  # Using coupon_code field for notes
                "delivery_status": delivery.status,
                "delivery_notes": delivery.delivery_notes
            }
        }
    
    @staticmethod
    def group_pickups_by_location(
        db: Session,
        delivery_person_id: int,
        status: Union[str, List[str]] = ["ASSIGNED", "PICKED_UP"]  # Default to active pickups
    ) -> List[Dict[str, Any]]:
        """Group pickups by location for efficient routing"""
        pickups = DeliveryPickupRepository.get_pickups_by_status(db, delivery_person_id, status)
        
        # Group by location ID
        location_groups = {}
        for pickup in pickups:
            location_id = pickup["pickup_location"]["location_id"]
            
            if location_id not in location_groups:
                location_groups[location_id] = {
                    "location_id": location_id,
                    "location_name": pickup["pickup_location"]["name"],
                    "location_type": pickup["vendor"]["vendor_type"],
                    "address": f"{pickup['pickup_location']['address_line1']}, {pickup['pickup_location']['area_name']}",
                    "distance": pickup["distance_info"]["distance_str"] if pickup["distance_info"] else None,
                    "estimated_time": pickup["distance_info"]["time_str"] if pickup["distance_info"] else None,
                    "pickup_count": 0,
                    "pickups": []
                }
            
            location_groups[location_id]["pickup_count"] += 1
            location_groups[location_id]["pickups"].append(pickup)
        
        # Convert to list and sort by distance
        groups = list(location_groups.values())
        groups.sort(key=lambda x: (
            0 if x["distance"] is None else float(x["distance"].split()[0])
        ))
        
        return groups
    
    # ===== VENDOR INFORMATION =====
    
    @staticmethod
    def _get_vendor_info(
        db: Session,
        order: Order,
        detailed: bool = False
    ) -> Dict[str, Any]:
        """Get vendor/supplier information for an order"""
        # In a real system, this would join with vendor/supplier tables
        # For now, using a simplified approach
        
        # Get product from order to find vendor
        order_item = db.query(OrderItem).filter(
            OrderItem.order_id == order.order_id
        ).first()
        
        vendor_info = {
            "vendor_id": 1,  # Default vendor ID
            "vendor_name": "Nexora Store",
            "vendor_type": VendorType.STORE,
            "contact_person": "Store Manager",
            "phone": "+91 98765 43210",  # Default store phone
            "email": "store@nexora.com",
            "business_hours": "9:00 AM - 9:00 PM"
        }
        
        if detailed and order_item:
            # Try to get actual supplier info from product
            variant = db.query(ProductVariant).filter(
                ProductVariant.variant_id == order_item.variant_id
            ).first()
            
            if variant:
                product = db.query(Product).filter(
                    Product.product_id == variant.product_id
                ).first()
                
                if product:
                    # Get brand as vendor
                    brand = db.query(ProductBrand).filter(
                        ProductBrand.brand_id == product.brand_id
                    ).first()
                    
                    if brand:
                        vendor_info.update({
                            "vendor_id": brand.brand_id,
                            "vendor_name": brand.brand_name,
                            "vendor_type": VendorType.SUPPLIER,
                            "contact_person": "Brand Representative",
                            "email": f"contact@{brand.brand_name.lower().replace(' ', '')}.com"
                        })
        
        return vendor_info
    
    @staticmethod
    def _get_pickup_location(
        db: Session,
        order: Order,
        vendor_info: Dict[str, Any],
        detailed: bool = False
    ) -> Dict[str, Any]:
        """Get pickup location details"""
        # Default pickup location (store address)
        pickup_location = {
            "location_id": 1,
            "name": "Nexora Store",
            "address_line1": "Sector 16",
            "address_line2": "Near Government Office",
            "area_name": "Gandhinagar",
            "city_name": "Gandhinagar",
            "pincode": "382016",
            "latitude": 23.2156,
            "longitude": 72.6369,
            "distance_km": None,
            "estimated_time_minutes": None
        }
        
        if detailed:
            # Get delivery person's current location for distance calculation
            # This would be implemented with actual geolocation
            pass
        
        return pickup_location
    
    @staticmethod
    def _get_pickup_items(
        db: Session,
        order_id: int,
        detailed: bool = False
    ) -> List[Dict[str, Any]]:
        """Get items for pickup"""
        order_items = db.query(
            OrderItem,
            ProductVariant,
            Product
        ).join(
            ProductVariant, ProductVariant.variant_id == OrderItem.variant_id
        ).join(
            Product, Product.product_id == ProductVariant.product_id
        ).filter(
            OrderItem.order_id == order_id
        ).all()
        
        items = []
        for order_item, variant, product in order_items:
            item_data = {
                "variant_id": variant.variant_id,
                "variant_name": variant.variant_name or f"{product.product_name} Variant",
                "product_name": product.product_name,
                "quantity": order_item.quantity,
                "sku": None  # SKU would be in ProductVariant model
            }
            
            if detailed:
                # Add detailed information
                item_data.update({
                    "price": float(order_item.price),
                    "total": float(order_item.total),
                    "product_id": product.product_id
                })
            
            items.append(item_data)
        
        return items
    
    # ===== PAYMENT & PRIORITY =====
    
    @staticmethod
    def _get_payment_type(db: Session, order_id: int) -> str:
        """Get payment type for order"""
        payment = db.query(Payment).filter(
            Payment.order_id == order_id
        ).first()
        
        if payment and payment.payment_status == "COMPLETED":
            return "PREPAID"
        return "COD"
    
    @staticmethod
    def _get_priority(delivery: Delivery) -> Optional[str]:
        """Get priority level for delivery"""
        # Priority logic based on delivery time
        if delivery.expected_delivery_time:
            time_diff = (delivery.expected_delivery_time - datetime.now()).total_seconds() / 3600
            if time_diff < 2:  # Less than 2 hours
                return "URGENT"
            elif time_diff < 4:  # Less than 4 hours
                return "HIGH"
        
        return "NORMAL"
    
    # ===== DISTANCE CALCULATION =====
    
    @staticmethod
    def _calculate_distance(
        db: Session,
        delivery_person_id: int,
        pickup_location: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Calculate distance from delivery person to pickup location"""
        # Get delivery person's current location
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.current_location:
            return None
        
        try:
            # Simple distance calculation (Haversine formula in production)
            # For now, using fixed distances based on location ID
            location_id = pickup_location["location_id"]
            
            # Mock distances for different locations
            distances = {
                1: {"km": 1.2, "minutes": 5},
                2: {"km": 3.5, "minutes": 12},
                3: {"km": 5.8, "minutes": 20},
                4: {"km": 8.3, "minutes": 30}
            }
            
            distance_info = distances.get(location_id, {"km": 2.0, "minutes": 8})
            
            return {
                "distance_km": distance_info["km"],
                "estimated_minutes": distance_info["minutes"],
                "distance_str": f"{distance_info['km']} km",
                "time_str": f"{distance_info['minutes']} mins"
            }
            
        except Exception:
            return None
    
    # ===== QR VERIFICATION =====
    
    @staticmethod
    def verify_qr_code(
        db: Session,
        delivery_person_id: int,
        delivery_id: int,
        qr_data: str
    ) -> Dict[str, Any]:
        """Verify QR code for pickup"""
        try:
            # Get delivery - allow ASSIGNED and PICKED_UP status for verification
            delivery = db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id,
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status.in_(["ASSIGNED", "PICKED_UP"])  # FIXED: Allow PICKED_UP too
            ).first()
            
            if not delivery:
                return {
                    "valid": False,
                    "message": "Delivery not found or not assigned to you",
                    "error_code": "DELIVERY_NOT_FOUND"
                }
            
            # Parse QR data
            if not qr_data.startswith(("ORD-", "DLV-")):
                return {
                    "valid": False,
                    "message": "Invalid QR code format",
                    "error_code": "INVALID_QR_FORMAT"
                }
            
            # Check if QR matches delivery
            if qr_data.startswith("ORD-"):
                try:
                    qr_order_id = int(qr_data.split('-')[1])
                    if qr_order_id != delivery.order_id:
                        return {
                            "valid": False,
                            "message": "QR code doesn't match this delivery",
                            "error_code": "QR_MISMATCH"
                        }
                except (IndexError, ValueError):
                    return {
                        "valid": False,
                        "message": "Invalid order ID in QR code",
                        "error_code": "INVALID_ORDER_ID"
                    }
            
            elif qr_data.startswith("DLV-"):
                try:
                    qr_delivery_id = int(qr_data.split('-')[1])
                    if qr_delivery_id != delivery_id:
                        return {
                            "valid": False,
                            "message": "QR code doesn't match this delivery",
                            "error_code": "QR_MISMATCH"
                        }
                except (IndexError, ValueError):
                    return {
                        "valid": False,
                        "message": "Invalid delivery ID in QR code",
                        "error_code": "INVALID_DELIVERY_ID"
                    }
            
            # Mark QR as verified (in a real system, update QR verification table)
            verification_time = datetime.now()
            
            return {
                "valid": True,
                "message": "QR code verified successfully",
                "delivery_id": delivery_id,
                "order_id": delivery.order_id,
                "verified_at": verification_time,
                "verification_type": "PICKUP",
                "requires_confirmation": delivery.status == "ASSIGNED",  # Only need confirmation for ASSIGNED
                "next_action": "confirm_pickup" if delivery.status == "ASSIGNED" else "proceed_to_delivery"
            }
            
        except Exception as e:
            return {
                "valid": False,
                "message": f"QR verification failed: {str(e)}",
                "error_code": "VERIFICATION_FAILED"
            }
    
    # ===== PICKUP CONFIRMATION =====
    
    @staticmethod
    def confirm_pickup(
        db: Session,
        delivery_person_id: int,
        delivery_id: int,
        notes: Optional[str] = None,
        pod_image_url: Optional[str] = None,
        signature_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """Confirm pickup of delivery"""
        try:
            delivery = db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id,
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "ASSIGNED"  # Only confirm if still ASSIGNED
            ).first()
            
            if not delivery:
                # Check if already picked up
                existing = db.query(Delivery).filter(
                    Delivery.delivery_id == delivery_id,
                    Delivery.delivery_person_id == delivery_person_id
                ).first()
                
                if existing and existing.status == "PICKED_UP":
                    return {
                        "success": False,
                        "message": "Pickup already confirmed",
                        "error_code": "ALREADY_CONFIRMED",
                        "current_status": "PICKED_UP"
                    }
                
                return {
                    "success": False,
                    "message": "Delivery not found or not in pending pickup state",
                    "error_code": "DELIVERY_NOT_FOUND"
                }
            
            # Update delivery status
            delivery.status = "PICKED_UP"
            delivery.delivery_notes = notes or delivery.delivery_notes
            
            # In a real system, you might have:
            # delivery.picked_up_at = datetime.now()
            # delivery.pod_image_url = pod_image_url
            # delivery.signature_url = signature_url
            
            db.commit()
            
            return {
                "success": True,
                "message": "Pickup confirmed successfully",
                "delivery_id": delivery_id,
                "order_id": delivery.order_id,
                "confirmed_at": datetime.now(),
                "new_status": "PICKED_UP",
                "next_step": "proceed_to_delivery"
            }
            
        except Exception as e:
            db.rollback()
            return {
                "success": False,
                "message": f"Failed to confirm pickup: {str(e)}",
                "error_code": "CONFIRMATION_FAILED"
            }
    
    # ===== NAVIGATION & CONTACT =====
    
    @staticmethod
    def get_navigation_details(
        db: Session,
        delivery_person_id: int,
        delivery_id: int
    ) -> Dict[str, Any]:
        """Get navigation details for pickup location"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return {
                "success": False,
                "message": "Delivery not found"
            }
        
        # Get vendor info for location
        vendor_info = DeliveryPickupRepository._get_vendor_info(db, delivery.order)
        pickup_location = DeliveryPickupRepository._get_pickup_location(db, delivery.order, vendor_info)
        
        # Format address for navigation
        formatted_address = f"{pickup_location['address_line1']}"
        if pickup_location['address_line2']:
            formatted_address += f", {pickup_location['address_line2']}"
        formatted_address += f", {pickup_location['area_name']}, {pickup_location['city_name']}"
        
        # URL encode the address
        import urllib.parse
        encoded_address = urllib.parse.quote(formatted_address)
        
        return {
            "success": True,
            "pickup_location_id": pickup_location['location_id'],
            "google_maps_url": f"https://www.google.com/maps/dir/?api=1&destination={encoded_address}",
            "openstreetmap_url": f"https://www.openstreetmap.org/directions?to={encoded_address}",
            "latitude": pickup_location['latitude'],
            "longitude": pickup_location['longitude'],
            "formatted_address": formatted_address,
            "distance_km": pickup_location['distance_km'],
            "estimated_time_minutes": pickup_location['estimated_time_minutes']
        }
    
    @staticmethod
    def get_vendor_contact(
        db: Session,
        delivery_person_id: int,
        delivery_id: int
    ) -> Dict[str, Any]:
        """Get vendor contact information"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return {
                "success": False,
                "message": "Delivery not found"
            }
        
        vendor_info = DeliveryPickupRepository._get_vendor_info(db, delivery.order, detailed=True)
        
        return {
            "success": True,
            "vendor_id": vendor_info['vendor_id'],
            "vendor_name": vendor_info['vendor_name'],
            "contact_person": vendor_info['contact_person'],
            "phone": vendor_info['phone'],
            "email": vendor_info['email'],
            "business_hours": vendor_info['business_hours'],
            "emergency_contact": None,  # Would come from vendor table
            "notes": f"Contact for order #{delivery.order_id}"
        }