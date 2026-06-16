import re

path = r"e:\sam projects\SPMS\PMS-backend\app\services\invoice_service.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

new_methods = """from app.core.audit import create_audit_log
from app.models.user import User

    @staticmethod
    def change_invoice_status(db: Session, invoice: Invoice, new_status: str, user: User):
        InvoiceService.validate_transition(invoice.status, new_status)
        old_status = invoice.status
        invoice.status = new_status
        
        if new_status == InvoiceStatus.ISSUED:
            invoice.issued_by_id = user.id
            action = "INVOICE_ISSUED"
        elif new_status == InvoiceStatus.PAID:
            invoice.paid_by_id = user.id
            action = "INVOICE_PAID"
        elif new_status == InvoiceStatus.CANCELLED:
            action = "INVOICE_CANCELLED"
            
            # If cancelled, release timesheets
            for ts in invoice.timesheets:
                ts.invoice_id = None
                ts.billing_status = BillingStatus.APPROVED
        else:
            action = f"INVOICE_{new_status.upper()}"
            
        create_audit_log(
            db=db,
            action=action,
            entity_type="invoice",
            entity_id=str(invoice.id),
            user=user,
            old_values={"status": old_status},
            new_values={"status": new_status, "invoice_number": invoice.invoice_number}
        )
        db.commit()
        db.refresh(invoice)
        return invoice
"""

content = content.replace('from app.models.timesheet import Timesheet, BillingStatus', 'from app.models.timesheet import Timesheet, BillingStatus\n' + new_methods)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("invoice_service.py updated!")
