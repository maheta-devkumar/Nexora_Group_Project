from sqlalchemy.orm import Session
from models.order.order import Order
from models.order.order_item import OrderItem
from models.order.order_history import OrderHistory
from models.order.order_return import OrderReturn
from models.order.order_refund import OrderRefund
from sqlalchemy import func

class OrderAdminRepository:

    def get_all_orders(self, db, page, per_page, status):
        q = db.query(Order)
        if status:
            q = q.filter(Order.order_status == status)
        return q.all()

    def get_order_by_id(self, db, order_id):
        return db.query(Order).filter(Order.order_id == order_id).first()

    def delete_order(self, db, order_id):
        order = self.get_order_by_id(db, order_id)
        db.delete(order)

    def get_order_items(self, db, order_id):
        return db.query(OrderItem).filter(OrderItem.order_id == order_id).all()

    def update_order_item_qty(self, db, order_id: int, variant_id: int, qty: int):
        item = db.query(OrderItem).filter(
            OrderItem.order_id == order_id,
            OrderItem.variant_id == variant_id
        ).first()

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Order item not found for this order"
            )

        item.quantity = qty
        item.total = item.price * qty

        db.commit()
        db.refresh(item)

        return item

    def remove_order_item(self, db, order_id, variant_id):
        item = db.query(OrderItem).filter_by(
            order_id=order_id,
            variant_id=variant_id
        ).first()

        if not item:
            raise HTTPException(
                status_code=404,
                detail="Order item not found"
            )

        db.delete(item)
        db.commit()

        return {"message": "Order item removed"}

    def get_order_history(self, db, order_id):
        return db.query(OrderHistory).filter(OrderHistory.order_id == order_id).all()

    def add_history(self, db, order_id, status, admin_id):
        history = OrderHistory(
            order_id=order_id,
            status=status,
            updated_by=admin_id
        )
        db.add(history)
        db.flush()       # ensures ID is generated
        db.refresh(history)

        return history

    def list_all_returns(self, db):
        return db.query(OrderReturn).all()

    def get_return_request(self, db, return_id):
        return db.query(OrderReturn).filter_by(return_id=return_id).first()

    def update_return_status(self, db, return_id, status):
        r = self.get_return_request(db, return_id)
        r.status = status
        db.commit()
        return r

    def get_return_items(self, db, return_id):
        r = self.get_return_request(db, return_id)
        return r.items

    def list_all_refunds(self, db):
        return db.query(OrderRefund).all()

    def get_refund(self, db, refund_id):
        return db.query(OrderRefund).filter_by(refund_id=refund_id).first()

    def create_refund(self, db, return_id, admin_id):
        refund = OrderRefund(
            return_id=return_id,
            amount=0,
            status="PROCESSING",
            processed_by=admin_id
        )
        db.add(refund)
        db.commit()
        return refund

    def update_refund_status(self, db, refund_id, status):
        refund = self.get_refund(db, refund_id)
        refund.status = status
        db.commit()
        return refund

    def get_order_stats(self, db):
        return {
            "total": db.query(func.count(Order.order_id)).scalar(),
            "placed": db.query(Order).filter(Order.order_status == "PLACED").count(),
            "delivered": db.query(Order).filter(Order.order_status == "DELIVERED").count()
        }

    def get_orders_by_date(self, db, start, end):
        return db.query(Order).filter(Order.placed_at.between(start, end)).all()

    def get_orders_by_payment_status(self, db, status):
        return db.query(Order).filter(Order.payment_status == status).all()

    def get_orders_by_delivery_status(self, db, status):
        return db.query(Order).filter(Order.order_status == status).all()
