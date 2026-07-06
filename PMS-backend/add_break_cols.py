import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found")
    exit(1)

engine = create_engine(db_url)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE timesheets ADD COLUMN break_hours INTEGER DEFAULT 0"))
        print("Added break_hours")
    except Exception as e:
        print("break_hours may already exist:", e)

    try:
        conn.execute(text("ALTER TABLE timesheets ADD COLUMN break_minutes INTEGER DEFAULT 0"))
        print("Added break_minutes")
    except Exception as e:
        print("break_minutes may already exist:", e)
    
    conn.commit()
print("Done")
