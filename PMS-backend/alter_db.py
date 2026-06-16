from app.database.session import engine
from sqlalchemy import text

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE projects ALTER COLUMN code DROP NOT NULL"))
    print("Dropped NOT NULL constraint on code column in projects table.")
