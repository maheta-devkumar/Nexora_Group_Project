from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user
from controllers.address_controller import AddressController
from schemas.address_schema import (
    AddressCreate, AddressUpdate, AddressWrapper, MessageWrapper,
    StateListWrapper, CityListWrapper, AreaListWrapper, AddressListWrapper
)

router = APIRouter(prefix="/api/v1/address", tags=["Address"])

@router.get("/states", response_model=StateListWrapper)
def list_states(db: Session = Depends(get_db)):
    """Get all available states."""
    controller = AddressController(db)
    states = controller.get_all_states()
    return {"success": True, "message": "States retrieved successfully", "data": states}

@router.get("/cities/{state_id}", response_model=CityListWrapper)
def list_cities(state_id: int, db: Session = Depends(get_db)):
    """Get all cities for a specific state ID."""
    controller = AddressController(db)
    cities = controller.get_cities_by_state(state_id)
    return {"success": True, "message": "Cities retrieved successfully", "data": cities}

@router.get("/areas/{city_id}", response_model=AreaListWrapper)
def list_areas(city_id: int, db: Session = Depends(get_db)):
    """Get all areas for a specific city ID."""
    controller = AddressController(db)
    areas = controller.get_areas_by_city(city_id)
    return {"success": True, "message": "Areas retrieved successfully", "data": areas}

@router.get("/", response_model=AddressListWrapper)
def list_user_addresses(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all addresses for the current authenticated user."""
    controller = AddressController(db)
    addresses = controller.get_user_addresses(current_user.user_id)
    return {"success": True, "message": "Addresses retrieved successfully", "data": addresses}

@router.get("/{address_id}", response_model=AddressWrapper)
def get_address(address_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific address by ID."""
    controller = AddressController(db)
    address = controller.get_address_by_id(address_id)
    return {"success": True, "message": "Address retrieved successfully", "data": address}

@router.post("/", response_model=AddressWrapper, status_code=201)
def add_address(address_data: AddressCreate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new address for the current authenticated user."""
    controller = AddressController(db)
    address = controller.create_address(current_user.user_id, address_data)
    return {"success": True, "message": "Address added successfully", "data": address}

@router.put("/{address_id}", response_model=AddressWrapper)
def edit_address(address_id: int, update_data: AddressUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an existing address for the current user."""
    controller = AddressController(db)
    address = controller.update_address(current_user.user_id, address_id, update_data.model_dump(exclude_unset=True))
    return {"success": True, "message": "Address updated successfully", "data": address}

@router.patch("/{address_id}/default", response_model=AddressWrapper)
def set_default_address(address_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Set an address as default for the current user."""
    controller = AddressController(db)
    address = controller.set_default_address(current_user.user_id, address_id)
    return {"success": True, "message": "Address set as default successfully", "data": address}

@router.delete("/{address_id}", response_model=MessageWrapper)
def remove_address(address_id: int, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete an address for the current user."""
    controller = AddressController(db)
    result = controller.delete_address(current_user.user_id, address_id)
    return {"success": True, "message": result.get("message"), "data": result}