import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Add current directory to path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

DB_URI = os.getenv("DB_URI", "postgresql+psycopg2://postgres:root@localhost:5432/nexora2")
engine = create_engine(DB_URI)

def run_migration():
    with engine.connect() as connection:
        print("Checking database schema...")
        
        # 1. Update delivery table
        print("Checking 'delivery' table...")
        try:
            # Check if delivery_otp column exists
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='delivery' AND column_name='delivery_otp'"
            ))
            if not result.fetchone():
                print("  -> Adding 'delivery_otp' column")
                connection.execute(text("ALTER TABLE delivery ADD COLUMN delivery_otp VARCHAR(255)"))
            
            # Check if delivery_otp_expiry column exists
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='delivery' AND column_name='delivery_otp_expiry'"
            ))
            if not result.fetchone():
                print("  -> Adding 'delivery_otp_expiry' column")
                connection.execute(text("ALTER TABLE delivery ADD COLUMN delivery_otp_expiry TIMESTAMP"))
                
            print("'delivery' table updated.")
        except Exception as e:
            print(f"Error updating 'delivery' table: {e}")

        # 2. Update delivery_person table
        print("Checking 'delivery_person' table...")
        try:
            # Total Deliveries
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='delivery_person' AND column_name='total_deliveries'"
            ))
            if not result.fetchone():
                print("  -> Adding 'total_deliveries' column")
                connection.execute(text("ALTER TABLE delivery_person ADD COLUMN total_deliveries INTEGER DEFAULT 0"))

            # Total Earnings
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='delivery_person' AND column_name='total_earnings'"
            ))
            if not result.fetchone():
                print("  -> Adding 'total_earnings' column")
                connection.execute(text("ALTER TABLE delivery_person ADD COLUMN total_earnings DECIMAL(10, 2) DEFAULT 0.00"))

            # Success Rate
            result = connection.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='delivery_person' AND column_name='success_rate'"
            ))
            if not result.fetchone():
                print("  -> Adding 'success_rate' column")
                connection.execute(text("ALTER TABLE delivery_person ADD COLUMN success_rate DECIMAL(5, 2) DEFAULT 100.00"))

            print("'delivery_person' table updated.")
        except Exception as e:
            print(f"Error updating 'delivery_person' table: {e}")
            
        connection.commit()
        print("\nMigration completed successfully!")

if __name__ == "__main__":
    run_migration()
