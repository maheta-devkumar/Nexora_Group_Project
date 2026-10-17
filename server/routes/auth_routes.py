from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from controllers.auth_controller import AuthController
from schemas.user_schema import UserCreate, UserLogin, RegisterResponse, LoginResponse
from config.database import get_db
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
from schemas.google_auth_schema import GoogleAuthRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# ✅ DEFINE SECURITY
security = HTTPBearer(auto_error=True)

@router.post("/register", response_model=RegisterResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    controller = AuthController(db)
    return controller.register_user(user_data)

@router.post("/login", response_model=LoginResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    controller = AuthController(db)
    return controller.login_user(user_data)


@router.post("/google-login")
def google_login(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    controller = AuthController(db)
    return controller.google_login(data)