from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ProjectDocumentBase(BaseModel):
    doc_type: str
    display_name: Optional[str] = None
    preparation_date: Optional[datetime] = None

class ProjectDocumentCreate(ProjectDocumentBase):
    filename: str
    file_path: str
    project_id: int
    uploaded_by_id: int

class ProjectDocumentResponse(ProjectDocumentBase):
    id: int
    filename: str
    project_id: int
    uploaded_by_id: int
    created_at: datetime

    class Config:
        from_attributes = True
