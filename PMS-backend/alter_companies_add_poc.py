from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE companies ADD COLUMN points_of_contact JSON DEFAULT '[]'::json"))
        print("Added points_of_contact column to companies table.")
    except Exception as e:
        print("Error or already exists:", e)
