from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
from pydantic import BaseModel
import os
import uuid

from app.database.session import get_db
from app.models.timesheet import Timesheet
from app.models.user import User
from app.models.notification import Notification
from app.schemas.timesheet import TimesheetCreate, TimesheetResponse
from app.core.deps import get_current_user, get_superadmin
from app.core.audit import create_audit_log
from fastapi import BackgroundTasks
from app.core.websockets import manager
from app.core.s3 import storage

router = APIRouter(prefix="/timesheets", tags=["timesheets"])

@router.post("/upload-attachment")
async def upload_timesheet_attachment(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".csv", ".xlsx", ".docx", ".zip"}
    ALLOWED_MIMES = {
        "application/pdf", 
        "image/jpeg", 
        "image/png", 
        "text/csv", 
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "application/zip",
        "application/x-zip-compressed"
    }
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension. Allowed: pdf, jpg, jpeg, png, csv, xlsx, docx, zip")
        
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="Unsupported MIME type")
        
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    unique_key = f"timesheets/{current_user.id}/{uuid.uuid4()}{file_extension}"
    storage.upload_file(file.file, unique_key, content_type=file.content_type)
    return {"file_path": unique_key, "filename": file.filename}

@router.get("/download-attachment/{timesheet_id}")
def download_timesheet_attachment(
    timesheet_id: int,
    request: Request,
    inline: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ts = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not ts or not ts.attachment_path:
        raise HTTPException(status_code=404, detail="Attachment not found")
        
    # Check access: superadmin/admin can view all, employee can only view their own
    if current_user.role not in ["superadmin", "admin"] and ts.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this attachment")
            
    # Return presigned URL as JSON so the frontend can open it (avoids auth header issues)
    presigned_url = storage.get_download_url(ts.attachment_path, ts.attachment_name or "attachment", inline=inline)
    
    create_audit_log(
        db=db,
        action="TIMESHEET_ATTACHMENT_DOWNLOADED",
        entity_type="timesheet",
        entity_id=ts.id,
        user=current_user,
        request=request
    )
    
    return {"url": presigned_url, "filename": ts.attachment_name or "attachment"}

@router.post("/", response_model=List[TimesheetResponse])
def create_timesheets(
    timesheets: List[TimesheetCreate],
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy import cast, Date
    from datetime import datetime as dt
    
    if not timesheets:
        return []

    # Check for existing submissions on the same date
    target_dates = {ts.date.date() if hasattr(ts.date, 'date') else dt.fromisoformat(str(ts.date)).date() for ts in timesheets}
    for t_date in target_dates:
        existing = db.query(Timesheet).filter(
            Timesheet.user_id == current_user.id,
            cast(Timesheet.date, Date) == t_date
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"A timesheet for {t_date.strftime('%d %b %Y')} has already been submitted. Please edit your existing submission instead."
            )
            
    created = []
    for ts in timesheets:
        new_ts = Timesheet(
            user_id=current_user.id,
            project_id=ts.project_id,
            date=ts.date,
            hours=ts.hours,
            task_title=ts.task_title,
            description=ts.description,
            task_status=ts.task_status,
            category=ts.category,
            subcategory=ts.subcategory,
            day=ts.day,
            attachment_path=ts.attachment_path,
            attachment_name=ts.attachment_name,
            attendance=ts.attendance,
            arrival_time=ts.arrival_time,
            half_day_period=ts.half_day_period,
            status="pending"
        )
        db.add(new_ts)
        created.append(new_ts)
    db.commit()
    for c in created:
        db.refresh(c)
        c.user_name = c.user.full_name if c.user else None
        
    # Notify superadmins
    if created:
        superadmins = db.query(User).filter(User.role == "superadmin").all()
        target_date_str = created[0].date.strftime('%d %b %Y') if hasattr(created[0].date, 'strftime') else str(created[0].date)
        for sa in superadmins:
            notification = Notification(
                user_id=sa.id,
                title="New Timesheet Submitted",
                message=f"{current_user.full_name} has submitted timesheets for {target_date_str}.",
                type="timesheet",
                priority="LOW",
                category="TIMESHEET",
                action_url="/superadmin/timesheets"
            )
            db.add(notification)
        if superadmins:
            db.commit()
            
        create_audit_log(
            db=db,
            action="TIMESHEET_SUBMITTED",
            entity_type="employee",
            entity_id=current_user.id,
            user=current_user,
            new_values={"date": target_date_str, "tasks_count": len(created)},
            request=request
        )

    background_tasks.add_task(manager.broadcast, {"event": "TIMESHEETS_UPDATED"})
    return created

@router.get("/me")
def get_my_timesheets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = 1,
    limit: int = 50,
    search: Optional[str] = None,
    status: Optional[str] = None,
    project_id: Optional[str] = None
):
    from app.models.project import Project
    base_query = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    ).filter(Timesheet.user_id == current_user.id)
    
    if project_id:
        if project_id.startswith("category:"):
            cat = project_id.split(":")[1]
            base_query = base_query.filter(Timesheet.category == cat)
        elif project_id == "other":
            base_query = base_query.filter(Timesheet.project_id.is_(None))
        else:
            base_query = base_query.filter(Timesheet.project_id == int(project_id))
        
    if search:
        search_pattern = f"%{search}%"
        base_query = base_query.outerjoin(Project, Timesheet.project_id == Project.id).filter(
            or_(
                Timesheet.task_title.ilike(search_pattern),
                Timesheet.description.ilike(search_pattern),
                Project.name.ilike(search_pattern)
            )
        )

    # Compute counts for the tabs
    counts = {
        "all": base_query.count(),
        "approved": base_query.filter(Timesheet.status == 'approved').count(),
        "pending": base_query.filter(Timesheet.status == 'pending').count(),
        "rejected": base_query.filter(Timesheet.status == 'rejected').count()
    }

    # Apply status filter for the actual list
    query = base_query
    if status and status != 'all':
        query = query.filter(Timesheet.status == status)
        
    total = query.count()
    timesheets = query.order_by(Timesheet.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    # We must format the response to match what the frontend expects 
    # (specifically ensuring user_name and project_name are attached since frontend relies on them, 
    # though frontend handles project ? project.name. It's safe to just return them as dicts or schema objects)
    
    from app.schemas.timesheet import TimesheetResponse
    items = []
    for ts in timesheets:
        ts.user_name = ts.user.full_name if ts.user else None
        items.append(TimesheetResponse.from_orm(ts))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "counts": counts
    }

