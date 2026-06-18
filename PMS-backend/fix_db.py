from app.database.session import engine
from sqlalchemy import text

def add_col():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE companies ADD COLUMN points_of_contact JSON DEFAULT '[]'::json;"))
            print("Successfully added points_of_contact column!")
        except Exception as e:
            print("Error adding column:", e)

if __name__ == "__main__":
    add_col()
