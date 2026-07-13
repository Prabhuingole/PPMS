import sqlite3
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def add_is_auto_clock_out():
    if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
        print(f"Connecting to PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        try:
            cursor.execute("ALTER TABLE attendance ADD COLUMN is_auto_clock_out BOOLEAN DEFAULT FALSE;")
            print("Successfully added is_auto_clock_out column to Postgres DB.")
        except Exception as e:
            print(f"Error (might already exist): {e}")
        finally:
            conn.commit()
            conn.close()
    else:
        db_path = "pms.db"
        if not os.path.exists(db_path):
            db_path = "sql_app.db"
            
        if os.path.exists(db_path):
            print(f"Connecting to SQLite: {db_path}...")
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            try:
                cursor.execute("ALTER TABLE attendance ADD COLUMN is_auto_clock_out BOOLEAN DEFAULT 0;")
                print("Successfully added is_auto_clock_out column to SQLite DB.")
            except Exception as e:
                print(f"Error (might already exist): {e}")
            finally:
                conn.commit()
                conn.close()
        else:
            print("No database found to patch.")

if __name__ == "__main__":
    add_is_auto_clock_out()
