from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func
from typing import Optional
import math

from app.database.session import get_db
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.project import Project
from app.schemas.company import (
    CompanyCreate, CompanyUpdate, CompanyResponse, CompanyListResponse, CompanyMetrics
)
from app.core.deps import check_roles, get_current_user
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager

router = APIRouter(prefix="/companies", tags=["companies"])

require_superadmin_strict = Depends(check_roles([UserRole.SUPERADMIN]))
require_superadmin_or_admin = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))

@router.get("/", response_model=CompanyListResponse)
def get_companies(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    company_type: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_or_admin
):
    query = db.query(Company)

    if admin.role == UserRole.ADMIN:
        query = query.filter(Company.id == admin.company_id)

    if status_filter:
        query = query.filter(Company.status == status_filter)

    if company_type:
        query = query.filter(Company.company_type == company_type)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Company.name.ilike(search_filter)) |
            (Company.code.ilike(search_filter)) |
            (Company.email.ilike(search_filter))
        )

    total = query.count()
    pages = math.ceil(total / limit)
    items = query.order_by(Company.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()

    # Aggregate Metrics
    company_ids = [c.id for c in items]
    
    metrics_map = {
        cid: {
            "team_member_count": 0,
            "consultant_count": 0,
            "reporting_manager_count": 0,
            "project_count": 0
        } for cid in company_ids
    }
    
    if company_ids:
        # Users
        users_agg = db.query(User.company_id, User.role, func.count(User.id))\
            .filter(User.company_id.in_(company_ids))\
            .group_by(User.company_id, User.role).all()
            
        for cid, role, count in users_agg:
            if role in [UserRole.EMPLOYEE, UserRole.TEAM_MEMBER, UserRole.INTERN]:
                metrics_map[cid]["team_member_count"] += count
            elif role == UserRole.CONSULTANT:
                metrics_map[cid]["consultant_count"] += count
            elif role == UserRole.REPORTING_MANAGER:
                metrics_map[cid]["reporting_manager_count"] += count
                
        # Projects
        projects_agg = db.query(Project.owner_company_id, func.count(Project.id))\
            .filter(Project.owner_company_id.in_(company_ids))\
            .group_by(Project.owner_company_id).all()
            
        for cid, count in projects_agg:
            metrics_map[cid]["project_count"] = count

    response_items = []
    for company in items:
        # We need to create a dictionary or BaseModel to append metrics
        # Since CompanyResponse reads from ORM, we can attach a non-orm attribute
        company_data = CompanyResponse.from_orm(company)
        company_data.metrics = CompanyMetrics(**metrics_map[company.id])
        response_items.append(company_data)

    return {
        "items": response_items,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_or_admin
):
    if admin.role == UserRole.ADMIN and company_id != admin.company_id:
        raise HTTPException(status_code=404, detail="Company not found")

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return company

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_strict
):
    code_val = payload.code if payload.code else None

    # Check uniqueness of code
    if code_val and db.query(Company).filter(func.lower(Company.code) == func.lower(code_val)).first():
        raise HTTPException(status_code=400, detail="Company code already exists")
        
    new_company = Company(
        name=payload.name,
        company_name=payload.company_name,
        code=code_val,
        address=payload.address,
        city=payload.city,
        gst_number=payload.gst_number,
        contact_person=payload.contact_person,
        email=payload.email,
        phone=payload.phone,
        status=payload.status,
        company_type=payload.company_type,
        company_owner=payload.company_owner,
        logo_url=payload.logo_url
    )
    
    db.add(new_company)
    db.commit()
    db.refresh(new_company)
    
    create_audit_log(
        db=db,
        action="COMPANY_CREATED",
        entity_type="company",
        entity_id=new_company.id,
        user=admin,
        new_values={"name": new_company.name, "code": new_company.code},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "COMPANIES_UPDATED"})
    return new_company

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_strict
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    old_values = {
        "name": company.name,
        "status": company.status,
        "contact_person": company.contact_person,
        "email": company.email
    }

    update_data = payload.dict(exclude_unset=True)
    if "code" in update_data and not update_data["code"]:
        update_data["code"] = None

    for key, value in update_data.items():
        setattr(company, key, value)
        
    db.commit()
    db.refresh(company)
    
    new_values = {
        "name": company.name,
        "status": company.status,
        "contact_person": company.contact_person,
        "email": company.email
    }
    
    create_audit_log(
        db=db,
        action="COMPANY_UPDATED",
        entity_type="company",
        entity_id=company.id,
        user=admin,
        old_values=old_values,
        new_values=new_values,
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "COMPANIES_UPDATED"})
    return company

@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    background_tasks: BackgroundTasks,
    request: Request,
    hard: bool = Query(False, description="Whether to hard delete the company from the database"),
    db: Session = Depends(get_db),
    admin: User = require_superadmin_strict
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    import traceback
    if hard:
        try:
            # Store values before deletion to avoid DetachedInstanceError
            c_id = company.id
            c_name = company.name
            
            db.delete(company)
            db.commit()
            
            create_audit_log(
                db=db,
                action="COMPANY_DELETED",
                entity_type="company",
                entity_id=str(c_id),
                user=admin,
                old_values={"id": c_id, "name": c_name},
                new_values=None,
                request=request
            )
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=400, 
                detail="Cannot hard delete company because it has associated users, projects, or other records."
            )
        except Exception as e:
            db.rollback()
            with open("delete_trace.txt", "w") as f:
                f.write("ERROR in delete_company:\n")
                traceback.print_exc(file=f)
            raise e
        
        background_tasks.add_task(manager.broadcast, {"event": "COMPANIES_UPDATED"})
        return None
    else:
        # Soft delete
        old_status = company.status
        company.status = "inactive"
        db.commit()
        db.refresh(company)
        
        create_audit_log(
            db=db,
            action="COMPANY_DEACTIVATED",
            entity_type="company",
            entity_id=str(company.id),
            user=admin,
            old_values={"id": company.id, "status": old_status},
            new_values={"id": company.id, "status": "inactive"},
            request=request
        )
        
        background_tasks.add_task(manager.broadcast, {"event": "COMPANIES_UPDATED"})
        return company

@router.patch("/{company_id}/reactivate", response_model=CompanyResponse)
def reactivate_company(
    company_id: int,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_strict
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    old_status = company.status
    if old_status == "active":
        return company
        
    company.status = "active"
    db.commit()
    db.refresh(company)
    
    create_audit_log(
        db=db,
        action="COMPANY_REACTIVATED",
        entity_type="company",
        entity_id=str(company.id),
        user=admin,
        old_values={"id": company.id, "status": old_status},
        new_values={"id": company.id, "status": "active"},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "COMPANIES_UPDATED"})
    return company
