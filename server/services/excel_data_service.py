import pandas as pd
import io
from typing import List, Dict, Any, Tuple
from schemas.excel_data_schema import TableInfo, BulkPreviewResponse, RowError
from repositories.excel_data_repository import ExcelDataRepository
from services.notification_service import NotificationService
from repositories.user_repository import UserRepository

class ExcelDataService:
    
    SCHEMAS = {
        "products": {
            "label": "Products",
            "columns": {
                "product_name": "str",
                "description": "str",
                "brand_id": "int",
                "sub_category_id": "int"
            },
            "required": ["product_name"]
        },
        "variant": {
            "label": "Product Variants",
            "columns": {
                "product_id": "int",
                "variant_name": "str",
                "price": "float",
                "stock_quantity": "int",
                "sku": "str", # Note: SKU not in model but usually required, checking model again... SKU wasn't in the partial file I saw? I'll omit it if not sure or map to variant_name if appropriate. Wait, model didn't have SKU. I will stick to model fields.
                "discount_type": "str", # Enum
                "discount_value": "float",
                "status": "str", # Enum
                "is_default": "bool"
            },
            "required": ["product_id", "price"]
        },
        "attribute": {
            "label": "Product Attributes",
            "columns": {
                "attribute_name": "str"
            },
            "required": ["attribute_name"]
        },
        "categories": {
            "label": "Categories",
            "columns": {
                "category_name": "str",
                "description": "str"
            },
            "required": ["category_name"]
        },
        "brands": {
            "label": "Brands",
            "columns": {
                "brand_name": "str",
                "description": "str"
            },
            "required": ["brand_name"]
        },
        "inventories": {
            "label": "Inventories (Batches)",
            "columns": {
                "purchase_id": "int",
                "batch_number": "str",
                "manufactured_at": "datetime",
                "expires_at": "datetime"
            },
            "required": ["batch_number"]
        }
    }

    @staticmethod
    def get_allowed_tables() -> List[TableInfo]:
        tables = []
        for name, info in ExcelDataService.SCHEMAS.items():
            tables.append(TableInfo(
                table_name=name,
                label=info["label"],
                required_columns=info["required"],
                data_types=info["columns"]
            ))
        return tables

    @staticmethod
    def generate_template(table_name: str) -> bytes:
        if table_name not in ExcelDataService.SCHEMAS:
            raise ValueError("Invalid table name")
        
        schema = ExcelDataService.SCHEMAS[table_name]
        columns = list(schema["columns"].keys())
        
        # Create a sample row
        sample_data = {col: f"Example {col}" for col in columns}
        # Fixed types for sample
        for col, dtype in schema["columns"].items():
            if dtype == "int":
                sample_data[col] = 1
            elif dtype == "float":
                sample_data[col] = 10.50
            elif dtype == "bool":
                sample_data[col] = True
            elif dtype == "datetime":
                sample_data[col] = "2024-01-01"

        df = pd.DataFrame([sample_data])
        
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Template")
        return output.getvalue()

    @staticmethod
    def validate_row(row: pd.Series, schema: Dict[str, Any], index: int) -> Tuple[Dict[str, Any], RowError]:
        cleaned_data = {}
        column_errors = {}
        
        for col, dtype in schema["columns"].items():
            val = row.get(col)
            
            # Check required
            if col in schema["required"] and (pd.isna(val) or val == ""):
                column_errors[col] = "Required field is empty"
                continue
                
            if pd.isna(val) or val == "":
                continue

            # Validate Type
            try:
                if dtype == "int":
                    cleaned_data[col] = int(val)
                elif dtype == "float":
                    cleaned_data[col] = float(val)
                elif dtype == "str":
                    cleaned_data[col] = str(val).strip()
                elif dtype == "bool":
                    if isinstance(val, str):
                        cleaned_data[col] = val.lower() in ['true', '1', 'yes']
                    else:
                        cleaned_data[col] = bool(val)
                elif dtype == "datetime":
                     cleaned_data[col] = pd.to_datetime(val)
                else:
                    cleaned_data[col] = val
            except ValueError:
                column_errors[col] = f"Invalid format, expected {dtype}"

        if column_errors:
            return None, RowError(row_index=index, error_message="Validation Failed", column_errors=column_errors)
        
        return cleaned_data, None

    @staticmethod
    async def parse_and_preview(file_content: bytes, table_name: str) -> BulkPreviewResponse:
        if table_name not in ExcelDataService.SCHEMAS:
            raise ValueError("Invalid table name")

        schema = ExcelDataService.SCHEMAS[table_name]
        
        try:
            df = pd.read_excel(io.BytesIO(file_content))
        except Exception:
            raise ValueError("Invalid Excel file")

        # Normalize headers
        df.columns = [str(c).strip() for c in df.columns]
        
        # Check missing columns
        missing_cols = [col for col in schema["required"] if col not in df.columns]
        if missing_cols:
             raise ValueError(f"Missing required columns: {', '.join(missing_cols)}")

        preview_data = []
        errors = []
        
        # Iterate rows
        for index, row in df.iterrows():
            cleaned_row, error = ExcelDataService.validate_row(row, schema, index + 2) # +2 for header + 0-index
            if error:
                errors.append(error)
                # For preview, add raw row with error flag? 
                # Or just put all in preview?
                # User wants "preview rows" and "invalid rows".
                row_dict = row.to_dict()
                row_dict["_error"] = True
                preview_data.append(row_dict)
            else:
                preview_data.append(cleaned_row)

        valid_count = len(df) - len(errors)
        
        # Convert non-serializable types for JSON
        final_preview = []
        for p in preview_data:
            new_p = {}
            for k, v in p.items():
                if isinstance(v, pd.Timestamp):
                    new_p[k] = v.isoformat()
                elif pd.isna(v):
                    new_p[k] = None
                else:
                    new_p[k] = v
            final_preview.append(new_p)

        return BulkPreviewResponse(
            total_rows=len(df),
            valid_rows=valid_count,
            invalid_rows=len(errors),
            preview_data=final_preview,
            errors=errors,
            columns=list(schema["columns"].keys())
        )

    @staticmethod
    def process_bulk_insert(db: Session, table_name: str, data: List[Dict[str, Any]]) -> int:
        """
        Process bulk insert and send notification
        """
        # 1. Perform Insert
        inserted_count = ExcelDataRepository.bulk_insert(db, table_name, data)
        
        # 2. Send Notification
        try:
            notification_service = NotificationService(db)
            user_repo = UserRepository()
            
            # Get admin users
            admin_users = user_repo.get_admin_users(db)
            
            # Create notifications for all admins
            for admin in admin_users:
                notification_service.send_notification(
                    user_id=admin.user_id,
                    title="📊 Bulk Data Import Completed",
                    message=f"Successfully imported {inserted_count} records into '{table_name}'.",
                    type="SYSTEM",
                    reference_id=None
                )
                
        except Exception as e:
            # Don't fail the insert if notification fails
            print(f"⚠️ Failed to send bulk import notification: {e}")
            
        return inserted_count
