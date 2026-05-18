from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    status: str = "active"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reporting_manager_id: Optional[int] = None

class ProjectCreate(ProjectBase):
    member_ids: Optional[List[int]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    client_name: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reporting_manager_id: Optional[int] = None
    member_ids: Optional[List[int]] = None

from app.schemas.reporting_manager import ReportingManagerResponse

class ProjectMemberResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    designation: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: int
    reporting_manager: Optional[ReportingManagerResponse] = None
    members: List[ProjectMemberResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int
    page: int
    pages: int
