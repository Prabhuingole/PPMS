from app.database.session import engine
from sqlalchemy import inspect

inspector = inspect(engine)
columns = inspector.get_columns('timesheets')
for col in columns:
    print(f"Column: {col['name']}, Type: {col['type']}")
