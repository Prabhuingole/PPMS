import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.invoice import Invoice, InvoiceReminderLog, ReminderType
from app.models.user import User
from app.core.audit import create_audit_log

logger = logging.getLogger(__name__)

class EmailProvider:
    @staticmethod
    def send(to_email: str, subject: str, body: str, attachments: list = None):
        """
        Mock transport layer for email delivery.
        In the future, this can integrate with SendGrid, AWS SES, or standard SMTP.
        """
        attachment_count = len(attachments) if attachments else 0
        logger.info(f"MOCK EMAIL SENT | To: {to_email} | Subject: '{subject}' | Attachments: {attachment_count}")
        return True

class EmailInvoiceService:
    @staticmethod
    def deliver_invoice(db: Session, invoice: Invoice, current_user: User):
        # We assume client_company has a primary contact or we use a designated billing email.
        # For mock purposes, we just log to client_company ID
        client_email = f"billing@company_{invoice.client_company_id}.com"
        subject = f"Invoice {invoice.invoice_number} from {invoice.vendor_company.name}"
        body = f"Please find attached your invoice {invoice.invoice_number}."
        
        try:
            # Here we would normally generate the PDF from ExportService to attach
            EmailProvider.send(
                to_email=client_email,
                subject=subject,
                body=body,
                attachments=["invoice.pdf"]
            )
            
            invoice.delivered_at = datetime.utcnow()
            db.add(invoice)
            
            create_audit_log(
                db=db,
                action="INVOICE_DELIVERED",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=current_user
            )
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to deliver invoice {invoice.id}: {e}")
            # Audit failure
            db.rollback()
            return False

    @staticmethod
    def send_reminder(db: Session, invoice: Invoice, reminder_type: ReminderType):
        # Check for existing reminder of this type
        existing_reminder = db.query(InvoiceReminderLog).filter(
            InvoiceReminderLog.invoice_id == invoice.id,
            InvoiceReminderLog.reminder_type == reminder_type.value
        ).first()
        
        if existing_reminder:
            logger.info(f"Reminder {reminder_type.value} already sent for invoice {invoice.id}.")
            return False

        client_email = f"billing@company_{invoice.client_company_id}.com"
        subject = f"Reminder: Invoice {invoice.invoice_number} is {reminder_type.value}"
        body = f"This is a friendly reminder regarding invoice {invoice.invoice_number}."

        try:
            EmailProvider.send(
                to_email=client_email,
                subject=subject,
                body=body,
                attachments=["invoice.pdf"]
            )
            
            # Log the reminder
            reminder_log = InvoiceReminderLog(
                invoice_id=invoice.id,
                reminder_type=reminder_type.value,
                sent_at=datetime.utcnow()
            )
            db.add(reminder_log)
            
            invoice.reminder_count += 1
            db.add(invoice)
            
            # Use system user or none for automated job
            create_audit_log(
                db=db,
                action="INVOICE_REMINDER_SENT",
                entity_type="invoice",
                entity_id=str(invoice.id),
                user=None  # Or a system user if applicable
            )
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to send reminder for invoice {invoice.id}: {e}")
            db.rollback()
            return False
