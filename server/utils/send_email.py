# utils/send_email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Union
import os
import logging
from sqlalchemy.orm import Session

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

# E-commerce Configuration
COMPANY_NAME = os.getenv("COMPANY_NAME", "Nexora")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "makwanapradip1412@gmail.com")

class EmailService:
    """Email service for sending emails to users"""
    
    def __init__(self, db_session: Optional[Session] = None):
        """
        Initialize email service
        
        Args:
            db_session: Optional database session for fetching user emails
        """
        self.db = db_session
        self._validate_smtp_config()
    
    def _validate_smtp_config(self):
        """Validate SMTP configuration"""
        if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
            logger.error("SMTP configuration missing")
            raise RuntimeError(
                "SMTP configuration missing. Please set SMTP_HOST, SMTP_PORT, "
                "SMTP_USER, and SMTP_PASSWORD environment variables."
            )
        logger.info("SMTP configuration validated successfully")
    
    def _send_single_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """
        Internal method to send a single email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body content
            is_html: Whether body is HTML format
            
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            msg = MIMEMultipart()
            msg["From"] = f"{COMPANY_NAME} <{SMTP_USER}>"
            msg["To"] = to_email
            msg["Subject"] = subject
            
            content_type = "html" if is_html else "plain"
            msg.attach(MIMEText(body, content_type))
            
            # Connect and send
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
            return False
    
    def _send_bulk_emails(
        self,
        email_list: List[str],
        subject: str,
        body: str,
        is_html: bool = False
    ) -> Dict[str, List[str]]:
        """
        Internal method to send bulk emails
        
        Args:
            email_list: List of recipient email addresses
            subject: Email subject
            body: Email body content
            is_html: Whether body is HTML format
            
        Returns:
            Dict with success and failed email lists
        """
        results = {
            "success": [],
            "failed": []
        }
        
        logger.info(f"Starting bulk email send to {len(email_list)} recipients")
        
        for email in email_list:
            if self._send_single_email(email, subject, body, is_html):
                results["success"].append(email)
            else:
                results["failed"].append(email)
        
        logger.info(f"📧 Bulk email results: {len(results['success'])} sent, "
                   f"{len(results['failed'])} failed")
        return results
    
    # =====================================
    # USER EMAIL FETCHING METHODS
    # =====================================
    
    def get_all_customer_emails(self) -> List[str]:
        """
        Get email addresses of all customers automatically
        
        Returns:
            List of customer email addresses
        """
        if not self.db:
            logger.error("Database session required for fetching user emails")
            raise RuntimeError("Database session required for fetching user emails")
        
        try:
            from models.user import User, UserRole, Role
            
            users = (
                self.db.query(User.email)
                .join(UserRole, User.user_id == UserRole.user_id)
                .join(Role, UserRole.role_id == Role.role_id)
                .filter(Role.role_name == "customer")
                .filter(User.email.isnot(None))
                .all()
            )
            
            emails = [user[0] for user in users if user[0]]
            logger.info(f"Found {len(emails)} customer emails")
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching customer emails: {str(e)}")
            return []
    
    def get_all_delivery_person_emails(self) -> List[str]:
        """
        Get email addresses of all delivery persons automatically
        
        Returns:
            List of delivery person email addresses
        """
        if not self.db:
            logger.error("Database session required for fetching user emails")
            raise RuntimeError("Database session required for fetching user emails")
        
        try:
            from models.user import User, UserRole, Role
            
            users = (
                self.db.query(User.email)
                .join(UserRole, User.user_id == UserRole.user_id)
                .join(Role, UserRole.role_id == Role.role_id)
                .filter(Role.role_name == "delivery")
                .filter(User.email.isnot(None))
                .all()
            )
            
            emails = [user[0] for user in users if user[0]]
            logger.info(f"Found {len(emails)} delivery person emails")
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching delivery person emails: {str(e)}")
            return []
    
    def get_all_admin_emails(self) -> List[str]:
        """
        Get email addresses of all admins automatically
        
        Returns:
            List of admin email addresses
        """
        if not self.db:
            logger.error("Database session required for fetching user emails")
            raise RuntimeError("Database session required for fetching user emails")
        
        try:
            from models.user import User, UserRole, Role
            
            users = (
                self.db.query(User.email)
                .join(UserRole, User.user_id == UserRole.user_id)
                .join(Role, UserRole.role_id == Role.role_id)
                .filter(Role.role_name == "admin")
                .filter(User.email.isnot(None))
                .all()
            )
            
            emails = [user[0] for user in users if user[0]]
            
            if not emails:
                logger.warning("No admin emails found in database, using default ADMIN_EMAIL")
                emails = [ADMIN_EMAIL] if ADMIN_EMAIL else []
            
            logger.info(f"Found {len(emails)} admin emails")
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching admin emails: {str(e)}")
            return [ADMIN_EMAIL] if ADMIN_EMAIL else []
    
    def get_all_user_emails(self) -> List[str]:
        """
        Get email addresses of all users automatically
        
        Returns:
            List of all user email addresses
        """
        if not self.db:
            logger.error("Database session required for fetching user emails")
            raise RuntimeError("Database session required for fetching user emails")
        
        try:
            from models.user import User
            
            users = (
                self.db.query(User.email)
                .filter(User.email.isnot(None))
                .all()
            )
            
            emails = [user[0] for user in users if user[0]]
            logger.info(f"Found {len(emails)} user emails")
            return emails
            
        except Exception as e:
            logger.error(f"Error fetching all user emails: {str(e)}")
            return []
    
    def get_user_email_by_id(self, user_id: int) -> Optional[str]:
        """
        Get email address of a specific user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            Email address or None if not found
        """
        if not self.db:
            logger.error("Database session required for fetching user email")
            raise RuntimeError("Database session required for fetching user email")
        
        try:
            from models.user import User
            
            user = self.db.query(User).filter(User.user_id == user_id).first()
            email = user.email if user and user.email else None
            
            if email:
                logger.info(f"Found email for user ID {user_id}: {email}")
            else:
                logger.warning(f"No email found for user ID {user_id}")
            
            return email
            
        except Exception as e:
            logger.error(f"Error fetching email for user {user_id}: {str(e)}")
            return None
    
    # ========================
    # CORE EMAIL SENDING METHODS
    # ========================
    
    def send_email_to_customer(self, customer_email: str, subject: str, message: str) -> bool:
        """
        Send email to a specific customer
        
        Args:
            customer_email: Customer's email address
            subject: Email subject
            message: Email message content
            
        Returns:
            bool: True if sent successfully
        """
        logger.info(f"Sending email to customer: {customer_email}")
        return self._send_single_email(customer_email, subject, message)
    
    def send_email_to_delivery_person(self, delivery_email: str, subject: str, message: str) -> bool:
        """
        Send email to a specific delivery person
        
        Args:
            delivery_email: Delivery person's email address
            subject: Email subject
            message: Email message content
            
        Returns:
            bool: True if sent successfully
        """
        logger.info(f"Sending email to delivery person: {delivery_email}")
        return self._send_single_email(delivery_email, subject, message)
    
    def send_email_to_admin(self, subject: str, message: str) -> bool:
        """
        Send email to admin (single admin email)
        
        Args:
            subject: Email subject
            message: Email message content
            
        Returns:
            bool: True if sent successfully
        """
        logger.info(f"Sending email to admin: {ADMIN_EMAIL}")
        return self._send_single_email(ADMIN_EMAIL, subject, message)
    
    def send_to_all_customers(self, subject: str, message: str) -> Dict[str, List[str]]:
        """
        Send email to all customers automatically
        
        Args:
            subject: Email subject
            message: Email message content
            
        Returns:
            Dict with success and failed email lists
        """
        logger.info("Starting email send to all customers")
        customer_emails = self.get_all_customer_emails()
        
        if not customer_emails:
            logger.warning("No customer emails found")
            return {"success": [], "failed": []}
        
        logger.info(f"Sending to {len(customer_emails)} customers")
        return self._send_bulk_emails(customer_emails, subject, message)
    
    def send_to_all_delivery_persons(self, subject: str, message: str) -> Dict[str, List[str]]:
        """
        Send email to all delivery persons automatically
        
        Args:
            subject: Email subject
            message: Email message content
            
        Returns:
            Dict with success and failed email lists
        """
        logger.info("Starting email send to all delivery persons")
        delivery_emails = self.get_all_delivery_person_emails()
        
        if not delivery_emails:
            logger.warning("No delivery person emails found")
            return {"success": [], "failed": []}
        
        logger.info(f"Sending to {len(delivery_emails)} delivery persons")
        return self._send_bulk_emails(delivery_emails, subject, message)
    
    def send_to_all_admins(self, subject: str, message: str) -> Dict[str, List[str]]:
        """
        Send email to all admin users automatically
        
        Args:
            subject: Email subject
            message: Email message content
            
        Returns:
            Dict with success and failed email lists
        """
        logger.info("Starting email send to all admins")
        admin_emails = self.get_all_admin_emails()
        
        if not admin_emails:
            logger.warning("No admin emails found")
            return {"success": [], "failed": []}
        
        logger.info(f"Sending to {len(admin_emails)} admins")
        return self._send_bulk_emails(admin_emails, subject, message)
    
    def send_to_all_users(self, subject: str, message: str) -> Dict[str, List[str]]:
        """
        Send email to all users automatically
        
        Args:
            subject: Email subject
            message: Email message content
            
        Returns:
            Dict with success and failed email lists
        """
        logger.info("Starting email send to all users")
        user_emails = self.get_all_user_emails()
        
        if not user_emails:
            logger.warning("No user emails found")
            return {"success": [], "failed": []}
        
        logger.info(f"Sending to {len(user_emails)} users")
        return self._send_bulk_emails(user_emails, subject, message)
    
    def send_to_email_list(self, email_list: List[str], subject: str, message: str) -> Dict[str, List[str]]:
        """
        Send email to a custom list of email addresses
        
        Args:
            email_list: List of email addresses
            subject: Email subject
            message: Email message content
            
        Returns:
            Dict with success and failed email lists
        """
        if not email_list:
            logger.warning("Empty email list provided")
            return {"success": [], "failed": []}
        
        logger.info(f"Sending to custom list of {len(email_list)} emails")
        return self._send_bulk_emails(email_list, subject, message)
    
    def send_to_user_by_id(self, user_id: int, subject: str, message: str) -> bool:
        """
        Send email to a specific user by user ID
        
        Args:
            user_id: User ID
            subject: Email subject
            message: Email message content
            
        Returns:
            bool: True if sent successfully
        """
        logger.info(f"Sending email to user ID {user_id}")
        user_email = self.get_user_email_by_id(user_id)
        
        if not user_email:
            logger.error(f"No email found for user ID {user_id}")
            return False
        
        return self._send_single_email(user_email, subject, message)
    
    def send_password_reset_otp(self, email: str, otp: str) -> bool:
        """
        Send password reset OTP email
        
        Args:
            email: Recipient email
            otp: One-time password
            
        Returns:
            bool: True if sent successfully
        """
        subject = f"{COMPANY_NAME} Password Reset OTP"
        
        body = f"""
