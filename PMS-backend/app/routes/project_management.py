from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.project import Project
from app.models.user import User
from app.models.reporting_manager import ReportingManager
from app.schemas.project import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectListResponse
)
from app.core.deps import get_superadmin, get_current_user

router = APIRouter(prefix="/projects", tags=["project-management"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project_code = payload.code
    if not project_code:
        # Auto-generate code: Prefix-001
        prefix = payload.name.split()[0]
        # Count existing projects with this prefix to determine the next sequence
        count = db.query(Project).filter(Project.code.like(f"{prefix}-%")).count()
        project_code = f"{prefix}-{str(count + 1).zfill(3)}"

    # Check if project code already exists
    if db.query(Project).filter(Project.code == project_code).first():
        # If auto-generated conflicted or manual exists, we might need a fallback or error
        # but for now, let's just use the generated/manual code
        if not payload.code: # If it was auto-generated and somehow exists (race condition or manual collision)
            # Try once more with a more robust count if needed, but zfill(3) should be fine
            existing_count = db.query(Project).filter(Project.code.like(f"{prefix}-%")).count()
            project_code = f"{prefix}-{str(existing_count + 1).zfill(3)}"
            if db.query(Project).filter(Project.code == project_code).first():
                raise HTTPException(status_code=400, detail="Unable to auto-generate unique project code. Please provide one manually.")
        else:
            raise HTTPException(status_code=400, detail="Project with this code already exists")

    # Validate Reporting Manager
    if payload.reporting_manager_id:
        rm = db.query(ReportingManager).filter(ReportingManager.id == payload.reporting_manager_id).first()
        if not rm:
            raise HTTPException(status_code=404, detail="Reporting Manager not found")
        if rm.status != "active":
            raise HTTPException(status_code=400, detail="Selected Reporting Manager is not active")

    new_project = Project(
        name=payload.name,
        code=project_code,
        description=payload.description,
        client_name=payload.client_name,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reporting_manager_id=payload.reporting_manager_id
    )

    # Validate and Assign Team Members
    if payload.member_ids:
        members = db.query(User).filter(User.id.in_(payload.member_ids)).all()
        if len(members) != len(payload.member_ids):
            raise HTTPException(status_code=404, detail="One or more team members not found")
        
        for member in members:
            if not member.is_active:
                raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
            new_project.members.append(member)

    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=ProjectListResponse)
def get_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[str] = None,
    manager_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project)

    if current_user.role != "superadmin":
        query = query.filter(Project.members.any(User.id == current_user.id))

    # Filters
    if status:
        query = query.filter(Project.status == status)
    if manager_id:
        query = query.filter(Project.reporting_manager_id == manager_id)
    
    # Search (Name, Code)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Project.name.ilike(search_filter)) |
            (Project.code.ilike(search_filter))
        )

    total = query.count()
    pages = math.ceil(total / limit)
    items = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_details(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # If not superadmin, check if user is a member of this project
    if current_user.role != "superadmin":
        if not any(member.id == current_user.id for member in project.members):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="You do not have access to this project"
            )
            
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, 
    payload: ProjectUpdate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check code uniqueness
    if payload.code and payload.code != project.code:
        if db.query(Project).filter(Project.code == payload.code).first():
            raise HTTPException(status_code=400, detail="Project with this code already exists")

    # Validate Reporting Manager
    if payload.reporting_manager_id is not None:
        if payload.reporting_manager_id == 0: # Option to unset?
            project.reporting_manager_id = None
        else:
            rm = db.query(ReportingManager).filter(ReportingManager.id == payload.reporting_manager_id).first()
            if not rm:
                raise HTTPException(status_code=404, detail="Reporting Manager not found")
            if rm.status != "active":
                raise HTTPException(status_code=400, detail="Selected Reporting Manager is not active")
            project.reporting_manager_id = payload.reporting_manager_id

    # Update Team Members
    if payload.member_ids is not None:
        members = db.query(User).filter(User.id.in_(payload.member_ids)).all()
        if len(members) != len(payload.member_ids):
            raise HTTPException(status_code=404, detail="One or more team members not found")
        
        for member in members:
            if not member.is_active:
                raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
        
        project.members = members

    # Update other fields
    update_data = payload.dict(exclude_unset=True, exclude={"member_ids", "reporting_manager_id"})
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None
