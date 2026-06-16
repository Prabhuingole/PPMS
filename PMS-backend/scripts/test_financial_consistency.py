import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from decimal import Decimal
from decimal import Decimal
import scripts.load_all_models
from app.database.session import SessionLocal
from app.database.session import SessionLocal
from app.models.invoice import Invoice
from app.models.timesheet import Timesheet
from app.services.financial_validation import FinancialValidationService

def test_financial_consistency():
    db = SessionLocal()
    try:
        invoices = db.query(Invoice).all()
        for inv in invoices:
            try:
                FinancialValidationService.validate_invoice_totals(inv)
                print(f"[OK] Invoice {inv.id} - Totals are consistent.")
            except ValueError as e:
                print(f"[ERROR] Invoice {inv.id} - {e}")
                
    finally:
        db.close()

if __name__ == "__main__":
    test_financial_consistency()
