# utils/jwt_handler.py
from jose import jwt
from datetime import datetime, timedelta
import os
from typing import Dict, Any

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "aotisbest")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
# default 15 days as in your original (can be changed via env)
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("ACCESS_TOKEN_EXPIRE_DAYS", "15"))

def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
