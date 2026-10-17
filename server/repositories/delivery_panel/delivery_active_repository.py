# delivery_panel/active_deliveries/delivery_active_repository.py
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_, case, text, extract
from datetime import datetime, timedelta, date
from typing import List, Optional, Dict, Any
from decimal import Decimal

# Import models
from models.delivery.delivery import Delivery
from models.delivery.delivery_person import DeliveryPerson
from models.delivery.delivery_earnings import DeliveryEarnings
from models.order.order import Order
from models.order.order_item import OrderItem
from models.user import User
from models.address import Address, Area, City
from models.payment import Payment
from models.feedback.feedback import Feedback
from models.feedback.user_issue import UserIssue

# Import schemas
from schemas.delivery_panel.delivery_active_schema import (
    DeliveryStatus, PaymentType, PriorityLevel
)


class DeliveryActiveRepository:
    
    # ===== ACTIVE DELIVERIES =====
    
    @staticmethod
    def get_active_deliveries(db: Session, delivery_person_id: int) -> List[Dict[str, Any]]:
        """Get active deliveries for delivery person"""
        deliveries = db.query(
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
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "PICKED_UP",  # STRICT: Only PICKED_UP is active
            Delivery.delivered_at.is_(None)
        ).order_by(
            Delivery.expected_delivery_time
        ).all()
        
        result = []
        for delivery, order, user, address, area, city in deliveries:
            # Get items count
            items_count = db.query(func.sum(OrderItem.quantity)).filter(
                OrderItem.order_id == order.order_id
            ).scalar() or 0
            
            # Get payment info
            payment = db.query(Payment).filter(
                Payment.order_id == order.order_id
            ).first()
            
            # Format address
            delivery_address = f"{address.line1}"
            if address.line2:
                delivery_address += f", {address.line2}"
            delivery_address += f", {area.area_name}, {city.city_name}"
            
            # Calculate progress based on status
            progress = 0
            status_text = delivery.status
            if delivery.status == "ASSIGNED":
                progress = 0
                status_text = "Pending Pickup"
            elif delivery.status == "PICKED_UP":
                progress = 50
                status_text = "Picked Up"
            elif delivery.status == "OUT_FOR_DELIVERY":
                progress = 75
                status_text = "Out for Delivery"
            
            # Format expected time
            expected_time = ""
            if delivery.expected_delivery_time:
                expected_time = delivery.expected_delivery_time.strftime("%I:%M %p")
            
            # Payment type and amount
            payment_type = PaymentType.COD
            amount = None
            if payment:
                payment_type = PaymentType.PREPAID if payment.payment_status == "COMPLETED" else PaymentType.COD
                if payment_type == PaymentType.COD:
                    amount = float(order.total_amount)
            
            result.append({
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer": {
                    "customer_id": user.user_id,
                    "name": f"{user.first_name} {user.last_name}",
                    "phone": user.phone or "",
                    "avatar_url": user.profile_img_url
                },
                "delivery_address": {
                    "address_id": address.address_id,
                    "line1": address.line1,
                    "line2": address.line2,
                    "area_name": area.area_name,
                    "city_name": city.city_name,
                    "pincode": area.pincode
                },
                "status": delivery.status,
                "status_label": status_text,
                "assigned_at": delivery.assigned_at,
                # Note: Delivery model doesn't have picked_up_at field
                "expected_delivery_time": delivery.expected_delivery_time,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
                "items_count": int(items_count),
                "payment_type": payment_type,
                "cod_amount": amount,
                "subtotal": float(order.subtotal) if order.subtotal else 0.0,
                "discount_amount": float(order.discount_amount) if order.discount_amount else 0.0,
                "delivery_fee": float(order.delivery_fee) if order.delivery_fee else 0.0,
                "total_amount": float(order.total_amount) if order.total_amount else 0.0,
                "progress": progress,
                "eta": "15 mins away" if progress > 0 else None,
                "pod_image_url": delivery.pod_image_url,
                "signature_url": delivery.signature_url,
                "delivery_notes": delivery.delivery_notes
            })
        
        return result
    
    @staticmethod
    def get_delivery_by_id(db: Session, delivery_id: int, delivery_person_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific delivery by ID"""
        delivery_data = db.query(
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
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_data:
            return None
        
        delivery, order, user, address, area, city = delivery_data
        
        # Get items count
        items_count = db.query(func.sum(OrderItem.quantity)).filter(
            OrderItem.order_id == order.order_id
        ).scalar() or 0
        
        # Get payment info
        payment = db.query(Payment).filter(
            Payment.order_id == order.order_id
        ).first()
        
        # Calculate progress based on status
        progress = 0
        status_text = delivery.status
        if delivery.status == "ASSIGNED":
            progress = 0
            status_text = "Pending Pickup"
        elif delivery.status == "PICKED_UP":
            progress = 50
            status_text = "Picked Up"
        elif delivery.status == "OUT_FOR_DELIVERY":
            progress = 75
            status_text = "Out for Delivery"
        
        # Payment type and amount
        payment_type = PaymentType.COD
        amount = None
        if payment:
            payment_type = PaymentType.PREPAID if payment.payment_status == "COMPLETED" else PaymentType.COD
            if payment_type == PaymentType.COD:
                amount = float(order.total_amount)
        
        # Get delivery person's current location
        current_latitude = None
        current_longitude = None
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if delivery_person and delivery_person.current_location:
            try:
                loc_data = delivery_person.current_location
                if isinstance(loc_data, dict):
                    current_latitude = loc_data.get('lat')
                    current_longitude = loc_data.get('lng')
            except:
                pass
        
        return {
            "delivery_id": delivery.delivery_id,
            "delivery_person_id": delivery.delivery_person_id,
            "order_id": order.order_id,
            "order_number": f"ORD-{order.order_id:05d}",
            "customer": {
                "customer_id": user.user_id,
                "name": f"{user.first_name} {user.last_name}",
                "phone": user.phone or "",
                "avatar_url": user.profile_img_url
            },
            "delivery_address": {
                "address_id": address.address_id,
                "line1": address.line1,
                "line2": address.line2,
                "area_name": area.area_name,
                "city_name": city.city_name,
                "pincode": area.pincode
            },
            "status": delivery.status,
            "status_label": status_text,
            "assigned_at": delivery.assigned_at,
            # Note: Delivery model doesn't have picked_up_at field
            "expected_delivery_time": delivery.expected_delivery_time,
            "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
            "items_count": int(items_count),
            "payment_type": payment_type,
            "cod_amount": amount,
            "subtotal": float(order.subtotal) if order.subtotal else 0.0,
            "discount_amount": float(order.discount_amount) if order.discount_amount else 0.0,
            "delivery_fee": float(order.delivery_fee) if order.delivery_fee else 0.0,
            "total_amount": float(order.total_amount) if order.total_amount else 0.0,
            "progress": progress,
            "current_latitude": current_latitude,
            "current_longitude": current_longitude,
            "pod_image_url": delivery.pod_image_url,
            "signature_url": delivery.signature_url,
            "delivery_notes": delivery.delivery_notes
        }
    
    # ===== DELIVERY STATISTICS =====
    
    @staticmethod
    def get_delivery_statistics(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get statistics for active deliveries"""
        today = date.today()
        
        # Total active deliveries (STRICT)
        total_active = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "PICKED_UP",
            Delivery.delivered_at.is_(None)
        ).count()
        
        # Count by status
        status_counts = db.query(
            Delivery.status,
            func.count(Delivery.delivery_id)
        ).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "PICKED_UP",
            Delivery.delivered_at.is_(None)
        ).group_by(Delivery.status).all()
        
        # Initialize counts
        pending_pickup = 0
        picked_up = 0
        in_transit = 0
        
        for status, count in status_counts:
            if status == "ASSIGNED":
                pending_pickup = count
            elif status == "PICKED_UP":
                picked_up = count
            elif status == "OUT_FOR_DELIVERY":
                in_transit = count
        
        # Today's completed deliveries
        today_completed = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            func.date(Delivery.delivered_at) == today
        ).count()
        
        # Today's earnings
        today_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) == today
        ).scalar() or Decimal('0')
        
        # Average delivery time for today's completed deliveries
        avg_delivery_time = None
        if today_completed > 0:
            avg_result = db.query(
                func.avg(
                    func.extract('epoch', Delivery.delivered_at) - 
                    func.extract('epoch', Delivery.assigned_at)
                ) / 60  # Convert to minutes
            ).filter(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                func.date(Delivery.delivered_at) == today,
                Delivery.delivered_at.isnot(None),
                Delivery.assigned_at.isnot(None)
            ).scalar()
            
            avg_delivery_time = float(avg_result) if avg_result else None
        
        # On-time rate (delivered within expected time)
        on_time_rate = None
        total_delivered_today = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            func.date(Delivery.delivered_at) == today,
            Delivery.expected_delivery_time.isnot(None),
            Delivery.delivered_at.isnot(None)
        ).count()
        
        if total_delivered_today > 0:
            on_time_deliveries = db.query(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                func.date(Delivery.delivered_at) == today,
                Delivery.expected_delivery_time.isnot(None),
                Delivery.delivered_at.isnot(None),
                Delivery.delivered_at <= Delivery.expected_delivery_time
            ).count()
            
            on_time_rate = (on_time_deliveries / total_delivered_today * 100) if total_delivered_today > 0 else 0
        
        return {
            "total_active": total_active,
            "pending_pickup": pending_pickup,
            "picked_up": picked_up,
            "in_transit": in_transit,
            "today_completed": today_completed,
            "today_earnings": float(today_earnings),
            "avg_delivery_time_minutes": avg_delivery_time,
            "on_time_rate": on_time_rate
        }
    
    # ===== DELIVERY STATUS UPDATES =====
    
    @staticmethod
    def update_delivery_status(
        db: Session, 
        delivery_id: int, 
        status: str,
        delivery_person_id: int,
        notes: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> bool:
        """Update delivery status"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return False
        
        delivery.status = status
        
        # Update timestamps based on status
        if status == "DELIVERED":
            delivery.delivered_at = datetime.utcnow()
            delivery.actual_delivery_time = datetime.utcnow()
            
            # Create earnings record if not exists
            existing_earning = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery_id
            ).first()
            
            if not existing_earning:
                order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
                if order and order.delivery_fee:
                    earnings = DeliveryEarnings(
                        delivery_person_id=delivery_person_id,
                        delivery_id=delivery_id,
                        amount=order.delivery_fee,
                        earned_at=datetime.utcnow()
                    )
                    db.add(earnings)
        elif status == "FAILED":
            delivery.delivered_at = datetime.utcnow()
            delivery.actual_delivery_time = datetime.utcnow()
        
        # Update notes if provided
        if notes:
            if delivery.delivery_notes:
                delivery.delivery_notes += f"\n[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {notes}"
            else:
                delivery.delivery_notes = notes
        
        # Update location if provided
        if latitude is not None and longitude is not None:
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if delivery_person:
                delivery_person.current_location = {
                    "lat": latitude,
                    "lng": longitude,
                    "updated_at": datetime.utcnow().isoformat()
                }
        
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
    
    
    
    # ===== OTP LOGIC =====
    
    @staticmethod
    def save_delivery_otp(
        db: Session,
        delivery_id: int,
        delivery_person_id: int,
        otp_hash: str,
        expiry: datetime
    ) -> bool:
        """Save generated OTP for delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return False
            
        delivery.delivery_otp = otp_hash
        delivery.delivery_otp_expiry = expiry
        
        try:
            db.commit()
            return True
        except Exception as e:
            print(f"❌ DB Error saving OTP: {e}")
            db.rollback()
            return False
            
    @staticmethod
    def get_delivery_otp_data(
        db: Session,
        delivery_id: int,
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get OTP data for verification"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return None
            
        return {
            "otp_hash": delivery.delivery_otp,
            "expiry": delivery.delivery_otp_expiry
        }

    # ===== MARK COMPLETE LOGIC =====
    
    @staticmethod
    def mark_delivery_completed(
        db: Session,
        delivery_id: int,
        delivery_person_id: int,
        notes: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Mark delivery as completed
        """
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return None
            
        # Update status and timestamps
        delivery.status = "DELIVERED"
        delivery.delivered_at = datetime.utcnow()
        delivery.actual_delivery_time = datetime.utcnow()
        
        # Clear OTP
        delivery.delivery_otp = None
        delivery.delivery_otp_expiry = None
        
        # Update notes
        if notes:
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M')
            if delivery.delivery_notes:
                delivery.delivery_notes += f"\n[{timestamp}] {notes}"
            else:
                delivery.delivery_notes = notes
        
        # Trigger earnings calculation
        # Check if earnings already exist
        existing_earning = db.query(DeliveryEarnings).filter(
            DeliveryEarnings.delivery_id == delivery_id
        ).first()
        
        earnings_amount = 0
        
        if not existing_earning:
            order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
            if order and order.delivery_fee:
                earnings_amount = order.delivery_fee
                earnings = DeliveryEarnings(
                    delivery_person_id=delivery_person_id,
                    delivery_id=delivery_id,
                    amount=order.delivery_fee,
                    earned_at=datetime.utcnow()
                )
                db.add(earnings)
        
        # Update Delivery Person Stats
        person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if person:
            person.total_deliveries = (person.total_deliveries or 0) + 1
            current_earnings = float(person.total_earnings or 0)
            person.total_earnings = current_earnings + float(earnings_amount)
            
            # Recalculate success rate (Simplified: Completed / (Completed + Failed))
            # You might want a better formula in production
            person.success_rate = 100.00 # Placeholder: Assuming perfect rate for now or complex calculation
        
        try:
            db.commit()
            # Return updated delivery dictionary (reuse get_delivery_by_id logic or similar)
            return DeliveryActiveRepository.get_delivery_by_id(db, delivery_id, delivery_person_id)
        except Exception as e:
            db.rollback()
            raise e

    # ===== DELIVERY PERSON LOCATION =====
    
    @staticmethod
    def update_delivery_person_location(
        db: Session,
        delivery_person_id: int,
        latitude: float,
        longitude: float,
        accuracy: Optional[float] = None
    ) -> bool:
        """Update delivery person's current location"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person:
            return False
        
        location_data = {
            "lat": latitude,
            "lng": longitude,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if accuracy is not None:
            location_data["accuracy"] = accuracy
        
        delivery_person.current_location = location_data
        
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
    
    # ===== CUSTOMER CONTACT =====
    
    @staticmethod
    def get_customer_contact_info(
        db: Session, 
        delivery_id: int, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get customer contact information for a specific delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return None
        
        order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
        if not order:
            return None
        
        customer = db.query(User).filter(User.user_id == order.user_id).first()
        if not customer:
            return None
        
        # Ensure phone is not None
        phone = customer.phone if customer.phone else ""
        
        return {
            "customer_id": customer.user_id,
            "name": f"{customer.first_name} {customer.last_name}",
            "phone": phone,  # Use empty string if None
            "avatar_url": customer.profile_img_url,
            "delivery_id": delivery_id,
            "order_id": delivery.order_id
        }
    
    # ===== NAVIGATION DATA =====
    
    @staticmethod
    def get_delivery_navigation_data(
        db: Session, 
        delivery_id: int, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get navigation data for a delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return None
        
        # Get order and address details
        order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
        if not order or not order.address_id:
            return None
        
        address_data = db.query(
            Address,
            Area,
            City
        ).join(
            Area, Area.area_id == Address.area_id
        ).join(
            City, City.city_id == Area.city_id
        ).filter(
            Address.address_id == order.address_id
        ).first()
        
        if not address_data:
            return None
        
        addr, area, city = address_data
        
        # Get customer details
        customer = db.query(User).filter(User.user_id == order.user_id).first()
        if not customer:
            return None
        
        # Format address
        formatted_address = f"{addr.line1}"
        if addr.line2:
            formatted_address += f", {addr.line2}"
        formatted_address += f", {area.area_name}, {city.city_name}"
        if area.pincode:
            formatted_address += f" - {area.pincode}"
        
        # URL encode for map services
        import urllib.parse
        encoded_address = urllib.parse.quote(formatted_address)
        
        # Get delivery person's current location
        current_lat = 23.0225  # Default coordinates (Ahmedabad)
        current_lng = 72.5714
        
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if delivery_person and delivery_person.current_location:
            try:
                loc_data = delivery_person.current_location
                if isinstance(loc_data, dict):
                    current_lat = loc_data.get('lat', current_lat)
                    current_lng = loc_data.get('lng', current_lng)
            except:
                pass
        
        return {
            "delivery_id": delivery_id,
            "order_id": order.order_id,
            "customer_name": f"{customer.first_name} {customer.last_name}",
            "customer_phone": customer.phone,
            "formatted_address": formatted_address,
            "latitude": None,  # Address coordinates not stored in current model
            "longitude": None,
            "google_maps_url": f"https://www.google.com/maps/dir/?api=1&destination={encoded_address}",
            "openstreetmap_url": f"https://www.openstreetmap.org/directions?to={encoded_address}",
            "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
            "current_latitude": current_lat,
            "current_longitude": current_lng
        }
    
    # ===== CALL LOGGING =====
    
    @staticmethod
    def log_call_action(
        db: Session,
        delivery_person_id: int,
        delivery_id: int,
        customer_id: int,
        action_type: str = "call_initiated"
    ) -> bool:
        """Log call action for tracking"""
        try:
            delivery = db.query(Delivery).filter(
                Delivery.delivery_id == delivery_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return False
            
            timestamp = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            call_note = f"[{timestamp}] Call initiated to customer"
            
            if delivery.delivery_notes:
                delivery.delivery_notes += f"\n{call_note}"
            else:
                delivery.delivery_notes = call_note
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    # ===== STATUS TRANSITION VALIDATION =====
    
    @staticmethod
    def validate_status_transition(
        db: Session,
        delivery_id: int,
        delivery_person_id: int,
        target_status: str
    ) -> Dict[str, Any]:
        """Validate if status transition is allowed"""
        delivery = db.query(Delivery).filter(
            Delivery.delivery_id == delivery_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return {
                "valid": False,
                "current_status": None,
                "target_status": target_status,
                "allowed": False,
                "message": "Delivery not found",
                "required_actions": []
            }
        
        current_status = delivery.status
        allowed_transitions = {
            "ASSIGNED": ["PICKED_UP", "CANCELLED"],
            "PICKED_UP": ["OUT_FOR_DELIVERY", "DELIVERED", "FAILED"],
            "OUT_FOR_DELIVERY": ["DELIVERED", "FAILED"],
            "DELIVERED": [],
            "CANCELLED": [],
            "FAILED": []
        }
        
        is_allowed = target_status in allowed_transitions.get(current_status, [])
        
        message = f"Transition from {current_status} to {target_status} is "
        message += "allowed" if is_allowed else "not allowed"
        
        required_actions = []
        if target_status == "DELIVERED" and current_status in ["PICKED_UP", "OUT_FOR_DELIVERY"]:
            required_actions.append("POD upload recommended")
        
        return {
            "valid": True,
            "current_status": current_status,
            "target_status": target_status,
            "allowed": is_allowed,
            "message": message,
            "required_actions": required_actions
        }
    
    # ===== DELIVERIES BY STATUS =====
    
    @staticmethod
    def get_deliveries_by_status(
        db: Session,
        delivery_person_id: int,
        status: str
    ) -> List[Dict[str, Any]]:
        """Get deliveries by specific status"""
        deliveries = db.query(
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
            Delivery.status == status,
            Delivery.delivered_at.is_(None)
        ).order_by(Delivery.assigned_at).all()
        
        result = []
        for delivery, order, user, address, area, city in deliveries:
            # Get items count
            items_count = db.query(func.sum(OrderItem.quantity)).filter(
                OrderItem.order_id == order.order_id
            ).scalar() or 0
            
            # Get payment info
            payment = db.query(Payment).filter(
                Payment.order_id == order.order_id
            ).first()
            
            # Calculate progress based on status
            progress = 0
            status_text = delivery.status
            if delivery.status == "ASSIGNED":
                progress = 0
                status_text = "Pending Pickup"
            elif delivery.status == "PICKED_UP":
                progress = 50
                status_text = "Picked Up"
            elif delivery.status == "OUT_FOR_DELIVERY":
                progress = 75
                status_text = "Out for Delivery"
            
            # Payment type and amount
            payment_type = PaymentType.COD
            amount = None
            if payment:
                payment_type = PaymentType.PREPAID if payment.payment_status == "COMPLETED" else PaymentType.COD
                if payment_type == PaymentType.COD:
                    amount = float(order.total_amount)
            
            result.append({
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer": {
                    "customer_id": user.user_id,
                    "name": f"{user.first_name} {user.last_name}",
                    "phone": user.phone or "",
                    "avatar_url": user.profile_img_url
                },
                "delivery_address": {
                    "address_id": address.address_id,
                    "line1": address.line1,
                    "line2": address.line2,
                    "area_name": area.area_name,
                    "city_name": city.city_name,
                    "pincode": area.pincode
                },
                "status": delivery.status,
                "status_label": status_text,
                "assigned_at": delivery.assigned_at,
                "expected_delivery_time": delivery.expected_delivery_time,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
                "items_count": int(items_count),
                "payment_type": payment_type,
                "cod_amount": amount,
                "subtotal": float(order.subtotal) if order.subtotal else 0.0,
                "discount_amount": float(order.discount_amount) if order.discount_amount else 0.0,
                "delivery_fee": float(order.delivery_fee) if order.delivery_fee else 0.0,
                "total_amount": float(order.total_amount) if order.total_amount else 0.0,
                "progress": progress,
                "pod_image_url": delivery.pod_image_url,
                "signature_url": delivery.signature_url,
                "delivery_notes": delivery.delivery_notes
            })
        
        return result
    
    # ===== TODAY'S DELIVERIES =====
    
    @staticmethod
    def get_todays_deliveries(db: Session, delivery_person_id: int) -> List[Dict[str, Any]]:
        """Get all deliveries assigned today"""
        today = date.today()
        
        deliveries = db.query(
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
            func.date(Delivery.assigned_at) == today
        ).order_by(Delivery.expected_delivery_time).all()
        
        result = []
        for delivery, order, user, address, area, city in deliveries:
            # Get items count
            items_count = db.query(func.sum(OrderItem.quantity)).filter(
                OrderItem.order_id == order.order_id
            ).scalar() or 0
            
            # Get payment info
            payment = db.query(Payment).filter(
                Payment.order_id == order.order_id
            ).first()
            
            # Calculate progress based on status
            progress = 0
            status_text = delivery.status
            if delivery.status == "ASSIGNED":
                progress = 0
                status_text = "Pending Pickup"
            elif delivery.status == "PICKED_UP":
                progress = 50
                status_text = "Picked Up"
            elif delivery.status == "OUT_FOR_DELIVERY":
                progress = 75
                status_text = "Out for Delivery"
            
            # Payment type and amount
            payment_type = PaymentType.COD
            amount = None
            if payment:
                payment_type = PaymentType.PREPAID if payment.payment_status == "COMPLETED" else PaymentType.COD
                if payment_type == PaymentType.COD:
                    amount = float(order.total_amount)
            
            result.append({
                "delivery_id": delivery.delivery_id,
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer": {
                    "customer_id": user.user_id,
                    "name": f"{user.first_name} {user.last_name}",
                    "phone": user.phone or "",
                    "avatar_url": user.profile_img_url
                },
                "delivery_address": {
                    "address_id": address.address_id,
                    "line1": address.line1,
                    "line2": address.line2,
                    "area_name": area.area_name,
                    "city_name": city.city_name,
                    "pincode": area.pincode
                },
                "status": delivery.status,
                "status_label": status_text,
                "assigned_at": delivery.assigned_at,
                "expected_delivery_time": delivery.expected_delivery_time,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else None,
                "items_count": int(items_count),
                "payment_type": payment_type,
                "cod_amount": amount,
                "subtotal": float(order.subtotal) if order.subtotal else 0.0,
                "discount_amount": float(order.discount_amount) if order.discount_amount else 0.0,
                "delivery_fee": float(order.delivery_fee) if order.delivery_fee else 0.0,
                "total_amount": float(order.total_amount) if order.total_amount else 0.0,
                "progress": progress,
                "pod_image_url": delivery.pod_image_url,
                "signature_url": delivery.signature_url,
                "delivery_notes": delivery.delivery_notes
            })
        
        return result