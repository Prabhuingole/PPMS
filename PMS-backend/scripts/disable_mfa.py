import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.session import SessionLocal
from app.models.user import User

def disable_mfa():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@sambhav.com").first()
        if user:
            user.is_mfa_enabled = False
            db.commit()
            print("Successfully disabled MFA for admin@sambhav.com")
        else:
            print("User admin@sambhav.com not found")
    finally:
        db.close()

if __name__ == "__main__":
    disable_mfa()
