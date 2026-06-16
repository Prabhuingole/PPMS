from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE companies ADD COLUMN company_name VARCHAR"))
        print("Added company_name column")
    except Exception as e:
        print("Error:", e)
