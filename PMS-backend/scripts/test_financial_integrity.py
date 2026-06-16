import sys
import os
from datetime import datetime

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User
from app.models.invoice import Invoice, InvoiceStatus
from app.models.timesheet import Timesheet, BillingStatus
from app.models.company import Company
from app.models.project import Project
from app.services.invoice_service import InvoiceService
from sqlalchemy.exc import IntegrityError

def run_tests():
    db: Session = SessionLocal()
    
    try:
        print("--- Running Financial Integrity Tests ---")

        # Setup basic data
        vendor = Company(name="Test Vendor", code="VEND")
        client = Company(name="Test Client", code="CLNT")
        db.add_all([vendor, client])
        db.commit()
        db.refresh(vendor)
        db.refresh(client)

        user = User(
            email="consultant_test@example.com", 
            hashed_password="hash", 
            full_name="Consultant",
            role="consultant",
            company_id=vendor.id,
            hourly_rate=100.0,
            currency="USD"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # 1. Invoice Collision
        print("Test 1: Invoice Collision")
        inv1 = Invoice(
            invoice_number="INV-001",
            vendor_company_id=vendor.id,
            client_company_id=client.id,
            billing_period_start=datetime.utcnow(),
            billing_period_end=datetime.utcnow()
        )
        db.add(inv1)
        db.commit()

        inv2 = Invoice(
            invoice_number="INV-001", # Duplicate
            vendor_company_id=vendor.id,
            client_company_id=client.id,
            billing_period_start=datetime.utcnow(),
            billing_period_end=datetime.utcnow()
        )
        db.add(inv2)
        try:
            db.commit()
            print("FAILED: Duplicate invoice allowed.")
        except IntegrityError:
            db.rollback()
            print("PASSED: Duplicate invoice rejected (IntegrityError).")

        # 2. Mixed Currency
        print("Test 2: Mixed Currency Validation")
        ts1 = Timesheet(user_id=user.id, date=datetime.utcnow(), hours=8, billed_currency="USD", billing_status=BillingStatus.APPROVED)
        ts2 = Timesheet(user_id=user.id, date=datetime.utcnow(), hours=8, billed_currency="INR", billing_status=BillingStatus.APPROVED)
        try:
            InvoiceService.validate_currency([ts1, ts2])
            print("FAILED: Mixed currency allowed.")
        except ValueError as e:
            print(f"PASSED: Mixed currency rejected: {e}")

        # 3. Lifecycle Validation
        print("Test 3: Lifecycle Validation")
        try:
            InvoiceService.validate_transition(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)
            InvoiceService.validate_transition(InvoiceStatus.ISSUED, InvoiceStatus.PAID)
            print("PASSED: Allowed transitions succeeded.")
        except ValueError as e:
            print(f"FAILED: Allowed transition failed: {e}")

        try:
            InvoiceService.validate_transition(InvoiceStatus.PAID, InvoiceStatus.DRAFT)
            print("FAILED: Blocked transition allowed.")
        except ValueError:
            print("PASSED: Blocked transition (PAID -> DRAFT) rejected.")

        # 4. Offboarding Validation
        print("Test 4: Offboarding Validation (DB RESTRICT Check)")
        db.add(ts1)
        db.commit()
        db.refresh(ts1)

        try:
            db.delete(user)
            db.commit()
            print("FAILED: User deleted with timesheets.")
        except IntegrityError:
            db.rollback()
            print("PASSED: User deletion restricted when historical records exist.")

        # Deactivation
        user.is_active = False
        db.commit()
        print("PASSED: User deactivated successfully.")

    finally:
        # Cleanup
        db.query(Timesheet).filter(Timesheet.user_id == user.id).delete()
        db.query(Invoice).filter(Invoice.vendor_company_id == vendor.id).delete()
        db.query(User).filter(User.email == "consultant_test@example.com").delete()
        db.query(Company).filter(Company.name.in_(["Test Vendor", "Test Client"])).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    run_tests()
