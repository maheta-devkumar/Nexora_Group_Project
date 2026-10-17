from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from config.database import get_db
from services.excel_data_service import ExcelDataService
from repositories.excel_data_repository import ExcelDataRepository
from schemas.excel_data_schema import BulkInsertRequest, BulkInsertResponse
import traceback

class ExcelDataController:
    
    @staticmethod
    def get_allowed_tables():
        return ExcelDataService.get_allowed_tables()

    @staticmethod
    def get_template(table_name: str):
        try:
            excel_bytes = ExcelDataService.generate_template(table_name)
            return Response(
                content=excel_bytes,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=template_{table_name}.xlsx"}
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def preview_upload(table_name: str = Form(...), excel_file: UploadFile = File(...)):
        if not excel_file.filename.endswith(('.xlsx', '.xls')):
             raise HTTPException(status_code=400, detail="Invalid file format. Please upload Excel file.")
        
        try:
            content = await excel_file.read()
            return await ExcelDataService.parse_and_preview(content, table_name)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
             traceback.print_exc()
             raise HTTPException(status_code=500, detail="Internal Server Error during preview")

    @staticmethod
    def insert_data(request: BulkInsertRequest, db: Session = Depends(get_db)):
        try:
            count = ExcelDataService.process_bulk_insert(db, request.table_name, request.data)
            return BulkInsertResponse(inserted_count=count, message="Data inserted successfully")
        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")
