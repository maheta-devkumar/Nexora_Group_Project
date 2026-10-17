import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add current directory to path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DB_URI = os.getenv("DB_URI", "postgresql+psycopg2://postgres:root@localhost:5432/nexora2")
engine = create_engine(DB_URI)

def fix_column_length():
    with engine.connect() as connection:
        print("Checking database schema...")
        
        try:
            print("Resizing 'delivery_otp' column in 'delivery' table...")
            # Force resize to 255
            connection.execute(text("ALTER TABLE delivery ALTER COLUMN delivery_otp TYPE VARCHAR(255)"))
            print("'delivery_otp' column resized to VARCHAR(255).")
        except Exception as e:
            print(f"Error resizing column: {e}")
            
        connection.commit()
        print("\nFix completed successfully!")

if __name__ == "__main__":
    fix_column_length()
