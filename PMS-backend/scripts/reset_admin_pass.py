import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email == 'admin@sambhav.com').first()
if user:
    new_hash = get_password_hash('admin@sam')
    user.hashed_password = new_hash
    db.commit()
    print("Password reset successfully for admin@sambhav.com to 'admin@sam'")
else:
    print("User not found!")
db.close()
