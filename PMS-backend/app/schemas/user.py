from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    employee_id: Optional[str] = None
    full_name: str
    email: str
    role: str
    designation: Optional[str] = None
    mobile_number: Optional[str] = None
    bio: Optional[str] = None
    must_change_password: bool = False
    password_updated_at: Optional[datetime] = None
    is_mfa_enabled: bool = False
    account_status: str = "active"
    last_login_at: Optional[datetime] = None

class SetupAccountSchema(BaseModel):
    new_password: str
    confirm_password: str
    new_email: EmailStr

class MFARequiredResponse(BaseModel):
    mfa_required: bool
    email: EmailStr
    message: str

class VerifyMFASchema(BaseModel):
    email: EmailStr
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None
    mobile_number: Optional[str] = None
    designation: Optional[str] = None
    is_mfa_enabled: Optional[bool] = None

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str

class ForgotPasswordSchema(BaseModel):
    email: EmailStr

class ResetPasswordSchema(BaseModel):
    token: str
    new_password: str

# --- Employee CRUD Schemas ---

class EmployeeBase(BaseModel):
    employee_id: Optional[str] = None
    full_name: str
    email: EmailStr
    mobile_number: Optional[str] = None
    role: str # employee or intern
    designation: Optional[str] = None
    joining_date: Optional[datetime] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None

from app.schemas.project import ProjectResponse
from app.schemas.timesheet import TimesheetResponse

class EmployeeListItemResponse(EmployeeBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    projects: List[ProjectResponse] = []
    timesheets: List[TimesheetResponse] = []
    
    class Config:
        from_attributes = True

class EmployeeCreateResponse(EmployeeResponse):
    pass

class EmployeeList(BaseModel):
    items: List[EmployeeListItemResponse]
    total: int
    page: int
    pages: int