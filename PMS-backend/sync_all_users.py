import sys
import os

# Ensure the app module can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.services.mail_sync_service import sync_user_to_mail

def main():
    db = SessionLocal()
    users = db.query(User).all()
    print(f"Found {len(users)} users in SPMS database. Starting sync...")
    
    for user in users:
        # Determine the correct Mail Automation role
        if user.role in ["superadmin", "admin"]:
            mail_role = "MAIL_ADMIN"
        else:
            mail_role = "MAIL_EMPLOYEE"

        payload = {
            "email": user.email,
            "full_name": user.full_name,
            "role": mail_role,
            "designation": user.designation,
            "phone_number": getattr(user, "phone_number", None),
            "is_active": user.is_active
        }
        
        sync_user_to_mail(payload)

    db.close()
    print("Done!")

if __name__ == "__main__":
    main()
