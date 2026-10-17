from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.inventory.company_service import CompanyService
from schemas.inventory_schema import CompanyCreate, CompanyUpdate
from typing import List, Dict, Any

class CompanyController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = CompanyService(db)
    
    def create_company(self, company_data: CompanyCreate) -> Dict[str, Any]:
        """Create a new company"""
        try:
            return self.service.create_company(company_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_company(self, company_id: int) -> Dict[str, Any]:
        """Get company by ID"""
        try:
            return self.service.get_company(company_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_companies(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all companies"""
        try:
            return self.service.get_all_companies(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_all_areas(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all areas"""
        try:
            return self.service.get_all_areas(skip, limit)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def update_company(self, company_id: int, company_data: CompanyUpdate) -> Dict[str, Any]:
        """Update company"""
        try:
            return self.service.update_company(company_id, company_data)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_company(self, company_id: int) -> Dict[str, str]:
        """Delete company"""
        try:
            return self.service.delete_company(company_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))