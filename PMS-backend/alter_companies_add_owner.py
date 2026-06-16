from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    try:
        conn.execute(text("ALTER TABLE companies ADD COLUMN company_owner VARCHAR"))
        print("Added company_owner column")
    except Exception as e:
        print("Error:", e)
