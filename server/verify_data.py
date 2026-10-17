from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker
from config.database import Base, DB_URI
from models.order.order import Order
from models.product_catalog.product import Product
from models.user import User

# Setup DB connection
engine = create_engine(DB_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    order_count = db.query(func.count(Order.order_id)).scalar()
    product_count = db.query(func.count(Product.product_id)).scalar()
    user_count = db.query(func.count(User.user_id)).scalar()
    
    print(f"Orders: {order_count}")
    print(f"Products: {product_count}")
    print(f"Users: {user_count}")
    
    if order_count > 0:
        print("Data exists. Checking sales query...")
        # Test sales query
        results = db.query(
            func.date(Order.placed_at).label("date"),
            func.count(Order.order_id).label("orders_count"),
            func.sum(Order.total_amount).label("revenue")
        ).group_by(func.date(Order.placed_at)).limit(5).all()
        print(f"Sales Query Results: {results}")

except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
