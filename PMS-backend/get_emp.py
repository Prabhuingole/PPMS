import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.session import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id}, Email: {u.email}, Role: {u.role}")
