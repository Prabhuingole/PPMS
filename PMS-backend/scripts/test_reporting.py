import sys
import os

# Add backend dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from app.database.session import SessionLocal
from app.services.reporting_service import ReportingService

def test_reports():
    db = SessionLocal()
    try:
        report = ReportingService.get_billing_report(db)
        print("OLD REPORT:", report)
    except Exception as e:
        print("ERROR:", e)
    finally:
        db.close()

if __name__ == "__main__":
    test_reports()
