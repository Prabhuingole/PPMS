from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TimesheetBase(BaseModel):
    project_id: int
    date: datetime
    hours: float
    description: Optional[str] = None
    status: str = "pending"

class TimesheetCreate(TimesheetBase):
    pass

class TimesheetResponse(TimesheetBase):
    id: int
    user_id: int
    created_at: datetime
    project_name: Optional[str] = None # Added via computed or manual map

    class Config:
        from_attributes = True
