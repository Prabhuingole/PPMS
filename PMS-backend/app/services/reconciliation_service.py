import logging
from decimal import Decimal
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.invoice import Invoice, InvoiceStatus, PaymentMethod
from app.models.user import User
from app.core.audit import create_audit_log

logger = logging.getLogger(__name__)

class ReconciliationService:
    @staticmethod
    def mark_invoice_paid(
        db: Session, 
        invoice: Invoice, 
        amount: float, 
        payment_method: str, 
        payment_reference: str, 
        current_user: User
    ):
        """
        Record a payment for an invoice with strict validation.
        """
        # Validate Transition Status
        if invoice.status not in [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE]:
            raise ValueError(f"Cannot record payment for invoice in {invoice.status} status.")

        # Ensure PaymentMethod is valid
        try:
            method_enum = PaymentMethod(payment_method)
        except ValueError:
            raise ValueError(f"Invalid payment method: {payment_method}")

        # Strict Decimal Amount Validation
        dec_amount = Decimal(str(amount)).quantize(Decimal("0.01"))
        dec_total = Decimal(str(invoice.total_amount)).quantize(Decimal("0.01"))
        
        if dec_amount != dec_total:
            # Audit failed validation
            create_audit_log(
                db=db,
                action="PAYMENT_VALIDATION_FAILED",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=current_user
            )
            db.commit()
            raise ValueError(f"Payment amount {dec_amount} does not match invoice total {dec_total}.")

        try:
            invoice.status = InvoiceStatus.PAID
            invoice.payment_method = method_enum.value
            invoice.payment_reference = payment_reference
            invoice.payment_received_at = datetime.utcnow()
            
            db.add(invoice)

            # Audit success
            create_audit_log(
                db=db,
                action="PAYMENT_RECORDED",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=current_user
            )
            create_audit_log(
                db=db,
                action="PAYMENT_RECONCILED",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=current_user
            )

            db.commit()
            return invoice
        except Exception as e:
            logger.error(f"Error recording payment for invoice {invoice.id}: {e}")
            db.rollback()
            raise ValueError("Failed to process payment recording.")
