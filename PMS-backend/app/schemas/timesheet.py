from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimesheetBase(BaseModel):
    project_id: Optional[int] = None
    date: datetime
    hours: float
    task_title: Optional[str] = None
    description: Optional[str] = None
    task_status: str = "Ongoing"
    category: Optional[str] = None
    subcategory: Optional[str] = None
    status: str = "pending"
    day: Optional[str] = None
    attachment_path: Optional[str] = None
    attachment_name: Optional[str] = None
    attachments: Optional[list] = None
    attendance: Optional[str] = "full-day"
    arrival_time: Optional[str] = None
    half_day_period: Optional[str] = None
    company_id: Optional[int] = None
    break_hours: Optional[int] = 0
    break_minutes: Optional[int] = 0

class TimesheetCreate(TimesheetBase):
    pass

class TimesheetResponse(TimesheetBase):
    id: int
    user_id: int
    created_at: datetime
    project_name: Optional[str] = None
    user_name: Optional[str] = None
    feedback: Optional[str] = None
    is_unassigned_project: Optional[bool] = False
    company_name: Optional[str] = None

    class Config:
        from_attributes = True

class PaginatedGroupedTimesheets(BaseModel):
    total: int
    page: int
    size: int
    items: list
