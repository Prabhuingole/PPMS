from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime

class AuditLogCreate(BaseModel):
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    metadata_info: Optional[Dict[str, Any]] = None

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    user_name: Optional[str]
    action: str
    entity_type: str
    entity_id: str
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    timestamp: datetime
    ip_address: Optional[str]
    metadata_info: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True

class PaginatedAuditLogResponse(BaseModel):
    items: list[AuditLogResponse]
    total: int
