from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from sqlalchemy import or_

from app.database.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse, PaginatedAuditLogResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity_type: Optional[str] = None,
    user_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
        
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
        
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs

@router.get("/paginated", response_model=PaginatedAuditLogResponse)
def get_audit_logs_paginated(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    entity_type: Optional[str] = "all",
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
        
    query = db.query(AuditLog)
    
    if entity_type and entity_type != "all":
        query = query.filter(AuditLog.entity_type == entity_type)
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.user_name.ilike(search_term),
                AuditLog.action.ilike(search_term),
                AuditLog.entity_type.ilike(search_term)
            )
        )
        
    total = query.count()
    skip = (page - 1) * size
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(size).all()
    
    return {"items": logs, "total": total}

@router.get("/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
def get_entity_audit_logs(
    entity_type: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to view audit logs")
        
    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.timestamp.desc()).all()
    
    return logs
