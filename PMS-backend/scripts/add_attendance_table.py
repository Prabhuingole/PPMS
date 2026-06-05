import sys
import os

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import engine, Base
from app.models.attendance import Attendance

def create_tables():
    print("Creating Attendance table if it doesn't exist...")
    # This will create tables for all models that inherit from Base
    # that have been imported so far. Since we imported Attendance,
    # it will create the 'attendance' table.
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    create_tables()
