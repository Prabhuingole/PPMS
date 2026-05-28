import sys
from sqlalchemy import text
from app.database.session import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating notifications table...")
        
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN priority VARCHAR(50) DEFAULT 'LOW'"))
            print("Added priority column")
        except Exception as e:
            print(f"Column priority already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN category VARCHAR(50) DEFAULT 'SYSTEM'"))
            print("Added category column")
        except Exception as e:
            print(f"Column category already exists or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN action_url VARCHAR(255)"))
            print("Added action_url column")
        except Exception as e:
            print(f"Column action_url already exists or error: {e}")
            
        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
