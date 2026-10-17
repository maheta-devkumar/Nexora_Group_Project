# delivery_panel/vehicle/delivery_vehicle_controller.py
from fastapi import HTTPException, status, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user, is_delivery_person
from services.delivery_panel.delivery_vehicle_service import DeliveryVehicleService
from schemas.delivery_panel.delivery_vehicle_schema import (
    VehicleDetailsResponse, VehicleDocumentsResponse, InsuranceResponse,
    ServiceHistoryResponse, VehicleComprehensiveResponse, VehicleSuccessResponse,
    NoVehicleResponse, InsuranceDetails
)
from models.user import User
from models.delivery.delivery_person import DeliveryPerson
from datetime import datetime, date

class DeliveryVehicleController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = DeliveryVehicleService(db)
    
    def _get_delivery_person_id(self, current_user: User) -> int:
        """Get delivery person ID from user"""
        delivery_person = self.db.query(DeliveryPerson).filter(
            DeliveryPerson.user_id == current_user.user_id
        ).first()
        
        if not delivery_person:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not a delivery person"
            )
        
        return delivery_person.delivery_person_id
    
    def get_vehicle_info(self, current_user: User) -> VehicleDetailsResponse:
        """Get vehicle basic information"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_vehicle_info(delivery_person_id)
        except ValueError as e:
            # Return empty vehicle info
            return VehicleDetailsResponse(
                vehicle_info=None,
                last_updated=None
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get vehicle information: {str(e)}"
            )
    
    def get_vehicle_documents(self, current_user: User) -> VehicleDocumentsResponse:
        """Get all vehicle documents"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_vehicle_documents(delivery_person_id)
        except Exception as e:
            # Return empty documents list
            return VehicleDocumentsResponse(
                documents=[],
                total_documents=0,
                verified_count=0,
                pending_count=0
            )
    
    def get_insurance_details(self, current_user: User) -> InsuranceResponse:
        """Get insurance information - returns empty if not found"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_insurance_details(delivery_person_id)
        except ValueError as e:
            # Return empty insurance response instead of error
            return InsuranceResponse(
                insurance_details=None,
                days_until_expiry=None,
                is_active=False
            )
        except Exception as e:
            # Return empty on any error
            return InsuranceResponse(
                insurance_details=None,
                days_until_expiry=None,
                is_active=False
            )
    
    def get_service_history(self, current_user: User) -> ServiceHistoryResponse:
        """Get service history"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_service_history(delivery_person_id)
        except Exception as e:
            # Return empty service history
            return ServiceHistoryResponse(
                service_records=[],
                total_services=0,
                last_service_date=None,
                next_service_date=None,
                total_service_cost=None
            )
    
    def get_comprehensive_vehicle_info(self, current_user: User) -> VehicleComprehensiveResponse:
        """Get all vehicle information in one call - returns empty if not found"""
        try:
            delivery_person_id = self._get_delivery_person_id(current_user)
            return self.service.get_comprehensive_info(delivery_person_id)
        except ValueError as e:
            # Return empty comprehensive info
            return VehicleComprehensiveResponse(
                vehicle_info=None,
                insurance_details=None,
                recent_service=None,
                document_count=0
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to get comprehensive vehicle information: {str(e)}"
            )