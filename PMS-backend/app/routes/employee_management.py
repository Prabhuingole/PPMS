from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    EmployeeCreate, EmployeeUpdate, EmployeeResponse, 
    EmployeeCreateResponse, EmployeeList
)
from app.core.security import get_password_hash
from app.core.deps import get_superadmin

router = APIRouter(prefix="/employees", tags=["employee-management"])

@router.post("/", response_model=EmployeeCreateResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    # Check if email, username or employee_id already exists
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.employee_id == payload.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    # Generate password: {username}@sam
    temp_password = f"{payload.username}@sam"
    hashed_password = get_password_hash(temp_password)

    new_user = User(
        employee_id=payload.employee_id,
        full_name=payload.full_name,
        username=payload.username,
        email=payload.email,
        mobile_number=payload.mobile_number,
        role=payload.role,
        designation=payload.designation,
        joining_date=payload.joining_date,
        hashed_password=hashed_password,
        is_active=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Return response with temp_password
    user_data = EmployeeResponse.model_validate(new_user).model_dump()
    return EmployeeCreateResponse(**user_data, temp_password=temp_password)

@router.get("/", response_model=EmployeeList)
def get_employees(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=1000),
    search: Optional[str] = None,
    user_type: Optional[str] = None,
    status_filter: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    query = db.query(User).filter(User.role != UserRole.SUPERADMIN)

    # Filters
    if user_type:
        query = query.filter(User.role == user_type)
    if status_filter is not None:
        query = query.filter(User.is_active == status_filter)
    
    # Search (Name, Employee ID, Email)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_filter)) |
            (User.employee_id.ilike(search_filter)) |
            (User.email.ilike(search_filter)) |
            (User.username.ilike(search_filter))
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

@router.get("/{employee_id_pk}", response_model=EmployeeResponse)
def get_employee_details(
    employee_id_pk: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    return user

@router.put("/{employee_id_pk}", response_model=EmployeeResponse)
def update_employee(
    employee_id_pk: int, 
    payload: EmployeeUpdate, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{employee_id_pk}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id_pk: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(user)
    db.commit()
    return None

@router.patch("/{employee_id_pk}/status", response_model=EmployeeResponse)
def toggle_employee_status(
    employee_id_pk: int, 
    is_active: bool,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    user = db.query(User).filter(User.id == employee_id_pk).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    user.is_active = is_active
    db.commit()
    db.refresh(user)
    return user
