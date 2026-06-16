import sys
import os

# Add the project root to the python path
sys.path.append(os.path.abspath("e:/sam projects/SPMS/PMS-backend"))

from app.database.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectUpdate
from app.routes.project_management import update_project
from fastapi import BackgroundTasks, Request
from unittest.mock import MagicMock

# Import all models to avoid mapper errors
from app.models import user, company, reporting_manager, timesheet, project, associations, deliverable, task, resource_allocation
import traceback

db = SessionLocal()
try:
    admin = db.query(User).filter(User.role == "superadmin").first()
    target_project = db.query(Project).first()

    if target_project:
        print(f"Updating project: {target_project.id} - {target_project.name}")
        payload = ProjectUpdate(
            name="Updated Name",
            code="",
        )

        request_mock = MagicMock(spec=Request)
        request_mock.client.host = "127.0.0.1"
        request_mock.state.user = admin
        
        bg_tasks = BackgroundTasks()
        
        updated = update_project(
            project_id=target_project.id,
            payload=payload,
            background_tasks=bg_tasks,
            request=request_mock,
            db=db,
            admin=admin
        )
        print("Project updated successfully!", updated.code)
except Exception as e:
    traceback.print_exc()
finally:
    db.close()
