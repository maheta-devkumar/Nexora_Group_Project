from sqlalchemy.orm import Session
from models.cart import Cart
from models.product_catalog.product_variant import ProductVariant
from models.address import Address
from models.marketing.coupon import Coupon
from models.order.order import Order
from models.order.order_item import OrderItem

class CheckoutRepository:

    @staticmethod
    def get_cart_items(db: Session, user_id: int):
        return (
            db.query(Cart)
              .join(ProductVariant)
              .filter(Cart.user_id == user_id)
              .all()
        )

    @staticmethod
    def get_address(db: Session, user_id: int, address_id: int):
        return db.query(Address).filter(
            Address.address_id == address_id,
            Address.user_id == user_id
        ).first()

    @staticmethod
    def get_coupon(db: Session, code: str):
        return db.query(Coupon).filter(Coupon.code == code).first()

    @staticmethod
    def create_order(db: Session, order: Order, items: list[OrderItem]):
        db.add(order)
        db.flush()  # get order_id

        for item in items:
            item.order_id = order.order_id
            db.add(item)

        db.commit()
        db.refresh(order)
        return order
