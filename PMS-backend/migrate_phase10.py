import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

def run_migration():
    with engine.connect() as conn:
        print("Migrating users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN employment_type VARCHAR DEFAULT 'internal'"))
        except Exception as e:
            print("employment_type might exist:", e)
        
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN consultant_type VARCHAR"))
        except Exception as e:
            print("consultant_type might exist:", e)

        print("Migrating timesheets table...")
        try:
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN is_billable BOOLEAN DEFAULT true"))
        except Exception as e:
            print("is_billable might exist:", e)

        try:
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN billed_rate FLOAT"))
        except Exception as e:
            print("billed_rate might exist:", e)

        try:
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN billing_status VARCHAR DEFAULT 'draft'"))
        except Exception as e:
            print("billing_status might exist:", e)

        try:
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL"))
        except Exception as e:
            print("invoice_id might exist:", e)

        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    from app.database.session import Base
    import app.models.company
    import app.models.user
    import app.models.project
    import app.models.timesheet
    import app.models.document
    import app.models.invoice
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    run_migration()
