from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, date
import os
import uuid

from app.database.session import get_db
from app.models.attendance import Attendance
from app.models.timesheet import Timesheet
from app.models.user import User
from app.schemas.attendance import AttendanceResponse, AttendanceListResponse
from app.core.deps import get_current_user
from app.core.audit import create_audit_log
from app.core.s3 import storage
from app.core.tenant import current_tenant_ctx
from fastapi import Form

router = APIRouter(prefix="/attendance", tags=["attendance"])

def get_timesheet_status(db: Session, user_id: int, target_date: date) -> str:
    """Helper to check if a timesheet exists for a user on a given date."""
    # Convert date to datetime bounds or cast Timesheet.date to date
    # In SQLite/Postgres, we can just cast
    from sqlalchemy import cast, Date
    ts = db.query(Timesheet).filter(
        Timesheet.user_id == user_id,
        cast(Timesheet.date, Date) == target_date
    ).first()
    return "submitted" if ts else "pending"

@router.post("/clock-in", response_model=AttendanceResponse)
async def clock_in(
    request: Request,
    photo: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_accuracy: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow().date()
    
    # Check if already clocked in today
    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already clocked in for today.")
    
    # Upload photo
    file_extension = os.path.splitext(photo.filename)[1]
    if not file_extension:
        file_extension = ".png" # Assume PNG from webcam if missing
    unique_key = f"attendance/{current_user.id}/{today}/clock_in_{uuid.uuid4()}{file_extension}"
    storage.upload_file(photo.file, unique_key, content_type=photo.content_type)
    
    now = datetime.utcnow()
    att = Attendance(
        user_id=current_user.id,
        date=today,
        clock_in_time=now,
        clock_in_photo=unique_key,
        latitude=latitude,
        longitude=longitude,
        location_accuracy=location_accuracy,
        status="Working"
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_CLOCKED_IN",
        entity_type="attendance",
        entity_id=att.id,
        user=current_user,
        request=request
    )
    
    # Add computed fields for response
    setattr(att, "timesheet_status", get_timesheet_status(db, current_user.id, today))
    
    return att

@router.post("/clock-out", response_model=AttendanceResponse)
async def clock_out(
    request: Request,
    photo: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_accuracy: Optional[float] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow().date()
    
    att = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date == today
    ).first()
    
    if not att:
        raise HTTPException(status_code=400, detail="Not clocked in today.")
    
    if att.clock_out_time:
        raise HTTPException(status_code=400, detail="Already clocked out today.")
        
    # Upload photo
    file_extension = os.path.splitext(photo.filename)[1]
    if not file_extension:
        file_extension = ".png"
    unique_key = f"attendance/{current_user.id}/{today}/clock_out_{uuid.uuid4()}{file_extension}"
    storage.upload_file(photo.file, unique_key, content_type=photo.content_type)
    
    now = datetime.utcnow()
    att.clock_out_time = now
    att.clock_out_photo = unique_key
    att.status = "Completed"
    if latitude is not None:
        att.latitude = latitude
    if longitude is not None:
        att.longitude = longitude
    if location_accuracy is not None:
        att.location_accuracy = location_accuracy
    
    # Calculate working hours
    diff = now - att.clock_in_time
    att.working_hours = round(diff.total_seconds() / 3600.0, 2)
    
    db.commit()
    db.refresh(att)
    
    create_audit_log(
        db=db,
        action="EMPLOYEE_CLOCKED_OUT",
        entity_type="attendance",
        entity_id=att.id,
        user=current_user,
        request=request
    )
    
    setattr(att, "timesheet_status", get_timesheet_status(db, current_user.id, today))
    
    return att

@router.get("/me", response_model=AttendanceListResponse)
def get_my_attendance(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import extract
    
    query = db.query(Attendance).filter(Attendance.user_id == current_user.id)
    
    if month:
        query = query.filter(extract('month', Attendance.date) == month)
    if year:
        query = query.filter(extract('year', Attendance.date) == year)
        
    total = query.count()
    items = query.order_by(desc(Attendance.date)).offset((page - 1) * limit).limit(limit).all()
    
    for item in items:
        setattr(item, "timesheet_status", get_timesheet_status(db, current_user.id, item.date))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/all", response_model=AttendanceListResponse)
def get_all_attendance(
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2020),
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    from sqlalchemy import extract
    
    query = db.query(Attendance)
    
    if current_user.role == "admin":
        query = query.join(Attendance.user).filter(User.company_id == current_tenant_ctx.get())
    
    if month:
        query = query.filter(extract('month', Attendance.date) == month)
    if year:
        query = query.filter(extract('year', Attendance.date) == year)
    if user_id:
        query = query.filter(Attendance.user_id == user_id)
    if status:
        query = query.filter(Attendance.status == status)
        
    total = query.count()
    items = query.order_by(desc(Attendance.date)).offset((page - 1) * limit).limit(limit).all()
    
    for item in items:
        if item.user:
            setattr(item, "user_name", item.user.full_name)
            setattr(item, "user_email", item.user.email)
            setattr(item, "user_role", item.user.role)
        setattr(item, "timesheet_status", get_timesheet_status(db, item.user_id, item.date))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/photo/{attendance_id}/{type}")
def get_attendance_photo(
    attendance_id: int,
    type: str, # "in" or "out"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if current_user.role not in ["superadmin", "admin"] and att.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Attendance record not found")
        
    if current_user.role == "admin":
        user = db.query(User).filter(User.id == att.user_id).first()
        if user and user.company_id != current_tenant_ctx.get():
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
    path = att.clock_in_photo if type == "in" else att.clock_out_photo
    if not path:
        raise HTTPException(status_code=404, detail="Photo not found")
        
    url = storage.get_download_url(path, f"photo_{type}.png", inline=True)
    return {"url": url}
