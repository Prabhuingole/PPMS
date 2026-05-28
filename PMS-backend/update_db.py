from app.database.session import engine
from sqlalchemy import text

updates = [
    ("ALTER TABLE timesheets ADD COLUMN task_status VARCHAR DEFAULT 'Ongoing'", "Added task_status"),
    ("ALTER TABLE timesheets ADD COLUMN category VARCHAR", "Added category"),
    ("ALTER TABLE timesheets ADD COLUMN subcategory VARCHAR", "Added subcategory"),
    ("ALTER TABLE timesheets ALTER COLUMN project_id DROP NOT NULL", "Made project_id nullable"),
    ("ALTER TABLE timesheets ADD COLUMN attachment_path VARCHAR", "Added attachment_path"),
    ("ALTER TABLE timesheets ADD COLUMN attachment_name VARCHAR", "Added attachment_name"),
    ("ALTER TABLE timesheets ADD COLUMN attendance VARCHAR DEFAULT 'full-day'", "Added attendance"),
    ("ALTER TABLE timesheets ADD COLUMN arrival_time VARCHAR", "Added arrival_time"),
    ("ALTER TABLE timesheets ADD COLUMN half_day_period VARCHAR", "Added half_day_period")
]

for sql, msg in updates:
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            conn.execute(text(sql))
            trans.commit()
            print(msg)
        except Exception as e:
            trans.rollback()
            if "already exists" not in str(e):
                print(f"Error executing '{sql}': {e}")
