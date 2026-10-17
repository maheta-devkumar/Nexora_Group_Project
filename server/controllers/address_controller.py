from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.address_service import AddressService
from schemas.address_schema import AddressCreate
from typing import List, Dict, Any

class AddressController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = AddressService(db)
    
    def get_all_states(self) -> List[Dict[str, Any]]:
        """Get all states"""
        try:
            return self.service.get_all_states()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_cities_by_state(self, state_id: int) -> List[Dict[str, Any]]:
        """Get cities by state"""
        try:
            return self.service.get_cities_by_state(state_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_areas_by_city(self, city_id: int) -> List[Dict[str, Any]]:
        """Get areas by city"""
        try:
            return self.service.get_areas_by_city(city_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_user_addresses(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user addresses"""
        try:
            return self.service.get_user_addresses(user_id)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_address_by_id(self, address_id: int) -> Dict[str, Any]:
        """Get address by ID"""
        try:
            return self.service.get_address_by_id(address_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def create_address(self, user_id: int, address_data: AddressCreate) -> Dict[str, Any]:
        """Create address"""
        try:
            return self.service.create_address(user_id, address_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_address(self, user_id: int, address_id: int, update_data: dict) -> Dict[str, Any]:
        """Update address"""
        try:
            return self.service.update_address(user_id, address_id, update_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_address(self, user_id: int, address_id: int) -> Dict[str, str]:
        """Delete address"""
        try:
            return self.service.delete_address(user_id, address_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def set_default_address(self, user_id: int, address_id: int) -> Dict[str, Any]:
        """Set address as default"""
        try:
            return self.service.set_default_address(user_id, address_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))