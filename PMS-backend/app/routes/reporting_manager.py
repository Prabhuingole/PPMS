from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.reporting_manager import ReportingManager
from app.schemas.reporting_manager import (
    ReportingManagerCreate, 
    ReportingManagerUpdate, 
    ReportingManagerResponse, 
    ReportingManagerListResponse
)
from app.models.user import User
from app.core.deps import get_superadmin
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager

router = APIRouter(prefix="/reporting-managers", tags=["reporting-manager-management"])

@router.post("/", response_model=ReportingManagerResponse, status_code=status.HTTP_201_CREATED)
def create_reporting_manager(
    payload: ReportingManagerCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    if db.query(ReportingManager).filter(ReportingManager.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Reporting Manager with this email already exists")
    
    if payload.mobile_number and db.query(ReportingManager).filter(ReportingManager.mobile_number == payload.mobile_number).first():
        raise HTTPException(status_code=400, detail="Reporting Manager with this mobile number already exists")

    new_manager = ReportingManager(
        full_name=payload.full_name,
        email=payload.email,
        mobile_number=payload.mobile_number,
        designation=payload.designation,
        status=payload.status
    )

    db.add(new_manager)
    db.commit()
    db.refresh(new_manager)
    
    create_audit_log(
        db=db,
        action="REPORTING_MANAGER_CREATED",
        entity_type="reporting_manager",
        entity_id=new_manager.id,
        user=admin,
        new_values={"full_name": new_manager.full_name, "email": new_manager.email, "designation": new_manager.designation},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "REPORTING_MANAGERS_UPDATED"})
    return new_manager

@router.get("/", response_model=ReportingManagerListResponse)
def get_reporting_managers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    query = db.query(ReportingManager)

    # Filters
    if status_filter:
        query = query.filter(ReportingManager.status == status_filter)
    
    # Search (Name, Email, Designation)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (ReportingManager.full_name.ilike(search_filter)) |
            (ReportingManager.email.ilike(search_filter)) |
            (ReportingManager.designation.ilike(search_filter))
        )

    total = query.count()
    pages = math.ceil(total / limit)
    items = query.order_by(ReportingManager.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/{manager_id}", response_model=ReportingManagerResponse)
def get_reporting_manager_details(
    manager_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    manager = db.query(ReportingManager).filter(ReportingManager.id == manager_id).first()
    if not manager:
        raise HTTPException(status_code=404, detail="Reporting Manager not found")
    return manager

@router.put("/{manager_id}", response_model=ReportingManagerResponse)
def update_reporting_manager(
    manager_id: int, 
    payload: ReportingManagerUpdate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    db_manager = db.query(ReportingManager).filter(ReportingManager.id == manager_id).first()
    if not db_manager:
        raise HTTPException(status_code=404, detail="Reporting Manager not found")

    old_values = {
        "full_name": db_manager.full_name,
        "email": db_manager.email,
        "designation": db_manager.designation,
        "status": db_manager.status
    }

    if payload.email and payload.email != db_manager.email:
        if db.query(ReportingManager).filter(ReportingManager.email == payload.email).first():
            raise HTTPException(status_code=400, detail="Reporting Manager with this email already exists")
            
    # Check if mobile number is being updated and if it's already taken
    if payload.mobile_number and payload.mobile_number != db_manager.mobile_number:
        if db.query(ReportingManager).filter(ReportingManager.mobile_number == payload.mobile_number).first():
            raise HTTPException(status_code=400, detail="Reporting Manager with this mobile number already exists")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_manager, key, value)

    db.commit()
    db.refresh(db_manager)
    
    create_audit_log(
        db=db,
        action="REPORTING_MANAGER_UPDATED",
        entity_type="reporting_manager",
        entity_id=db_manager.id,
        user=admin,
        old_values=old_values,
        new_values={"full_name": db_manager.full_name, "email": db_manager.email, "designation": db_manager.designation, "status": db_manager.status},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "REPORTING_MANAGERS_UPDATED"})
    return db_manager

@router.delete("/{manager_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reporting_manager(
    manager_id: int, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    db_manager = db.query(ReportingManager).filter(ReportingManager.id == manager_id).first()
    if not db_manager:
        raise HTTPException(status_code=404, detail="Reporting Manager not found")
    
    old_values = {"full_name": db_manager.full_name, "email": db_manager.email}
    
    db.delete(db_manager)
    db.commit()
    
    create_audit_log(
        db=db,
        action="REPORTING_MANAGER_DELETED",
        entity_type="reporting_manager",
        entity_id=manager_id,
        user=admin,
        old_values=old_values,
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "REPORTING_MANAGERS_UPDATED"})
    return None
