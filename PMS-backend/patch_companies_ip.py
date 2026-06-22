from app.database.session import engine
from sqlalchemy import text

def patch_db():
    with engine.begin() as conn:
        try:
            print("Adding restrict_clockin_to_office_ip...")
            conn.execute(text("ALTER TABLE companies ADD COLUMN restrict_clockin_to_office_ip BOOLEAN DEFAULT FALSE;"))
        except Exception as e:
            print(f"Failed or already exists: {e}")
            
        try:
            print("Adding office_ip_addresses...")
            conn.execute(text("ALTER TABLE companies ADD COLUMN office_ip_addresses JSON DEFAULT '[]'::json;"))
        except Exception as e:
            print(f"Failed or already exists: {e}")
            
    print("Database patched successfully.")

if __name__ == "__main__":
    patch_db()
