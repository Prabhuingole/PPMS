from app.database.session import SessionLocal
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.user import User
from app.models.document import ProjectDocument
from sqlalchemy import text

db = SessionLocal()

def explain_query(query_str):
    res = db.execute(text(f"EXPLAIN ANALYZE {query_str}")).fetchall()
    for row in res:
        print(row)

print("--- GET /projects ---")
explain_query("SELECT * FROM projects WHERE owner_company_id = 1")

print("\n--- GET /timesheets/grouped ---")
explain_query("SELECT * FROM timesheets WHERE company_id = 1")

print("\n--- GET /employees ---")
explain_query("SELECT * FROM users WHERE company_id = 1")

print("\n--- GET /documents ---")
explain_query("SELECT * FROM project_documents WHERE company_id = 1")

db.close()
