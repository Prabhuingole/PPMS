from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.deliverable import Deliverable
from app.models.project import Project
from app.models.user import User
from app.schemas.deliverable import DeliverableCreate, DeliverableUpdate, DeliverableResponse, DeliverableListResponse
from app.core.deps import get_superadmin
from app.core.tenant import verify_tenant_access, current_tenant_ctx
from app.services.visibility import ProjectVisibilityService
from app.core.audit import create_audit_log

router = APIRouter(prefix="/deliverables", tags=["deliverables"])

@router.post("/", response_model=DeliverableResponse, status_code=status.HTTP_201_CREATED)
def create_deliverable(
    payload: DeliverableCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Access check: user must have view/edit access to the project
    if not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")

    new_del = Deliverable(
        project_id=payload.project_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        is_active=payload.is_active,
        target_date=payload.target_date
    )
    db.add(new_del)
    db.commit()
    db.refresh(new_del)

    create_audit_log(
        db=db,
        action="DELIVERABLE_CREATED",
        entity_type="deliverable",
        entity_id=new_del.id,
        user=current_user,
        request=request
    )

    return new_del

@router.get("/", response_model=DeliverableListResponse)
def list_deliverables(
    project_id: Optional[int] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    # Find all visible project IDs for the current user (enforces tenant isolation)
    proj_query = db.query(Project.id)
    proj_query = ProjectVisibilityService.get_visible_query(current_user, db, proj_query)
    visible_project_ids = [r[0] for r in proj_query.all()]

    query = db.query(Deliverable).filter(Deliverable.project_id.in_(visible_project_ids))

    if project_id:
        if project_id not in visible_project_ids:
            raise HTTPException(status_code=404, detail="Project not found or access denied")
        query = query.filter(Deliverable.project_id == project_id)

    total = query.count()
    items = query.order_by(Deliverable.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/{id}", response_model=DeliverableResponse)
def get_deliverable(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    deliv = db.query(Deliverable).filter(Deliverable.id == id).first()
    if not deliv:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    if not ProjectVisibilityService.can_view(current_user, deliv.project):
        raise HTTPException(status_code=404, detail="Deliverable not found")

    return deliv

@router.put("/{id}", response_model=DeliverableResponse)
def update_deliverable(
    id: int,
    payload: DeliverableUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    deliv = db.query(Deliverable).filter(Deliverable.id == id).first()
    if not deliv:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    # Use project visibility: Must be able to edit the project or be RM of the project
    if not ProjectVisibilityService.can_edit(current_user, deliv.project) and current_user.role != "reporting_manager":
        raise HTTPException(status_code=403, detail="Not authorized to edit deliverables for this project")

    update_data = payload.dict(exclude_unset=True)
    if "project_id" in update_data and update_data["project_id"] != deliv.project_id:
        # Verify the new project exists and is accessible
        new_proj = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not new_proj or not ProjectVisibilityService.can_view(current_user, new_proj):
            raise HTTPException(status_code=404, detail="New project not found")

    for key, val in update_data.items():
        setattr(deliv, key, val)

    db.commit()
    db.refresh(deliv)

    create_audit_log(
        db=db,
        action="DELIVERABLE_UPDATED",
        entity_type="deliverable",
        entity_id=deliv.id,
        user=current_user,
        request=request
    )

    return deliv

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deliverable(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    deliv = db.query(Deliverable).filter(Deliverable.id == id).first()
    if not deliv:
        raise HTTPException(status_code=404, detail="Deliverable not found")

    if not ProjectVisibilityService.can_edit(current_user, deliv.project) and current_user.role != "reporting_manager":
        raise HTTPException(status_code=403, detail="Not authorized to delete deliverables for this project")

    # Due to ON DELETE RESTRICT on Tasks.deliverable_id, check for active task dependencies
    # Standard DB constraint will reject, but let's check explicitly for a cleaner message
    from app.models.task import Task
    dependency_count = db.query(Task).filter(Task.deliverable_id == id).count()
    if dependency_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete deliverable: It is referenced by active tasks.")

    db.delete(deliv)
    db.commit()

    create_audit_log(
        db=db,
        action="DELIVERABLE_DELETED",
        entity_type="deliverable",
        entity_id=id,
        user=current_user,
        request=request
    )
