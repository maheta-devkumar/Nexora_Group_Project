from sqlalchemy.orm import Session
from models.address import State, City, Area, Address
from typing import List, Optional

class AddressRepository:
    
    @staticmethod
    def get_all_states(db: Session) -> List[State]:
        """Get all states"""
        return db.query(State).all()
    
    @staticmethod
    def get_state_by_id(db: Session, state_id: int) -> Optional[State]:
        """Get state by ID"""
        return db.query(State).filter(State.state_id == state_id).first()
    
    @staticmethod
    def get_cities_by_state(db: Session, state_id: int) -> List[City]:
        """Get cities by state ID"""
        return db.query(City).filter(City.state_id == state_id).all()
    
    @staticmethod
    def get_city_by_id(db: Session, city_id: int) -> Optional[City]:
        """Get city by ID"""
        return db.query(City).filter(City.city_id == city_id).first()
    
    @staticmethod
    def get_areas_by_city(db: Session, city_id: int) -> List[Area]:
        """Get areas by city ID"""
        return db.query(Area).filter(Area.city_id == city_id).all()
    
    @staticmethod
    def get_area_by_id(db: Session, area_id: int) -> Optional[Area]:
        """Get area by ID"""
        return db.query(Area).filter(Area.area_id == area_id).first()
    
    @staticmethod
    def get_user_addresses(db: Session, user_id: int) -> List[Address]:
        """Get all addresses for a user"""
        return db.query(Address).filter(Address.user_id == user_id).all()
    
    @staticmethod
    def get_user_address_by_id(db: Session, user_id: int, address_id: int) -> Optional[Address]:
        """Get specific address for a user"""
        return db.query(Address).filter(
            Address.address_id == address_id, 
            Address.user_id == user_id
        ).first()
    
    @staticmethod
    def get_address_by_id(db: Session, address_id: int) -> Optional[Address]:
        """Get address by ID (without user validation)"""
        return db.query(Address).filter(Address.address_id == address_id).first()
    
    @staticmethod
    def create_address(db: Session, address_data: dict) -> Address:
        """Create new address"""
        new_address = Address(**address_data)
        db.add(new_address)
        db.commit()
        db.refresh(new_address)
        return new_address
    
    @staticmethod
    def update_address(db: Session, address: Address, update_data: dict) -> Address:
        """Update address"""
        for key, value in update_data.items():
            if hasattr(address, key):
                setattr(address, key, value)
        
        db.commit()
        db.refresh(address)
        return address
    
    @staticmethod
    def update_user_addresses_default(db: Session, user_id: int, is_default: bool = False) -> None:
        """Update default status for all user addresses"""
        db.query(Address).filter(Address.user_id == user_id).update(
            {"is_default": is_default}, 
            synchronize_session='fetch'
        )
        db.commit()
    
    @staticmethod
    def delete_address(db: Session, address: Address) -> None:
        """Delete address"""
        db.delete(address)
        db.commit()