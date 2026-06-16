import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from app.database.session import SessionLocal
from app.database.session import SessionLocal
from app.models.invoice import Invoice
from app.models.user import User, UserRole
from app.services.invoice_visibility import InvoiceVisibilityService

def test_billing_permissions():
    db = SessionLocal()
    try:
        # Create a mock superadmin
        superadmin = User(id=1, role=UserRole.SUPERADMIN)
        
        # Create a mock client admin
        client_admin = User(id=2, role=UserRole.ADMIN, company_id=10)
        
        # Create a mock consultant
        consultant = User(id=3, role=UserRole.EMPLOYEE, company_id=20)
        
        # Create a mock invoice
        invoice = Invoice(id=1, vendor_company_id=20, client_company_id=10)

        # Superadmin can view and edit
        assert InvoiceVisibilityService.can_view(superadmin, invoice) == True
        assert InvoiceVisibilityService.can_edit(superadmin, invoice) == True
        
        # Client admin can view but not edit
        assert InvoiceVisibilityService.can_view(client_admin, invoice) == True
        assert InvoiceVisibilityService.can_edit(client_admin, invoice) == False
        
        # Consultant cannot view or edit
        assert InvoiceVisibilityService.can_view(consultant, invoice) == False
        assert InvoiceVisibilityService.can_edit(consultant, invoice) == False
        
        # Unrelated admin cannot view
        unrelated_admin = User(id=4, role=UserRole.ADMIN, company_id=99)
        assert InvoiceVisibilityService.can_view(unrelated_admin, invoice) == False
        
        print("[OK] Billing permissions correctly validated.")
    finally:
        db.close()

if __name__ == "__main__":
    test_billing_permissions()
