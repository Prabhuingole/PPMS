from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class DeliverableBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    is_active: bool = True
    target_date: Optional[datetime] = None
    project_id: int

class DeliverableCreate(DeliverableBase):
    pass

class DeliverableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    target_date: Optional[datetime] = None
    project_id: Optional[int] = None

class DeliverableResponse(DeliverableBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DeliverableListResponse(BaseModel):
    items: List[DeliverableResponse]
    total: int
    page: int
    pages: int
