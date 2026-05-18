from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DocumentTemplateBase(BaseModel):
    doc_type: str
    html_content: Optional[str] = None

class DocumentTemplateCreate(DocumentTemplateBase):
    pass

class DocumentTemplateResponse(DocumentTemplateBase):
    id: int
    filename: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True
