from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session, joinedload, selectinload, noload
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.project import Project
from app.models.user import User
from app.models.company import Company
from app.models.reporting_manager import ReportingManager
from app.models.timesheet import Timesheet
from app.schemas.project import (
    ProjectCreate, 
    ProjectUpdate, 
    ProjectResponse, 
    ProjectListResponse
)
from app.core.deps import get_superadmin, get_current_user
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager

router = APIRouter(prefix="/projects", tags=["project-management"])

@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project_code = payload.code if payload.code else None

    # Check if project code already exists
    if project_code and db.query(Project).filter(Project.code == project_code).first():
        raise HTTPException(status_code=400, detail="Project with this code already exists")

    # Validate Reporting Manager
    if payload.reporting_manager_id:
        rm = db.query(ReportingManager).filter(ReportingManager.id == payload.reporting_manager_id).first()
        if not rm:
            raise HTTPException(status_code=404, detail="Reporting Manager not found")
        if rm.status != "active":
            raise HTTPException(status_code=400, detail="Selected Reporting Manager is not active")

    if not payload.owner_company_id:
        raise HTTPException(status_code=400, detail="Owner company is required")
        
    owner_company = db.query(Company).filter(Company.id == payload.owner_company_id).first()
    if not owner_company:
        raise HTTPException(status_code=404, detail="Owner company not found")

    new_project = Project(
        name=payload.name,
        code=project_code,
        description=payload.description,
        client_name=payload.client_name,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        total_hours=payload.total_hours,
        reporting_manager_id=payload.reporting_manager_id,
        owner_company_id=payload.owner_company_id
    )

    if payload.participating_company_ids:
        part_companies = db.query(Company).filter(Company.id.in_(payload.participating_company_ids)).all()
        if len(part_companies) != len(payload.participating_company_ids):
            raise HTTPException(status_code=404, detail="One or more participating companies not found")
        new_project.participating_companies = part_companies

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
    
    create_audit_log(
        db=db,
        action="PROJECT_CREATED",
        entity_type="project",
        entity_id=new_project.id,
        user=admin,
        new_values={"name": new_project.name, "code": new_project.code, "status": new_project.status},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "PROJECTS_UPDATED"})
    return new_project

