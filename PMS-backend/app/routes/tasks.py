from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import math

from app.database.session import get_db
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.project import Project
from app.models.deliverable import Deliverable
from app.models.user import User
from app.models.notification import Notification
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from app.core.deps import get_current_user
from app.core.tenant import verify_tenant_access, current_tenant_ctx
from app.services.task_visibility import TaskVisibilityService
from app.core.audit import create_audit_log
from app.core.websockets import manager

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    project = db.query(Project).filter(Project.id == payload.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Access check: can the current user view/edit this project?
    # RMs, Admins, Superadmins, or Project Members can create tasks.
    # We check if user is a member or has project scoped access
    from app.services.visibility import ProjectVisibilityService
    if not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")

    # Val 1: title required
    if not payload.title or not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")

    # Val 2: estimated_hours > 0
    if payload.estimated_hours <= 0:
        raise HTTPException(status_code=400, detail="Estimated hours must be greater than 0")

    # Val 3: assignee must belong to project
    if payload.assignee_id:
        is_member = db.query(Project).filter(
            Project.id == payload.project_id,
            Project.members.any(User.id == payload.assignee_id)
        ).first()
        if not is_member:
            raise HTTPException(status_code=400, detail="Assignee must be a member of the project")

    # Val 4: deliverable must belong to project
    if payload.deliverable_id:
        deliv = db.query(Deliverable).filter(Deliverable.id == payload.deliverable_id).first()
        if not deliv or deliv.project_id != payload.project_id:
            raise HTTPException(status_code=400, detail="Deliverable must belong to the selected project")

    new_task = Task(
        project_id=payload.project_id,
        deliverable_id=payload.deliverable_id,
        assignee_id=payload.assignee_id,
        creator_id=current_user.id,
        title=payload.title,
        description=payload.description,
        estimated_hours=payload.estimated_hours,
        actual_hours=payload.actual_hours,
        status=payload.status,
        priority=payload.priority,
        is_active=payload.is_active,
        due_date=payload.due_date
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    if payload.assignee_id and payload.assignee_id != current_user.id:
        notification = Notification(
            user_id=payload.assignee_id,
            title="New Task Assigned",
            message=f"You have been assigned to a new task: {payload.title}",
            type="info",
            priority="MEDIUM",
            category="SYSTEM",
            action_url=f"/employee/projects/{payload.project_id}"
        )
        db.add(notification)
        db.commit()
        background_tasks.add_task(manager.broadcast, {"event": "NOTIFICATIONS_UPDATED"})

    create_audit_log(
        db=db,
        action="TASK_CREATED",
        entity_type="task",
        entity_id=new_task.id,
        user=current_user,
        request=request
    )

    return new_task

@router.get("/", response_model=TaskListResponse)
def list_tasks(
    project_id: Optional[int] = None,
    assignee_id: Optional[int] = None,
    status: Optional[TaskStatus] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    query = db.query(Task).options(joinedload(Task.project))
    query = TaskVisibilityService.get_visible_query(current_user, db, query)

    if project_id:
        query = query.filter(Task.project_id == project_id)
    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)
    if status:
        query = query.filter(Task.status == status)

    total = query.count()
    items = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/my-tasks", response_model=TaskListResponse)
def list_my_tasks(
    status: Optional[TaskStatus] = None,
    filterType: Optional[str] = Query(None, description="Filter tasks by 'all', 'active' or 'completed'"),
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    query = db.query(Task).options(joinedload(Task.project)).filter(Task.assignee_id == current_user.id)

    if filterType == 'active':
        query = query.filter(Task.status != TaskStatus.DONE)
    elif filterType == 'completed':
        query = query.filter(Task.status == TaskStatus.DONE)
    elif status:
        query = query.filter(Task.status == status)

    total = query.count()
    items = query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit)
    }

@router.get("/{id}", response_model=TaskResponse)
def get_task(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if not TaskVisibilityService.can_view(current_user, task, db):
        raise HTTPException(status_code=404, detail="Task not found")

    return task

@router.put("/{id}", response_model=TaskResponse)
def update_task(
    id: int,
    payload: TaskUpdate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Authorization Check
    if not TaskVisibilityService.can_edit(current_user, task, db):
        raise HTTPException(status_code=403, detail="Not authorized to edit this task")

    update_data = payload.dict(exclude_unset=True)

    # Consultant restriction check
    if current_user.role == "consultant":
        # Can edit only if assigned to them (already verified in can_edit, but double check)
        if task.assignee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Consultant can only edit their own assigned tasks")
        
        # Cannot reassign task to someone else
        if "assignee_id" in update_data and update_data["assignee_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Consultant cannot reassign tasks to other users")

    # Validations on changes
    target_project_id = update_data.get("project_id", task.project_id)
    
    if "project_id" in update_data and update_data["project_id"] != task.project_id:
        new_proj = db.query(Project).filter(Project.id == update_data["project_id"]).first()
        if not new_proj:
            raise HTTPException(status_code=404, detail="New project not found")
        from app.services.visibility import ProjectVisibilityService
        if not ProjectVisibilityService.can_view(current_user, new_proj):
            raise HTTPException(status_code=404, detail="New project not found")

    if "title" in update_data and (not update_data["title"] or not update_data["title"].strip()):
        raise HTTPException(status_code=400, detail="Title is required")

    if "estimated_hours" in update_data and update_data["estimated_hours"] <= 0:
        raise HTTPException(status_code=400, detail="Estimated hours must be greater than 0")

    if "assignee_id" in update_data and update_data["assignee_id"] is not None:
        is_member = db.query(Project).filter(
            Project.id == target_project_id,
            Project.members.any(User.id == update_data["assignee_id"])
        ).first()
        if not is_member:
            raise HTTPException(status_code=400, detail="Assignee must be a member of the project")

    if "deliverable_id" in update_data and update_data["deliverable_id"] is not None:
        deliv = db.query(Deliverable).filter(Deliverable.id == update_data["deliverable_id"]).first()
        if not deliv or deliv.project_id != target_project_id:
            raise HTTPException(status_code=400, detail="Deliverable must belong to the selected project")

    old_assignee = task.assignee_id

    for key, val in update_data.items():
        setattr(task, key, val)

    db.commit()
    db.refresh(task)

    new_assignee = task.assignee_id

    if old_assignee != new_assignee:
        if new_assignee and new_assignee != current_user.id:
            notification = Notification(
                user_id=new_assignee,
                title="Task Assigned",
                message=f"You have been assigned to the task: {task.title}",
                type="info",
                priority="MEDIUM",
                category="SYSTEM",
                action_url=f"/employee/projects/{task.project_id}"
            )
            db.add(notification)
        if old_assignee and old_assignee != current_user.id:
            notification = Notification(
                user_id=old_assignee,
                title="Task Unassigned",
                message=f"You have been unassigned from the task: {task.title}",
                type="info",
                priority="LOW",
                category="SYSTEM",
                action_url=f"/employee/projects/{task.project_id}"
            )
            db.add(notification)
        db.commit()
        background_tasks.add_task(manager.broadcast, {"event": "NOTIFICATIONS_UPDATED"})
    elif update_data and new_assignee and new_assignee != current_user.id:
        notification = Notification(
            user_id=new_assignee,
            title="Task Updated",
            message=f"A task assigned to you was updated: {task.title}",
            type="info",
            priority="LOW",
            category="SYSTEM",
            action_url=f"/employee/projects/{task.project_id}"
        )
        db.add(notification)
        db.commit()
        background_tasks.add_task(manager.broadcast, {"event": "NOTIFICATIONS_UPDATED"})

    if update_data and current_user.role in ["employee", "intern", "consultant"]:
        admins = db.query(User).filter(User.role.in_(["admin", "superadmin"])).all()
        for admin in admins:
            if admin.id != current_user.id:
                notif = Notification(
                    user_id=admin.id,
                    title="Task Updated",
                    message=f"Task '{task.title}' was updated by {current_user.full_name}.",
                    type="info",
                    priority="LOW",
                    category="SYSTEM",
                    action_url=f"/superadmin/projects/{task.project_id}" if admin.role == "superadmin" else f"/admin/projects/{task.project_id}"
                )
                db.add(notif)
        db.commit()
        background_tasks.add_task(manager.broadcast, {"event": "NOTIFICATIONS_UPDATED"})

    create_audit_log(
        db=db,
        action="TASK_UPDATED",
        entity_type="task",
        entity_id=task.id,
        user=current_user,
        request=request
    )

    return task

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Authorization Check
    if not TaskVisibilityService.can_delete(current_user, task, db):
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    db.delete(task)
    db.commit()

    create_audit_log(
        db=db,
        action="TASK_DELETED",
        entity_type="task",
        entity_id=id,
        user=current_user,
        request=request
    )
