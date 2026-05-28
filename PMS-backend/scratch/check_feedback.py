from app.database.session import engine, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.reporting_manager import ReportingManager
from app.models.document import ProjectDocument
from app.models.template import DocumentTemplate

db = SessionLocal()
timesheets = db.query(Timesheet).filter(Timesheet.feedback != None).all()
print(f"Found {len(timesheets)} timesheets with feedback:")
for ts in timesheets:
    print(f"ID: {ts.id}, Status: {ts.status}, Feedback: {ts.feedback}")
db.close()
