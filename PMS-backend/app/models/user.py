from sqlalchemy import Column, String, Integer, Enum, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base
import enum
from datetime import datetime

class UserRole(str, enum.Enum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    REPORTING_MANAGER = "reporting_manager"
    EMPLOYEE = "employee"
    INTERN = "intern"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=True) # Optional for superadmin maybe?
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    password_updated_at = Column(DateTime, nullable=True)
    must_change_password = Column(Boolean, default=False)
    account_status = Column(String, default="active")
    last_login_at = Column(DateTime, nullable=True)
    full_name = Column(String)
    mobile_number = Column(String, nullable=True)
    role = Column(String, default=UserRole.EMPLOYEE)
    designation = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    joining_date = Column(DateTime, default=datetime.utcnow)
    is_mfa_enabled = Column(Boolean, default=False)
    mfa_otp = Column(String, nullable=True)
    mfa_otp_expires_at = Column(DateTime, nullable=True)
    last_mfa_verified_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    deactivation_reason = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)