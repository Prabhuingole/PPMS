from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

# Load env vars
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        print("Adding 'bio' column to 'users' table...")
        conn.execute(text("ALTER TABLE users ADD COLUMN bio VARCHAR;"))
        conn.commit()
        print("Success: Column 'bio' added.")
    except Exception as e:
        print(f"Error: {e}")
        print("Note: If the column already exists, you can ignore this error.")
