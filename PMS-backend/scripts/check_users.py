import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.session import SessionLocal
from app.models.user import User

def check_db():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.role.in_(['superadmin', 'admin'])).all()
        for u in users:
            print(f"Email: {u.email}, Role: {u.role}")
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
