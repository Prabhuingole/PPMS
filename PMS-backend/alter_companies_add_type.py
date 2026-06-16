from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE companies ADD COLUMN company_type VARCHAR DEFAULT 'client'"))
        print("Added company_type column to companies table.")
    except Exception as e:
        print("Error or already exists:", e)
