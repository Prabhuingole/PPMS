import psycopg2

DATABASE_URL = "postgresql://postgres:root@localhost:5432/sambhavpms"

def migrate():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Starting migration...")
        # Add display_name column
        cur.execute("ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS display_name VARCHAR;")
        print("Added display_name column or it already exists.")
        
        # Add preparation_date column
        cur.execute("ALTER TABLE project_documents ADD COLUMN IF NOT EXISTS preparation_date TIMESTAMP;")
        print("Added preparation_date column or it already exists.")
        
        conn.commit()
        print("Migration successful.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
