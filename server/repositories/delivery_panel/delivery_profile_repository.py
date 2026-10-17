# delivery_panel/profile/delivery_profile_repository.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, and_, or_, case
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal

# Import models
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
from models.address import Address, Area, City, State
from models.delivery.delivery import Delivery
from models.delivery.delivery_earnings import DeliveryEarnings
from models.feedback.feedback import Feedback
from models.order.order import Order

class DeliveryProfileRepository:
    
    @staticmethod
    def get_profile_overview(
        db: Session, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get profile overview combining user and delivery_person data"""
        result = db.query(
            DeliveryPerson,
            User
        ).join(
            User, User.user_id == DeliveryPerson.user_id
        ).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not result:
            return None
        
        delivery_person, user = result
        
        # Get address if exists
        address = db.query(
            Address,
            Area,
            City,
            State
        ).outerjoin(
            Area, Area.area_id == Address.area_id
        ).outerjoin(
            City, City.city_id == Area.city_id
        ).outerjoin(
            State, State.state_id == City.state_id
        ).filter(
            Address.user_id == user.user_id,
            Address.is_default == True
        ).first()
        
        # Get statistics
        total_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED"
        ).count()
        
        total_earnings_result = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), Decimal('0.00'))
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).scalar() or Decimal('0.00')
        
        # Get average rating from feedback
        avg_rating_query = db.query(
            func.avg(Feedback.rating)
        ).join(Order).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Feedback.feedback_type == "DELIVERY_FEEDBACK",
            Feedback.rating.isnot(None)
        )
        avg_rating = float(avg_rating_query.scalar() or 0.0)
        
        # Calculate on-time rate (simplified)
        on_time_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            Delivery.actual_delivery_time.isnot(None),
            Delivery.expected_delivery_time.isnot(None)
        ).count()
        
        on_time_rate = 0.0
        if total_deliveries > 0:
            on_time_rate = (on_time_deliveries / total_deliveries) * 100
        
        return {
            "user_id": user.user_id,
            "full_name": f"{user.first_name} {user.last_name}",
            "email": user.email,
            "phone": user.phone,
            "profile_image_url": user.profile_img_url,
            "role": "Delivery Partner",
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "last_login": user.last_login,
            "delivery_person_id": delivery_person.delivery_person_id,
            "license_number": delivery_person.license_number,
            "delivery_status": delivery_person.status,
            "rating": delivery_person.rating,
            "joined_at": delivery_person.joined_at,
            "is_online": delivery_person.is_online,
            "total_deliveries": total_deliveries,
            "total_earnings": total_earnings_result,
            "average_rating": avg_rating,
            "on_time_rate": on_time_rate,
            "address": address
        }
    
    @staticmethod
    def get_personal_info(
        db: Session, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """Get personal information combining user and delivery_person data"""
        result = db.query(
            DeliveryPerson,
            User
        ).join(
            User, User.user_id == DeliveryPerson.user_id
        ).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not result:
            return None
        
        delivery_person, user = result
        
        # Get default address
        address_info = None
        address = db.query(
            Address,
            Area,
            City,
            State
        ).outerjoin(
            Area, Area.area_id == Address.area_id
        ).outerjoin(
            City, City.city_id == Area.city_id
        ).outerjoin(
            State, State.state_id == City.state_id
        ).filter(
            Address.user_id == user.user_id,
            Address.is_default == True
        ).first()
        
        if address:
            addr, area, city, state = address
            address_info = {
                "address_line1": addr.line1,
                "address_line2": addr.line2,
                "area": area.area_name if area else None,
                "city": city.city_name if city else None,
                "state": state.state_name if state else None,
                "pincode": area.pincode if area else None
            }
        
        # Get vehicle info from delivery_person
        vehicle_info = delivery_person.vehicle_info or {}
        
        return {
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone,
            "gender": user.gender,
            "date_of_birth": user.dob,
            "profile_image_url": user.profile_img_url,
            "license_number": delivery_person.license_number,
            "vehicle_type": vehicle_info.get("type"),
            "vehicle_number": vehicle_info.get("number"),
            **{k: v for k, v in (address_info or {}).items()}
        }
    
    @staticmethod
    def update_personal_info(
        db: Session,
        delivery_person_id: int,
        update_data: Dict[str, Any]
    ) -> bool:
        """Update personal information for delivery person"""
        try:
            # Get delivery person
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person:
                return False
            
            # Get user
            user = db.query(User).filter(
                User.user_id == delivery_person.user_id
            ).first()
            
            if not user:
                return False
            
            # Update user fields
            user_fields = ['first_name', 'last_name', 'phone', 'gender', 'dob', 'profile_img_url']
            for field in user_fields:
                if field in update_data:
                    setattr(user, field, update_data[field])
            
            # Update delivery_person fields
            delivery_fields = ['license_number']
            for field in delivery_fields:
                if field in update_data:
                    setattr(delivery_person, field, update_data[field])
            
            # Update vehicle info if provided
            if 'vehicle_type' in update_data or 'vehicle_number' in update_data:
                vehicle_info = delivery_person.vehicle_info or {}
                if 'vehicle_type' in update_data:
                    vehicle_info['type'] = update_data['vehicle_type']
                if 'vehicle_number' in update_data:
                    vehicle_info['number'] = update_data['vehicle_number']
                delivery_person.vehicle_info = vehicle_info
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False
    
    @staticmethod
    def get_verification_documents(
        db: Session,
        delivery_person_id: int
    ) -> List[Dict[str, Any]]:
        """Get verification documents for delivery person"""
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.documents:
            return []
        
        documents_data = delivery_person.documents or {}
        documents = []
        doc_id = 1
        
        # Aadhaar Card
        if documents_data.get("aadhaar"):
            documents.append({
                "document_id": doc_id,
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number": "•••• •••• ••••",
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["aadhaar"]
            })
            doc_id += 1
        
        # Driving License
        if documents_data.get("license"):
            documents.append({
                "document_id": doc_id,
                "document_type": "DRIVING_LICENSE",
                "document_name": "Driving License",
                "document_number": "•••• •••• ••••",
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["license"]
            })
            doc_id += 1
        
        # PAN Card
        if documents_data.get("pan"):
            documents.append({
                "document_id": doc_id,
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number": "•••• •••• •••",
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["pan"]
            })
            doc_id += 1
        
        return documents
    
    @staticmethod
    def get_profile_statistics(
        db: Session,
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """Get profile statistics for delivery person"""
        # Total deliveries
        total_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED"
        ).count()
        
        # Completed deliveries (this week)
        today = date.today()
        week_start = today - timedelta(days=today.weekday())
        completed_this_week = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            func.date(Delivery.delivered_at) >= week_start
        ).count()
        
        # Total earnings
        total_earnings = db.query(
            func.coalesce(func.sum(DeliveryEarnings.amount), Decimal('0.00'))
        ).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id
        ).scalar() or Decimal('0.00')
        
        # Average rating
        avg_rating_query = db.query(
            func.avg(Feedback.rating)
        ).join(Order).join(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Feedback.feedback_type == "DELIVERY_FEEDBACK",
            Feedback.rating.isnot(None)
        )
        avg_rating = float(avg_rating_query.scalar() or 0.0)
        
        # On-time rate
        on_time_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            Delivery.actual_delivery_time.isnot(None),
            Delivery.expected_delivery_time.isnot(None)
        ).count()
        
        on_time_rate = 0.0
        if total_deliveries > 0:
            on_time_rate = (on_time_deliveries / total_deliveries) * 100
        
        # Joined since days
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        joined_since_days = 0
        if delivery_person and delivery_person.joined_at:
            joined_since_days = (datetime.now() - delivery_person.joined_at).days
        
        # Performance trend (simplified - compare this week with last week)
        last_week_start = week_start - timedelta(days=7)
        last_week_end = week_start - timedelta(days=1)
        
        this_week_deliveries = completed_this_week
        last_week_deliveries = db.query(Delivery).filter(
            Delivery.delivery_person_id == delivery_person_id,
            Delivery.status == "DELIVERED",
            func.date(Delivery.delivered_at) >= last_week_start,
            func.date(Delivery.delivered_at) <= last_week_end
        ).count()
        
        performance_trend = 0.0
        if last_week_deliveries > 0:
            performance_trend = ((this_week_deliveries - last_week_deliveries) / last_week_deliveries) * 100
        
        return {
            "total_deliveries": total_deliveries,
            "completed_deliveries": completed_this_week,
            "total_earnings": total_earnings,
            "average_rating": avg_rating,
            "on_time_rate": on_time_rate,
            "joined_since_days": joined_since_days,
            "performance_trend": performance_trend
        }
    
    @staticmethod
    def update_address(
        db: Session,
        delivery_person_id: int,
        address_data: Dict[str, Any]
    ) -> bool:
        """Update delivery person's address - only updates address table with area_id"""
        try:
            # Get delivery person
            delivery_person = db.query(DeliveryPerson).filter(
                DeliveryPerson.delivery_person_id == delivery_person_id
            ).first()
            
            if not delivery_person:
                return False
            
            # Get user
            user = db.query(User).filter(
                User.user_id == delivery_person.user_id
            ).first()
            
            if not user:
                return False
            
            # Validate area_id exists
            area = db.query(Area).filter(
                Area.area_id == address_data.get("area_id")
            ).first()
            
            if not area:
                return False
            
            # Get existing default address
            existing_address = db.query(Address).filter(
                Address.user_id == user.user_id,
                Address.is_default == True
            ).first()
            
            if existing_address:
                # Update existing address
                existing_address.line1 = address_data.get("line1", existing_address.line1)
                existing_address.line2 = address_data.get("line2", existing_address.line2)
                existing_address.address_type = address_data.get("address_type", existing_address.address_type)
                existing_address.area_id = address_data.get("area_id", existing_address.area_id)
                existing_address.is_default = address_data.get("is_default", existing_address.is_default)
            else:
                # Create new address
                new_address = Address(
                    user_id=user.user_id,
                    address_type=address_data.get("address_type", "Home"),
                    line1=address_data.get("line1"),
                    line2=address_data.get("line2"),
                    area_id=address_data.get("area_id"),
                    is_default=address_data.get("is_default", True)
                )
                db.add(new_address)
            
            db.commit()
            return True
            
        except Exception as e:
            db.rollback()
            return False