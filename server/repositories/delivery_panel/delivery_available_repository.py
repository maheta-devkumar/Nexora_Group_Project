from sqlalchemy.orm import Session
from datetime import datetime


class DeliveryAvailableRepository:

    def get_available_deliveries(self, db: Session):
        """Get available deliveries"""
        return db.execute(
            """
            SELECT 
                d.delivery_id,
                d.order_id,
                d.status,
                d.available_since,
                o.shipping_address,
                c.first_name,
                c.last_name
            FROM delivery d
            JOIN "order" o ON d.order_id = o.order_id
            JOIN "user" c ON o.customer_id = c.user_id
            WHERE d.status = 'AVAILABLE'
              AND d.is_available = true
            ORDER BY d.available_since ASC
            """
        ).fetchall()

    def check_delivery_availability(self, db: Session, delivery_id: int):
        """Check if delivery is available"""
        result = db.execute(
            """
            SELECT status, is_available, delivery_person_id 
            FROM delivery 
            WHERE delivery_id = :delivery_id
            """,
            {"delivery_id": delivery_id}
        ).fetchone()
        
        return result

    def assign_delivery(self, db: Session, delivery_id: int, delivery_person_id: int):
        """Assign delivery to person"""
        db.execute(
            """
            UPDATE delivery 
            SET delivery_person_id = :dp_id,
                status = 'ASSIGNED',
                is_available = false,
                assigned_at = :now
            WHERE delivery_id = :delivery_id
            """,
            {
                "dp_id": delivery_person_id,
                "delivery_id": delivery_id,
                "now": datetime.utcnow()
            }
        )
        db.commit()

    def cancel_delivery(self, db: Session, delivery_id: int):
        """Cancel delivery and make available"""
        db.execute(
            """
            UPDATE delivery 
            SET status = 'AVAILABLE',
                is_available = true,
                delivery_person_id = NULL,
                available_since = :now
            WHERE delivery_id = :delivery_id
            """,
            {
                "delivery_id": delivery_id,
                "now": datetime.utcnow()
            }
        )
        db.commit()