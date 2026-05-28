import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.session import SessionLocal
from app.models.user import User
from app.models.reporting_manager import ReportingManager
from app.models.project import Project
from app.models.timesheet import Timesheet

db = SessionLocal()
timesheets = db.query(Timesheet).all()
for ts in timesheets[:5]:
    project_name = ts.project.name if ts.project else None
    print(f"ID: {ts.id}, Project Name: {project_name}")
