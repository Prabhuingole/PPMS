from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import math
import secrets
import string

from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import EmployeeCreate, EmployeeResponse, EmployeeCreateResponse, EmployeeList
from app.core.security import get_password_hash
from app.core.deps import check_roles
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager
from app.core.email import send_temporary_password_email

router = APIRouter(prefix="/admins", tags=["admin-management"])

# Superadmins and Admins can manage other admins
require_superadmin = Depends(check_roles([UserRole.SUPERADMIN, UserRole.ADMIN]))
require_superadmin_strict = Depends(check_roles([UserRole.SUPERADMIN]))

@router.post("/", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def create_admin(
    payload: EmployeeCreate, 
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = require_superadmin_strict
):
    if payload.role != UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Only 'admin' role can be created. Superadmin creation is disabled.")

    if db.query(User).filter(func.lower(User.email) == func.lower(payload.email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if payload.employee_id and db.query(User).filter(User.employee_id == payload.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

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
        hashed_password=hashed_password,
        must_change_password=True,
        is_active=True,
        account_status="active"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    background_tasks.add_task(
        send_temporary_password_email,
        to_email=payload.email,
        employee_name=payload.full_name,
        temp_password=temp_password
    )
    
    create_audit_log(
        db=db,
        action="ADMIN_CREATED",
        entity_type="user",
        entity_id=new_user.id,
        user=admin,
        new_values={"full_name": new_user.full_name, "email": new_user.email, "role": new_user.role},
        request=request
    )
    
    user_data = EmployeeResponse.model_validate(new_user).model_dump()
    return EmployeeCreateResponse(**user_data)

@router.get("/", response_model=EmployeeList)
def get_admins(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = require_superadmin
):
    query = db.query(User).filter(User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN]))

    if status_filter:
        if status_filter == "active":
            query = query.filter(User.is_active == True)
        elif status_filter == "inactive":
            query = query.filter(User.is_active == False)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) |
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

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(
    user_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = require_superadmin
):
    user_to_delete = db.query(User).filter(User.id == user_id, User.role.in_([UserRole.SUPERADMIN, UserRole.ADMIN])).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if user_to_delete.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
        
    if user_to_delete.email == "admin@sambhav.com":
        raise HTTPException(status_code=400, detail="Cannot delete the primary system administrator")
        
    # Log before deletion
    create_audit_log(
        db=db,
        action="ADMIN_DELETED",
        entity_type="user",
        entity_id=user_id,
        user=admin,
        old_values={"email": user_to_delete.email, "role": user_to_delete.role, "full_name": user_to_delete.full_name},
        request=request
    )
    
    db.delete(user_to_delete)
    db.commit()
    background_tasks.add_task(manager.broadcast, {"event": "ACCOUNT_DEACTIVATED", "user_id": str(user_id)})
    return None
