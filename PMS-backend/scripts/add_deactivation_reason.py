import os
import sys

# Add backend dir to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN deactivation_reason VARCHAR;"))
            conn.commit()
            print("Successfully added deactivation_reason to users table.")
        except Exception as e:
            if 'already exists' in str(e).lower() or 'duplicate column' in str(e).lower():
                print("Column already exists, skipping.")
            else:
                print(f"Error adding column: {e}")
                
if __name__ == "__main__":
    add_column()
