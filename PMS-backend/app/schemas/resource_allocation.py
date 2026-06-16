from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class ResourceAllocationBase(BaseModel):
    user_id: int
    project_id: int
    allocated_hours_per_week: float = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    is_active: bool = True

class ResourceAllocationCreate(ResourceAllocationBase):
    override_capacity: bool = False

class ResourceAllocationUpdate(BaseModel):
    user_id: Optional[int] = None
    project_id: Optional[int] = None
    allocated_hours_per_week: Optional[float] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    override_capacity: bool = False

class ResourceAllocationResponse(ResourceAllocationBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ResourceAllocationListResponse(BaseModel):
    items: List[ResourceAllocationResponse]
    total: int
    page: int
    pages: int
