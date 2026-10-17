from sqlalchemy.orm import Session
from sqlalchemy import exc
from models.product_catalog.product import Product
from models.product_catalog.product_variant import ProductVariant
from models.product_catalog.product_attribute import ProductAttribute
from models.product_catalog.category import Category
from models.product_catalog.product_brand import ProductBrand
from models.inventory.product_batch import ProductBatch
from typing import List, Dict, Any, Type

class ExcelDataRepository:
    
    @staticmethod
    def get_model(table_name: str) -> Type:
        mapping = {
            "products": Product,
            "variant": ProductVariant,
            "attribute": ProductAttribute,
            "categories": Category,
            "brands": ProductBrand,
            "inventories": ProductBatch
        }
        return mapping.get(table_name)
    
    @staticmethod
    def bulk_insert(db: Session, table_name: str, data: List[Dict[str, Any]]) -> int:
        model = ExcelDataRepository.get_model(table_name)
        if not model:
            raise ValueError(f"Unknown table: {table_name}")
            
        try:
            # Create model instances
            instances = [model(**row) for row in data]
            
            # Use bulk_save_objects for performance, but add_all is safer for relationships if needed
            # giving the "seeder" nature, simple insert is likely preferred.
            # However, if we need to return IDs or something, add_all is better.
            # Using add_all to ensure constraints and defaults are handled by ORM if needed
            db.add_all(instances)
            db.commit()
            
            return len(instances)
        except exc.SQLAlchemyError as e:
            db.rollback()
            raise e
        except Exception as e:
            db.rollback()
            raise e