@router.get("/", response_model=ProjectListResponse)
def get_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    status: Optional[str] = None,
    manager_id: Optional[int] = None,
    dropdown: bool = Query(False, description="If true, skip eager loads for lightweight dropdowns"),
    include_unassigned: bool = Query(False, description="Include unassigned active projects"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project)
    if not dropdown:
        query = query.options(
            joinedload(Project.reporting_manager),
            selectinload(Project.members)
        )
    else:
        query = query.options(
            noload(Project.reporting_manager),
            noload(Project.members)
        )

    if current_user.role not in ["superadmin", "admin"]:
        if include_unassigned:
            query = query.filter(
                (Project.members.any(User.id == current_user.id)) | 
                (Project.status == "active")
            )
        else:
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
    items = query.order_by(Project.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()

    from sqlalchemy import func
    from app.models.timesheet import Timesheet

    if items and not dropdown:
        project_ids = [item.id for item in items]
        
        # Aggregate timesheets for all fetched projects
        timesheet_stats = db.query(
            Timesheet.project_id,
            func.sum(Timesheet.hours).label("total_worked")
        ).filter(
            Timesheet.project_id.in_(project_ids),
            Timesheet.status.in_(["approved", "rejected"])
        ).group_by(Timesheet.project_id).all()
        
        worked_dict = {stat.project_id: stat.total_worked or 0.0 for stat in timesheet_stats}

        # Aggregate timesheets for current user only
        my_timesheet_stats = db.query(
            Timesheet.project_id,
            func.sum(Timesheet.hours).label("my_worked")
        ).filter(
            Timesheet.project_id.in_(project_ids),
            Timesheet.user_id == current_user.id,
            Timesheet.status.in_(["approved", "rejected"])
        ).group_by(Timesheet.project_id).all()
        
        my_worked_dict = {stat.project_id: stat.my_worked or 0.0 for stat in my_timesheet_stats}

        for item in items:
            worked = worked_dict.get(item.id, 0.0)
            item.total_hours_worked = worked
            item.total_hours_remaining = (item.total_hours or 0.0) - worked
            item.my_hours_worked = my_worked_dict.get(item.id, 0.0)

    # Calculate assigned status for all items
    for item in items:
        if current_user.role in ["superadmin", "admin"]:
            item.assigned = True
        else:
            try:
                item.assigned = any(member.id == current_user.id for member in item.members)
            except Exception:
                # Fallback if members are not loaded
                item.assigned = False

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
    project = db.query(Project).options(
        joinedload(Project.reporting_manager),
        selectinload(Project.members)
    ).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # If not superadmin, check if user is a member of this project
    if current_user.role not in ["superadmin", "admin"]:
        if not any(member.id == current_user.id for member in project.members):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="You do not have access to this project"
            )

    from sqlalchemy import func
    from app.models.timesheet import Timesheet

    worked = db.query(func.sum(Timesheet.hours)).filter(
        Timesheet.project_id == project.id,
        Timesheet.status.in_(["approved", "rejected"])
    ).scalar() or 0.0

    project.total_hours_worked = worked
    project.total_hours_remaining = (project.total_hours or 0.0) - worked
    
    my_worked = db.query(func.sum(Timesheet.hours)).filter(
        Timesheet.project_id == project.id,
        Timesheet.user_id == current_user.id,
        Timesheet.status.in_(["approved", "rejected"])
    ).scalar() or 0.0
    project.my_hours_worked = my_worked
            
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int, 
    payload: ProjectUpdate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    old_members = [m.full_name for m in project.members]
    old_values = {
        "name": project.name,
        "status": project.status,
        "reporting_manager": project.reporting_manager.full_name if project.reporting_manager else None,
        "members": old_members
    }

    # Check code uniqueness
    code_val = payload.code if payload.code else None
    if code_val and code_val != project.code:
        if db.query(Project).filter(Project.code == code_val).first():
            raise HTTPException(status_code=400, detail="Project with this code already exists")

    payload_dict = payload.dict(exclude_unset=True)
    if "code" in payload_dict and not payload_dict["code"]:
        payload_dict["code"] = None

    # Validate Reporting Manager
    if "reporting_manager_id" in payload_dict:
        rm_id = payload_dict["reporting_manager_id"]
        if rm_id is None or rm_id == 0:
            project.reporting_manager_id = None
        else:
            rm = db.query(ReportingManager).filter(ReportingManager.id == rm_id).first()
            if not rm:
                raise HTTPException(status_code=404, detail="Reporting Manager not found")
            if rm.status != "active":
                raise HTTPException(status_code=400, detail="Selected Reporting Manager is not active")
            project.reporting_manager_id = rm_id

    # Update Team Members
    if "member_ids" in payload_dict:
        m_ids = payload_dict["member_ids"]
        if m_ids is not None:
            members = db.query(User).filter(User.id.in_(m_ids)).all()
            if len(members) != len(m_ids):
                raise HTTPException(status_code=404, detail="One or more team members not found")
            
            for member in members:
                if not member.is_active:
                    raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
            
            project.members = members

    # Update Owner Company
    if "owner_company_id" in payload_dict:
        owner_company = db.query(Company).filter(Company.id == payload_dict["owner_company_id"]).first()
        if not owner_company:
            raise HTTPException(status_code=404, detail="Owner company not found")
        project.owner_company_id = payload_dict["owner_company_id"]

    # Update Participating Companies
    if "participating_company_ids" in payload_dict:
        p_ids = payload_dict["participating_company_ids"]
        if p_ids is not None:
            part_companies = db.query(Company).filter(Company.id.in_(p_ids)).all()
            if len(part_companies) != len(p_ids):
                raise HTTPException(status_code=404, detail="One or more participating companies not found")
            project.participating_companies = part_companies

    # Update other fields
    update_data = payload.dict(exclude_unset=True, exclude={"member_ids", "reporting_manager_id", "owner_company_id", "participating_company_ids"})
    for key, value in update_data.items():
        setattr(project, key, value)

    db.commit()
    db.refresh(project)
    
    new_members = [m.full_name for m in project.members]
    new_values = {
        "name": project.name,
        "status": project.status,
        "reporting_manager": project.reporting_manager.full_name if project.reporting_manager else None,
        "members": new_members
    }
    
    # Only log if something actually changed
    if old_values != new_values:
        create_audit_log(
            db=db,
            action="PROJECT_UPDATED",
            entity_type="project",
            entity_id=project.id,
            user=admin,
            old_values=old_values,
            new_values=new_values,
            request=request
        )
    
    background_tasks.add_task(manager.broadcast, {"event": "PROJECTS_UPDATED"})

    from sqlalchemy import func
    from app.models.timesheet import Timesheet

    worked = db.query(func.sum(Timesheet.hours)).filter(
        Timesheet.project_id == project.id,
        Timesheet.status.in_(["approved", "rejected"])
    ).scalar() or 0.0

    project.total_hours_worked = worked
    project.total_hours_remaining = (project.total_hours or 0.0) - worked
    
    my_worked = db.query(func.sum(Timesheet.hours)).filter(
        Timesheet.project_id == project.id,
        Timesheet.user_id == admin.id,
        Timesheet.status.in_(["approved", "rejected"])
    ).scalar() or 0.0
    project.my_hours_worked = my_worked

    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    old_values = {"name": project.name, "code": project.code}
    
    from app.models.document import ProjectDocument
    from app.models.timesheet import Timesheet

    # Clear many-to-many members association
    project.members = []
    
    # Delete associated documents (since project_id is nullable=False)
    db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id).delete()
    
    # Set timesheets to 'Other Work' (null project_id) since project_id is nullable=True
    db.query(Timesheet).filter(Timesheet.project_id == project_id).update({"project_id": None})
    
    db.delete(project)
    db.commit()
    
    create_audit_log(
        db=db,
        action="PROJECT_DELETED",
        entity_type="project",
        entity_id=project_id,
        user=admin,
        old_values=old_values,
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "PROJECTS_UPDATED"})
    return None
