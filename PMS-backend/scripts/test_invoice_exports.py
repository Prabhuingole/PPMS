import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from app.database.session import SessionLocal
from app.database.session import SessionLocal
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.services.export_service import ExportService
from app.services.invoice_visibility import InvoiceVisibilityService

def test_invoice_exports():
    db = SessionLocal()
    try:
        # Just grab the first invoice to test
        invoice = db.query(Invoice).first()
        if not invoice:
            print("[INFO] No invoices available to test export.")
            return

        user = db.query(User).filter(User.role == UserRole.SUPERADMIN).first()
        if not user:
            print("[INFO] No superadmin user available.")
            return

        # Test CSV
        try:
            csv_output = ExportService.generate_invoice_csv(invoice, db, user)
            assert csv_output is not None
            assert "Invoice Number" in csv_output
            print(f"[OK] CSV Generation successful for invoice {invoice.id}")
        except Exception as e:
            print(f"[ERROR] CSV Generation failed: {e}")

        # Test PDF
        try:
            pdf_output = ExportService.generate_invoice_pdf(invoice, db, user)
            assert pdf_output is not None
            # PDF begins with %PDF
            pdf_bytes = pdf_output.getvalue()
            assert pdf_bytes.startswith(b"%PDF")
            print(f"[OK] PDF Generation successful for invoice {invoice.id}")
        except Exception as e:
            print(f"[ERROR] PDF Generation failed: {e}")

    finally:
        db.close()

if __name__ == "__main__":
    test_invoice_exports()