@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    from sqlalchemy import func
    from datetime import datetime, timedelta

    # Basic counts
    total_count = db.query(Timesheet).count()
    pending_count = db.query(Timesheet).filter(Timesheet.status == 'pending').count()
    approved_count = db.query(Timesheet).filter(Timesheet.status == 'approved').count()
    rejected_count = db.query(Timesheet).filter(Timesheet.status == 'rejected').count()

    now = datetime.utcnow()
    # last 7 days data
    last_7_days_data = []
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        day_name = d.strftime('%a')
        
        from sqlalchemy import cast, Date
        hours = db.query(func.sum(Timesheet.hours)).filter(
            cast(Timesheet.date, Date) == d.date(),
            Timesheet.status == 'approved'
        ).scalar() or 0.0
        
        last_7_days_data.append({"name": day_name, "hours": hours})
        
    # recent timesheets
    recent = db.query(Timesheet).options(
        joinedload(Timesheet.user)
    ).order_by(Timesheet.updated_at.desc()).limit(10).all()
    
    recent_list = []
    for ts in recent:
        recent_list.append({
            "id": ts.id,
            "user_name": ts.user.full_name if ts.user else "Unknown",
            "task_title": ts.task_title,
            "description": ts.description,
            "hours": ts.hours,
            "status": ts.status,
            "updated_at": ts.updated_at.isoformat() if ts.updated_at else None
        })

    return {
        "totalCount": total_count,
        "pendingCount": pending_count,
        "approvedCount": approved_count,
        "rejectedCount": rejected_count,
        "last7DaysData": last_7_days_data,
        "recentTimesheets": recent_list
    }

@router.get("/all", response_model=List[TimesheetResponse])
def get_all_timesheets(
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    timesheets = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    ).order_by(Timesheet.updated_at.desc()).all()
    for ts in timesheets:
        ts.user_name = ts.user.full_name if ts.user else None
    return timesheets

