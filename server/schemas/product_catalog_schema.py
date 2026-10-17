# schemas/product_catalog_schema.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Utility Schemas ---
class CategoryDetail(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str] = None
    sub_categories_count: int

class SubCategoryDetail(BaseModel):
    sub_category_id: int
    sub_category_name: str
    category_name: str
    description: Optional[str] = None
    products_count: int

class BrandDetail(BaseModel):
    brand_id: int
    brand_name: str
    description: Optional[str] = ""
    products_count: int

class AttributeDetail(BaseModel):
    attribute_id: int
    attribute_name: str
    values: List[str]

class ProductImageDetail(BaseModel):
    image_id: int
    url: str
    is_default: bool

class ProductVideoDetail(BaseModel):
    video_id: int
    url: str
    is_default: bool

class ProductCatalogSummaryResponseData(BaseModel):
    categories: List[CategoryDetail]
    brands: List[BrandDetail]
    total_products: int

# --- Category Schemas ---
class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    category_id: int

    class Config:
        from_attributes = True

# --- SubCategory Schemas ---
class SubCategoryBase(BaseModel):
    sub_category_name: str
    category_id: int
    description: Optional[str] = None

class SubCategoryCreate(SubCategoryBase):
    pass

class SubCategoryUpdate(BaseModel):
    sub_category_name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None

class SubCategoryResponse(SubCategoryBase):
    sub_category_id: int

    class Config:
        from_attributes = True

# --- Brand Schemas ---
class BrandBase(BaseModel):
    brand_name: str
    description: Optional[str] = None

class BrandCreate(BrandBase):
    pass

class BrandUpdate(BaseModel):
    brand_name: Optional[str] = None
    description: Optional[str] = None

class BrandResponse(BrandBase):
    brand_id: int

    class Config:
        from_attributes = True

# --- Attribute Schemas ---
class AttributeBase(BaseModel):
    attribute_name: str

class AttributeCreate(AttributeBase):
    pass

class AttributeResponse(AttributeBase):
    attribute_id: int

    class Config:
        from_attributes = True

# --- Attribute Variant Schemas ---
class AttributeVariantBase(BaseModel):
    attribute_id: int
    variant_id: int
    value: str

class AttributeVariantCreate(AttributeVariantBase):
    pass

class AttributeVariantResponse(AttributeVariantBase):
    class Config:
        from_attributes = True

# --- Product Image Schemas ---
class ProductImageBase(BaseModel):
    variant_id: int
    url: str
    is_default: bool = False

class ProductImageCreate(ProductImageBase):
    pass

class ProductImageUpdate(BaseModel):
    url: Optional[str] = None
    is_default: Optional[bool] = None

class ProductImageResponse(ProductImageBase):
    image_id: int

    class Config:
        from_attributes = True

# --- Product Video Schemas ---
class ProductVideoBase(BaseModel):
    variant_id: int
    url: str
    is_default: bool = False

class ProductVideoCreate(ProductVideoBase):
    pass

class ProductVideoResponse(ProductVideoBase):
    video_id: int

    class Config:
        from_attributes = True

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class ProductCatalogSummaryWrapper(SuccessWrapper):
    data: ProductCatalogSummaryResponseData

class CategoryWrapper(SuccessWrapper):
    data: CategoryResponse

class SubCategoryWrapper(SuccessWrapper):
    data: SubCategoryResponse

class BrandWrapper(SuccessWrapper):
    data: BrandResponse

class AttributeWrapper(SuccessWrapper):
    data: AttributeResponse

class ProductImageWrapper(SuccessWrapper):
    data: ProductImageResponse

class ProductVideoWrapper(SuccessWrapper):
    data: ProductVideoResponse

# Add these to your existing product_catalog_schema.py

class VariantAttributeDetail(BaseModel):
    attribute_id: int
    attribute_name: str
    value: str

# Wrappers for attribute routes
class AttributeListWrapper(SuccessWrapper):
    data: List[AttributeResponse]

class VariantAttributeListWrapper(SuccessWrapper):
    data: List[VariantAttributeDetail]

class SingleAttributeWrapper(SuccessWrapper):
    data: AttributeResponse

class MessageWrapper(SuccessWrapper):
    data: Dict[str, str]

# Wrappers for brand routes  
class ListBrandWrapper(SuccessWrapper):
    data: List[BrandResponse]

class SingleBrandWrapper(SuccessWrapper):
    data: BrandResponse

# Wrappers for category routes
class ListCategoryWrapper(SuccessWrapper):
    data: List[CategoryResponse]

class SingleCategoryWrapper(SuccessWrapper):
    data: CategoryResponse

class NestedCategoryWrapper(SuccessWrapper):
    data: Dict[str, Any]

class SingleSubCategoryWrapper(SuccessWrapper):
    data: SubCategoryResponse

# Wrappers for media routes
class ImageUploadWrapper(SuccessWrapper):
    data: ProductImageResponse

class VideoUploadWrapper(SuccessWrapper):
    data: ProductVideoResponse

# Add ListWrapper for general list responses
class ListWrapper(SuccessWrapper):
    data: List[Any]

class PaginatedVariantListWrapper(SuccessWrapper):
    data: Dict[str, Any]
# --- SubCategory Detail Schema (For subcategory with category info) ---
class SubCategoryWithCategory(BaseModel):
    sub_category_id: int
    sub_category_name: str
    description: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Category with Subcategories Schema ---
class CategoryWithSubcategories(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str] = None
    subcategories: List[SubCategoryResponse]

    class Config:
        from_attributes = True

# --- Wrapper for all subcategories response ---
class AllSubcategoriesResponse(BaseModel):
    subcategories: List[SubCategoryWithCategory]
    total_subcategories: int

# --- Wrapper for subcategory by ID response ---
class SubCategoryDetailResponse(BaseModel):
    sub_category_id: int
    sub_category_name: str
    description: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    category_description: Optional[str] = None

    class Config:
        from_attributes = True

# --- Update Wrapper Schemas ---
class AllSubcategoriesWrapper(SuccessWrapper):
    data: AllSubcategoriesResponse

class SubCategoryDetailWrapper(SuccessWrapper):
    data: SubCategoryDetailResponse

class CategoryWithSubcategoriesWrapper(SuccessWrapper):
    data: CategoryWithSubcategories

# Update the existing ListWrapper to be more specific
class ListSubCategoryWrapper(SuccessWrapper):
    data: List[SubCategoryResponse]

# Add this near other subcategory schemas
class SubCategoryWithCategory(BaseModel):
    sub_category_id: int
    sub_category_name: str
    description: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# Add this to wrapper schemas section
class ListSubCategoryWrapper(SuccessWrapper):
    data: List[SubCategoryWithCategory]

class SubCategoryDetail(BaseModel):
    sub_category_id: int
    sub_category_name: str
    description: Optional[str] = None
    category_id: int
    category_name: Optional[str] = None
    category_description: Optional[str] = None

    class Config:
        from_attributes = True

class SingleSubCategoryDetailWrapper(SuccessWrapper):
    data: SubCategoryDetail