Hello,

Your password reset OTP is:

🔐 {otp}

This OTP is valid for 10 minutes.
If you did not request this, please ignore this email.

— {COMPANY_NAME} Team
"""
        
        # Log for debugging
        logger.info(f"📧 Sending password reset OTP to {email}")
        print("=" * 60)
        print(f"📧 PASSWORD RESET OTP EMAIL SENDING")
        print(f"To: {email}")
        print("=" * 60)
        
        return self._send_single_email(email, subject, body)

    def send_delivery_verification_otp(self, email: str, otp: str, order_id: int = None) -> bool:
        """
        Send delivery verification OTP email
        
        Args:
            email: Recipient email
            otp: One-time password
            order_id: Optional order ID for context
            
        Returns:
            bool: True if sent successfully
        """
        subject = f"{COMPANY_NAME} Delivery Verification OTP"
        
        order_text = f" for Order #{order_id}" if order_id else ""
        
        body = f"""
Hello,

Your delivery verification code{order_text} is:

📦 {otp}

Please share this code with the delivery person to complete your delivery.
This code is valid for 10 minutes.

— {COMPANY_NAME} Team
"""
        
        # Log for debugging
        logger.info(f"📧 Sending delivery verification OTP to {email}")
        print("=" * 60)
        print(f"📧 DELIVERY OTP EMAIL SENDING")
        print(f"To: {email}")
        print("=" * 60)
        
        return self._send_single_email(email, subject, body)


# ========================
# QUICK USAGE FUNCTIONS
# ========================

def send_otp_email(email: str, otp: str) -> bool:
    """
    Quick function for sending OTP emails (backward compatibility)
    
    Args:
        email: Recipient email
        otp: One-time password
        
    Returns:
        bool: True if sent successfully
    """
    service = EmailService()
    return service.send_password_reset_otp(email, otp)

def send_delivery_otp_email(email: str, otp: str, order_id: int = None) -> bool:
    """
    Quick function for sending delivery verification OTP emails
    """
    service = EmailService()
    return service.send_delivery_verification_otp(email, otp, order_id)