from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from config.database import get_db
from models.user import User
import os

security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "aotisbest")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# -------------------------
# JWT: Decode + extract user
# -------------------------
def verify_token(token: str, credentials_exception):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")

        if user_id is None:
            raise credentials_exception

        return payload

    except JWTError:
        raise credentials_exception


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    decoded = verify_token(token, credentials_exception)

    user = db.query(User).filter(User.user_id == decoded["user_id"]).first()

    if not user:
        raise credentials_exception

    return user


# -------------------------
# ROLE CHECK UTILS
# -------------------------
def user_has_role(user: User, required_role: str) -> bool:
    """Check if user has a specific role using UserRole + Role tables."""
    if not user.roles:
        return False

    for user_role in user.roles:
        if user_role.role.role_name.lower() == required_role.lower():
            return True

    return False


# -------------------------
# ROLE VALIDATORS
# -------------------------
def is_admin(current_user: User = Depends(get_current_user)):
    if not user_has_role(current_user, "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


def is_customer(current_user: User = Depends(get_current_user)):
    if not user_has_role(current_user, "customer"):
        raise HTTPException(status_code=403, detail="Customer access required")
    return current_user


def is_delivery_person(current_user: User = Depends(get_current_user)):
    if not user_has_role(current_user, "delivery"):
        raise HTTPException(status_code=403, detail="Delivery person access required")
    return current_user


# -------------------------
# DELIVERY PERSON OR NONE
# -------------------------
def get_delivery_person_or_none(current_user: User = Depends(get_current_user)):
    """
    Return delivery person user if role = 'delivery'
    Return None otherwise.
    Does NOT block access (no 403).
    """
    if user_has_role(current_user, "delivery"):
        return current_user
    return None
