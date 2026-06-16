import sys
import os
from datetime import datetime
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from app.database.session import SessionLocal
from app.models.invoice import Invoice, InvoiceStatus, PaymentMethod
from app.models.user import User, UserRole
from app.services.reconciliation_service import ReconciliationService

def test_reconciliation():
    db = SessionLocal()
    try:
        # Create mock objects
        admin = User(id=1, role=UserRole.ADMIN)
        # Find an existing invoice or pick existing companies
        from app.models.company import Company
        company = db.query(Company).first()
        if not company:
            print("[INFO] No companies exist to test reconciliation")
            return
            
        invoice = Invoice(
            id=999,
            invoice_number="INV-TEST-001",
            vendor_company_id=company.id,
            client_company_id=company.id,
            total_amount=100.05,
            status=InvoiceStatus.ISSUED,
            billing_period_start=datetime.utcnow(),
            billing_period_end=datetime.utcnow()
        )
        
        db.add(invoice)
        db.commit()

        # Test valid exact payment
        success_inv = ReconciliationService.mark_invoice_paid(
            db=db,
            invoice=invoice,
            amount=100.05,
            payment_method=PaymentMethod.BANK_TRANSFER.value,
            payment_reference="REF-001",
            current_user=admin
        )
        assert success_inv.status == InvoiceStatus.PAID
        assert success_inv.payment_method == "BANK_TRANSFER"
        assert success_inv.payment_reference == "REF-001"
        print("[OK] Exact payment recorded successfully.")

        # Re-issue for error testing
        invoice.status = InvoiceStatus.ISSUED
        db.add(invoice)
        db.commit()

        # Test decimal validation rejection (e.g., float precision or simple typo)
        try:
            ReconciliationService.mark_invoice_paid(
                db=db,
                invoice=invoice,
                amount=100.04,
                payment_method=PaymentMethod.CASH.value,
                payment_reference="REF-002",
                current_user=admin
            )
            assert False, "Should have raised ValueError for mismatched amounts"
        except ValueError as e:
            assert "does not match invoice total" in str(e)
            print("[OK] Validation securely rejected mismatched payment amount.")

        # Test invalid status rejection
        invoice.status = InvoiceStatus.DRAFT
        db.add(invoice)
        db.commit()

        try:
            ReconciliationService.mark_invoice_paid(
                db=db,
                invoice=invoice,
                amount=100.05,
                payment_method=PaymentMethod.UPI.value,
                payment_reference="REF-003",
                current_user=admin
            )
            assert False, "Should have raised ValueError for invalid status"
        except ValueError as e:
            assert "Cannot record payment for invoice in draft status" in str(e)
            print("[OK] Validation securely rejected invalid status transition.")

    finally:
        # Cleanup
        try:
            if 'invoice' in locals():
                db.delete(invoice)
                db.commit()
        except:
            pass
        db.close()

if __name__ == "__main__":
    test_reconciliation()
