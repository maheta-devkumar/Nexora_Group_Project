from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from config.database import get_db
from controllers.excel_data_controller import ExcelDataController
from schemas.excel_data_schema import BulkInsertRequest

router = APIRouter(
    prefix="/api/v1/admin/bulk",
    tags=["Bulk Excel Upload"]
)

@router.get("/tables")
def get_allowed_tables():
    return ExcelDataController.get_allowed_tables()

@router.get("/template/{table_name}")
def get_template(table_name: str):
    return ExcelDataController.get_template(table_name)

@router.post("/preview")
async def preview_upload(
    table_name: str = Form(...),
    excel_file: UploadFile = File(...)
):
    return await ExcelDataController.preview_upload(table_name, excel_file)

@router.post("/insert")
def insert_data(
    request: BulkInsertRequest,
    db: Session = Depends(get_db)
):
    return ExcelDataController.insert_data(request, db)
