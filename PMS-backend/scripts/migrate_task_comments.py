import sys
import os
from sqlalchemy import create_engine
from app.database.session import Base
from app.core.config import settings

# Import models to register them
from app.models.user import User
from app.models.task import Task
from app.models.task_comment import TaskComment

def upgrade():
    print("Creating task_comments table...")
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine, tables=[TaskComment.__table__])
    print("Done!")

if __name__ == "__main__":
    upgrade()
