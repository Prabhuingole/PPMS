import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.getenv("DATABASE_URL")
engine = create_engine(db_url)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE note_pages ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE;"))
        conn.commit()
        print("Column project_id added successfully.")
    except Exception as e:
        print(f"Error: {e}")
