import sys
import os
import argparse
from datetime import datetime, timedelta
import logging

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import scripts.load_all_models
from app.database.session import SessionLocal
from app.models.invoice import Invoice, InvoiceStatus, ReminderType
from app.services.email_invoice_service import EmailInvoiceService

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

def process_reminders(dry_run: bool = False):
    db = SessionLocal()
    try:
        now = datetime.utcnow().date()
        logger.info(f"Starting reminder engine for date {now}. Dry run: {dry_run}")
        
        # We process in batches of 500 to avoid locking the entire table
        batch_size = 500
        offset = 0
        total_processed = 0
        total_sent = 0
        
        while True:
            # Query invoices that are ISSUED or OVERDUE and have a due date
            invoices = db.query(Invoice).filter(
                Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE]),
                Invoice.due_date != None
            ).order_by(Invoice.id).offset(offset).limit(batch_size).all()
            
            if not invoices:
                break
                
            for invoice in invoices:
                total_processed += 1
                due_date = invoice.due_date.date()
                
                # Check PRE_DUE_7
                if now == due_date - timedelta(days=7):
                    if not dry_run:
                        success = EmailInvoiceService.send_reminder(db, invoice, ReminderType.PRE_DUE_7)
                        if success: total_sent += 1
                    else:
                        logger.info(f"[DRY-RUN] Would send PRE_DUE_7 for Invoice {invoice.invoice_number}")
                
                # Check DUE_DATE
                elif now == due_date:
                    if not dry_run:
                        success = EmailInvoiceService.send_reminder(db, invoice, ReminderType.DUE_DATE)
                        if success: total_sent += 1
                    else:
                        logger.info(f"[DRY-RUN] Would send DUE_DATE for Invoice {invoice.invoice_number}")
                        
                # Check POST_DUE_7
                elif now == due_date + timedelta(days=7):
                    if not dry_run:
                        success = EmailInvoiceService.send_reminder(db, invoice, ReminderType.POST_DUE_7)
                        if success: total_sent += 1
                        
                        # Optionally mark as overdue if it wasn't already
                        if invoice.status == InvoiceStatus.ISSUED:
                            invoice.status = InvoiceStatus.OVERDUE
                            db.add(invoice)
                            db.commit()
                    else:
                        logger.info(f"[DRY-RUN] Would send POST_DUE_7 for Invoice {invoice.invoice_number}")
                        
            offset += batch_size
            
        logger.info(f"Reminder engine finished. Processed {total_processed} invoices, Sent {total_sent} reminders.")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automated Invoice Reminder Engine")
    parser.add_argument("--dry-run", action="store_true", help="Run without sending emails or updating DB")
    args = parser.parse_args()
    
    process_reminders(dry_run=args.dry_run)
