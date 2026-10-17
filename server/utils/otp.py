import random
from argon2 import PasswordHasher

ph = PasswordHasher()

def generate_otp() -> str:
    return str(random.randint(100000, 999999))

def hash_otp(otp: str) -> str:
    return ph.hash(otp)

def verify_otp(plain_otp: str, hashed_otp: str) -> bool:
    try:
        return ph.verify(hashed_otp, plain_otp)
    except Exception:
        return False
