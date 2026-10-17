from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.company_repository import CompanyRepository
from repositories.address_repository import AddressRepository
from schemas.inventory_schema import CompanyCreate, CompanyUpdate
from typing import List, Dict, Any
from datetime import datetime
from utils.send_email import EmailService  # Import email service

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class CompanyService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = CompanyRepository()
        self.address_repo = AddressRepository()
        self.email_service = EmailService(db_session=db)  # Initialize email service
        # ADD NOTIFICATION REPOSITORY
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def create_company(self, company_data: CompanyCreate) -> Dict[str, Any]:
        """Create a new company"""
        # Check if company with same name exists
        existing_company = self.repository.get_company_by_name(self.db, company_data.name)
        if existing_company:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Company with this name already exists"
            )
        
        # Check if area exists
        area = self.address_repo.get_area_by_id(self.db, company_data.area_id)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Area not found"
            )
        
        # Get area details for email
        area_name = area.area_name if area else "Unknown Area"
        city_name = area.city.city_name if area and area.city else "Unknown City"
        state_name = area.city.state.state_name if area and area.city and area.city.state else "Unknown State"
        pincode = area.pincode if area else "Unknown"
        
        company = self.repository.create_company(self.db, company_data.model_dump())
        self.db.refresh(company)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR COMPANY CREATION
        # ============================================
        try:
            # Prepare company details
            full_address = f"{company.address_line}, {area_name}, {city_name}, {state_name} - {pincode}"
            
            # 1. Send email to all admins (a)
            admin_subject = f"🏢 New Company Added - {company.name}"
            admin_message = f"""
NEW COMPANY REGISTRATION

Company Details:
- Company ID: {company.company_id}
- Company Name: {company.name}
- GST Number: {company.gst_number if company.gst_number else 'Not provided'}
- Contact Email: {company.contact_email if company.contact_email else 'Not provided'}
- Contact Phone: {company.contact_phone if company.contact_phone else 'Not provided'}
- Website: {company.website if company.website else 'Not provided'}

Address:
{full_address}

Registration Details:
- Created At: {company.created_at.strftime('%Y-%m-%d %H:%M:%S') if company.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Area: {area_name}
- City: {city_name}
- State: {state_name}
- Pincode: {pincode}

The company has been successfully registered in the system and can now be used for purchases and inventory management.

Best regards,
Company Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send welcome email to company contact email if provided (bonus feature)
            if company.contact_email:
                company_subject = f"Welcome to Our Partner Network - {company.name}"
                company_message = f"""
Dear {company.name} Team,

Welcome to our partner network! Your company has been successfully registered in our system.

Your Company Details:
- Company ID: {company.company_id}
- Company Name: {company.name}
- GST Number: {company.gst_number if company.gst_number else 'Not provided'}
- Contact Email: {company.contact_email}
- Contact Phone: {company.contact_phone if company.contact_phone else 'Not provided'}
- Website: {company.website if company.website else 'Not provided'}

Registered Address:
{full_address}

You can now:
1. Be listed as a supplier in our purchase orders
2. Receive notifications for relevant business opportunities
3. Access partner portal features (if applicable)

If you have any questions or need to update your information, please contact our support team.

