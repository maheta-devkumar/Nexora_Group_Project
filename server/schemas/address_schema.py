from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# --- Utility Schemas ---
class AddressDetail(BaseModel):
    address_id: int
    address_type: str
    line1: str
    line2: Optional[str] = None
    area_id: int
    area_name: Optional[str] = None
    city_name: Optional[str] = None
    state_name: Optional[str] = None
    pincode: Optional[str] = None
    is_default: bool
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AddressSummaryResponseData(BaseModel):
    addresses: List[AddressDetail]
    total_addresses: int

# --- Core Address Schemas ---
class AddressBase(BaseModel):
    address_type: str
    line1: str
    line2: Optional[str] = None
    area_id: int
    is_default: bool = False

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    address_type: Optional[str] = None
    line1: Optional[str] = None
    line2: Optional[str] = None
    area_id: Optional[int] = None
    is_default: Optional[bool] = None

class AddressResponse(AddressBase):
    address_id: int
    user_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- Location Schemas ---
class StateResponse(BaseModel):
    state_id: int
    state_name: str
    
    model_config = ConfigDict(from_attributes=True)

class CityResponse(BaseModel):
    city_id: int
    city_name: str
    state_id: int
    
    model_config = ConfigDict(from_attributes=True)

class AreaResponse(BaseModel):
    area_id: int
    area_name: str
    pincode: Optional[str] = None
    city_id: int
    
    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class AddressSummaryWrapper(SuccessWrapper):
    data: AddressSummaryResponseData

class AddressWrapper(SuccessWrapper):
    data: AddressResponse

class MessageWrapper(SuccessWrapper):
    data: dict

# Specific list wrappers for address routes
class StateListWrapper(SuccessWrapper):
    data: List[StateResponse]

class CityListWrapper(SuccessWrapper):
    data: List[CityResponse]

class AreaListWrapper(SuccessWrapper):
    data: List[AreaResponse]

class AddressListWrapper(SuccessWrapper):
    data: List[AddressDetail]