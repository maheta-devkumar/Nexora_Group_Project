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
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product import Product
from models.address import Address, Area, City
from models.payment import Payment
from models.feedback.feedback import Feedback
from models.feedback.user_issue import UserIssue

# Import schemas
from schemas.delivery_panel.delivery_dashboard_schema import (
    DeliveryStatus, PaymentType, PriorityLevel
)


class DeliveryDashboardRepository:
    
    # ===== DASHBOARD STATISTICS =====
    
    @staticmethod
    def get_dashboard_stats(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get dashboard statistics for delivery person"""
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Today's deliveries
        today_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) == today
        ).count()
        
        # Yesterday's deliveries for comparison
        yesterday_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) == yesterday
        ).count()
        
        # Completed deliveries today
        completed_today = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) == today,
            Delivery.status == "DELIVERED"
        ).count()
        
        # In progress deliveries
        in_progress = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
        ).count()
        
        # Today's earnings
        today_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) == today
        ).scalar() or 0
        
        # Average per delivery
        avg_per_delivery = 0
        if completed_today > 0:
            avg_per_delivery = float(today_earnings) / completed_today
        
        # Rating
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        rating = float(delivery_person.rating) if delivery_person and delivery_person.rating else 0.0
        
        # Total reviews (delivery feedback)
        total_reviews = db.query(Feedback).join(Order).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Feedback.feedback_type == "DELIVERY_FEEDBACK"
        ).count()
        
        # Percentage change
        yesterday_comparison = 0
        if yesterday_deliveries > 0:
            yesterday_comparison = ((today_deliveries - yesterday_deliveries) / yesterday_deliveries * 100)
        
        return {
            "today_deliveries": today_deliveries,
            "completed": completed_today,
            "in_progress": in_progress,
            "earnings": float(today_earnings),
            "rating": rating,
            "yesterday_comparison": yesterday_comparison,
            "average_per_delivery": avg_per_delivery,
            "total_reviews": total_reviews
        }
    
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
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status.in_(["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"])
        ).order_by(
            case(
                (Delivery.status == "ASSIGNED", 1),
                (Delivery.status == "PICKED_UP", 2),
                (Delivery.status == "OUT_FOR_DELIVERY", 3)
            ),
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
            
            # Determine actions based on status
            actions = []
            if delivery.status == "ASSIGNED":
                actions = ["call", "navigate", "mark-picked"]
            elif delivery.status == "PICKED_UP":
                actions = ["call", "navigate", "mark-delivered"]
            elif delivery.status == "OUT_FOR_DELIVERY":
                actions = ["call", "navigate", "mark-delivered"]
            
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
            payment_type = "prepaid"
            amount = None
            if payment:
                payment_type = "prepaid" if payment.payment_status == "COMPLETED" else "cod"
                if payment_type == "cod":
                    amount = float(order.total_amount)
            
            result.append({
                "id": f"ORD-{order.order_id:05d}",
                "order_id": order.order_id,
                "priority": None,  # No priority field in Delivery model
                "status": delivery.status,
                "status_text": status_text,
                "customer": {
                    "name": f"{user.first_name} {user.last_name}",
                    "phone": user.phone or "",
                    "avatar": user.profile_img_url
                },
                "pickup_location": "Store",  # Generic since no store table
                "delivery_location": delivery_address,
                "distance": f"{float(delivery.distance_km)} km" if delivery.distance_km else "N/A",
                "expected_time": expected_time,
                "items": int(items_count),
                "payment_type": payment_type,
                "amount": amount,
                "progress": progress,
                "eta": "15 mins away" if progress > 0 else None,
                "actions": actions
            })
        
        return result
    
    # ===== EARNINGS OVERVIEW =====
    
    @staticmethod
    def get_earnings_overview(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get earnings overview for different periods"""
        today = date.today()
        
        # Today's earnings
        today_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) == today
        ).scalar() or 0
        
        today_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) == today,
            Delivery.status == "DELIVERED"
        ).count()
        
        # This week (Monday to Sunday)
        week_start = today - timedelta(days=today.weekday())
        week_end = week_start + timedelta(days=6)
        
        week_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) >= week_start,
            func.date(DeliveryEarnings.earned_at) <= week_end
        ).scalar() or 0
        
        week_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) >= week_start,
            func.date(Delivery.assigned_at) <= week_end,
            Delivery.status == "DELIVERED"
        ).count()
        
        # This month
        month_start = today.replace(day=1)
        next_month = month_start.replace(month=month_start.month % 12 + 1, year=month_start.year + (month_start.month // 12))
        month_end = next_month - timedelta(days=1)
        
        month_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(DeliveryEarnings.earned_at) >= month_start,
            func.date(DeliveryEarnings.earned_at) <= month_end
        ).scalar() or 0
        
        month_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            func.date(Delivery.assigned_at) >= month_start,
            func.date(Delivery.assigned_at) <= month_end,
            Delivery.status == "DELIVERED"
        ).count()
        
        # Pending settlement (earnings from delivered orders without earnings record)
        pending_earnings_query = db.query(
            func.coalesce(func.sum(Order.delivery_fee), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            ~Delivery.earnings.any()  # No earnings record exists
        )
        pending_earnings = float(pending_earnings_query.scalar() or 0)
        
        return {
            "periods": [
                {
                    "period": "Today",
                    "amount": float(today_earnings),
                    "deliveries": today_deliveries
                },
                {
                    "period": "This Week",
                    "amount": float(week_earnings),
                    "deliveries": week_deliveries
                },
                {
                    "period": "This Month",
                    "amount": float(month_earnings),
                    "deliveries": month_deliveries
                },
                {
                    "period": "Pending",
                    "amount": pending_earnings,
                    "description": "To be settled"
                }
            ],
            "pending_settlement": pending_earnings
        }
    
    # ===== TODAY'S SCHEDULE =====
    
    @staticmethod
    def get_today_schedule(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get today's schedule for delivery person - Using deliveries as schedule"""
        today = date.today()
        
        # Get today's deliveries
        today_deliveries = db.query(
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
        ).order_by(
            Delivery.expected_delivery_time
        ).all()
        
        # Group deliveries by time periods (morning, afternoon, evening)
        morning_deliveries = []
        afternoon_deliveries = []
        evening_deliveries = []
        
        for delivery, order, user, address, area, city in today_deliveries:
            if delivery.expected_delivery_time:
                hour = delivery.expected_delivery_time.hour
                if hour < 12:
                    morning_deliveries.append(delivery)
                elif hour < 17:
                    afternoon_deliveries.append(delivery)
                else:
                    evening_deliveries.append(delivery)
            else:
                morning_deliveries.append(delivery)  # Default to morning
        
        # Create schedule from deliveries
        upcoming_shifts = []
        
        if morning_deliveries:
            completed = len([d for d in morning_deliveries if d.status == "DELIVERED"])
            upcoming_shifts.append({
                "id": 1,
                "type": "shift",
                "title": "Morning Deliveries",
                "time": "9:00 AM - 12:00 PM",
                "location": "Scheduled",
                "status": "completed" if datetime.utcnow().hour >= 12 else "ongoing",
                "completed_tasks": completed,
                "total_tasks": len(morning_deliveries)
            })
        
        if afternoon_deliveries:
            completed = len([d for d in afternoon_deliveries if d.status == "DELIVERED"])
            upcoming_shifts.append({
                "id": 2,
                "type": "shift",
                "title": "Afternoon Deliveries",
                "time": "12:00 PM - 5:00 PM",
                "location": "Scheduled",
                "status": "completed" if datetime.utcnow().hour >= 17 else "ongoing" if datetime.utcnow().hour >= 12 else "upcoming",
                "completed_tasks": completed,
                "total_tasks": len(afternoon_deliveries)
            })
        
        if evening_deliveries:
            completed = len([d for d in evening_deliveries if d.status == "DELIVERED"])
            upcoming_shifts.append({
                "id": 3,
                "type": "shift",
                "title": "Evening Deliveries",
                "time": "5:00 PM - 9:00 PM",
                "location": "Scheduled",
                "status": "completed" if datetime.utcnow().hour >= 21 else "ongoing" if datetime.utcnow().hour >= 17 else "upcoming",
                "completed_tasks": completed,
                "total_tasks": len(evening_deliveries)
            })
        
        # Find next delivery
        next_delivery = None
        upcoming_deliveries = db.query(
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
            Delivery.status.in_(["ASSIGNED", "PICKED_UP"]),
            Delivery.expected_delivery_time > datetime.utcnow()
        ).order_by(
            Delivery.expected_delivery_time
        ).first()
        
        if upcoming_deliveries:
            delivery, order, user, address, area, city = upcoming_deliveries
            delivery_address = f"{address.line1}"
            if address.line2:
                delivery_address += f", {address.line2}"
            delivery_address += f", {area.area_name}"
            
            next_delivery = {
                "id": f"ORD-{order.order_id:05d}",
                "customer": f"{user.first_name} {user.last_name}",
                "time": delivery.expected_delivery_time.strftime("%I:%M %p") if delivery.expected_delivery_time else "N/A",
                "address": delivery_address,
                "distance": f"{float(delivery.distance_km)} km" if delivery.distance_km else "N/A"
            }
        
        return {
            "date": today.strftime("%A, %B %d, %Y"),
            "upcoming_shifts": upcoming_shifts,
            "next_delivery": next_delivery or {
                "id": "No deliveries",
                "customer": "No upcoming deliveries",
                "time": "N/A",
                "address": "No address",
                "distance": "0 km"
            }
        }
    
    # ===== DELIVERY STATUS UPDATES =====
    
    @staticmethod
    def update_delivery_status(
        db: Session, 
        delivery_id: int, 
        status: DeliveryStatus,
        delivery_person_id: int,
        notes: Optional[str] = None
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
        if status == DeliveryStatus.PICKED_UP:
            # You might want to add a picked_up_at field
            pass
        elif status == DeliveryStatus.DELIVERED:
            delivery.delivered_at = datetime.utcnow()
            delivery.actual_delivery_time = datetime.utcnow()
            
            # Check if earnings record already exists
            existing_earning = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery_id
            ).first()
            
            if not existing_earning:
                # Get order to calculate earnings
                order = db.query(Order).filter(Order.order_id == delivery.order_id).first()
                if order and order.delivery_fee:
                    earnings_amount = order.delivery_fee
                    
                    earnings = DeliveryEarnings(
                        delivery_person_id=delivery_person_id,
                        delivery_id=delivery_id,
                        amount=earnings_amount,
                        earned_at=datetime.utcnow()
                    )
                    db.add(earnings)
        
        if notes:
            delivery.delivery_notes = notes
        
        try:
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
    
    @staticmethod
    def update_delivery_progress(db: Session, delivery_id: int, progress: int) -> bool:
        """Update delivery progress percentage"""
        delivery = db.query(Delivery).filter(Delivery.delivery_id == delivery_id).first()
        
        if not delivery:
            return False
        
        # Update status based on progress
        if progress >= 75:
            delivery.status = DeliveryStatus.OUT_FOR_DELIVERY
        elif progress >= 50:
            delivery.status = DeliveryStatus.PICKED_UP
        
        try:
            db.commit()
            return True
        except:
            db.rollback()
            return False
    
    # ===== QUICK ACTIONS =====
    
    @staticmethod
    def verify_qr_code(db: Session, qr_data: str, delivery_person_id: int) -> Dict[str, Any]:
        """Verify QR code for order pickup/delivery"""
        try:
            # Parse QR data
            if not qr_data.startswith("ORD-"):
                return {"valid": False, "message": "Invalid QR code format"}
            
            # Extract order ID
            try:
                order_id = int(qr_data.split('-')[1])
            except (IndexError, ValueError):
                return {"valid": False, "message": "Invalid order ID in QR code"}
            
            # Check if delivery exists and assigned to this delivery person
            delivery = db.query(Delivery).filter(
                Delivery.order_id == order_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return {"valid": False, "message": "Delivery not found or not assigned to you"}
            
            # Determine action from QR suffix or delivery status
            action = "verify"
            if "PICKUP" in qr_data.upper() and delivery.status == DeliveryStatus.ASSIGNED:
                action = "pickup"
            elif "DELIVERY" in qr_data.upper() and delivery.status == DeliveryStatus.PICKED_UP:
                action = "delivery"
            
            return {
                "valid": True,
                "order_id": order_id,
                "delivery_id": delivery.delivery_id,
                "action": action,
                "message": f"QR verified for order {order_id}"
            }
            
        except Exception as e:
            return {"valid": False, "message": f"QR verification failed: {str(e)}"}
    
    @staticmethod
    def report_issue(
        db: Session,
        delivery_person_id: int,
        order_id: int,
        issue_type: str,
        description: str,
        priority: str = "MEDIUM"
    ) -> bool:
        """Report delivery issue"""
        try:
            # Get delivery
            delivery = db.query(Delivery).filter(
                Delivery.order_id == order_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return False
            
            # Get user_id from delivery person
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person:
                return False
            
            # Create issue
            issue = UserIssue(
                raised_by_id=delivery_person.user_id,
                raised_by_role="delivery",
                order_id=order_id,
                delivery_id=delivery.delivery_id,
                issue_type=issue_type,
                title=f"Delivery Issue - {issue_type}",
                description=description,
                priority=priority,
                status="OPEN"
            )
            
            db.add(issue)
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    @staticmethod
    def upload_pod(
        db: Session,
        delivery_person_id: int,
        order_id: int,
        image_url: str,
        signature_url: Optional[str] = None,
        notes: Optional[str] = None
    ) -> bool:
        """Upload Proof of Delivery"""
        try:
            delivery = db.query(Delivery).filter(
                Delivery.order_id == order_id,
                Delivery.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery:
                return False
            
            delivery.pod_image_url = image_url
            if signature_url:
                delivery.signature_url = signature_url
            if notes:
                delivery.delivery_notes = notes
            
            # Mark as delivered and update timestamps
            delivery.status = DeliveryStatus.DELIVERED
            delivery.delivered_at = datetime.utcnow()
            delivery.actual_delivery_time = datetime.utcnow()
            
            # Create earnings record if not exists
            existing_earning = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery.delivery_id
            ).first()
            
            if not existing_earning:
                order = db.query(Order).filter(Order.order_id == order_id).first()
                if order and order.delivery_fee:
                    earnings = DeliveryEarnings(
                        delivery_person_id=delivery_person_id,
                        delivery_id=delivery.delivery_id,
                        amount=order.delivery_fee,
                        earned_at=datetime.utcnow()
                    )
                    db.add(earnings)
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    # ===== NAVIGATION =====
    
    @staticmethod
    def get_navigation_details(db: Session, order_id: int, delivery_person_id: int) -> Optional[Dict[str, Any]]:
        """Get navigation details for delivery"""
        delivery = db.query(Delivery).filter(
            Delivery.order_id == order_id,
            Delivery.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery:
            return None
        
        # Get order and address details
        order = db.query(Order).filter(Order.order_id == order_id).first()
        if not order or not order.address_id:
            return None
        
        address = db.query(
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
        
        if not address:
            return None
        
        addr, area, city = address
        
        # Format address for navigation
        formatted_address = f"{addr.line1}"
        if addr.line2:
            formatted_address += f", {addr.line2}"
        formatted_address += f", {area.area_name}, {city.city_name}"
        
        # URL encode the address
        import urllib.parse
        encoded_address = urllib.parse.quote(formatted_address)
        
        # Try to get coordinates from delivery person's current location
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        latitude = 23.0225  # Default coordinates
        longitude = 72.5714
        
        if delivery_person and delivery_person.current_location:
            try:
                loc_data = delivery_person.current_location
                if isinstance(loc_data, dict):
                    latitude = loc_data.get('lat', latitude)
                    longitude = loc_data.get('lng', longitude)
            except:
                pass
        
        return {
            "google_maps_url": f"https://www.google.com/maps/dir/?api=1&destination={encoded_address}",
            "openstreetmap_url": f"https://www.openstreetmap.org/directions?to={encoded_address}",
            "latitude": float(latitude),
            "longitude": float(longitude),
            "formatted_address": formatted_address,
            "distance_km": float(delivery.distance_km) if delivery.distance_km else None
        }
    
    # ===== PERFORMANCE METRICS =====
    
    @staticmethod
    def get_performance_metrics(db: Session, delivery_person_id: int) -> Dict[str, Any]:
        """Get delivery person performance metrics"""
        # Total deliveries
        total_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED"
        ).count()
        
        # On-time deliveries (within expected time or within 30 minutes)
        on_time_deliveries = 0
        if total_deliveries > 0:
            deliveries = db.query(Delivery).filter(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.actual_delivery_time.isnot(None),
                Delivery.expected_delivery_time.isnot(None)
            ).all()
            
            for delivery in deliveries:
                time_diff = (delivery.actual_delivery_time - delivery.expected_delivery_time).total_seconds() / 60
                if time_diff <= 30:  # Within 30 minutes is considered on-time
                    on_time_deliveries += 1
        
        # Calculate on-time rate
        on_time_rate = (on_time_deliveries / total_deliveries * 100) if total_deliveries > 0 else 0
        
        # Get rating from delivery person
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        rating = float(delivery_person.rating) if delivery_person and delivery_person.rating else 0.0
        
        # Total earnings
        total_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), 0)
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).scalar() or 0
        
        # Average delivery time (in minutes)
        avg_delivery_time = 0
        if total_deliveries > 0:
            avg_time_query = db.query(
                func.avg(
                    func.extract('epoch', Delivery.actual_delivery_time) - 
                    func.extract('epoch', Delivery.assigned_at)
                ) / 60  # Convert to minutes
            ).filter(
                Delivery.delivery_person_id == delivery_person_id,
                Delivery.status == "DELIVERED",
                Delivery.actual_delivery_time.isnot(None),
                Delivery.assigned_at.isnot(None)
            ).scalar()
            
            avg_delivery_time = float(avg_time_query or 0)
        
        return {
            "total_deliveries": total_deliveries,
            "on_time_deliveries": on_time_deliveries,
            "on_time_rate": on_time_rate,
            "average_rating": rating,
            "total_earnings": float(total_earnings),
            "average_delivery_time": avg_delivery_time
        }
    
    # ===== UPDATE DELIVERY PERSON STATUS =====
    
    @staticmethod
    def update_delivery_person_status(
        db: Session,
        delivery_person_id: int,
        is_online: bool,
        current_location: Optional[Dict] = None
    ) -> bool:
        """Update delivery person online status and location"""
        try:
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person:
                return False
            
            delivery_person.is_online = is_online
            if current_location:
                delivery_person.current_location = current_location
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    # ===== GET DELIVERY HISTORY =====
    
    @staticmethod
    def get_delivery_history(
        db: Session,
        delivery_person_id: int,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get delivery history for past N days"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
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
            Delivery.status == "DELIVERED",
            Delivery.delivered_at >= cutoff_date
        ).order_by(
            desc(Delivery.delivered_at)
        ).all()
        
        result = []
        for delivery, order, user, address, area, city in deliveries:
            delivery_address = f"{address.line1}"
            if address.line2:
                delivery_address += f", {address.line2}"
            delivery_address += f", {area.area_name}"
            
            # Get earnings for this delivery
            earnings = db.query(DeliveryEarnings).filter(
                DeliveryEarnings.delivery_id == delivery.delivery_id
            ).first()
            
            result.append({
                "order_id": order.order_id,
                "order_number": f"ORD-{order.order_id:05d}",
                "customer_name": f"{user.first_name} {user.last_name}",
                "delivery_address": delivery_address,
                "delivered_at": delivery.delivered_at.strftime("%Y-%m-%d %I:%M %p") if delivery.delivered_at else "",
                "status": delivery.status,
                "earnings": float(earnings.amount) if earnings else 0.0,
                "distance_km": float(delivery.distance_km) if delivery.distance_km else 0.0
            })
        
        return result