import time
import sys
import os

sys.path.append("e:/sam projects/SPMS/PMS-backend")

from app.database.session import SessionLocal
from app.routes.project_management import get_projects
from app.routes.timesheets import get_all_timesheets
from app.models.user import User

db = SessionLocal()
admin = db.query(User).filter(User.role == "superadmin").first()

if not admin:
    print("No superadmin found!")
    exit(1)

print(f"Logged in as {admin.email}")

t0 = time.time()
projects_res = get_projects(page=1, limit=100, db=db, current_user=admin)
t1 = time.time()
proj_len = len(str(projects_res))
print(f"Projects (Baseline): {t1-t0:.3f}s, size: ~{proj_len} bytes")

t0 = time.time()
timesheets_res = get_all_timesheets(db=db, admin=admin)
t1 = time.time()
ts_len = len(str(timesheets_res))
print(f"Timesheets All (Baseline): {t1-t0:.3f}s, size: ~{ts_len} bytes")

db.close()
