from pydantic import BaseModel
from typing import Optional, Any, List, Dict, Union
from decimal import Decimal

class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int

class BulkOperationResponse(BaseModel):
    success: bool = True
    processed: int
    failed: int
    errors: Optional[List[str]] = None