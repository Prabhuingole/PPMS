import time
import sys

sys.path.append("e:/sam projects/SPMS/PMS-backend")

from app.database.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.reporting_manager import ReportingManager
from app.models.timesheet import Timesheet
from app.routes.timesheets import get_dashboard_stats

db = SessionLocal()
admin = db.query(User).filter(User.role == "superadmin").first()

t0 = time.time()
stats_res = get_dashboard_stats(db=db, admin=admin)
t1 = time.time()
stats_len = len(str(stats_res))
print(f"Timesheets Dashboard-Stats (Optimized): {t1-t0:.3f}s, size: ~{stats_len} bytes")

db.close()