Best regards,
Partner Relations Team
"""
                # Send to company contact email (using send_to_email_list for single email)
                self.email_service.send_to_email_list(
                    [company.contact_email], 
                    company_subject, 
                    company_message
                )
            
            
        except Exception as email_error:
            # Don't fail company creation if email fails
            print(f"⚠️ Email sending failed but company was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR COMPANY CREATION
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_company_creation_notifications(company, area_name, city_name, state_name)
            
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but company was created: {notif_error}")
        
        return self._serialize_company(company)
    
    def get_company(self, company_id: int) -> Dict[str, Any]:
        """Get company by ID"""
        company = self.repository.get_company_by_id(self.db, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        return self._serialize_company(company)
    
    def get_all_companies(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all companies"""
        companies = self.repository.get_all_companies(self.db, skip, limit)
        return [self._serialize_company(company) for company in companies]
    
    def get_all_areas(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all areas"""
        areas = self.repository.get_all_area(self.db, skip, limit)
        return [self._serialize_area(area) for area in areas]
    
    def update_company(self, company_id: int, company_data: CompanyUpdate) -> Dict[str, Any]:
        """Update company"""
        company = self.repository.get_company_by_id(self.db, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # If area_id is being updated, check if new area exists
        if company_data.area_id is not None:
            area = self.address_repo.get_area_by_id(self.db, company_data.area_id)
            if not area:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Area not found"
                )
        
        # Update fields
        update_data = company_data.model_dump(exclude_unset=True)
        updated_company = self.repository.update_company(self.db, company_id, update_data)
        if not updated_company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Send email update notification
        self._send_company_update_notification(company_id, update_data, company.name)
        
        # Send database notification for company update
        self._send_company_update_notifications(company, update_data)
        
        return self._serialize_company(updated_company)
    
    def delete_company(self, company_id: int) -> Dict[str, str]:
        """Delete company"""
        # Get company details before deletion for email
        company = self.repository.get_company_by_id(self.db, company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # Get area details for email
        area = self.address_repo.get_area_by_id(self.db, company.area_id) if company.area_id else None
        area_name = area.area_name if area else "Unknown Area"
        city_name = area.city.city_name if area and area.city else "Unknown City"
        state_name = area.city.state.state_name if area and area.city and area.city.state else "Unknown State"
        
        # Store company details for notifications before deletion
        company_name = company.name
        company_details = {
            "company_id": company.company_id,
            "name": company.name,
            "gst_number": company.gst_number,
            "contact_email": company.contact_email,
            "contact_phone": company.contact_phone,
            "area_name": area_name,
            "city_name": city_name,
            "state_name": state_name
        }
        
        # Delete company
        success = self.repository.delete_company(self.db, company_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR COMPANY DELETION
        # ============================================
        try:
            # Prepare company details
            full_address = f"{company.address_line}, {area_name}, {city_name}, {state_name}"
            
            # 1. Send email to all admins (a)
            admin_subject = f"🗑️ Company Deleted - {company.name}"
            admin_message = f"""
COMPANY DELETION NOTIFICATION

Deleted Company Details:
- Company ID: {company.company_id}
- Company Name: {company.name}
- GST Number: {company.gst_number if company.gst_number else 'Not provided'}
- Contact Email: {company.contact_email if company.contact_email else 'Not provided'}
- Contact Phone: {company.contact_phone if company.contact_phone else 'Not provided'}
- Website: {company.website if company.website else 'Not provided'}

Address:
{full_address}

Deletion Details:
- Deleted At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Area: {area_name}
- City: {city_name}
- State: {state_name}

IMPORTANT: All company records have been permanently deleted from the system.
This company will no longer appear in purchase orders or inventory records.

Best regards,
Company Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send notification to company contact email if provided (bonus feature)
            if company.contact_email:
                company_subject = f"Company Registration Removed - {company.name}"
                company_message = f"""
Dear {company.name} Team,

This is to inform you that your company registration has been removed from our system.

Your company details have been permanently deleted from our records.

Company Details (for your reference):
- Company Name: {company.name}
- GST Number: {company.gst_number if company.gst_number else 'Not provided'}
- Contact Email: {company.contact_email}
- Contact Phone: {company.contact_phone if company.contact_phone else 'Not provided'}
- Website: {company.website if company.website else 'Not provided'}

Registered Address:
{full_address}

Deleted At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

If this was a mistake or you wish to re-register, please contact our support team.

Best regards,
Partner Relations Team
"""
                # Send to company contact email
                self.email_service.send_to_email_list(
                    [company.contact_email], 
                    company_subject, 
                    company_message
                )
            
            
        except Exception as email_error:
            # Don't fail deletion if email fails
            print(f"⚠️ Email sending failed but company was deleted: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR COMPANY DELETION
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_company_deletion_notifications(company_details)
            
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but company was deleted: {notif_error}")
        
        return {"message": "Company deleted successfully"}
    
    def _serialize_company(self, company) -> Dict[str, Any]:
        """Serialize company data"""
        # Try to get area details if available
        area_data = None
        if hasattr(company, 'area') and company.area:
            area_data = self._serialize_area(company.area)
        elif company.area_id:
            # Fetch area if not already loaded
            area = self.address_repo.get_area_by_id(self.db, company.area_id)
            if area:
                area_data = self._serialize_area(area)
        
        return {
            "company_id": company.company_id,
            "name": company.name,
            "gst_number": company.gst_number,
            "address_line": company.address_line,
            "area_id": company.area_id,
            "area": area_data,  # Include area details
            "contact_email": company.contact_email,
            "contact_phone": company.contact_phone,
            "website": company.website,
            "created_at": company.created_at,
            "updated_at": company.updated_at
        }
    
    def _serialize_area(self, area) -> Dict[str, Any]:
        """Serialize area data"""
        return {
            "area_id": area.area_id,
            "name": area.area_name,
            "city": area.city.city_name if area.city else None,
            "state": area.city.state.state_name if area.city and area.city.state else None,
            "country": "India",  # Default
            "pincode": area.pincode
        }
    
    def _send_company_update_notification(self, company_id: int, update_data: Dict[str, Any], company_name: str):
        """Send email notification when company is updated"""
        try:
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Prepare update summary
            update_summary = "\n".join([
                f"- {field}: Updated"
                for field in updated_fields
                if field not in ['created_at', 'updated_at']
            ])
            
            if not update_summary.strip():
                return
            
            admin_subject = f"✏️ Company Updated - {company_name}"
            admin_message = f"""
COMPANY UPDATE NOTIFICATION

Company Details:
- Company Name: {company_name}
- Company ID: {company_id}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Updated Fields:
{update_summary}

The company information has been successfully updated.

Best regards,
Company Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
        except Exception as e:
            print(f"⚠️ Failed to send company update email: {e}")
    
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_company_creation_notifications(self, company, area_name: str, city_name: str, state_name: str):
        """Send database notifications when company is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🏢 New Company Registered",
                    message=f"New company '{company.name}' has been registered. GST: {company.gst_number if company.gst_number else 'N/A'}. Location: {area_name}, {city_name}, {state_name}.",
                    type="COMPANY",
                    reference_id=company.company_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send company creation notifications: {e}")
    
    def _send_company_update_notifications(self, company, update_data: Dict[str, Any]):
        """Send database notifications when company is updated"""
        try:
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Filter out system fields
            significant_fields = [f for f in updated_fields if f not in ['created_at', 'updated_at']]
            if not significant_fields:
                return
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="✏️ Company Updated",
                    message=f"Company '{company.name}' has been updated. Updated fields: {', '.join(significant_fields)}.",
                    type="COMPANY",
                    reference_id=company.company_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send company update notifications: {e}")
    
    def _send_company_deletion_notifications(self, company_details: Dict[str, Any]):
        """Send database notifications when company is deleted"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🗑️ Company Deleted",
                    message=f"Company '{company_details['name']}' has been permanently deleted. Company ID: {company_details['company_id']}. Location: {company_details['area_name']}, {company_details['city_name']}.",
                    type="COMPANY",
                    reference_id=company_details['company_id']
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send company deletion notifications: {e}")