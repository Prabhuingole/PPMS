from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.core.deps import get_current_user
from app.models.user import User, UserRole
from app.models.invoice import Invoice, InvoiceStatus
from app.services.billing_service import BillingService
from app.services.reporting_service import ReportingService
from app.services.export_service import ExportService
from app.services.invoice_visibility import InvoiceVisibilityService
from app.services.email_invoice_service import EmailInvoiceService
from app.services.reconciliation_service import ReconciliationService
from app.core.audit import create_audit_log
import io
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class InvoiceCreate(BaseModel):
    vendor_company_id: int
    client_company_id: int
    timesheet_ids: List[int]

class TimesheetMinimal(BaseModel):
    id: int
    user_id: int
    project_id: int
    date: datetime
    hours: float
    billed_rate: float
    is_billable: bool
    billing_status: str

    class Config:
        from_attributes = True

class InvoicePaymentPayload(BaseModel):
    amount: float
    payment_method: str
    payment_reference: str

class InvoiceIssuePayload(BaseModel):
    due_date: Optional[datetime] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    vendor_company_id: int
    client_company_id: int
    total_amount: float
    currency: str
    status: str
    subtotal: float
    tax_amount: float
    created_by_id: int
    issued_by_id: int = None
    paid_by_id: int = None
    timesheets: List[TimesheetMinimal] = []
    
    class Config:
        from_attributes = True

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    data: InvoiceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security checks could go here based on user role/tenant
    return BillingService.generate_invoice(
        db=db,
        vendor_id=data.vendor_company_id,
        client_id=data.client_company_id,
        timesheet_ids=data.timesheet_ids,
        user=current_user
    )

@router.get("/invoices", response_model=List[InvoiceResponse])
def list_invoices(
    vendor_id: Optional[int] = None,
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = InvoiceVisibilityService.get_visible_query(current_user, db)
    if vendor_id:
        query = query.filter(Invoice.vendor_company_id == vendor_id)
    if client_id:
        query = query.filter(Invoice.client_company_id == client_id)
    if status:
        query = query.filter(Invoice.status == status)
        
    return query.all()

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_view(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    create_audit_log(
        db=db,
        action="INVOICE_VIEWED",
        entity_type="invoice",
        entity_id=str(invoice.id),
        user=current_user
    )
    db.commit()
    return invoice

@router.post("/invoices/{invoice_id}/issue", response_model=InvoiceResponse)
def issue_invoice(
    invoice_id: int,
    payload: InvoiceIssuePayload = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_edit(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        from app.services.invoice_service import InvoiceService
        invoice = InvoiceService.change_invoice_status(db, invoice, InvoiceStatus.ISSUED, current_user)
        
        # Set issue date
        invoice.issued_date = datetime.utcnow()
        if payload and payload.due_date:
            if payload.due_date < invoice.issued_date:
                db.rollback()
                raise HTTPException(status_code=400, detail="due_date cannot be earlier than issued_date")
            invoice.due_date = payload.due_date
        db.add(invoice)
        db.commit()
        db.refresh(invoice)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/invoices/{invoice_id}/deliver", response_model=InvoiceResponse)
def deliver_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_edit(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    success = EmailInvoiceService.deliver_invoice(db, invoice, current_user)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to deliver invoice")
    
    return invoice

@router.post("/invoices/{invoice_id}/pay", response_model=InvoiceResponse)
def pay_invoice(
    invoice_id: int,
    payload: InvoicePaymentPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_edit(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        return ReconciliationService.mark_invoice_paid(
            db=db, 
            invoice=invoice, 
            amount=payload.amount, 
            payment_method=payload.payment_method, 
            payment_reference=payload.payment_reference, 
            current_user=current_user
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports")
def get_billing_reports(
    vendor_id: Optional[int] = None,
    client_id: Optional[int] = None,
    project_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = ReportingService.get_billing_report(db, vendor_id, client_id, project_id)
    
    create_audit_log(
        db=db,
        action="BILLING_REPORT_VIEWED",
        entity_type="billing_report",
        entity_id="global" if not vendor_id and not client_id else str(vendor_id or client_id),
        user=current_user
    )
    db.commit()
    
    return report

@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceResponse)
def cancel_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_edit(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        from app.services.invoice_service import InvoiceService
        return InvoiceService.change_invoice_status(db, invoice, InvoiceStatus.CANCELLED, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices/{invoice_id}/pdf")
def export_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_view(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        pdf_buffer = ExportService.generate_invoice_pdf(invoice, db, current_user)
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.invoice_number}.pdf"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices/{invoice_id}/csv")
def export_invoice_csv(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice or not InvoiceVisibilityService.can_view(current_user, invoice):
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    try:
        csv_string = ExportService.generate_invoice_csv(invoice, db, current_user)
        buffer = io.BytesIO(csv_string.encode('utf-8'))
        return StreamingResponse(
            buffer, 
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=invoice_{invoice.invoice_number}.csv"}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
