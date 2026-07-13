from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AttendanceBase(BaseModel):
    pass

class AttendanceResponse(BaseModel):
    id: int
    user_id: int
    date: date
    clock_in_time: datetime
    clock_in_photo: str
    clock_out_time: Optional[datetime] = None
    clock_out_photo: Optional[str] = None
    working_hours: Optional[float] = None
    status: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    location_accuracy: Optional[float] = None
    
    # Computed fields for the response
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_role: Optional[str] = None
    timesheet_status: Optional[str] = None
    is_auto_clock_out: Optional[bool] = False

    class Config:
        orm_mode = True
        from_attributes = True

class AttendanceListResponse(BaseModel):
    items: List[AttendanceResponse]
    total: int
    page: int
    pages: int
