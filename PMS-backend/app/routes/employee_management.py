from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.user import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    EmployeeCreateResponse, EmployeeList
)
from app.core.security import get_password_hash
from app.core.deps import check_roles
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager
import secrets
import string
from app.core.email import send_temporary_password_email

router = APIRouter(prefix="/employees", tags=["employee-management"])

@router.post("/", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    # Check if email or employee_id already exists
    if db.query(User).filter(func.lower(User.email) == func.lower(payload.email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if payload.employee_id and db.query(User).filter(User.employee_id == payload.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")
    if payload.mobile_number and db.query(User).filter(User.mobile_number == payload.mobile_number).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    if admin.role == UserRole.ADMIN:
        payload.company_id = admin.company_id

    if not payload.company_id:
        raise HTTPException(status_code=400, detail="Company assignment is required")
        
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if company.company_type != "in_house":
        raise HTTPException(status_code=400, detail="Employees and managers can only be assigned to in-house companies")

    # Generate secure random temporary password
    alphabet = string.ascii_letters + string.digits + "@#*!?"
    temp_password = ''.join(secrets.choice(alphabet) for i in range(12))
    hashed_password = get_password_hash(temp_password)

    new_user = User(
        employee_id=payload.employee_id,
        full_name=payload.full_name,
        email=payload.email,
        mobile_number=payload.mobile_number,
        role=payload.role,
        designation=payload.designation,
        joining_date=payload.joining_date,
        company_id=payload.company_id,
        hashed_password=hashed_password,
        must_change_password=True,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Dispatch welcome email asynchronously
    if payload.role != "reporting_manager":
        print(f"Adding task to send welcome email to {payload.email}")
        background_tasks.add_task(
            send_temporary_password_email,
            to_email=payload.email,
            employee_name=payload.full_name,
            temp_password=temp_password
        )
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_CREATED",
        entity_type="employee",
        entity_id=new_user.id,
        user=admin,
        new_values={"full_name": new_user.full_name, "email": new_user.email, "role": new_user.role},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "EMPLOYEES_UPDATED"})

    user_data = EmployeeResponse.model_validate(new_user).model_dump()
    return EmployeeCreateResponse(**user_data)

@router.get("/", response_model=EmployeeList)
def get_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    user_type: Optional[str] = None,
    status_filter: Optional[bool] = None,
    is_reporting_manager: Optional[bool] = None,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    from sqlalchemy.orm import joinedload
    query = (
        db.query(User)
        .join(Company, User.company_id == Company.id)
        .options(joinedload(User.company))
        .filter(User.role.notin_([UserRole.SUPERADMIN, UserRole.ADMIN]))
        .filter(Company.company_type == "in_house")
    )
    
    if admin.role == UserRole.ADMIN:
        query = query.filter(User.company_id == admin.company_id)
    elif company_id:
        query = query.filter(User.company_id == company_id)

    # Filters
    if user_type:
        query = query.filter(User.role == user_type)
    if status_filter is not None:
        query = query.filter(User.is_active == status_filter)
        
    if is_reporting_manager:
        query = query.filter(User.role == UserRole.REPORTING_MANAGER)
    elif user_type != UserRole.REPORTING_MANAGER:
        query = query.filter(User.role != UserRole.REPORTING_MANAGER)
    
    # Search (Name, Employee ID, Email)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) |
            (User.employee_id.ilike(search_filter)) |
            (User.email.ilike(search_filter))
        )

    total = query.count()
    pages = math.ceil(total / limit)
    items = query.order_by(User.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }

@router.get("/{employee_id_pk}", response_model=EmployeeResponse)
def get_employee_details(
    employee_id_pk: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    from sqlalchemy.orm import joinedload
    user = (
        db.query(User)
        .join(Company, User.company_id == Company.id)
        .options(joinedload(User.company))
        .filter(User.id == employee_id_pk)
        .filter(Company.company_type == "in_house")
        .first()
    )
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if admin.role == UserRole.ADMIN and user.company_id != admin.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")
    return user

@router.put("/{employee_id_pk}", response_model=EmployeeResponse)
def update_employee(
    employee_id_pk: int, 
    payload: EmployeeUpdate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if admin.role == UserRole.ADMIN and user.company_id != admin.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")

    old_values = {
        "full_name": user.full_name,
        "designation": user.designation,
        "role": user.role,
        "mobile_number": user.mobile_number
    }

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_UPDATED",
        entity_type="employee",
        entity_id=user.id,
        user=admin,
        old_values=old_values,
        new_values={"full_name": user.full_name, "designation": user.designation, "role": user.role, "mobile_number": user.mobile_number},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "EMPLOYEES_UPDATED"})
    return user

@router.delete("/{employee_id_pk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id_pk: int, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if admin.role == UserRole.ADMIN and user.company_id != admin.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    from sqlalchemy.exc import IntegrityError
    old_values = {"full_name": user.full_name, "email": user.email}
    try:
        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Cannot delete user with historical financial records")
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_DELETED",
        entity_type="employee",
        entity_id=employee_id_pk,
        user=admin,
        old_values=old_values,
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "EMPLOYEES_UPDATED"})
    background_tasks.add_task(manager.broadcast, {"event": "ACCOUNT_DEACTIVATED", "user_id": str(employee_id_pk)})
    return None

@router.patch("/{employee_id_pk}/status", response_model=EmployeeResponse)
def toggle_employee_status(
    employee_id_pk: int, 
    is_active: bool,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN])),
    reason: str = None
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    if admin.role == UserRole.ADMIN and user.company_id != admin.company_id:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    old_status = user.is_active
    user.is_active = is_active
    if not is_active and reason:
        user.deactivation_reason = reason
    elif is_active:
        user.deactivation_reason = None
        
    db.commit()
    db.refresh(user)
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_STATUS_CHANGED",
        entity_type="employee",
        entity_id=user.id,
        user=admin,
        old_values={"is_active": old_status},
        new_values={"is_active": user.is_active, "reason": reason},
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "EMPLOYEES_UPDATED"})
    if not is_active:
        background_tasks.add_task(manager.broadcast, {"event": "ACCOUNT_DEACTIVATED", "user_id": str(user.id)})
    return user
