# services/inventory/supplier_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from repositories.inventory.supplier_repository import SupplierRepository
from repositories.inventory.company_repository import CompanyRepository
from repositories.address_repository import AddressRepository
from schemas.inventory_schema import SupplierCreate, SupplierUpdate
from typing import List, Dict, Any
from datetime import datetime
from utils.send_email import EmailService

from services.notification_service import NotificationService
from repositories.user_repository import UserRepository


class SupplierService:
    
    def __init__(self, db: Session):
        self.db = db
        self.repository = SupplierRepository()
        self.company_repo = CompanyRepository()
        self.address_repo = AddressRepository()
        self.email_service = EmailService(db_session=db)
        self.notification_service = NotificationService(db)
        self.user_repo = UserRepository()
    
    def create_supplier(self, supplier_data: SupplierCreate) -> Dict[str, Any]:
        """Create a new supplier"""
        # Check if company exists (only if company_id is provided)
        if supplier_data.company_id is not None:
            company = self.company_repo.get_company_by_id(self.db, supplier_data.company_id)
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
        
        # Check if area exists
        area = self.address_repo.get_area_by_id(self.db, supplier_data.area_id)
        if not area:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Area not found"
            )
        
        # Check if supplier with same name exists for this company
        if supplier_data.company_id is not None:
            existing_supplier = self.repository.get_supplier_by_name_and_company(
                self.db, supplier_data.name, supplier_data.company_id
            )
            if existing_supplier:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Supplier with this name already exists for this company"
                )
        
        # Get company and area details for email
        company_name = company.name if company else "Independent Supplier"
        area_name = area.area_name if area else "Unknown Area"
        city_name = area.city.city_name if area and area.city else "Unknown City"
        state_name = area.city.state.state_name if area and area.city and area.city.state else "Unknown State"
        
        supplier = self.repository.create_supplier(self.db, supplier_data.model_dump())
        self.db.refresh(supplier)
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR SUPPLIER CREATION
        # ============================================
        try:
            # Prepare supplier details
            full_address = f"{supplier.address_line}, {area_name}, {city_name}, {state_name}"
            
            # 1. Send email to all admins
            admin_subject = f"🏭 New Supplier Added - {supplier.name}"
            admin_message = f"""
NEW SUPPLIER REGISTRATION

Supplier Details:
- Supplier ID: {supplier.supplier_id}
- Supplier Name: {supplier.name}
- Company: {company_name} (ID: {supplier.company_id if supplier.company_id else 'N/A'})
- Email: {supplier.email if supplier.email else 'Not provided'}
- Phone: {supplier.phone if supplier.phone else 'Not provided'}
- GST Number: {supplier.gst_number if supplier.gst_number else 'Not provided'}
- Status: {'Active' if supplier.is_active else 'Inactive'}
- Address: {full_address}

Registration Details:
- Created At: {supplier.created_at.strftime('%Y-%m-%d %H:%M:%S') if supplier.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Company: {company_name}
- Location: {area_name}, {city_name}, {state_name}

Supplier can now be used for:
1. Creating purchase orders
2. Inventory procurement
3. Vendor management

Best regards,
Vendor Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send welcome email to supplier if email is provided
            if supplier.email:
                supplier_subject = f"Welcome as Our Supplier - {supplier.name}"
                supplier_message = f"""
Dear {supplier.name} Team,

Welcome to our supplier network! Your company has been registered as a supplier in our system.

Your Supplier Details:
- Supplier ID: {supplier.supplier_id}
- Supplier Name: {supplier.name}
- Company: {company_name}
- Email: {supplier.email}
- Phone: {supplier.phone if supplier.phone else 'Not provided'}
- GST Number: {supplier.gst_number if supplier.gst_number else 'Not provided'}
- Address: {full_address}

