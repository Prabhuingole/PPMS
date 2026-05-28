import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database.session import engine

def alter_db():
    try:
        with engine.connect() as conn:
            print("Adding updated_at to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("Successfully added updated_at to users.")
    except Exception as e:
        print(f"Error altering users: {e}")

    try:
        with engine.connect() as conn:
            print("Adding updated_at to timesheets...")
            conn.execute(text("ALTER TABLE timesheets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("Successfully added updated_at to timesheets.")
    except Exception as e:
        print(f"Error altering timesheets: {e}")

if __name__ == "__main__":
    alter_db()
