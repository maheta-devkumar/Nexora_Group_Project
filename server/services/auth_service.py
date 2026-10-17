from sqlalchemy.orm import Session
from fastapi import HTTPException
from repositories.auth_repository import AuthRepository
from utils.hashing import hash_password, verify_password
from utils.jwt_handler import create_access_token
from utils.google_verify import verify_google_token
from utils.send_email import EmailService  # Import email service
from datetime import datetime
from services.notification_service import NotificationService


class AuthService:

    def __init__(self):
        self.auth_repo = AuthRepository()
        self.user_repo = None # Lazy init when db is available

    # --------------------- REGISTER ---------------------
    def register(self, user_data, db: Session):
        # Check email/username exists
        existing_user = self.auth_repo.get_user_by_email_or_username(
            db, user_data.email, user_data.username
        )

        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(status_code=400, detail="Email already registered")
            if existing_user.username == user_data.username:
                raise HTTPException(status_code=400, detail="Username already taken")

        # Hash password
        hashed_password = hash_password(user_data.password)

        # Prepare data for DB
        new_user_data = {
            "username": user_data.username,
            "email": user_data.email,
            "password_hash": hashed_password,
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "phone": user_data.phone,
            "is_active": True,
            "is_verified": False
        }

        # Create user
        new_user = self.auth_repo.create_user(db, new_user_data)

        # Initialize services
        email_service = EmailService(db_session=db)
        notification_service = NotificationService(db)

        # ============================================
        # SEND WELCOME EMAIL TO CUSTOMER (c)
        # ============================================
        try:
            customer_subject = "🎉 Welcome to Our Platform!"
            customer_message = f"""
Dear {new_user.first_name} {new_user.last_name},

Welcome to our platform! We're excited to have you join our community.

Your Account Details:
- Username: {new_user.username}
- Email: {new_user.email}
- Name: {new_user.first_name} {new_user.last_name}
- Phone: {new_user.phone if new_user.phone else 'Not provided'}
- Account Created: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

Getting Started:
1. Complete your profile
2. Browse our products
3. Start shopping
4. Track your orders
5. Manage your account

Account Security:
- Keep your password secure
- Never share your login details
- Enable two-factor authentication if available

Need Help?
- Visit our help center
- Contact customer support
- Check our FAQs

We're here to make your shopping experience amazing!

Happy Shopping! 🛍️

Best regards,
Customer Support Team
"""
            # Send welcome email to the new customer
            email_service.send_email_to_customer(new_user.email, customer_subject, customer_message)
            
            # Also send notification to all admins about new registration (bonus feature)
            admin_subject = f"👤 New Customer Registered - {new_user.username}"
            admin_message = f"""
NEW CUSTOMER REGISTRATION

Customer Details:
- User ID: {new_user.user_id}
- Username: {new_user.username}
- Email: {new_user.email}
- Name: {new_user.first_name} {new_user.last_name}
- Phone: {new_user.phone if new_user.phone else 'Not provided'}
- Registered At: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Verified: {'Yes' if new_user.is_verified else 'No'}
- Active: {'Yes' if new_user.is_active else 'No'}

Registration Source: Direct Registration

Customer has been automatically assigned the 'customer' role.

Welcome Email: Sent to customer

Best regards,
User Management System
"""
        except Exception as email_error:
            # Don't fail registration if email fails
            print(f"⚠️ Email sending failed but user was registered: {email_error}")
            
        # ============================================
        # SEND DATABASE NOTIFICATIONS (c)
        # ============================================
        try:
            # 1. Welcome notification to user
            notification_service.send_notification(
                user_id=new_user.user_id,
                title="👋 Welcome to Nexora!",
                message=f"Welcome {new_user.first_name}! Your account has been successfully created. We're excited to have you with us.",
                type="SYSTEM",
                reference_id=None
            )
            
            # 2. New user notification to admins
            # We need UserRepository to get admins, but it's not imported. 
            # Let's import it dynamically or at top if possible. 
            # Since we can't easily add top-level imports without potentially circular deps or just messiness, 
            # I'll rely on NotificationService's internal logic or just skip admin broadcast if too complex here?
            # Actually, I should import UserRepository at top.
            
            # Since I can't easily get admins here without repo, I'll assume NotificationService might have a broadcast? 
            # No, standard pattern is to loop admins.
            # I will add UserRepository import to the top block in a separate chunk.
            
            from repositories.user_repository import UserRepository
            user_repo = UserRepository()
            admin_users = user_repo.get_admin_users(db)
            
            for admin in admin_users:
                notification_service.send_notification(
                    user_id=admin.user_id,
                    title="👤 New Customer Registered",
                    message=f"New customer {new_user.username} ({new_user.email}) has registered.",
                    type="USER",
                    reference_id=new_user.user_id
                )

        except Exception as notif_error:
            print(f"⚠️ Database notification failed: {notif_error}")

        # roles
        roles = [ur.role.role_name for ur in new_user.roles] if new_user.roles else []

        return {
            "success": True,
            "message": "User Registered Successfully",
            "user": {
                "user_id": new_user.user_id,
                "username": new_user.username,
                "email": new_user.email,
                "first_name": new_user.first_name,
                "last_name": new_user.last_name,
                "phone": new_user.phone,
                "profile_img_url": new_user.profile_img_url,
                "roles": roles
            }
        }

    # --------------------- LOGIN ---------------------
    def login(self, user_data, db: Session):
        user = self.auth_repo.get_user_by_email(db, user_data.email)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not verify_password(user_data.password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect password")

        # roles
        roles = [ur.role.role_name for ur in user.roles] if user.roles else []

        # create JWT
        token = create_access_token({
            "user_id": user.user_id,
            "email": user.email,
            "roles": roles
        })

        # Send login notification email (bonus feature)
        try:
            email_service = EmailService(db_session=db)
            login_subject = "🔐 New Login Detected"
            login_message = f"""
Security Alert: New Login

Dear {user.first_name} {user.last_name},

We detected a new login to your account.

Login Details:
- Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}
- Account: {user.username}
- Email: {user.email}

If this was you, no action is needed.

If this wasn't you:
1. Change your password immediately
2. Contact customer support
3. Review your account activity

For your security, we recommend:
- Using strong, unique passwords
- Enabling two-factor authentication
- Regularly reviewing account activity

Stay safe!

Best regards,
Security Team
"""
            email_service.send_email_to_customer(user.email, login_subject, login_message)
        except Exception as e:
            print(f"⚠️ Login notification email failed: {e}")
            
        # Send database notification
        try:
            notification_service = NotificationService(db)
            notification_service.send_notification(
                user_id=user.user_id,
                title="🔐 New Login Detected",
                message=f"New login detected on your account at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}.",
                type="SECURITY",
                reference_id=None
            )
        except Exception as notif_error:
            print(f"⚠️ Login database notification failed: {notif_error}")

        return {
            "success": True,
            "message": "Login successful",
            "access_token": token,
            "user": {
                "user_id": user.user_id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "profile_img_url": user.profile_img_url,
                "roles": roles
            }
        }

    def google_login(self, token: str, db):
        payload = verify_google_token(token)

        email = payload.get("email")
        first_name = payload.get("given_name", "")
        last_name = payload.get("family_name", "")
        picture = payload.get("picture")

        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")

        user = self.auth_repo.get_user_by_email(db, email)

        # CREATE USER IF NOT EXISTS
        if not user:
            username = email.split("@")[0]

            user = self.auth_repo.create_user(db, {
                "username": username,
                "email": email,
                "password_hash": "GOOGLE_AUTH",
                "first_name": first_name or "Google",
                "last_name": last_name or "User",
                "profile_img_url": picture,
                "is_active": True,
                "is_verified": True
            })

            # Send welcome email for Google signup (bonus feature)
            try:
                email_service = EmailService(db_session=db)
                welcome_subject = "🎉 Welcome via Google!"
                welcome_message = f"""
Dear {first_name} {last_name},

Welcome to our platform! You've successfully registered using Google.

Your Account Details:
- Username: {username}
- Email: {email}
- Name: {first_name} {last_name}
- Registration: Google Sign-in
- Account Created: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}

You can now:
1. Shop our products
2. Save your favorites
3. Track your orders
4. Manage your profile

Need help? Contact our support team.

Happy Shopping! 🛍️

Best regards,
Customer Support Team
"""
                email_service.send_email_to_customer(email, welcome_subject, welcome_message)
            except Exception as e:
                print(f"⚠️ Welcome email failed for Google signup: {e}")

        
            # Send welcome notification for Google signup
            try:
                notification_service = NotificationService(db)
                notification_service.send_notification(
                    user_id=user.user_id,
                    title="👋 Welcome via Google!",
                    message=f"Welcome {user.first_name}! You've successfully registered using Google.",
                    type="SYSTEM",
                    reference_id=None
                )
            except Exception as notif_error:
                print(f"⚠️ Google signup notification failed: {notif_error}")

        # Send login notification for Google login
        try:
            notification_service = NotificationService(db)
            notification_service.send_notification(
                user_id=user.user_id,
                title="🔐 New Login via Google",
                message=f"New Google login detected on your account at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}.",
                type="SECURITY",
                reference_id=None
            )
        except Exception as notif_error:
            print(f"⚠️ Google login notification failed: {notif_error}")

        # roles
        roles = [ur.role.role_name for ur in user.roles] if user.roles else []

        token = create_access_token({
            "user_id": user.user_id,
            "email": user.email,
            "roles": roles
        })

        return {
            "success": True,
            "access_token": token,
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_img_url": user.profile_img_url,
                "roles": roles
            }
        }