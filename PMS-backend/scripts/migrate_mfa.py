import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import text
from app.database.session import engine

def run_migration():
    print("Starting migration...")
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_mfa_enabled BOOLEAN DEFAULT FALSE;"))
            print("Added is_mfa_enabled")
        except Exception as e:
            print(f"is_mfa_enabled error: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN mfa_otp VARCHAR;"))
            print("Added mfa_otp")
        except Exception as e:
            print(f"mfa_otp error: {e}")

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN mfa_otp_expires_at TIMESTAMP;"))
            print("Added mfa_otp_expires_at")
        except Exception as e:
            print(f"mfa_otp_expires_at error: {e}")
            
        conn.commit()

    print("Migration completed.")

if __name__ == "__main__":
    run_migration()