@router.get("/project/{project_id}")
def get_timesheets_by_project(
    project_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    query = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    ).filter(Timesheet.project_id == project_id)
    
    total = query.count()
    timesheets = query.order_by(Timesheet.updated_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    from app.schemas.timesheet import TimesheetResponse
    items = []
    for ts in timesheets:
        ts.user_name = ts.user.full_name if ts.user else None
        items.append(TimesheetResponse.from_orm(ts))
        
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit
    }

# IMPORTANT: Static routes MUST come before dynamic /{id} routes
@router.get("/grouped")
def get_grouped_timesheets(
    status: Optional[str] = "pending",
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    """Get grouped timesheets for the superadmin queue."""
    query = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    )
    
    if status != "all":
        query = query.filter(Timesheet.status == status)
        
    timesheets = query.order_by(Timesheet.updated_at.desc()).all()
    
    groups = {}
    for ts in timesheets:
        date_str = ts.date.strftime("%Y-%m-%d") if ts.date else "unknown"
        key = f"{ts.user_id}_{date_str}"
        if key not in groups:
            user = ts.user
            groups[key] = {
                "user_id": ts.user_id,
                "user_name": user.full_name if user else "Unknown",
                "user_email": user.email if user else "",
                "user_designation": user.designation if user and hasattr(user, 'designation') else "",
                "date": date_str,
                "attendance": ts.attendance or "full-day",
                "arrival_time": ts.arrival_time,
                "half_day_period": ts.half_day_period,
                "total_hours": 0,
                "task_count": 0,
                "tasks": []
            }
        groups[key]["total_hours"] += ts.hours or 0
        groups[key]["task_count"] += 1
        groups[key]["tasks"].append({
            "id": ts.id,
            "task_title": ts.task_title,
            "description": ts.description,
            "hours": ts.hours,
            "task_status": ts.task_status,
            "project_name": ts.project.name if ts.project else (ts.category or "Other Work"),
            "project_code": ts.project.code if ts.project else None,
            "day": ts.day,
            "status": ts.status,
            "feedback": ts.feedback,
            "attachment_path": ts.attachment_path,
            "attachment_name": ts.attachment_name,
            "attendance": ts.attendance or "full-day",
            "arrival_time": ts.arrival_time,
            "half_day_period": ts.half_day_period
        })
    
    return list(groups.values())

