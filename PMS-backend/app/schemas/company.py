from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PointOfContact(BaseModel):
    name: str
    email: str
    phone: str
    designation: str

class CompanyBase(BaseModel):
    name: str
    company_name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "active"
    company_type: Optional[str] = "client"
    company_owner: Optional[str] = None
    logo_url: Optional[str] = None
    points_of_contact: Optional[List[PointOfContact]] = []
    restrict_clockin_to_office_ip: bool = False
    office_ip_addresses: Optional[List[str]] = []

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    # Code is intentionally omitted as it is immutable after creation
    address: Optional[str] = None
    city: Optional[str] = None
    gst_number: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    company_type: Optional[str] = None
    company_owner: Optional[str] = None
    logo_url: Optional[str] = None
    points_of_contact: Optional[List[PointOfContact]] = None
    restrict_clockin_to_office_ip: Optional[bool] = None
    office_ip_addresses: Optional[List[str]] = None

class CompanyMetrics(BaseModel):
    team_member_count: int = 0
    consultant_count: int = 0
    reporting_manager_count: int = 0
    project_count: int = 0

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    metrics: Optional[CompanyMetrics] = None

    class Config:
        from_attributes = True

class CompanyListResponse(BaseModel):
    items: List[CompanyResponse]
    total: int
    page: int
    pages: int
