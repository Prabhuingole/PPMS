import json
# Import app.main first to ensure all models are imported in correct order
import app.main

from app.database.session import SessionLocal
from app.models.timesheet import Timesheet
from app.schemas.timesheet import TimesheetResponse

db = SessionLocal()
ts = db.query(Timesheet).filter(Timesheet.id == 16).first()
if not ts:
    ts = db.query(Timesheet).filter(Timesheet.feedback != None).first()

if not ts:
    print("No timesheet with feedback found in DB to test with.")
    db.close()
    exit(1)

# Populate user name like in route
ts.user_name = ts.user.full_name if ts.user else None

# Serialize via Pydantic
pydantic_model = TimesheetResponse.from_orm(ts)
print("Pydantic model serialized JSON:")
print(json.dumps(json.loads(pydantic_model.json()), indent=2))

db.close()
