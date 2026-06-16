from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from app.models.task import TaskStatus, TaskPriority

class TaskBase(BaseModel):
    project_id: int
    deliverable_id: Optional[int] = None
    assignee_id: Optional[int] = None
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    estimated_hours: float = Field(..., gt=0)
    actual_hours: float = Field(0.0, ge=0)
    status: TaskStatus = TaskStatus.BACKLOG
    priority: TaskPriority = TaskPriority.MEDIUM
    is_active: bool = True
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    project_id: Optional[int] = None
    deliverable_id: Optional[int] = None
    assignee_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, gt=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    is_active: Optional[bool] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskBase):
    id: int
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    pages: int
