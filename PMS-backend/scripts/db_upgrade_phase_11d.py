import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from app.database.session import engine
from sqlalchemy import text

def upgrade_db():
    with engine.begin() as conn:
        try:
            # Add columns to invoices
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reference VARCHAR;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR;"))
            conn.execute(text("ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMP;"))
            print("Successfully added columns to 'invoices' table.")
            
            # Create invoice_reminder_logs table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS invoice_reminder_logs (
                    id SERIAL PRIMARY KEY,
                    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
                    reminder_type VARCHAR NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS ix_invoice_reminder_logs_invoice_id 
                ON invoice_reminder_logs(invoice_id);
            """))
            print("Successfully created 'invoice_reminder_logs' table.")
        except Exception as e:
            print(f"Error executing DB upgrade: {e}")

if __name__ == "__main__":
    upgrade_db()
