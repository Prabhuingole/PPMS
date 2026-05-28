from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Checklist Item Schemas ──────────────────────────────────────

class ChecklistItemCreate(BaseModel):
    text: str
    sort_order: Optional[int] = 0

class ChecklistItemUpdate(BaseModel):
    text: Optional[str] = None
    is_completed: Optional[bool] = None
    sort_order: Optional[int] = None

class ChecklistItemResponse(BaseModel):
    id: int
    page_id: int
    text: str
    is_completed: bool
    completed_at: Optional[datetime] = None
    sort_order: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Note Page Schemas ───────────────────────────────────────────

class NotePageCreate(BaseModel):
    title: Optional[str] = "Untitled"
    project_id: Optional[int] = None
    category: Optional[str] = "general"
    content: Optional[str] = None

class NotePageUpdate(BaseModel):
    title: Optional[str] = None
    project_id: Optional[int] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_archived: Optional[bool] = None

class NotePageResponse(BaseModel):
    id: int
    workspace_id: int
    project_id: Optional[int] = None
    title: str
    content: Optional[str] = None
    category: str
    is_pinned: bool
    is_archived: bool
    checklist_items: List[ChecklistItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotePageListItem(BaseModel):
    id: int
    workspace_id: int
    project_id: Optional[int] = None
    title: str
    category: str
    is_pinned: bool
    is_archived: bool
    checklist_total: int = 0
    checklist_completed: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Workspace Schemas ───────────────────────────────────────────

class WorkspaceResponse(BaseModel):
    id: int
    user_id: int
    page_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkspaceStatsResponse(BaseModel):
    total_pages: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    categories: dict = {}

class AdminWorkspaceOverview(BaseModel):
    id: int
    user_id: int
    user_name: str
    email: str
    designation: Optional[str] = None
    page_count: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    last_activity: Optional[datetime] = None

    class Config:
        from_attributes = True
