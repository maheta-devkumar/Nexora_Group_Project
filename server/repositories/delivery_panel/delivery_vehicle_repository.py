# delivery_panel/vehicle/delivery_vehicle_repository.py
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json

# Import models
from models.delivery.delivery_person import DeliveryPerson

class DeliveryVehicleRepository:
    
    @staticmethod
    def get_vehicle_by_delivery_person_id(
        db: Session, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get vehicle information from delivery_person's vehicle_info JSON field
        Returns None if no vehicle_info exists
        """
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.vehicle_info:
            return None
        
        vehicle_info = delivery_person.vehicle_info
        
        # Parse insurance date from string if exists
        insurance_date = None
        if vehicle_info.get("insurance"):
            try:
                insurance_date = datetime.strptime(vehicle_info["insurance"], "%Y-%m-%d").date()
            except:
                pass
        
        return {
            "vehicle_id": delivery_person.delivery_person_id,
            "vehicle_type": vehicle_info.get("type"),
            "registration_number": vehicle_info.get("number"),
            "insurance_valid_until": insurance_date,
            "vehicle_info_raw": vehicle_info,  # Keep raw for other fields
            "status": "ACTIVE" if delivery_person.is_online else "INACTIVE",
            "last_updated": delivery_person.joined_at
        }
    
    @staticmethod
    def get_vehicle_documents(
        db: Session, 
        delivery_person_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get vehicle documents from delivery_person's documents JSON field
        Returns empty list if no documents exist
        """
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.documents:
            return []
        
        documents_data = delivery_person.documents
        documents = []
        doc_id = 1
        
        # Aadhaar Card
        if documents_data.get("aadhaar"):
            documents.append({
                "document_id": doc_id,
                "document_type": "AADHAAR",
                "document_name": "Aadhaar Card",
                "document_number": "•••• •••• ••••",  # Masked
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["aadhaar"]
            })
            doc_id += 1
        
        # Driving License
        if documents_data.get("license"):
            documents.append({
                "document_id": doc_id,
                "document_type": "DRIVING_LICENSE",
                "document_name": "Driving License",
                "document_number": "•••• •••• ••••",  # Masked
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["license"]
            })
            doc_id += 1
        
        # PAN Card
        if documents_data.get("pan"):
            documents.append({
                "document_id": doc_id,
                "document_type": "PAN",
                "document_name": "PAN Card",
                "document_number": "•••• •••• •••",  # Masked
                "status": "VERIFIED",
                "verified_at": delivery_person.joined_at,
                "uploaded_at": delivery_person.joined_at,
                "download_url": documents_data["pan"]
            })
            doc_id += 1
        
        # Insurance document (from vehicle_info)
        vehicle_info = delivery_person.vehicle_info or {}
        if vehicle_info.get("insurance"):
            try:
                expiry_date = datetime.strptime(vehicle_info["insurance"], "%Y-%m-%d").date()
                current_date = date.today()
                status = "VERIFIED" if expiry_date >= current_date else "EXPIRED"
                
                documents.append({
                    "document_id": doc_id,
                    "document_type": "INSURANCE",
                    "document_name": "Insurance Document",
                    "document_number": "•••• •••• ••••",  # Masked
                    "status": status,
                    "expiry_date": expiry_date,
                    "verified_at": delivery_person.joined_at,
                    "uploaded_at": delivery_person.joined_at,
                    "download_url": None  # Not in documents JSON
                })
                doc_id += 1
            except:
                pass
        
        return documents
    
    @staticmethod
    def get_insurance_details(
        db: Session, 
        delivery_person_id: int
    ) -> Optional[Dict[str, Any]]:
        """
        Get insurance details from vehicle_info JSON field
        Returns None if no insurance info exists
        """
        delivery_person = db.query(DeliveryPerson).filter(
            DeliveryPerson.delivery_person_id == delivery_person_id
        ).first()
        
        if not delivery_person or not delivery_person.vehicle_info:
            return None
        
        vehicle_info = delivery_person.vehicle_info
        
        # Check if insurance field exists
        if not vehicle_info.get("insurance"):
            return None
        
        try:
            # Parse insurance date
            expiry_date = datetime.strptime(vehicle_info["insurance"], "%Y-%m-%d").date()
            current_date = date.today()
            days_until_expiry = (expiry_date - current_date).days
            
            # Default start date (1 year before expiry)
            start_date = date(expiry_date.year - 1, expiry_date.month, expiry_date.day)
            
            return {
                "insurance_id": 1,
                "provider_name": "Insurance Provider",  # Not in model, would need separate field
                "policy_number_masked": "",
                "policy_number_full": "",  # Not in model
                "coverage_type": "Vehicle Insurance",
                "status": "ACTIVE" if days_until_expiry > 0 else "EXPIRED",
                "start_date": start_date,
                "expiry_date": expiry_date,
                "days_until_expiry": days_until_expiry,
                "is_active": days_until_expiry > 0
            }
        except:
            return None
    
    @staticmethod
    def get_service_history(
        db: Session, 
        delivery_person_id: int
    ) -> List[Dict[str, Any]]:
        """
        Get service history
        Returns empty list since service_history is not in the model
        """
        # Service history is not stored in the current models
        # This would require a separate service_history table
        return []
    
    @staticmethod
    def get_comprehensive_vehicle_info(
        db: Session, 
        delivery_person_id: int
    ) -> Dict[str, Any]:
        """
        Get all vehicle information in one call
        """
        vehicle_info = DeliveryVehicleRepository.get_vehicle_by_delivery_person_id(db, delivery_person_id)
        documents = DeliveryVehicleRepository.get_vehicle_documents(db, delivery_person_id)
        insurance = DeliveryVehicleRepository.get_insurance_details(db, delivery_person_id)
        
        return {
            "vehicle_info": vehicle_info,
            "documents_count": len(documents),
            "insurance_details": insurance,
            "has_vehicle": vehicle_info is not None
        }