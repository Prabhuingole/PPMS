from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Float, Boolean, Index
from sqlalchemy.orm import relationship, backref
from app.database.session import Base
from datetime import datetime
import enum

class BillingStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    INVOICED = "invoiced"
    PAID = "paid"
    CANCELLED = "cancelled"

class Timesheet(Base):
    __tablename__ = "timesheets"
    __table_args__ = (Index('idx_timesheet_user_date', 'user_id', 'date'),)
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=True, index=True) # Will be migrated to False
    user_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True) # Nullable for 'other' work
    date = Column(DateTime, nullable=False, index=True)
    hours = Column(Float, nullable=False)
    task_title = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    task_status = Column(String, default="Ongoing") # Ongoing, Completed, etc
    category = Column(String, nullable=True) # For 'other' work
    subcategory = Column(String, nullable=True) # For 'other' work
    status = Column(String, default="pending", index=True) # pending, approved, rejected
    day = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    attachment_path = Column(String, nullable=True)
    attachment_name = Column(String, nullable=True)
    attendance = Column(String, default="full-day")
    arrival_time = Column(String, nullable=True)
    half_day_period = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_unassigned_project = Column(Boolean, default=False)
    
    is_billable = Column(Boolean, default=True)
    billed_rate = Column(Float, nullable=True)
    billed_currency = Column(String(10), nullable=True)
    billing_status = Column(String, default=BillingStatus.DRAFT)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    
    user = relationship("User", backref="timesheets")
    project = relationship("Project", backref="timesheets")
    company = relationship("Company")

    @property
    def project_name(self):
        return self.project.name if self.project else (self.category or 'Other Work')

    @property
    def company_name(self):
        return self.company.name if self.company else None
