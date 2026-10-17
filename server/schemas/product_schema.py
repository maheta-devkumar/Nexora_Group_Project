from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# --- Utility Schemas ---
class ProductDetail(BaseModel):
    product_id: int
    product_name: str
    description: Optional[str] = None
    brand_name: Optional[str] = None
    category_name: Optional[str] = None
    sub_category_name: Optional[str] = None
    created_at: datetime

class VariantDetail(BaseModel):
    variant_id: int
    variant_name: Optional[str] = None
    product_name: str
    price: float
    stock_quantity: int
    discount_type: str
    discount_value: float
    final_price: float
    status: str
    attributes: Dict[str, Any]

class ProductSummaryResponseData(BaseModel):
    products: List[ProductDetail]
    total_products: int

class VariantSummaryResponseData(BaseModel):
    variants: List[VariantDetail]
    total_variants: int

# --- Core Product Schemas ---
class ProductBase(BaseModel):
    product_name: str
    description: Optional[str] = None
    brand_id: Optional[int] = None
    sub_category_id: int

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    description: Optional[str] = None
    brand_id: Optional[int] = None
    sub_category_id: Optional[int] = None

class ProductResponse(ProductBase):
    product_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- Variant Schemas ---
class VariantBase(BaseModel):
    variant_name: Optional[str] = None
    product_id: int
    price: Decimal
    stock_quantity: int = 0
    discount_type: str = "NONE"
    discount_value: Decimal = 0
    status: str = "ACTIVE"
    is_default: bool = False

class VariantCreate(VariantBase):
    pass

class VariantUpdate(BaseModel):
    variant_name: Optional[str] = None
    price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    discount_type: Optional[str] = None
    discount_value: Optional[Decimal] = None
    status: Optional[str] = None
    is_default: Optional[bool] = None

class VariantResponse(VariantBase):
    variant_id: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# --- Category Schemas ---
class CategoryBase(BaseModel):
    category_name: str
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    category_id: int

    model_config = ConfigDict(from_attributes=True)

class SubCategoryBase(BaseModel):
    sub_category_name: str
    category_id: int
    description: Optional[str] = None

class SubCategoryResponse(SubCategoryBase):
    sub_category_id: int

    model_config = ConfigDict(from_attributes=True)

# --- Wrapper Schemas ---
class SuccessWrapper(BaseModel):
    success: bool = True
    message: Optional[str] = "Success"

class ProductSummaryWrapper(SuccessWrapper):
    data: ProductSummaryResponseData

class ProductWrapper(SuccessWrapper):
    data: ProductResponse

class VariantSummaryWrapper(SuccessWrapper):
    data: VariantSummaryResponseData

class VariantWrapper(SuccessWrapper):
    data: VariantResponse

# Additional schemas for product operations
class ProductVariantDetail(BaseModel):
    variant_id: int
    variant_name: Optional[str] = None
    price: float
    final_price: float
    discount_type: str
    discount_value: float
    stock_quantity: int
    status: str
    is_default: bool
    images: List[Dict[str, Any]]

class ProductWithVariantsResponse(BaseModel):
    product_id: int
    product_name: str
    description: Optional[str] = None
    brand: Optional[Dict[str, Any]] = None
    category: Optional[Dict[str, Any]] = None
    subcategory: Optional[Dict[str, Any]] = None
    created_at: datetime
    variants: List[ProductVariantDetail]

class PaginatedProductsResponse(BaseModel):
    items: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    total_pages: int

class ProductSingleCreationResponse(BaseModel):
    product_id: int
    product_name: str
    description: Optional[str] = None
    brand_id: Optional[int] = None
    sub_category_id: int  # Fixed: sub_category_id instead of subcategory_id
    created_at: str

# Wrapper for paginated products
class PaginatedProductsWrapper(SuccessWrapper):
    data: PaginatedProductsResponse

# Wrapper for single product with variants
class SingleProductWrapper(SuccessWrapper):
    data: ProductWithVariantsResponse

# Wrapper for product creation
class ProductSingleCreationWrapper(SuccessWrapper):
    data: ProductSingleCreationResponse

class SingleVariantWrapper(SuccessWrapper):
    data: Dict[str, Any]

class MessageWrapper(SuccessWrapper):
    data: dict

# Add to your existing schemas

class NewArrivalsResponseData(PaginatedProductsResponse):
    days: int = 7

class CategoryProductsResponseData(PaginatedProductsResponse):
    category: str

class TrendingProductResponse(BaseModel):
    product_id: int
    product_name: str
    created_at: datetime
    default_variant: Dict[str, Any]

class TrendingProductsResponse(BaseModel):
    items: List[TrendingProductResponse]
    total: int

# Wrapper schemas
class NewArrivalsWrapper(SuccessWrapper):
    data: NewArrivalsResponseData

class CategoryProductsWrapper(SuccessWrapper):
    data: CategoryProductsResponseData

class TrendingProductsWrapper(SuccessWrapper):
    data: TrendingProductsResponse

class VariantMediaImage(BaseModel):
    image_id: int
    url: str
    is_default: bool

    class Config:
        orm_mode = True


class VariantMediaVideo(BaseModel):
    video_id: int
    url: str

    class Config:
        orm_mode = True


class VariantImageListWrapper(BaseModel):
    success: bool
    message: str
    data: List[VariantMediaImage]

class VariantVideoListWrapper(BaseModel):
    success: bool
    message: str
    data: List[VariantMediaVideo]
