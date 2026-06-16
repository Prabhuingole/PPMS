from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime
from fastapi import HTTPException
from app.models.timesheet import Timesheet, BillingStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User
from app.core.audit import create_audit_log
from app.services.invoice_number_service import InvoiceNumberService

class BillingService:
    @staticmethod
    def generate_invoice(db: Session, vendor_id: int, client_id: int, timesheet_ids: List[int], user: User) -> Invoice:
        if not timesheet_ids:
            raise HTTPException(status_code=400, detail="No timesheets provided")
            
        try:
            # 2. Lock rows using with_for_update() to prevent double billing
            timesheets = db.query(Timesheet).filter(
                Timesheet.id.in_(timesheet_ids)
            ).with_for_update().all()

            if len(timesheets) != len(timesheet_ids):
                raise HTTPException(status_code=404, detail="One or more timesheets not found")

            # 3. Validate timesheets eligibility
            subtotal = 0.0
            currency = None
            
            for ts in timesheets:
                if ts.billing_status != BillingStatus.APPROVED:
                    raise HTTPException(status_code=400, detail=f"Timesheet {ts.id} is not APPROVED")
                if not ts.is_billable:
                    raise HTTPException(status_code=400, detail=f"Timesheet {ts.id} is not billable")
                if ts.invoice_id is not None:
                    raise HTTPException(status_code=409, detail=f"Timesheet {ts.id} already invoiced")
                
                if currency is None:
                    currency = ts.billed_currency
                elif currency != ts.billed_currency:
                    raise HTTPException(status_code=400, detail="All timesheets must use the same currency")
                    
                # Calculate total
                subtotal += float(ts.hours) * float(ts.billed_rate or 0.0)

            # 4. Generate Invoice Number
            invoice_number = InvoiceNumberService.get_next_number(db)

            # 5. Create Invoice
            # Hardcoded tax for now
            tax_amount = 0.0
            total_amount = subtotal + tax_amount
            
            invoice = Invoice(
                invoice_number=invoice_number,
                vendor_company_id=vendor_id,
                client_company_id=client_id,
                subtotal=subtotal,
                tax_amount=tax_amount,
                total_amount=total_amount,
                currency=currency or "USD",
                status=InvoiceStatus.DRAFT,
                billing_period_start=min(ts.date for ts in timesheets),
                billing_period_end=max(ts.date for ts in timesheets),
                created_by_id=user.id
            )
            db.add(invoice)
            db.flush() # Get invoice ID

            # 6. Link Timesheets
            for ts in timesheets:
                ts.invoice_id = invoice.id
                ts.billing_status = BillingStatus.INVOICED

            # 7. Audit Log
            create_audit_log(
                db=db,
                action="INVOICE_CREATED",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=user,
                new_values={
                    "invoice_number": invoice.invoice_number,
                    "vendor_company_id": vendor_id,
                    "client_company_id": client_id,
                    "total_amount": total_amount,
                    "currency": invoice.currency
                }
            )
                
            db.commit()
            db.refresh(invoice)
            return invoice

        except HTTPException:
            db.rollback()
            raise
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Invoice collision or constraint error during generation")
        except Exception as e:
            db.rollback()
            raise
