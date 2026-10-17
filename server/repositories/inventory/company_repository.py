from sqlalchemy.orm import Session
from models.inventory.company import Company
from models.address import Area
from typing import List, Dict, Any, Optional

class CompanyRepository:
    
    @staticmethod
    def get_company_by_id(db: Session, company_id: int) -> Optional[Company]:
        """Get company by ID"""
        return db.query(Company).filter(Company.company_id == company_id).first()
    
    @staticmethod
    def get_company_by_name(db: Session, name: str) -> Optional[Company]:
        """Get company by name"""
        return db.query(Company).filter(Company.name == name).first()
    
    @staticmethod
    def get_all_companies(db: Session, skip: int = 0, limit: int = 100) -> List[Company]:
        """Get all companies"""
        return db.query(Company).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_area(db: Session, skip: int = 0, limit: int = 100) -> List[Area]:
        """Get all areas"""
        return db.query(Area).offset(skip).limit(limit).all()
    
    @staticmethod
    def create_company(db: Session, company_data: Dict[str, Any]) -> Company:
        """Create a new company"""
        company = Company(**company_data)
        db.add(company)
        db.commit()
        db.refresh(company)
        return company
    
    @staticmethod
    def update_company(db: Session, company_id: int, update_data: Dict[str, Any]) -> Optional[Company]:
        """Update company"""
        company = db.query(Company).filter(Company.company_id == company_id).first()
        
        if company:
            for field, value in update_data.items():
                setattr(company, field, value)
            db.commit()
            db.refresh(company)
        
        return company
    
    @staticmethod
    def delete_company(db: Session, company_id: int) -> bool:
        """Delete company"""
        company = db.query(Company).filter(Company.company_id == company_id).first()
        
        if company:
            db.delete(company)
            db.commit()
            return True
        
        return False