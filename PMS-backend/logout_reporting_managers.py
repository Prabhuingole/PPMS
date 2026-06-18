import sys
from sqlalchemy import text
from app.database.session import SessionLocal

def run_migration():
    db = SessionLocal()
    try:
        print("Finding active sessions for reporting managers...")
        query = text("""
            UPDATE user_sessions
            SET is_active = false, refresh_token_hash = null, refresh_token_expires_at = null
            WHERE is_active = true AND user_id IN (
                SELECT id FROM users WHERE role = 'reporting_manager'
            )
        """)
        result = db.execute(query)
        db.commit()
        print(f"Successfully logged out reporting manager sessions. Rows affected: {result.rowcount}")
    except Exception as e:
        db.rollback()
        print(f"Error during migration: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
