import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.session import SessionLocal

# Import all models to configure all SQLAlchemy relations
from app.models.user import User
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.reporting_manager import ReportingManager
from app.models.document import ProjectDocument
from app.models.template import DocumentTemplate
from app.models.notification import Notification

from app.schemas.user import EmployeeResponse

db = SessionLocal()
user = db.query(User).filter(User.employee_id != None).first()
if user:
    print(f"Loaded User ID: {user.id}, Email: {user.email}")
    print(f"Direct timesheets count: {len(user.timesheets)}")
    print(f"Direct projects count: {len(user.projects)}")
    try:
        serialized = EmployeeResponse.model_validate(user)
        print("Serialization successful!")
        print(f"Serialized timesheets count: {len(serialized.timesheets)}")
        print(f"Serialized projects count: {len(serialized.projects)}")
        if serialized.timesheets:
            print("First timesheet serialized:", serialized.timesheets[0].model_dump())
    except Exception as e:
        print("Serialization failed:", e)
else:
    print("No user found with an employee_id")
db.close()
