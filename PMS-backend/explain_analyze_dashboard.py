import time
from sqlalchemy import text
from app.database.session import SessionLocal
from app.models.timesheet import Timesheet
from app.models.user import User
from app.models.project import Project
from app.models.attendance import Attendance
from app.models.reporting_manager import ReportingManager
from sqlalchemy import func, case, cast, Date
from datetime import datetime, timedelta

db = SessionLocal()

now = datetime.utcnow()
start_date = (now - timedelta(days=6)).date()
end_date = now.date()

print("--- 1. Consolidated Stats Query ---")
q1 = db.query(
    func.count(Timesheet.id).label('total'),
    func.sum(case((Timesheet.status == 'pending', 1), else_=0)).label('pending'),
    func.sum(case((Timesheet.status == 'approved', 1), else_=0)).label('approved'),
    func.sum(case((Timesheet.status == 'rejected', 1), else_=0)).label('rejected')
)
stmt1 = str(q1.statement.compile(compile_kwargs={"literal_binds": True}))
explain1 = db.execute(text(f"EXPLAIN ANALYZE {stmt1}")).fetchall()
for row in explain1:
    print(row[0])


print("\n--- 2. 7-Day Aggregation Query ---")
q2 = db.query(
    cast(Timesheet.date, Date), 
    func.sum(Timesheet.hours)
).filter(
    cast(Timesheet.date, Date).between(start_date, end_date),
    Timesheet.status == 'approved'
).group_by(
    cast(Timesheet.date, Date)
)
stmt2 = str(q2.statement.compile(compile_kwargs={"literal_binds": True}))
explain2 = db.execute(text(f"EXPLAIN ANALYZE {stmt2}")).fetchall()
for row in explain2:
    print(row[0])


print("\n--- 3. Recent Timesheets Query ---")
q3 = db.query(Timesheet).join(User, Timesheet.user_id == User.id).order_by(Timesheet.created_at.desc()).limit(10)
stmt3 = str(q3.statement.compile(compile_kwargs={"literal_binds": True}))
explain3 = db.execute(text(f"EXPLAIN ANALYZE {stmt3}")).fetchall()
for row in explain3:
    print(row[0])

db.close()
