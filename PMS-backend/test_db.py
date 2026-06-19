import sys
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# connect to postgres
engine = create_engine('postgresql://postgres:postgres@localhost:5432/spms_db')
Session = sessionmaker(bind=engine)
db = Session()

from app.models.user import User
from app.models.task import Task
from app.models.project import Project

users = db.query(User).filter(User.role.in_(['employee', 'intern'])).all()
for u in users:
    print(f"User {u.id} {u.full_name} {u.role} company_id={u.company_id}")
    tasks = db.query(Task).filter(Task.assignee_id == u.id).all()
    print(f"  Assigned tasks: {len(tasks)}")
    for t in tasks:
        print(f"    Task {t.id} {t.title} project_id={t.project_id}")
        proj = db.query(Project).filter(Project.id == t.project_id).first()
        is_member = u in proj.members
        print(f"      Project {proj.id} is_member={is_member}")
