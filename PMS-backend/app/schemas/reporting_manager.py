from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class ReportingManagerBase(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str
    designation: Optional[str] = None
    status: str = "active"

class ReportingManagerCreate(ReportingManagerBase):
    pass

class ReportingManagerUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile_number: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None

class ReportingManagerResponse(ReportingManagerBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportingManagerListResponse(BaseModel):
    items: List[ReportingManagerResponse]
    total: int
    page: int
    pages: int
