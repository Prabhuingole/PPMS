import sys
import os

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from sqlalchemy import text
from app.database.session import engine, Base
from app.models.deliverable import Deliverable
from app.models.task import Task
from app.models.resource_allocation import ResourceAllocation

def run_migration():
    print("Starting Database Migration Phase 12B...")
    
    # 1. Create deliverables, tasks, resource_allocations tables via SQLAlchemy Metadata
    print("Creating tables: deliverables, tasks, resource_allocations...")
    Base.metadata.create_all(bind=engine, tables=[
        Deliverable.__table__,
        Task.__table__,
        ResourceAllocation.__table__
    ])
    print("Tables created successfully (if they did not exist).")

    # 2. Add weekly_capacity_hours to users
    with engine.begin() as conn:
        print("Checking if weekly_capacity_hours column needs to be added to users...")
        try:
            # PostgreSQL syntax
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_capacity_hours FLOAT DEFAULT 40.0 NOT NULL;"))
            print("Added weekly_capacity_hours column to users table.")
        except Exception as pg_err:
            try:
                # SQLite fallback or standard ALTER
                conn.execute(text("ALTER TABLE users ADD COLUMN weekly_capacity_hours FLOAT DEFAULT 40.0 NOT NULL;"))
                print("Added weekly_capacity_hours column to users table (fallback).")
            except Exception as fallback_err:
                print(f"weekly_capacity_hours column already exists or failed to add: {fallback_err}")
                
    print("Migration Phase 12B complete!")

if __name__ == "__main__":
    run_migration()
