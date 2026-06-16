from sqlalchemy import Column, String, Integer, Enum, Boolean, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship, backref
from app.database.session import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    REPORTING_MANAGER = "reporting_manager"
    EMPLOYEE = "employee"
    TEAM_MEMBER = "team_member"
    INTERN = "intern"
    CONSULTANT = "consultant"

class EmploymentType(str, enum.Enum):
    INTERNAL = "internal"
    CONSULTANT = "consultant"
    CONTRACTOR = "contractor"
    INTERN = "intern"

class ConsultantType(str, enum.Enum):
    FREELANCER = "freelancer"
    CONTRACTOR = "contractor"
    VENDOR_RESOURCE = "vendor_resource"
    CONSULTANT = "consultant"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="RESTRICT"), nullable=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=True) # Optional for superadmin maybe?
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    password_updated_at = Column(DateTime, nullable=True)
    must_change_password = Column(Boolean, default=False)
    account_status = Column(String, default="active")
    last_login_at = Column(DateTime, nullable=True)
    reset_token = Column(String, nullable=True)
    full_name = Column(String)
    mobile_number = Column(String, nullable=True)
    role = Column(String, default=UserRole.EMPLOYEE, index=True)
    designation = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    joining_date = Column(DateTime, default=datetime.utcnow)
    is_mfa_enabled = Column(Boolean, default=False)
    mfa_otp = Column(String, nullable=True)
    mfa_otp_expires_at = Column(DateTime, nullable=True)
    last_mfa_verified_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    deactivation_reason = Column(String, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    employment_type = Column(String, default=EmploymentType.INTERNAL)
    consultant_type = Column(String, nullable=True)
    weekly_capacity_hours = Column(Float, default=40.0, nullable=False)
    company = relationship("Company", backref=backref("users"))

    @property
    def company_name(self):
        return self.company.name if self.company else None
