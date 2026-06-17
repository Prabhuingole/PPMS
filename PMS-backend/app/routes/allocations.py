from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import math

from app.database.session import get_db
from app.models.resource_allocation import ResourceAllocation
from app.models.project import Project
from app.models.user import User

from app.schemas.resource_allocation import ResourceAllocationCreate, ResourceAllocationUpdate, ResourceAllocationResponse, ResourceAllocationListResponse
from app.core.deps import get_current_user
from app.core.tenant import verify_tenant_access, current_tenant_ctx
from app.services.resource_visibility import ResourceVisibilityService
from app.core.audit import create_audit_log

router = APIRouter(prefix="/allocations", tags=["allocations"])

def validate_allocation_capacity(
    db: Session,
    user_id: int,
    new_hours: float,
    start_date: datetime,
    end_date: datetime,
    override_capacity: bool,
    allocation_id: Optional[int] = None
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    capacity = target_user.weekly_capacity_hours or 40.0

    # 1. Fetch overlapping active allocations
    overlapping_query = db.query(ResourceAllocation).filter(
        ResourceAllocation.user_id == user_id,
        ResourceAllocation.is_active == True,
        ResourceAllocation.start_date <= end_date,
        ResourceAllocation.end_date >= start_date
    )
    if allocation_id:
        overlapping_query = overlapping_query.filter(ResourceAllocation.id != allocation_id)

    overlapping_allocations = overlapping_query.all()
    existing_allocated_hours = sum(a.allocated_hours_per_week for a in overlapping_allocations)
    total_allocation = existing_allocated_hours + new_hours

    # 2. Check capacity limits
    if total_allocation > capacity:
        if not override_capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Allocation of {new_hours} hrs/week brings total overlapping allocation to {total_allocation} hrs/week, "
                       f"which exceeds the user's weekly capacity of {capacity} hrs/week. Set override_capacity=true to override."
            )

@router.post("/", response_model=ResourceAllocationResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(
    payload: ResourceAllocationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Authorization Check
    is_authorized = False
    if current_user.role == "superadmin":
        is_authorized = True
    elif current_user.role == "admin":
        if project.owner_company_id == tenant_id:
            is_authorized = True
    elif current_user.role == "reporting_manager":
        if project.reporting_manager_id == current_user.id:
            is_authorized = True

    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to create allocations for this project")

    # Validation: start_date must be before end_date
    if payload.start_date >= payload.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    # Validation: allocated_hours_per_week > 0
    if payload.allocated_hours_per_week <= 0:
        raise HTTPException(status_code=400, detail="Allocated hours per week must be greater than 0")

    # Validation: overlap and capacity limits
    validate_allocation_capacity(
        db=db,
        user_id=payload.user_id,
        new_hours=payload.allocated_hours_per_week,
        start_date=payload.start_date,
        end_date=payload.end_date,
        override_capacity=payload.override_capacity
    )

    new_alloc = ResourceAllocation(
        user_id=payload.user_id,
        project_id=payload.project_id,
        allocated_hours_per_week=payload.allocated_hours_per_week,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active
    )
    db.add(new_alloc)
    db.commit()
    db.refresh(new_alloc)

    create_audit_log(
        db=db,
        action="RESOURCE_ALLOCATION_CREATED",
        entity_type="resource_allocation",
        entity_id=new_alloc.id,
        user=current_user,
        request=request
    )

    return new_alloc

@router.get("/", response_model=ResourceAllocationListResponse)
def list_allocations(
    user_id: Optional[int] = None,
    project_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    query = db.query(ResourceAllocation)
    query = ResourceVisibilityService.get_visible_query(current_user, db, query)

    if user_id:
        query = query.filter(ResourceAllocation.user_id == user_id)
    if project_id:
        query = query.filter(ResourceAllocation.project_id == project_id)

    total = query.count()
    items = query.order_by(ResourceAllocation.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/{id}", response_model=ResourceAllocationResponse)
def get_allocation(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    alloc = db.query(ResourceAllocation).filter(ResourceAllocation.id == id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Resource allocation not found")

    if not ResourceVisibilityService.can_view(current_user, alloc, db):
        raise HTTPException(status_code=404, detail="Resource allocation not found")

    return alloc

@router.put("/{id}", response_model=ResourceAllocationResponse)
def update_allocation(
    id: int,
    payload: ResourceAllocationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    alloc = db.query(ResourceAllocation).filter(ResourceAllocation.id == id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Resource allocation not found")

    if not ResourceVisibilityService.can_edit(current_user, alloc, db):
        raise HTTPException(status_code=403, detail="Not authorized to edit this resource allocation")

    update_data = payload.dict(exclude_unset=True)
    
    target_user_id = update_data.get("user_id", alloc.user_id)
    target_project_id = update_data.get("project_id", alloc.project_id)
    target_hours = update_data.get("allocated_hours_per_week", alloc.allocated_hours_per_week)
    target_start = update_data.get("start_date", alloc.start_date)
    target_end = update_data.get("end_date", alloc.end_date)
    override_capacity = update_data.pop("override_capacity", False)

    # Validate dates
    if target_start >= target_end:
        raise HTTPException(status_code=400, detail="Start date must be before end date")

    # Validate hours
    if target_hours <= 0:
        raise HTTPException(status_code=400, detail="Allocated hours per week must be greater than 0")

    # Verify project exists and belongs to company if updated
    if "project_id" in update_data and update_data["project_id"] != alloc.project_id:
        new_proj = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not new_proj:
            raise HTTPException(status_code=404, detail="New project not found")
        # Check permissions
        if current_user.role == "admin" and new_proj.owner_company_id != tenant_id:
            raise HTTPException(status_code=404, detail="New project not found")

    # Validate overlap and capacity constraints
    validate_allocation_capacity(
        db=db,
        user_id=target_user_id,
        new_hours=target_hours,
        start_date=target_start,
        end_date=target_end,
        override_capacity=override_capacity,
        allocation_id=id
    )

    for key, val in update_data.items():
        setattr(alloc, key, val)

    db.commit()
    db.refresh(alloc)

    create_audit_log(
        db=db,
        action="RESOURCE_ALLOCATION_UPDATED",
        entity_type="resource_allocation",
        entity_id=alloc.id,
        user=current_user,
        request=request
    )

    return alloc

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_allocation(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    alloc = db.query(ResourceAllocation).filter(ResourceAllocation.id == id).first()
    if not alloc:
        raise HTTPException(status_code=404, detail="Resource allocation not found")

    if not ResourceVisibilityService.can_delete(current_user, alloc, db):
        raise HTTPException(status_code=403, detail="Not authorized to delete this resource allocation")

    db.delete(alloc)
    db.commit()

    create_audit_log(
        db=db,
        action="RESOURCE_ALLOCATION_DELETED",
        entity_type="resource_allocation",
        entity_id=id,
        user=current_user,
        request=request
    )
