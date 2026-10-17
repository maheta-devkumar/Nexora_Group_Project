from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.settings_controller import SettingsController
from schemas.settings_schema import SettingsUpdate, SettingsResponse

router = APIRouter(prefix="/api/v1/admin/settings", tags=["Admin Settings"])

@router.get("/", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    controller = SettingsController(db)
    return controller.get_settings()

@router.put("/", response_model=SettingsResponse)
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    admin = Depends(is_admin)
):
    controller = SettingsController(db)
    return controller.update_settings(data)
