from google.oauth2 import id_token
from google.auth.transport import requests
import os
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("VITE_GOOGLE_CLIENT_ID")

def verify_google_token(token: str):
    print(f"🔍 Verifying Google Token. Client ID: {GOOGLE_CLIENT_ID}") 
    if not GOOGLE_CLIENT_ID:
        print("❌ CRITICAL: GOOGLE_CLIENT_ID is missing from environment!")
        raise HTTPException(status_code=500, detail="Server configuration error: Missing Google Client ID")

    try:
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10
        )
        print("✅ Token verified successfully")
        return idinfo
    except ValueError as ve:
        print(f"❌ Token verification failed (ValueError): {ve}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(ve)}")
    except Exception as e:
        print(f"❌ Token verification failed (Exception): {e}")
        # import traceback
        # traceback.print_exc()
        raise HTTPException(status_code=401, detail="Invalid Google token")
