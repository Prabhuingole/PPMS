import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

from app.database.session import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE timesheets ADD COLUMN is_unassigned_project BOOLEAN DEFAULT FALSE;"))
        conn.commit()
    print("Column added successfully.")
except Exception as e:
    print(f"Error: {e}")
