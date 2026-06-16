import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Migrating invoices table for Phase 11A...")
        try:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN subtotal FLOAT DEFAULT 0.0 NOT NULL;"))
            print("Added subtotal to invoices.")
        except Exception as e:
            print(f"Skipping subtotal: {e}")

        try:
            conn.execute(text("ALTER TABLE invoices ADD COLUMN tax_amount FLOAT DEFAULT 0.0 NOT NULL;"))
            print("Added tax_amount to invoices.")
        except Exception as e:
            print(f"Skipping tax_amount: {e}")

        for col in ["created_by_id", "issued_by_id", "paid_by_id"]:
            try:
                conn.execute(text(f"ALTER TABLE invoices ADD COLUMN {col} INTEGER REFERENCES users(id) ON DELETE RESTRICT;"))
                print(f"Added {col} to invoices.")
            except Exception as e:
                print(f"Skipping {col}: {e}")

        conn.commit()
    print("Migration 11A complete!")

if __name__ == "__main__":
    run_migration()
