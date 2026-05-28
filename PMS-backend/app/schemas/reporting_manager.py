from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, field_validator

class ReportingManagerBase(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str
    designation: Optional[str] = None
    status: str = "active"

    @field_validator('email')
    def validate_gmail(cls, v):
        if v and not v.lower().endswith('@gmail.com'):
            raise ValueError('Email must be a valid @gmail.com address')
        return v

class ReportingManagerCreate(ReportingManagerBase):
    pass

class ReportingManagerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None

    @field_validator('email')
    def validate_gmail(cls, v):
        if v and not v.lower().endswith('@gmail.com'):
            raise ValueError('Email must be a valid @gmail.com address')
        return v

class ManagedProjectBase(BaseModel):
    id: int
    name: str
    code: str
    status: str

    class Config:
        from_attributes = True

class ReportingManagerResponse(ReportingManagerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    managed_projects: List[ManagedProjectBase] = []

    class Config:
        from_attributes = True

class ReportingManagerListResponse(BaseModel):
    items: List[ReportingManagerResponse]
    total: int
    page: int
    pages: int
