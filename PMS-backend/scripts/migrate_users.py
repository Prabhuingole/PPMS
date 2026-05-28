import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.session import engine
from sqlalchemy import text

def run_migration():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users RENAME COLUMN requires_password_change TO must_change_password;"))
            print("Renamed requires_password_change to must_change_password")
        except Exception as e:
            print(f"Error renaming column (maybe already renamed): {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN account_status VARCHAR DEFAULT 'active';"))
            print("Added account_status column")
        except Exception as e:
            print(f"Error adding account_status column: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;"))
            print("Added last_login_at column")
        except Exception as e:
            print(f"Error adding last_login_at column: {e}")

        conn.commit()
        print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
