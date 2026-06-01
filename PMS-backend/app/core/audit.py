from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional, Any, Dict
from app.models.audit_log import AuditLog
from app.models.user import User

def create_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    user: Optional[User] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None,
    metadata_info: Optional[Dict[str, Any]] = None
) -> AuditLog:
    ip_address = None
    if request:
        # Try to get IP from headers first for reverse proxies, fallback to client.host
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip_address = forwarded.split(",")[0].strip()
        else:
            ip_address = request.client.host if request.client else None

    if metadata_info is None:
        metadata_info = {}

    if "entity_name" not in metadata_info:
        entity_name = None
        
        # 1. Try database lookup first (most accurate for existing entities like Projects)
        if str(entity_id).isdigit():
            try:
                if entity_type == "project":
                    from app.models.project import Project
                    obj = db.query(Project).filter(Project.id == int(entity_id)).first()
                    if obj: entity_name = obj.name
                elif entity_type in ["employee", "reporting_manager", "user"]:
                    from app.models.user import User
                    obj = db.query(User).filter(User.id == int(entity_id)).first()
                    if obj: entity_name = obj.full_name
                elif entity_type == "template":
                    from app.models.template import DocumentTemplate
                    obj = db.query(DocumentTemplate).filter(DocumentTemplate.id == int(entity_id)).first()
                    if obj: entity_name = obj.name
            except Exception:
                pass

        # 2. If entity was deleted or not found, try to extract from old_values or new_values
        if not entity_name:
            if new_values:
                entity_name = new_values.get("name") or new_values.get("full_name")
            if not entity_name and old_values:
                entity_name = old_values.get("name") or old_values.get("full_name")
                
        if entity_name:
            metadata_info["entity_name"] = entity_name

    if user and "user_type" not in metadata_info:
        metadata_info["user_type"] = user.role.value if hasattr(user.role, 'value') else str(user.role)

    log_entry = AuditLog(
        user_id=user.id if user else None,
        user_name=user.full_name if user else "System",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_values=old_values,
        new_values=new_values,
        ip_address=ip_address,
        metadata_info=metadata_info
    )
    
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
