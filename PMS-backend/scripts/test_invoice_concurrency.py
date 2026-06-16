import sys
import os
import threading
from datetime import datetime

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.user import User
from app.models.company import Company
from app.models.timesheet import Timesheet, BillingStatus
from app.models.invoice import Invoice
from app.services.billing_service import BillingService
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError, OperationalError

def run_tests():
    db = SessionLocal()
    
    # Setup
    vendor = Company(name="Concurrency Vendor", code="CVEND")
    client = Company(name="Concurrency Client", code="CCLNT")
    db.add_all([vendor, client])
    db.commit()
    db.refresh(vendor)
    db.refresh(client)

    user = User(
        email="concurrent_tester@example.com", 
        hashed_password="hash", 
        full_name="Tester",
        role="admin",
        company_id=vendor.id,
        hourly_rate=100.0,
        currency="USD"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    ts1 = Timesheet(user_id=user.id, date=datetime.utcnow(), hours=8, billed_rate=100.0, billed_currency="USD", billing_status=BillingStatus.APPROVED, is_billable=True)
    db.add(ts1)
    db.commit()
    db.refresh(ts1)

    print("--- Running Invoice Concurrency Tests ---")

    # Test 1: Two invoice generation requests
    print("Test 1: Two invoice generation requests")
    results = []
    
    def generate_invoice_task(timesheet_id, user_id):
        # Local session for thread
        local_db = SessionLocal()
        try:
            local_user = local_db.query(User).get(user_id)
            BillingService.generate_invoice(local_db, vendor.id, client.id, [timesheet_id], local_user)
            results.append("SUCCESS")
        except HTTPException as e:
            results.append(f"HTTP_{e.status_code}")
        except Exception as e:
            results.append(f"ERROR: {e}")
        finally:
            local_db.close()

    t1 = threading.Thread(target=generate_invoice_task, args=(ts1.id, user.id))
    t2 = threading.Thread(target=generate_invoice_task, args=(ts1.id, user.id))
    
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    # One should succeed, one should get 409 Conflict due to "Timesheet already invoiced" or row lock wait then check
    if "SUCCESS" in results and ("HTTP_409" in results or "ERROR" in results or "HTTP_400" in results):
        print("PASSED: Concurrency prevented double billing (1 success, 1 failure).")
    else:
        print(f"FAILED: Unexpected results: {results}")

    # Reset timesheet
    ts1.invoice_id = None
    ts1.billing_status = BillingStatus.APPROVED
    db.commit()

    # Test 2: Invoice generation while timesheet approval changes
    print("Test 2: Invoice generation while timesheet approval changes")
    
    # We will simulate this by manually setting status to pending before generation
    # Since sqlite doesn't truly do async locks well across threads for the same row, we mock the scenario sequentially
    ts1.billing_status = BillingStatus.DRAFT
    db.commit()
    
    try:
        BillingService.generate_invoice(db, vendor.id, client.id, [ts1.id], user)
        print("FAILED: Generated invoice for DRAFT timesheet")
    except HTTPException as e:
        if e.status_code == 400:
            print("PASSED: Safely rejected generation on non-approved timesheet")
        else:
            print(f"FAILED: Unexpected error code {e.status_code}")

    # Test 3: Duplicate invoice number generation
    print("Test 3: Duplicate invoice number generation")
    from app.services.invoice_number_service import InvoiceNumberService
    inv_num_1 = InvoiceNumberService.get_next_number(db)
    
    inv_mock = Invoice(
        invoice_number=inv_num_1, vendor_company_id=vendor.id, client_company_id=client.id, 
        billing_period_start=datetime.utcnow(), billing_period_end=datetime.utcnow()
    )
    db.add(inv_mock)
    db.commit()

    inv_num_2 = InvoiceNumberService.get_next_number(db)
    if inv_num_1 != inv_num_2:
        print(f"PASSED: Sequential invoice numbering functioning ({inv_num_1} -> {inv_num_2})")
    else:
        print("FAILED: Duplicate generated")

    # Test 4: Invoice creation after invoice assignment
    print("Test 4: Invoice creation after invoice assignment")
    ts1.billing_status = BillingStatus.APPROVED
    ts1.invoice_id = inv_mock.id
    db.commit()

    try:
        BillingService.generate_invoice(db, vendor.id, client.id, [ts1.id], user)
        print("FAILED: Generated invoice for already invoiced timesheet")
    except HTTPException as e:
        if e.status_code == 409:
            print("PASSED: Prevented invoice creation (409 Conflict)")
        else:
            print(f"FAILED: Unexpected error code {e.status_code}")

    # Cleanup
    db.query(Timesheet).filter(Timesheet.user_id == user.id).delete()
    db.query(Invoice).filter(Invoice.vendor_company_id == vendor.id).delete()
    db.query(User).filter(User.email == "concurrent_tester@example.com").delete()
    db.query(Company).filter(Company.name.in_(["Concurrency Vendor", "Concurrency Client"])).delete()
    db.commit()
    db.close()

if __name__ == "__main__":
    run_tests()
