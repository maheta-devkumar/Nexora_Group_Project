from sqlalchemy import Column, Integer, ForeignKey, DECIMAL
from sqlalchemy.orm import relationship
from config.database import Base

class PurchaseItem(Base):
    __tablename__ = "purchase_item"

    purchase_id = Column(Integer, ForeignKey("purchase.purchase_id", ondelete="CASCADE"), primary_key=True)
    variant_id = Column(Integer, ForeignKey("product_variant.variant_id", ondelete="RESTRICT"), primary_key=True)
    quantity = Column(Integer, nullable=False)
    cost_per_unit = Column(DECIMAL(12, 2), nullable=False)
    total_cost = Column(DECIMAL(12, 2), nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    variant = relationship("ProductVariant")