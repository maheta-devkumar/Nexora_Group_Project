from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from config.dependencies import get_db, get_current_user  # Use simple version
from controllers.account_controller import AccountController
from schemas.account_schema import DashboardWrapper
from models.user import User

router = APIRouter(prefix="/api/v1/account", tags=["Account"])

@router.get("/dashboard", response_model=DashboardWrapper)
def get_dashboard(
    current_user: User = Depends(get_current_user),  # Use simple auth
    db: Session = Depends(get_db)
):
    """Get comprehensive account dashboard data"""
    try:
        controller = AccountController(db)
        dashboard_data = controller.get_account_dashboard(current_user.user_id)
        return {
            "success": True,
            "message": "Dashboard data retrieved successfully",
            "data": dashboard_data
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))