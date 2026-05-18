from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    designation: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    bio: Optional[str] = None

# --- Employee CRUD Schemas ---

class EmployeeBase(BaseModel):
    employee_id: str
    full_name: str
    username: str
    email: EmailStr
    mobile_number: str
    role: str # employee or intern
    designation: Optional[str] = None
    joining_date: Optional[datetime] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    is_active: Optional[bool] = None

from app.schemas.project import ProjectResponse
from app.schemas.timesheet import TimesheetResponse

class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    projects: List[ProjectResponse] = []
    timesheets: List[TimesheetResponse] = []
    
    class Config:
        from_attributes = True

class EmployeeCreateResponse(EmployeeResponse):
    temp_password: str # The auto-generated password returned only once

class EmployeeList(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    pages: int