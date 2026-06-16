import sys
import os

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database.session import engine, Base
from app.models.company import Company
from app.models.associations import project_companies
from app.models.user import User
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.document import ProjectDocument
from app.models.attendance import Attendance
from app.models.audit_log import AuditLog

def run_migration():
    print("Starting Database Migration Phase 9A...")
    
    # Create new tables (companies, project_companies)
    Base.metadata.create_all(bind=engine, tables=[
        Company.__table__,
        project_companies
    ])
    print("New tables created.")

    alter_statements = [
        # users table
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate FLOAT;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS currency VARCHAR;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;",
        
        # projects table
        "ALTER TABLE projects ADD COLUMN IF NOT EXISTS owner_company_id INTEGER;",
        
        # timesheets table
        "ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS company_id INTEGER;",
        
        # project_documents table
        "ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS company_id INTEGER;",
        
        # attendance table
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude FLOAT;",
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude FLOAT;",
        "ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_accuracy FLOAT;",
        
        # audit_logs table
        "ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS company_id INTEGER;"
    ]

    with engine.connect() as conn:
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                print(f"Error executing statement: {stmt}\nError: {e}")
                
        # Provision default company
        try:
            conn.execute(text("""
                INSERT INTO companies (id, name, code, status, created_at, updated_at)
                VALUES (1, 'System Default', 'SYS-001', 'active', NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            """))
            print("System Default company provisioned.")
        except Exception as e:
            print(f"Error provisioning default company: {e}")

        # Data backfill
        try:
            res1 = conn.execute(text("UPDATE users SET company_id = 1 WHERE role != 'superadmin' AND company_id IS NULL;"))
            res2 = conn.execute(text("UPDATE projects SET owner_company_id = 1 WHERE owner_company_id IS NULL;"))
            
            # Backfill project_companies
            conn.execute(text("""
                INSERT INTO project_companies (project_id, company_id)
                SELECT id, 1 FROM projects
                ON CONFLICT DO NOTHING;
            """))
            
            res3 = conn.execute(text("UPDATE timesheets SET company_id = 1 WHERE company_id IS NULL;"))
            res4 = conn.execute(text("UPDATE project_documents SET company_id = 1 WHERE company_id IS NULL;"))
            res5 = conn.execute(text("UPDATE audit_logs SET company_id = 1 WHERE company_id IS NULL;"))
            
            print(f"Backfill complete.")
            print(f"Users migrated: {res1.rowcount}")
            print(f"Projects migrated: {res2.rowcount}")
            print(f"Timesheets migrated: {res3.rowcount}")
            print(f"Documents migrated: {res4.rowcount}")
            print(f"Audit logs migrated: {res5.rowcount}")
            
            # Apply foreign key constraints and NOT NULL logic after backfill
            constraints = [
                "ALTER TABLE users ADD CONSTRAINT fk_user_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;",
                "ALTER TABLE projects ADD CONSTRAINT fk_project_owner_company FOREIGN KEY (owner_company_id) REFERENCES companies(id) ON DELETE RESTRICT;",
                "ALTER TABLE projects ALTER COLUMN owner_company_id SET NOT NULL;",
                "ALTER TABLE timesheets ADD CONSTRAINT fk_timesheet_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;",
                "ALTER TABLE project_documents ADD CONSTRAINT fk_document_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;",
                "ALTER TABLE audit_logs ADD CONSTRAINT fk_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT;"
            ]
            for stmt in constraints:
                try:
                    conn.execute(text(stmt))
                except Exception as e:
                    # Ignore if constraint already exists
                    pass
            print("Constraints applied.")
            
            conn.commit()
            
        except Exception as e:
            print(f"Error during backfill: {e}")

if __name__ == "__main__":
    run_migration()
