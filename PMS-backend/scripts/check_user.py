import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.session import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@sambhav.com').first()
if user:
    print(f"User found: {user.email}")
    print(f"Hashed password: {user.hashed_password}")
    print(f"Is active: {user.is_active}")
    print(f"MFA enabled: {user.is_mfa_enabled}")
else:
    print("User admin@sambhav.com not found!")
db.close()
