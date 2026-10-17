# delivery_panel/vehicle/delivery_vehicle_service.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from repositories.delivery_panel.delivery_vehicle_repository import DeliveryVehicleRepository
from schemas.delivery_panel.delivery_vehicle_schema import (
    VehicleBasicInfo, VehicleDetailsResponse, VehicleDocument,
    VehicleDocumentsResponse, InsuranceDetails, InsuranceResponse,
    ServiceRecord, ServiceHistoryResponse, VehicleComprehensiveResponse,
    NoVehicleResponse, VehicleSuccessResponse
)

class DeliveryVehicleService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = DeliveryVehicleRepository()
    
    def get_vehicle_info(self, delivery_person_id: int) -> VehicleDetailsResponse:
        """Get basic vehicle information - returns None if no vehicle"""
        vehicle_data = self.repository.get_vehicle_by_delivery_person_id(
            self.db, delivery_person_id
        )
        
        if not vehicle_data:
            raise ValueError("No vehicle information found for this delivery person")
        
        # Extract from raw vehicle_info
        vehicle_info_raw = vehicle_data.get("vehicle_info_raw", {})
        
        # Create VehicleBasicInfo with available data
        vehicle_info = VehicleBasicInfo(
            vehicle_id=vehicle_data["vehicle_id"],
            vehicle_type=vehicle_data.get("vehicle_type") or vehicle_info_raw.get("type", "Unknown"),
            brand="",  # Not in model
            model="",  # Not in model
            year=None,  # Not in model
            color=None,  # Not in model
            registration_number=vehicle_data.get("registration_number") or vehicle_info_raw.get("number", ""),
            status=vehicle_data["status"],
            current_mileage=None,  # Not in model
            average_fuel_efficiency=None,  # Not in model
            next_service_km=None  # Not in model
        )
        
        return VehicleDetailsResponse(
            vehicle_info=vehicle_info,
            last_updated=vehicle_data.get("last_updated")
        )
    
    def get_vehicle_documents(self, delivery_person_id: int) -> VehicleDocumentsResponse:
        """Get all vehicle documents - returns empty if none"""
        documents_data = self.repository.get_vehicle_documents(
            self.db, delivery_person_id
        )
        
        # Process documents
        processed_documents = []
        verified_count = 0
        
        for doc_data in documents_data:
            # Count verified
            if doc_data.get("status") == "VERIFIED":
                verified_count += 1
            
            # Create document schema
            document = VehicleDocument(**doc_data)
            processed_documents.append(document)
        
        return VehicleDocumentsResponse(
            documents=processed_documents,
            total_documents=len(processed_documents),
            verified_count=verified_count,
            pending_count=len(processed_documents) - verified_count
        )
    
    def get_insurance_details(self, delivery_person_id: int) -> InsuranceResponse:
        """Get insurance details - returns empty if none"""
        insurance_data = self.repository.get_insurance_details(
            self.db, delivery_person_id
        )
        
        if not insurance_data:
            # Return empty response instead of raising error
            return InsuranceResponse(
                insurance_details=None,
                days_until_expiry=None,
                is_active=False
            )
        
        # Create insurance details with available data
        insurance_details = InsuranceDetails(
            insurance_id=insurance_data["insurance_id"],
            provider_name=insurance_data["provider_name"],
            policy_number_masked="•••• •••• ••••",  # Masked since not in model
            coverage_type=insurance_data["coverage_type"],
            amount_covered=None,  # Not in model
            premium_amount=None,  # Not in model
            status=insurance_data["status"],
            start_date=insurance_data["start_date"],
            expiry_date=insurance_data["expiry_date"],
            renewal_date=None,  # Not in model
            agent_contact=None,  # Not in model
            agent_email=None  # Not in model
        )
        
        return InsuranceResponse(
            insurance_details=insurance_details,
            days_until_expiry=insurance_data.get("days_until_expiry"),
            is_active=insurance_data.get("is_active", False)
        )
    
    def get_service_history(self, delivery_person_id: int) -> ServiceHistoryResponse:
        """Get service history - always returns empty (not in model)"""
        # Service history is not stored in current models
        return ServiceHistoryResponse(
            service_records=[],
            total_services=0,
            last_service_date=None,
            next_service_date=None,
            total_service_cost=None
        )
    
    def get_comprehensive_info(self, delivery_person_id: int) -> VehicleComprehensiveResponse:
        """Get comprehensive vehicle information"""
        comprehensive_data = self.repository.get_comprehensive_vehicle_info(
            self.db, delivery_person_id
        )
        
        if not comprehensive_data or not comprehensive_data.get("has_vehicle"):
            raise ValueError("No vehicle information found")
        
        vehicle_data = comprehensive_data["vehicle_info"]
        vehicle_info_raw = vehicle_data.get("vehicle_info_raw", {})
        
        # Create vehicle info
        vehicle_info = VehicleBasicInfo(
            vehicle_id=vehicle_data["vehicle_id"],
            vehicle_type=vehicle_data.get("vehicle_type") or vehicle_info_raw.get("type", "Unknown"),
            brand="",  # Not in model
            model="",  # Not in model
            year=None,  # Not in model
            color=None,  # Not in model
            registration_number=vehicle_data.get("registration_number") or vehicle_info_raw.get("number", ""),
            status=vehicle_data["status"],
            current_mileage=None,  # Not in model
            average_fuel_efficiency=None,  # Not in model
            next_service_km=None  # Not in model
        )
        
        # Process insurance details if available
        insurance_data = comprehensive_data.get("insurance_details")
        insurance_details = None
        if insurance_data:
            insurance_details = InsuranceDetails(
                insurance_id=insurance_data["insurance_id"],
                provider_name=insurance_data["provider_name"],
                policy_number_masked="•••• •••• ••••",
                coverage_type=insurance_data["coverage_type"],
                amount_covered=None,
                premium_amount=None,
                status=insurance_data["status"],
                start_date=insurance_data["start_date"],
                expiry_date=insurance_data["expiry_date"],
                renewal_date=None,
                agent_contact=None,
                agent_email=None
            )
        
        return VehicleComprehensiveResponse(
            vehicle_info=vehicle_info,
            insurance_details=insurance_details,
            recent_service=None,  # Not in model
            document_count=comprehensive_data.get("documents_count", 0)
        )