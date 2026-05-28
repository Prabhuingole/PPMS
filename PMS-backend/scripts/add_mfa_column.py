import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from sqlalchemy import text
from app.database.session import engine

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_mfa_verified_at TIMESTAMP;"))
            conn.commit()
            print("Successfully added last_mfa_verified_at column to users table.")
        except Exception as e:
            print(f"Error (maybe column already exists): {e}")

if __name__ == "__main__":
    run_migration()
