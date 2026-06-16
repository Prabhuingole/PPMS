import sys
import os

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from app.core.config import settings

def run_migration():
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        print("Migrating timesheets table...")
        # Add billed_currency
        try:
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN billed_currency VARCHAR(10);"))
            print("Added billed_currency to timesheets.")
        except Exception as e:
            print(f"Skipping billed_currency: {e}")

        # Drop and recreate FK for timesheets.user_id
        try:
            # Drop constraint (might be named timesheets_user_id_fkey)
            conn.execute(text("ALTER TABLE timesheets DROP CONSTRAINT timesheets_user_id_fkey;"))
            conn.execute(text("ALTER TABLE timesheets ADD CONSTRAINT timesheets_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;"))
            print("Updated timesheets_user_id_fkey to RESTRICT.")
        except Exception as e:
            print(f"Error updating timesheets_user_id_fkey: {e}")

        # Drop and recreate FK for project_documents.uploaded_by_id
        try:
            # Assuming it's named project_documents_uploaded_by_id_fkey
            conn.execute(text("ALTER TABLE project_documents DROP CONSTRAINT project_documents_uploaded_by_id_fkey;"))
            conn.execute(text("ALTER TABLE project_documents ADD CONSTRAINT project_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE RESTRICT;"))
            print("Updated project_documents_uploaded_by_id_fkey to RESTRICT.")
        except Exception as e:
            print(f"Error updating project_documents_uploaded_by_id_fkey: {e}")

        conn.commit()
    print("Migration 10F complete!")

if __name__ == "__main__":
    run_migration()
