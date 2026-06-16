from pydantic import BaseModel, ConfigDict
from datetime import datetime

class TaskCommentBase(BaseModel):
    comment: str

class TaskCommentCreate(TaskCommentBase):
    task_id: int

class TaskCommentResponse(TaskCommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TaskCommentListResponse(BaseModel):
    items: list[TaskCommentResponse]
    total: int
