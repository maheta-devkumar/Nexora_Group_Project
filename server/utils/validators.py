import re
from fastapi import HTTPException

def validate_email(email: str):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(pattern, email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    return True

def validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    return True

def validate_phone(phone: str):
    pattern = r'^\+?[1-9]\d{9,14}$'
    if phone and not re.match(pattern, phone):
        raise HTTPException(status_code=400, detail="Invalid phone number")
    return True