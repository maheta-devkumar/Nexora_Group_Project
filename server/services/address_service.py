from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.address_repository import AddressRepository
from schemas.address_schema import AddressCreate
from schemas.address_schema import AddressCreate
from typing import List, Dict, Any
from services.notification_service import NotificationService

class AddressService:
    
    def __init__(self, db: Session):
        self.db = db
    def __init__(self, db: Session):
        self.db = db
        self.repository = AddressRepository
        self.notification_service = NotificationService(db)
    
    def serialize_state(self, state) -> Dict[str, Any]:
        """Convert state to dictionary"""
        return {
            "state_id": state.state_id,
            "state_name": state.state_name
        }
    
    def serialize_city(self, city) -> Dict[str, Any]:
        """Convert city to dictionary"""
        return {
            "city_id": city.city_id,
            "city_name": city.city_name,
            "state_id": city.state_id
        }
    
    def serialize_area(self, area) -> Dict[str, Any]:
        """Convert area to dictionary"""
        return {
            "area_id": area.area_id,
            "area_name": area.area_name,
            "pincode": area.pincode,
            "city_id": area.city_id
        }
    
    def serialize_address(self, address) -> Dict[str, Any]:
        """Convert address to dictionary"""
        return {
            "address_id": address.address_id,
            "address_type": address.address_type,
            "line1": address.line1,
            "line2": address.line2,
            "area_id": address.area_id,
            "area_name": address.area.area_name if address.area else None,
            "city_name": address.area.city.city_name if address.area and address.area.city else None,
            "state_name": address.area.city.state.state_name if address.area and address.area.city and address.area.city.state else None,
            "pincode": address.area.pincode if address.area else None,
            "is_default": address.is_default,
            "user_id": address.user_id,
            "created_at": address.created_at
        }
    
    def get_all_states(self) -> List[Dict[str, Any]]:
        """Get all states"""
        states = self.repository.get_all_states(self.db)
        return [self.serialize_state(state) for state in states]
    
    def get_cities_by_state(self, state_id: int) -> List[Dict[str, Any]]:
        """Get cities by state ID"""
        state = self.repository.get_state_by_id(self.db, state_id)
        if not state:
            raise HTTPException(status_code=404, detail="State not found")
        
        cities = self.repository.get_cities_by_state(self.db, state_id)
        return [self.serialize_city(city) for city in cities]
    
    def get_areas_by_city(self, city_id: int) -> List[Dict[str, Any]]:
        """Get areas by city ID"""
        city = self.repository.get_city_by_id(self.db, city_id)
        if not city:
            raise HTTPException(status_code=404, detail="City not found")
        
        areas = self.repository.get_areas_by_city(self.db, city_id)
        return [self.serialize_area(area) for area in areas]
    
    def get_user_addresses(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all addresses for a user"""
        addresses = self.repository.get_user_addresses(self.db, user_id)
        return [self.serialize_address(address) for address in addresses]
    
    def get_address_by_id(self, address_id: int) -> Dict[str, Any]:
        """Get address by ID"""
        address = self.repository.get_address_by_id(self.db, address_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        return self.serialize_address(address)
    
    def create_address(self, user_id: int, address_data: AddressCreate) -> Dict[str, Any]:
        """Create new address"""
        area = self.repository.get_area_by_id(self.db, address_data.area_id)
        if not area:
            raise HTTPException(status_code=404, detail="Area not found")
        
        if address_data.is_default:
            self.repository.update_user_addresses_default(self.db, user_id, False)
        
        address_dict = address_data.model_dump()
        address_dict["user_id"] = user_id
        
        
        new_address = self.repository.create_address(self.db, address_dict)
        
        # Send notification
        self._send_address_notification(user_id, "Home Address Added", f"New address in {area.area_name} has been added to your profile.")
        
        return self.serialize_address(new_address)
    
    def update_address(self, user_id: int, address_id: int, update_data: dict) -> Dict[str, Any]:
        """Update address"""
        address = self.repository.get_user_address_by_id(self.db, user_id, address_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Check if area_id is being updated and exists
        if 'area_id' in update_data and update_data['area_id'] is not None:
            area = self.repository.get_area_by_id(self.db, update_data['area_id'])
            if not area:
                raise HTTPException(status_code=404, detail="Area not found")
        
        if update_data.get("is_default") is True:
            self.repository.update_user_addresses_default(self.db, user_id, False)
        
        updated_address = self.repository.update_address(self.db, address, update_data)
        
        # Send notification
        self._send_address_notification(user_id, "Address Updated", "Your address details have been updated successfully.")
        
        return self.serialize_address(updated_address)
    
    def delete_address(self, user_id: int, address_id: int) -> Dict[str, str]:
        """Delete address"""
        address = self.repository.get_user_address_by_id(self.db, user_id, address_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        self.repository.delete_address(self.db, address)
        
        # Send notification
        self._send_address_notification(user_id, "Address Deleted", "An address has been removed from your profile.")
        
        return {"message": "Address deleted successfully"}
    
    def set_default_address(self, user_id: int, address_id: int) -> Dict[str, Any]:
        """Set an address as default"""
        address = self.repository.get_user_address_by_id(self.db, user_id, address_id)
        if not address:
            raise HTTPException(status_code=404, detail="Address not found")
        
        # Set all user addresses to non-default
        self.repository.update_user_addresses_default(self.db, user_id, False)
        
        # Set this address as default
        # Set this address as default
        updated_address = self.repository.update_address(self.db, address, {"is_default": True})
        
        # Send notification
        self._send_address_notification(user_id, "Default Address Changed", "Your default delivery address has been updated.")
        
        return self.serialize_address(updated_address)

    def _send_address_notification(self, user_id: int, title: str, message: str):
        """Send notification to user"""
        try:
            self.notification_service.send_notification(
                user_id=user_id,
                title=title,
                message=message,
                type="SYSTEM",
                reference_id=None
            )
        except Exception as e:
            print(f"⚠️ Failed to send address notification: {e}")