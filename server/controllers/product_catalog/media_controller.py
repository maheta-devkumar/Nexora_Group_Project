from fastapi import HTTPException, Depends, UploadFile
from sqlalchemy.orm import Session
from config.dependencies import get_db
from services.product_catalog.media_service import MediaService
from typing import Dict, Any

class MediaController:
    
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.service = MediaService(db)
    
    async def upload_product_image(self, variant_id: int, file: UploadFile) -> Dict[str, Any]:
        """Upload product image"""
        try:
            return await self.service.upload_product_image(variant_id, file)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_product_image(self, image_id: int) -> Dict[str, str]:
        """Delete product image"""
        try:
            return await self.service.delete_product_image(image_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def set_default_image(self, variant_id: int, image_id: int) -> Dict[str, str]:
        """Set default image"""
        try:
            return self.service.set_default_image(variant_id, image_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    async def upload_product_video(self, variant_id: int, file: UploadFile) -> Dict[str, Any]:
        """Upload product video"""
        try:
            return await self.service.upload_product_video(variant_id, file)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    async def delete_product_video(self, video_id: int) -> Dict[str, str]:
        """Delete product video"""
        try:
            return await self.service.delete_product_video(video_id)
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))