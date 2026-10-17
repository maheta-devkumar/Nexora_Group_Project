from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class TableInfo(BaseModel):
    table_name: str
    label: str
    required_columns: List[str]
    data_types: Dict[str, str]

class BulkPreviewRequest(BaseModel):
    table_name: str

class RowError(BaseModel):
    row_index: int
    error_message: str
    column_errors: Dict[str, str]

class BulkPreviewResponse(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    preview_data: List[Dict[str, Any]]
    errors: List[RowError]
    columns: List[str]

class BulkInsertRequest(BaseModel):
    table_name: str
    data: List[Dict[str, Any]]

class BulkInsertResponse(BaseModel):
    inserted_count: int
    message: str
