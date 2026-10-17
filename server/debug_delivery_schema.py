from sqlalchemy import inspect
from config.database import engine
import logging

logging.basicConfig(level=logging.INFO)

def inspect_schema():
    inspector = inspect(engine)
    columns = inspector.get_columns('delivery')
    print("\n📦 DELIVERY TABLE SCHEMA:")
    for col in columns:
        print(f" - {col['name']}: {col['type']} (Nullable: {col['nullable']})")

if __name__ == "__main__":
    inspect_schema()
