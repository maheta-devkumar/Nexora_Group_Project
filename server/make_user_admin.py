# server/make_user_admin.py
from config.database import SessionLocal
from models.user import User
from models.role import Role, UserRole
from datetime import datetime

def make_user_admin():
    db = SessionLocal()
    
    try:
        # Get user by email
        email = input("Enter user email: ").strip()
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"❌ User with email {email} not found")
            return
        
        # Get Admin role
        admin_role = db.query(Role).filter(Role.role_name == "Admin").first()
        if not admin_role:
            print("❌ Admin role not found. Creating it...")
            admin_role = Role(role_name="Admin", description="Administrator role", is_active=True)
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
        
        # Check if already admin
        existing = db.query(UserRole).filter(
            UserRole.user_id == user.user_id,
            UserRole.role_id == admin_role.role_id
        ).first()
        
        if existing:
            print(f"ℹ️  User {email} is already an Admin")
            return
        
        # Assign Admin role
        user_role = UserRole(
            user_id=user.user_id,
            role_id=admin_role.role_id,
            assigned_at=datetime.now()
        )
        db.add(user_role)
        db.commit()
        
        print(f"✅ User {email} is now an Admin!")
        print(f"User ID: {user.user_id}")
        print(f"Role ID: {admin_role.role_id}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    make_user_admin()