Registered At: {supplier.created_at.strftime('%Y-%m-%d %H:%M:%S') if supplier.created_at else datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

As a registered supplier, you can:
1. Receive purchase orders from our company
2. Be considered for procurement opportunities
3. Receive timely payments as per agreed terms

If you have any questions or need to update your information, please contact our procurement team.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([supplier.email], supplier_subject, supplier_message)
            
            
        except Exception as email_error:
            print(f"⚠️ Email sending failed but supplier was created: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS
        # ============================================
        try:
            self._send_supplier_creation_notifications(supplier, company_name, area_name, city_name, state_name)
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but supplier was created: {notif_error}")
        
        return self._serialize_supplier(supplier)
    
    def get_supplier(self, supplier_id: int) -> Dict[str, Any]:
        """Get supplier by ID"""
        supplier = self.repository.get_supplier_by_id(self.db, supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        return self._serialize_supplier(supplier)
    
    def get_all_suppliers(self, skip: int = 0, limit: int = 100) -> List[Dict[str, Any]]:
        """Get all suppliers"""
        suppliers = self.repository.get_all_suppliers(self.db, skip, limit)
        return [self._serialize_supplier(supplier) for supplier in suppliers]
    
    def update_supplier(self, supplier_id: int, supplier_data: SupplierUpdate) -> Dict[str, Any]:
        """Update supplier"""
        supplier = self.repository.get_supplier_by_id(self.db, supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        # If company_id is being updated, check if new company exists
        if supplier_data.company_id is not None:
            company = self.company_repo.get_company_by_id(self.db, supplier_data.company_id)
            if not company:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Company not found"
                )
        
        # If area_id is being updated, check if new area exists
        if supplier_data.area_id is not None:
            area = self.address_repo.get_area_by_id(self.db, supplier_data.area_id)
            if not area:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Area not found"
                )
        
        # Update fields
        update_data = supplier_data.model_dump(exclude_unset=True)
        updated_supplier = self.repository.update_supplier(self.db, supplier_id, update_data)
        if not updated_supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        # Refresh to get relationships
        updated_supplier = self.repository.get_supplier_by_id(self.db, supplier_id)
        
        # Send email update notification
        self._send_supplier_update_notification(supplier_id, update_data, supplier.name)
        
        # Send database notification for supplier update
        self._send_supplier_update_notifications(supplier, update_data)
        
        return self._serialize_supplier(updated_supplier)
    
    def delete_supplier(self, supplier_id: int) -> Dict[str, str]:
        """Delete supplier"""
        # Get supplier details before deletion for email
        supplier = self.repository.get_supplier_by_id(self.db, supplier_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        # Get company and area details for email
        company = None
        if supplier.company_id:
            company = self.company_repo.get_company_by_id(self.db, supplier.company_id)
        company_name = company.name if company else "Independent Supplier"
        
        area = None
        if supplier.area_id:
            area = self.address_repo.get_area_by_id(self.db, supplier.area_id)
        area_name = area.area_name if area else "Unknown Area"
        city_name = area.city.city_name if area and area.city else "Unknown City"
        state_name = area.city.state.state_name if area and area.city and area.city.state else "Unknown State"
        
        # Store supplier details for notifications before deletion
        supplier_name = supplier.name
        supplier_details = {
            "supplier_id": supplier.supplier_id,
            "name": supplier.name,
            "email": supplier.email,
            "phone": supplier.phone,
            "gst_number": supplier.gst_number,
            "company_name": company_name,
            "area_name": area_name,
            "city_name": city_name,
            "state_name": state_name,
            "total_purchases": supplier.total_purchases if hasattr(supplier, 'total_purchases') else 0,
            "last_purchase_date": supplier.last_purchase_date if hasattr(supplier, 'last_purchase_date') else None
        }
        
        # Delete supplier
        success = self.repository.delete_supplier(self.db, supplier_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found"
            )
        
        # ============================================
        # SEND EMAIL NOTIFICATIONS FOR SUPPLIER DELETION
        # ============================================
        try:
            # Prepare supplier details
            full_address = f"{supplier.address_line}, {area_name}, {city_name}, {state_name}"
            
            # 1. Send email to all admins
            admin_subject = f"🗑️ Supplier Deleted - {supplier.name}"
            admin_message = f"""
SUPPLIER DELETION NOTIFICATION

Deleted Supplier Details:
- Supplier ID: {supplier.supplier_id}
- Supplier Name: {supplier.name}
- Company: {company_name}
- Email: {supplier.email if supplier.email else 'Not provided'}
- Phone: {supplier.phone if supplier.phone else 'Not provided'}
- GST Number: {supplier.gst_number if supplier.gst_number else 'Not provided'}
- Total Purchases: {supplier.total_purchases if hasattr(supplier, 'total_purchases') else 0}
- Last Purchase: {supplier.last_purchase_date.strftime('%Y-%m-%d') if hasattr(supplier, 'last_purchase_date') and supplier.last_purchase_date else 'Never'}
- Address: {full_address}

Deletion Details:
- Deleted At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Company: {company_name}
- Location: {area_name}, {city_name}, {state_name}

IMPORTANT: 
- Supplier records have been permanently deleted
- This supplier will no longer appear in purchase orders
- Historical purchase data may still reference this supplier ID

Best regards,
Vendor Management System
"""
            admin_results = self.email_service.send_to_all_admins(admin_subject, admin_message)
            
            # 2. Send notification to supplier if email is provided
            if supplier.email:
                supplier_subject = f"Supplier Registration Removed - {supplier.name}"
                supplier_message = f"""
Dear {supplier.name} Team,

This is to inform you that your supplier registration has been removed from our system.

Your supplier details have been permanently deleted from our records.

Supplier Details (for your reference):
- Supplier Name: {supplier.name}
- Company: {company_name}
- Email: {supplier.email}
- Phone: {supplier.phone if supplier.phone else 'Not provided'}
- GST Number: {supplier.gst_number if supplier.gst_number else 'Not provided'}
- Address: {full_address}

Total Purchases with us: {supplier.total_purchases if hasattr(supplier, 'total_purchases') else 0}
Last Purchase Date: {supplier.last_purchase_date.strftime('%Y-%m-%d') if hasattr(supplier, 'last_purchase_date') and supplier.last_purchase_date else 'Never'}

Deleted At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

If this was a mistake or you wish to re-register, please contact our procurement team.

Best regards,
Procurement Team
"""
                self.email_service.send_to_email_list([supplier.email], supplier_subject, supplier_message)
            
            
        except Exception as email_error:
            print(f"⚠️ Email sending failed but supplier was deleted: {email_error}")
        
        # ============================================
        # SEND DATABASE NOTIFICATIONS FOR SUPPLIER DELETION
        # ============================================
        try:
            # Send notifications to all admin users
            self._send_supplier_deletion_notifications(supplier_details)
            
        except Exception as notif_error:
            print(f"⚠️ Database notification failed but supplier was deleted: {notif_error}")
        
        return {"message": "Supplier deleted successfully"}
    
    def _send_supplier_update_notification(self, supplier_id: int, update_data: Dict[str, Any], supplier_name: str):
        """Send email notification when supplier is updated"""
        try:
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Prepare update summary
            update_summary = "\n".join([
                f"- {field}: Updated"
                for field in updated_fields
                if field not in ['created_at', 'updated_at', 'last_purchase_date']
            ])
            
            if not update_summary.strip():
                return
            
            admin_subject = f"✏️ Supplier Updated - {supplier_name}"
            admin_message = f"""
SUPPLIER UPDATE NOTIFICATION

Supplier Details:
- Supplier Name: {supplier_name}
- Supplier ID: {supplier_id}
- Updated At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Updated Fields:
{update_summary}

The supplier information has been successfully updated.

Best regards,
Vendor Management System
"""
            self.email_service.send_to_all_admins(admin_subject, admin_message)
            
        except Exception as e:
            print(f"⚠️ Failed to send supplier update email: {e}")
    
    # services/inventory/supplier_service.py - Update _serialize_supplier method

    def _serialize_supplier(self, supplier) -> Dict[str, Any]:
        """Serialize supplier data with company and area details"""
        # Serialize company data
        company_data = None
        if supplier.company and hasattr(supplier.company, 'company_id'):
            # Check if area relationship is loaded for company
            company_area = None
            if hasattr(supplier.company, 'area') and supplier.company.area:
                company_area = {
                    "area_id": supplier.company.area.area_id,
                    "name": supplier.company.area.area_name,
                    "city": supplier.company.area.city.city_name if supplier.company.area.city else None,
                    "state": supplier.company.area.city.state.state_name if supplier.company.area.city and supplier.company.area.city.state else None,
                    "pincode": supplier.company.area.pincode
                }
            
            company_data = {
                "company_id": supplier.company.company_id,
                "name": supplier.company.name,
                "gst_number": supplier.company.gst_number,
                "address_line": supplier.company.address_line,
                "area_id": supplier.company.area_id,
                "contact_email": supplier.company.contact_email,
                "contact_phone": supplier.company.contact_phone,
                "website": supplier.company.website,
                "created_at": supplier.company.created_at,
                "updated_at": supplier.company.updated_at,
                "area": company_area  # Include area if available
            }
        
        # Serialize area data
        area_data = None
        if supplier.area and hasattr(supplier.area, 'area_id'):
            area_data = {
                "area_id": supplier.area.area_id,
                "name": supplier.area.area_name,
                "city": supplier.area.city.city_name if supplier.area.city else None,
                "state": supplier.area.city.state.state_name if supplier.area.city and supplier.area.city.state else None,
                "pincode": supplier.area.pincode
            }
        
        return {
            "supplier_id": supplier.supplier_id,
            "company_id": supplier.company_id,
            "name": supplier.name,
            "email": supplier.email,
            "phone": supplier.phone,
            "address_line": supplier.address_line,
            "area_id": supplier.area_id,
            "gst_number": supplier.gst_number,
            "is_active": supplier.is_active,
            "total_purchases": float(supplier.total_purchases) if supplier.total_purchases else 0.0,
            "last_purchase_date": supplier.last_purchase_date,
            "created_at": supplier.created_at,
            "updated_at": supplier.updated_at,
            "company": company_data,
            "area": area_data
        }
    # ===== NOTIFICATION HELPER METHODS =====
    
    def _send_supplier_creation_notifications(self, supplier, company_name: str, area_name: str, city_name: str, state_name: str):
        """Send database notifications when supplier is created"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🏭 New Supplier Added",
                    message=f"New supplier '{supplier.name}' has been added under company '{company_name}'. GST: {supplier.gst_number if supplier.gst_number else 'N/A'}. Location: {area_name}, {city_name}.",
                    type="SUPPLIER",
                    reference_id=supplier.supplier_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send supplier creation notifications: {e}")
    
    def _send_supplier_update_notifications(self, supplier, update_data: Dict[str, Any]):
        """Send database notifications when supplier is updated"""
        try:
            # Check what fields were updated
            updated_fields = list(update_data.keys())
            if not updated_fields:
                return
            
            # Filter out system fields
            significant_fields = [f for f in updated_fields if f not in ['created_at', 'updated_at', 'last_purchase_date']]
            if not significant_fields:
                return
            
            # Check if status was changed
            status_changed = 'is_active' in significant_fields
            
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Create notifications for all admins
            for admin in admin_users:
                if status_changed:
                    new_status = "active" if supplier.is_active else "inactive"
                    message = f"Supplier '{supplier.name}' status changed to {new_status}. Other updated fields: {', '.join([f for f in significant_fields if f != 'is_active'])}."
                else:
                    message = f"Supplier '{supplier.name}' has been updated. Updated fields: {', '.join(significant_fields)}."
                
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="✏️ Supplier Updated",
                    message=message,
                    type="SUPPLIER",
                    reference_id=supplier.supplier_id
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send supplier update notifications: {e}")
    
    def _send_supplier_deletion_notifications(self, supplier_details: Dict[str, Any]):
        """Send database notifications when supplier is deleted"""
        try:
            # Get all admin users
            admin_users = self.user_repo.get_admin_users(self.db)
            
            # Format last purchase date
            last_purchase = supplier_details['last_purchase_date']
            last_purchase_str = last_purchase.strftime('%Y-%m-%d') if last_purchase else "Never"
            
            # Create notifications for all admins
            for admin in admin_users:
                self.notification_service.send_notification(
                    user_id=admin.user_id,
                    title="🗑️ Supplier Deleted",
                    message=f"Supplier '{supplier_details['name']}' has been permanently deleted. Company: {supplier_details['company_name']}. Total purchases: {supplier_details['total_purchases']}. Last purchase: {last_purchase_str}.",
                    type="SUPPLIER",
                    reference_id=supplier_details['supplier_id']
                )
                
                
        except Exception as e:
            print(f"⚠️ Failed to send supplier deletion notifications: {e}")