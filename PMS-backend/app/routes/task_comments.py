from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.task_comment import TaskComment
from app.models.task import Task
from app.models.user import User
from app.schemas.task_comment import TaskCommentCreate, TaskCommentResponse, TaskCommentListResponse
from app.core.deps import get_current_user
from app.core.tenant import verify_tenant_access
from app.services.task_visibility import TaskVisibilityService
from app.models.notification import Notification
from app.core.websockets import manager
import logging

router = APIRouter(prefix="/task-comments", tags=["task-comments"], dependencies=[Depends(verify_tenant_access)])
logger = logging.getLogger(__name__)

@router.post("/", response_model=TaskCommentResponse, status_code=201)
def create_comment(
    comment_in: TaskCommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify task exists and is visible to user
    task = TaskVisibilityService.get_task(db, comment_in.task_id, current_user)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
        
    new_comment = TaskComment(
        task_id=comment_in.task_id,
        user_id=current_user.id,
        comment=comment_in.comment
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    if task.assignee_id and task.assignee_id != current_user.id:
        notification = Notification(
            user_id=task.assignee_id,
            title="New Comment on Task",
            message=f"{current_user.full_name} commented on: {task.title}",
            type="info",
            priority="LOW",
            category="SYSTEM",
            action_url=f"/employee/projects/{task.project_id}"
        )
        db.add(notification)
        db.commit()
        background_tasks.add_task(manager.broadcast, {"event": "NOTIFICATIONS_UPDATED"})
    
    return new_comment

@router.get("/", response_model=TaskCommentListResponse)
def list_comments(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify task exists and is visible to user
    task = TaskVisibilityService.get_task(db, task_id, current_user)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or access denied")
        
    comments = db.query(TaskComment).filter(TaskComment.task_id == task_id).order_by(TaskComment.created_at.asc()).all()
    
    return {"items": comments, "total": len(comments)}

@router.delete("/{id}", status_code=204)
def delete_comment(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    comment = db.query(TaskComment).filter(TaskComment.id == id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    # Only author or superadmin/admin can delete comments
    if current_user.role not in ["superadmin", "admin"] and comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
        
    db.delete(comment)
    db.commit()
    
    return None