@router.get("/grouped/paginated")
def get_grouped_timesheets_paginated(
    page: int = 1,
    size: int = 5,
    status: Optional[str] = "all",
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    """Get paginated timesheets grouped by user and date."""
    from sqlalchemy import func, or_
    from app.models.user import User
    
    subq = db.query(Timesheet.user_id, func.date(Timesheet.date).label('date_group')).join(Timesheet.user)
    
    if status != "all":
        subq = subq.filter(Timesheet.status == status)
        
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        subq = subq.filter(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
        
    subq = subq.group_by(Timesheet.user_id, func.date(Timesheet.date))
    total = subq.count()
    
    offset = (page - 1) * size
    paginated_groups = subq.order_by(func.date(Timesheet.date).desc(), Timesheet.user_id).offset(offset).limit(size).all()
    
    if not paginated_groups:
        return {"total": total, "page": page, "size": size, "items": []}
        
    group_filters = [
        (Timesheet.user_id == g.user_id) & (func.date(Timesheet.date) == g.date_group)
        for g in paginated_groups
    ]
    
    timesheets = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    ).filter(or_(*group_filters)).order_by(Timesheet.updated_at.desc()).all()
    
    groups = {}
    for ts in timesheets:
        date_str = ts.date.strftime("%Y-%m-%d") if ts.date else "unknown"
        key = f"{ts.user_id}_{date_str}"
        if key not in groups:
            user = ts.user
            groups[key] = {
                "user_id": ts.user_id,
                "user_name": user.full_name if user else "Unknown",
                "user_email": user.email if user else "",
                "user_designation": user.designation if user and hasattr(user, 'designation') else "",
                "date": date_str,
                "attendance": ts.attendance or "full-day",
                "arrival_time": ts.arrival_time,
                "half_day_period": ts.half_day_period,
                "total_hours": 0,
                "task_count": 0,
                "tasks": []
            }
        groups[key]["total_hours"] += ts.hours or 0
        groups[key]["task_count"] += 1
        groups[key]["tasks"].append({
            "id": ts.id,
            "task_title": ts.task_title,
            "description": ts.description,
            "hours": ts.hours,
            "task_status": ts.task_status,
            "project_name": ts.project.name if ts.project else (ts.category or "Other Work"),
            "project_code": ts.project.code if ts.project else None,
            "day": ts.day,
            "status": ts.status,
            "feedback": ts.feedback,
            "attachment_path": ts.attachment_path,
            "attachment_name": ts.attachment_name,
            "attendance": ts.attendance or "full-day",
            "arrival_time": ts.arrival_time,
            "half_day_period": ts.half_day_period
        })
        
    # Sort the items according to the order in paginated_groups
    # paginated_groups is ordered by date desc, user_id
    ordered_items = []
    for g in paginated_groups:
        key = f"{g.user_id}_{g.date_group}"
        if key in groups:
            ordered_items.append(groups[key])
            
    return {
        "total": total,
        "page": page,
        "size": size,
        "items": ordered_items
    }

class StatusUpdate(BaseModel):
    status: str
    feedback: Optional[str] = None

class BulkStatusUpdate(BaseModel):
    user_id: int
    date: str
    status: str
    feedback: Optional[str] = None

# IMPORTANT: bulk-status MUST come before /{timesheet_id}/status
@router.patch("/bulk-status")
def bulk_update_status(
    bulk_update: BulkStatusUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    """Approve or reject all timesheets for a user on a specific date."""
    from sqlalchemy import cast, Date
    from datetime import datetime
    
    if not bulk_update.feedback or not bulk_update.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback is compulsory when updating timesheets.")

    target_date = datetime.strptime(bulk_update.date, "%Y-%m-%d").date()
    
    timesheets = db.query(Timesheet).filter(
        Timesheet.user_id == bulk_update.user_id,
        cast(Timesheet.date, Date) == target_date,
        Timesheet.status == "pending"
    ).all()
    
    if not timesheets:
        raise HTTPException(status_code=404, detail="No pending timesheets found")
    
    for ts in timesheets:
        ts.status = bulk_update.status
        ts.feedback = bulk_update.feedback
    
    if timesheets:
        notif_msg = f"Your timesheets for {target_date.strftime('%Y-%m-%d')} have been {bulk_update.status}."
        if bulk_update.feedback:
            notif_msg += f" Feedback: {bulk_update.feedback}"
            
        notification = Notification(
            user_id=bulk_update.user_id,
            title=f"Timesheets {bulk_update.status.capitalize()}",
            message=notif_msg,
            type="success" if bulk_update.status == "approved" else "warning" if bulk_update.status == "rejected" else "info",
            priority="HIGH" if bulk_update.status == "rejected" else "MEDIUM" if bulk_update.status == "approved" else "LOW",
            category="TIMESHEET",
            action_url="/employee/timesheets"
        )
        db.add(notification)
    
    for ts in timesheets:
        create_audit_log(
            db=db,
            action="TIMESHEET_STATUS_UPDATED",
            entity_type="timesheet",
            entity_id=ts.id,
            user=admin,
            old_values={"status": "pending"},
            new_values={"status": bulk_update.status, "feedback": bulk_update.feedback},
            request=request
        )

    db.commit()
    background_tasks.add_task(manager.broadcast, {"event": "TIMESHEETS_UPDATED"})
    return {"message": f"Updated {len(timesheets)} timesheets to {bulk_update.status}"}

@router.patch("/{timesheet_id}/status", response_model=TimesheetResponse)
def update_timesheet_status(
    timesheet_id: int,
    status_update: StatusUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    if not status_update.feedback or not status_update.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback is compulsory when updating a timesheet.")

    ts = db.query(Timesheet).filter(Timesheet.id == timesheet_id).first()
    if not ts:
        raise HTTPException(status_code=404, detail="Timesheet not found")
    old_status = ts.status
    ts.status = status_update.status
    ts.feedback = status_update.feedback

    notif_msg = f"Your timesheet for {ts.date.strftime('%Y-%m-%d') if ts.date else 'a specific date'} has been {status_update.status}."
    if status_update.feedback:
        notif_msg += f" Feedback: {status_update.feedback}"
        
    notification = Notification(
        user_id=ts.user_id,
        title=f"Timesheet {status_update.status.capitalize()}",
        message=notif_msg,
        type="success" if status_update.status == "approved" else "warning" if status_update.status == "rejected" else "info",
        priority="HIGH" if status_update.status == "rejected" else "MEDIUM" if status_update.status == "approved" else "LOW",
        category="TIMESHEET",
        action_url="/employee/timesheets"
    )
    db.add(notification)

    create_audit_log(
        db=db,
        action="TIMESHEET_STATUS_UPDATED",
        entity_type="timesheet",
        entity_id=ts.id,
        user=admin,
        old_values={"status": old_status},
        new_values={"status": ts.status, "feedback": ts.feedback},
        request=request
    )

    db.commit()
    db.refresh(ts)
    ts.user_name = ts.user.full_name if ts.user else None
    background_tasks.add_task(manager.broadcast, {"event": "TIMESHEETS_UPDATED"})
    return ts

@router.get("/day/{date}", response_model=List[TimesheetResponse])
def get_timesheets_for_day(
    date: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all timesheet entries for the current user on a specific date (for edit pre-population)."""
    from sqlalchemy import cast, Date
    from datetime import datetime as dt
    target_date = dt.strptime(date, "%Y-%m-%d").date()
    timesheets = db.query(Timesheet).options(
        joinedload(Timesheet.user),
        joinedload(Timesheet.project)
    ).filter(
        Timesheet.user_id == current_user.id,
        cast(Timesheet.date, Date) == target_date
    ).all()
    for ts in timesheets:
        ts.user_name = ts.user.full_name if ts.user else None
    return timesheets

@router.put("/day/{date}", response_model=List[TimesheetResponse])
def update_timesheets_for_day(
    date: str,
    timesheets: List[TimesheetCreate],
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Replace all pending timesheet entries for the current user on a specific date."""
    from sqlalchemy import cast, Date
    from datetime import datetime as dt
    target_date = dt.strptime(date, "%Y-%m-%d").date()

    # Only allow editing if ALL entries for that day are still pending
    existing = db.query(Timesheet).filter(
        Timesheet.user_id == current_user.id,
        cast(Timesheet.date, Date) == target_date
    ).all()

    if not existing:
        raise HTTPException(status_code=404, detail="No timesheet found for this date")

    non_pending = [ts for ts in existing if ts.status != "pending"]
    if non_pending:
        raise HTTPException(
            status_code=400,
            detail="Cannot edit a timesheet that has already been reviewed."
        )
        
    # Check if they are moving it to a new date that already has entries
    new_dates = {ts.date.date() if hasattr(ts.date, 'date') else dt.fromisoformat(str(ts.date)).date() for ts in timesheets}
    if len(new_dates) > 1:
        raise HTTPException(status_code=400, detail="All entries must belong to the same date.")

    # Delete all existing pending entries for that day
    for ts in existing:
        db.delete(ts)
    db.flush()

    # Insert new entries
    created = []
    for ts_data in timesheets:
        new_ts = Timesheet(
            user_id=current_user.id,
            project_id=ts_data.project_id,
            date=ts_data.date,
            hours=ts_data.hours,
            task_title=ts_data.task_title,
            description=ts_data.description,
            task_status=ts_data.task_status,
            category=ts_data.category,
            subcategory=ts_data.subcategory,
            day=ts_data.day,
            attachment_path=ts_data.attachment_path,
            attachment_name=ts_data.attachment_name,
            attendance=ts_data.attendance,
            arrival_time=ts_data.arrival_time,
            half_day_period=ts_data.half_day_period,
            status="pending"
        )
        db.add(new_ts)
        created.append(new_ts)

    db.commit()
    for c in created:
        db.refresh(c)
        c.user_name = c.user.full_name if c.user else None
        
    create_audit_log(
        db=db,
        action="TIMESHEET_EDITED",
        entity_type="employee",
        entity_id=current_user.id,
        user=current_user,
        new_values={"date": date, "tasks_count": len(created)},
        request=request
    )
        
    background_tasks.add_task(manager.broadcast, {"event": "TIMESHEETS_UPDATED"})
    return created

