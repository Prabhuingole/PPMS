from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.session import Base
from datetime import datetime
import enum
class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "BANK_TRANSFER"
    UPI = "UPI"
    WIRE_TRANSFER = "WIRE_TRANSFER"
    CASH = "CASH"
    CHEQUE = "CHEQUE"
    OTHER = "OTHER"

class ReminderType(str, enum.Enum):
    PRE_DUE_7 = "PRE_DUE_7"
    DUE_DATE = "DUE_DATE"
    POST_DUE_7 = "POST_DUE_7"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    vendor_company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True)
    client_company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    subtotal = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    issued_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    paid_by_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=True)
    currency = Column(String, nullable=False, default="USD")
    status = Column(String, default=InvoiceStatus.DRAFT, index=True)
    
    billing_period_start = Column(DateTime, nullable=False)
    billing_period_end = Column(DateTime, nullable=False)
    issued_date = Column(DateTime, nullable=True)
    due_date = Column(DateTime, nullable=True)
    
    delivered_at = Column(DateTime, nullable=True)
    viewed_at = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0)
    
    payment_reference = Column(String, nullable=True)
    payment_method = Column(String, nullable=True)
    payment_received_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor_company = relationship("Company", foreign_keys=[vendor_company_id])
    client_company = relationship("Company", foreign_keys=[client_company_id])
    
    timesheets = relationship("Timesheet", backref="invoice")
    reminders = relationship("InvoiceReminderLog", backref="invoice")

class InvoiceReminderLog(Base):
    __tablename__ = "invoice_reminder_logs"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_type = Column(String, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
