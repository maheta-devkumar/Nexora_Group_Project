from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from sqlalchemy.orm import Session
from config.dependencies import get_db, is_admin
from controllers.product_catalog.media_controller import MediaController
from schemas.product_catalog_schema import (
    ImageUploadWrapper, VideoUploadWrapper, MessageWrapper
)

router = APIRouter(prefix="/api/v1/media", tags=["Product Media"])

@router.post("/image/upload", response_model=ImageUploadWrapper)
async def upload_image(
    variant_id: int = Query(..., description="Variant ID to associate the image with"),
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Upload product image."""
    controller = MediaController(db)
    try:
        image = await controller.upload_product_image(variant_id, file)
        return {"success": True, "message": "Image uploaded successfully", "data": image}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/image/{image_id}", response_model=MessageWrapper)
async def remove_image(image_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Delete product image."""
    controller = MediaController(db)
    try:
        result = await controller.delete_product_image(image_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/image/default", response_model=MessageWrapper)
def set_default_img(
    variant_id: int = Query(..., description="Variant ID"),
    image_id: int = Query(..., description="Image ID to set as default"),
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Set default image for variant."""
    controller = MediaController(db)
    try:
        result = controller.set_default_image(variant_id, image_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video/upload", response_model=VideoUploadWrapper)
async def upload_video(
    variant_id: int = Query(..., description="Variant ID to associate the video with"),
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    admin = Depends(is_admin)
):
    """Admin: Upload product video."""
    controller = MediaController(db)
    try:
        video = await controller.upload_product_video(variant_id, file)
        return {"success": True, "message": "Video uploaded successfully", "data": video}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/video/{video_id}", response_model=MessageWrapper)
async def remove_video(video_id: int, db: Session = Depends(get_db), admin = Depends(is_admin)):
    """Admin: Delete product video."""
    controller = MediaController(db)
    try:
        result = await controller.delete_product_video(video_id)
        return {"success": True, "message": result.get("message"), "data": result}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))