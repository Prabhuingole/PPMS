import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath("e:/sam projects/SPMS/PMS-backend"))

from app.database.session import SessionLocal
from app.models.user import User
from app.schemas.project import ProjectCreate
from app.routes.project_management import create_project
from fastapi import BackgroundTasks, Request
from unittest.mock import MagicMock

db = SessionLocal()
admin = db.query(User).filter(User.role == "superadmin").first()

payload = ProjectCreate(
    name="Test Project Error Test",
    code="",
    status="planning",
    owner_company_id=1,
    participating_company_ids=[1],
    member_ids=[]
)

try:
    request_mock = MagicMock(spec=Request)
    request_mock.client.host = "127.0.0.1"
    request_mock.state.user = admin
    
    bg_tasks = BackgroundTasks()
    
    project = create_project(
        payload=payload,
        background_tasks=bg_tasks,
        request=request_mock,
        db=db,
        admin=admin
    )
    print("Project created successfully!", project.id)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
