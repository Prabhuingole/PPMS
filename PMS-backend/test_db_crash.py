from app.database.session import SessionLocal
from app.models.company import Company
import traceback

def test():
    db = SessionLocal()
    try:
        companies = db.query(Company).limit(5).all()
        for c in companies:
            print(f"Company ID: {c.id}, POC: {c.points_of_contact}")
    except Exception as e:
        print("EXCEPTION CAUGHT:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test()
