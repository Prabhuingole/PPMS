import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.session import SessionLocal
from app.models.user import User
from app.routes.timesheets import get_my_timesheets

db = SessionLocal()
user = db.query(User).filter(User.role == "employee").first()
if not user:
    print("No employee found")
    sys.exit(0)

try:
    timesheets = get_my_timesheets(db=db, current_user=user)
    print(f"Success! Returned {len(timesheets)} timesheets")
    print(timesheets[0].__dict__ if timesheets else "No timesheets")
except Exception as e:
    print(f"Error: {e}")
