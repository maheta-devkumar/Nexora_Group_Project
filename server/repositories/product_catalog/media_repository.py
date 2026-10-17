from sqlalchemy.orm import Session
from models.product_catalog.product_image import ProductImage
from models.product_catalog.product_video import ProductVideo
from typing import List, Optional

class MediaRepository:
    
    @staticmethod
    def get_image_by_id(db: Session, image_id: int) -> Optional[ProductImage]:
        """Get image by ID"""
        return db.query(ProductImage).filter(ProductImage.image_id == image_id).first()
    
    @staticmethod
    def get_video_by_id(db: Session, video_id: int) -> Optional[ProductVideo]:
        """Get video by ID"""
        return db.query(ProductVideo).filter(ProductVideo.video_id == video_id).first()
    
    @staticmethod
    def count_variant_images(db: Session, variant_id: int) -> int:
        """Count images for a variant"""
        return db.query(ProductImage).filter(ProductImage.variant_id == variant_id).count()
    
    @staticmethod
    def create_image(db: Session, image_data: dict) -> ProductImage:
        """Create new image"""
        new_image = ProductImage(**image_data)
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        return new_image
    
    @staticmethod
    def create_video(db: Session, video_data: dict) -> ProductVideo:
        """Create new video"""
        new_video = ProductVideo(**video_data)
        db.add(new_video)
        db.commit()
        db.refresh(new_video)
        return new_video
    
    @staticmethod
    def update_variant_images_default(db: Session, variant_id: int, is_default: bool = False) -> None:
        """Update default status for all images of a variant"""
        db.query(ProductImage).filter(ProductImage.variant_id == variant_id).update({"is_default": is_default})
        db.commit()
    
    @staticmethod
    def update_image(db: Session, image: ProductImage, update_data: dict) -> ProductImage:
        """Update image"""
        for key, value in update_data.items():
            if hasattr(image, key):
                setattr(image, key, value)
        
        db.commit()
        db.refresh(image)
        return image
    
    @staticmethod
    def delete_image(db: Session, image: ProductImage) -> None:
        """Delete image"""
        db.delete(image)
        db.commit()
    
    @staticmethod
    def delete_video(db: Session, video: ProductVideo) -> None:
        """Delete video"""
        db.delete(video)
        db.commit()