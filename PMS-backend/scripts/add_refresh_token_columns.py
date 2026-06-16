import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token_hash VARCHAR;"))
        conn.execute(text("ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMP;"))
        conn.commit()
    print("Columns added successfully.")
except Exception as e:
    print(f"Error: {e}")
