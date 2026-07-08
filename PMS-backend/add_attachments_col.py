import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(db_url)
with engine.connect() as conn:
    try:
        # SQLite doesn't strictly support JSON keyword in ALTER TABLE natively, but typically TEXT or JSON works depending on SQLAlchemy dialect. Postgres uses JSON or JSONB. 
        # Using JSON which SQLAlchemy usually maps correctly, or we can use JSONB for Postgres and JSON for sqlite.
        # Let's try JSON first.
        conn.execute(text("ALTER TABLE timesheets ADD COLUMN attachments JSON"))
        print("Successfully added attachments column as JSON.")
    except Exception as e:
        print("Could not add attachments column. It may already exist, or JSON type isn't supported. Error:", e)

    conn.commit()
print("Migration done.")
