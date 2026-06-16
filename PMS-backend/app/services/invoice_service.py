from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceStatus
from app.models.timesheet import Timesheet, BillingStatus
from app.core.audit import create_audit_log
from app.models.user import User
from typing import List

class InvoiceService:
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

    @staticmethod
    def validate_transition(current_status: str, new_status: str):
        allowed_transitions = {
            InvoiceStatus.DRAFT: [InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED],
            InvoiceStatus.ISSUED: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE],
            InvoiceStatus.OVERDUE: [InvoiceStatus.PAID],
            InvoiceStatus.PAID: [],
            InvoiceStatus.CANCELLED: []
        }

        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError(f"Invalid transition from {current_status} to {new_status}")
            
        return True

    @staticmethod
    def validate_currency(timesheets: List[Timesheet]):
        if not timesheets:
            return True
            
        currencies = set(ts.billed_currency for ts in timesheets)
        if len(currencies) > 1:
            raise ValueError("All timesheets attached to an invoice must use the same currency")
        
        return True

    @staticmethod
    def validate_billing_status(timesheets: List[Timesheet]):
        for ts in timesheets:
            if ts.billing_status != BillingStatus.APPROVED:
                raise ValueError(f"Timesheet {ts.id} is not APPROVED. Current status: {ts.billing_status}")
        return True
