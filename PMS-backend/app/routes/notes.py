from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime

from app.database.session import get_db
from app.models.note import NoteWorkspace, NotePage, NoteChecklistItem
from app.models.user import User
from app.schemas.note import (
    NotePageCreate, NotePageUpdate, NotePageResponse, NotePageListItem,
    ChecklistItemCreate, ChecklistItemUpdate, ChecklistItemResponse,
    WorkspaceResponse, WorkspaceStatsResponse, AdminWorkspaceOverview
)
from app.core.deps import get_current_user, get_superadmin
from app.core.audit import create_audit_log
from app.core.websockets import manager

router = APIRouter(prefix="/notes", tags=["notes"])


# ── Helpers ─────────────────────────────────────────────────────

def _get_or_create_workspace(db: Session, user: User) -> NoteWorkspace:
    workspace = db.query(NoteWorkspace).filter(NoteWorkspace.user_id == user.id).first()
    if not workspace:
        workspace = NoteWorkspace(user_id=user.id)
        db.add(workspace)
        db.commit()
        db.refresh(workspace)
    return workspace


def _get_page_list_item(page: NotePage) -> dict:
    total = len(page.checklist_items)
    completed = sum(1 for item in page.checklist_items if item.is_completed)
    return {
        "id": page.id,
        "workspace_id": page.workspace_id,
        "project_id": page.project_id,
        "title": page.title,
        "category": page.category,
        "is_pinned": page.is_pinned,
        "is_archived": page.is_archived,
        "checklist_total": total,
        "checklist_completed": completed,
        "created_at": page.created_at,
        "updated_at": page.updated_at,
    }


# ── Employee: Workspace ────────────────────────────────────────

@router.get("/workspace")
def get_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page_count = db.query(func.count(NotePage.id)).filter(
        NotePage.workspace_id == workspace.id,
        NotePage.is_archived == False
    ).scalar()
    return {
        "id": workspace.id,
        "user_id": workspace.user_id,
        "page_count": page_count,
        "created_at": workspace.created_at,
        "updated_at": workspace.updated_at,
    }


@router.get("/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    pages = db.query(NotePage).filter(
        NotePage.workspace_id == workspace.id,
        NotePage.is_archived == False
    ).all()

    total_tasks = 0
    completed_tasks = 0
    categories = {}
    for page in pages:
        cat = page.category
        categories[cat] = categories.get(cat, 0) + 1
        for item in page.checklist_items:
            total_tasks += 1
            if item.is_completed:
                completed_tasks += 1

    return {
        "total_pages": len(pages),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "categories": categories,
    }


# ── Employee: Pages ─────────────────────────────────────────────

@router.get("/pages", response_model=List[NotePageListItem])
def list_pages(
    project_id: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    query = db.query(NotePage).filter(
        NotePage.workspace_id == workspace.id,
        NotePage.is_archived == archived
    )
    if project_id is not None:
        query = query.filter(NotePage.project_id == project_id)
    if category and category != "all":
        query = query.filter(NotePage.category == category)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (NotePage.title.ilike(search_term)) | (NotePage.content.ilike(search_term))
        )
    pages = query.order_by(NotePage.is_pinned.desc(), NotePage.updated_at.desc()).all()
    return [_get_page_list_item(p) for p in pages]


@router.post("/pages", response_model=NotePageResponse, status_code=status.HTTP_201_CREATED)
def create_page(
    payload: NotePageCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page = NotePage(
        workspace_id=workspace.id,
        project_id=payload.project_id,
        title=payload.title or "Untitled",
        content=payload.content,
        category=payload.category or "general",
    )
    db.add(page)
    db.commit()
    db.refresh(page)

    create_audit_log(
        db=db,
        action="NOTE_PAGE_CREATED",
        entity_type="note",
        entity_id=page.id,
        user=current_user,
        new_values={"title": page.title, "category": page.category},
        request=request
    )
    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return page


@router.get("/pages/{page_id}", response_model=NotePageResponse)
def get_page(
    page_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page = db.query(NotePage).filter(
        NotePage.id == page_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page


@router.put("/pages/{page_id}", response_model=NotePageResponse)
def update_page(
    page_id: int,
    payload: NotePageUpdate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page = db.query(NotePage).filter(
        NotePage.id == page_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    old_title = page.title
    changed_fields = {}

    if payload.title is not None:
        page.title = payload.title
        changed_fields["title"] = payload.title
    if payload.project_id is not None:
        page.project_id = payload.project_id
        changed_fields["project_id"] = payload.project_id
    if payload.content is not None:
        page.content = payload.content
    if payload.category is not None:
        page.category = payload.category
        changed_fields["category"] = payload.category
    if payload.is_pinned is not None:
        page.is_pinned = payload.is_pinned
        changed_fields["is_pinned"] = payload.is_pinned
    if payload.is_archived is not None:
        page.is_archived = payload.is_archived
        changed_fields["is_archived"] = payload.is_archived

    db.commit()
    db.refresh(page)

    # Only audit non-content-only updates (avoid flooding on auto-save)
    if changed_fields:
        create_audit_log(
            db=db,
            action="NOTE_PAGE_UPDATED",
            entity_type="note",
            entity_id=page.id,
            user=current_user,
            old_values={"title": old_title},
            new_values=changed_fields,
            request=request
        )
        background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})

    return page


@router.delete("/pages/{page_id}")
def delete_page(
    page_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page = db.query(NotePage).filter(
        NotePage.id == page_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    page_title = page.title
    page_id_str = str(page.id)
    db.delete(page)
    db.commit()

    create_audit_log(
        db=db,
        action="NOTE_PAGE_DELETED",
        entity_type="note",
        entity_id=page_id_str,
        user=current_user,
        old_values={"title": page_title},
        request=request
    )
    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return {"message": "Page deleted successfully"}


# ── Employee: Checklist Items ───────────────────────────────────

@router.post("/pages/{page_id}/checklist", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
def add_checklist_item(
    page_id: int,
    payload: ChecklistItemCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    page = db.query(NotePage).filter(
        NotePage.id == page_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    # Auto-set sort_order to end
    max_order = db.query(func.max(NoteChecklistItem.sort_order)).filter(
        NoteChecklistItem.page_id == page_id
    ).scalar() or 0

    item = NoteChecklistItem(
        page_id=page_id,
        text=payload.text,
        sort_order=max_order + 1,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return item


@router.put("/checklist/{item_id}", response_model=ChecklistItemResponse)
def update_checklist_item(
    item_id: int,
    payload: ChecklistItemUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    item = db.query(NoteChecklistItem).join(NotePage).filter(
        NoteChecklistItem.id == item_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    if payload.text is not None:
        item.text = payload.text
    if payload.sort_order is not None:
        item.sort_order = payload.sort_order
    if payload.is_completed is not None:
        item.is_completed = payload.is_completed
        item.completed_at = datetime.utcnow() if payload.is_completed else None

    db.commit()
    db.refresh(item)

    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return item


@router.put("/checklist/{item_id}/toggle", response_model=ChecklistItemResponse)
def toggle_checklist_item(
    item_id: int,
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    item = db.query(NoteChecklistItem).join(NotePage).filter(
        NoteChecklistItem.id == item_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    item.is_completed = not item.is_completed
    item.completed_at = datetime.utcnow() if item.is_completed else None
    db.commit()
    db.refresh(item)

    if item.is_completed:
        create_audit_log(
            db=db,
            action="NOTE_TASK_COMPLETED",
            entity_type="note",
            entity_id=item.page_id,
            user=current_user,
            new_values={"task": item.text, "completed": True},
            request=request
        )

    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return item


@router.delete("/checklist/{item_id}")
def delete_checklist_item(
    item_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workspace = _get_or_create_workspace(db, current_user)
    item = db.query(NoteChecklistItem).join(NotePage).filter(
        NoteChecklistItem.id == item_id,
        NotePage.workspace_id == workspace.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Checklist item not found")

    db.delete(item)
    db.commit()

    background_tasks.add_task(manager.broadcast, {"event": "NOTES_UPDATED"})
    return {"message": "Checklist item deleted"}


# ── Superadmin: Workspace Management ────────────────────────────

@router.get("/admin/projects", response_model=List[dict])
def list_admin_projects(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    from app.models.project import Project
    
    query = db.query(Project)
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter((Project.name.ilike(search_lower)) | (Project.code.ilike(search_lower)))
    projects = query.all()

    results = []
    for project in projects:
        pages = db.query(NotePage).filter(
            NotePage.project_id == project.id,
            NotePage.is_archived == False
        ).all()
        
        total_tasks = 0
        completed_tasks = 0
        last_activity = None
        for page in pages:
            if page.updated_at and (not last_activity or page.updated_at > last_activity):
                last_activity = page.updated_at
            for item in page.checklist_items:
                total_tasks += 1
                if item.is_completed:
                    completed_tasks += 1
                    
        results.append({
            "project_id": project.id,
            "project_name": project.name,
            "project_code": project.code,
            "page_count": len(pages),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "last_activity": last_activity,
        })
        
    results.sort(key=lambda x: x["last_activity"] or datetime.min, reverse=True)
    return results

@router.get("/admin/projects/{project_id}/users", response_model=List[dict])
def list_admin_project_users(
    project_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    from app.models.user import User as UserModel
    
    pages = db.query(NotePage).filter(
        NotePage.project_id == project_id,
        NotePage.is_archived == False
    ).all()
    
    workspace_ids = set(p.workspace_id for p in pages)
    
    results = []
    for wid in workspace_ids:
        workspace = db.query(NoteWorkspace).filter(NoteWorkspace.id == wid).first()
        if not workspace: continue
        
        user = db.query(UserModel).filter(UserModel.id == workspace.user_id).first()
        if not user: continue
        
        user_pages = [p for p in pages if p.workspace_id == wid]
        total_tasks = 0
        completed_tasks = 0
        last_activity = None
        for page in user_pages:
            if page.updated_at and (not last_activity or page.updated_at > last_activity):
                last_activity = page.updated_at
            for item in page.checklist_items:
                total_tasks += 1
                if item.is_completed:
                    completed_tasks += 1
                    
        results.append({
            "user_id": user.id,
            "user_name": user.full_name or "Unknown",
            "email": user.email,
            "designation": user.designation,
            "page_count": len(user_pages),
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "last_activity": last_activity,
        })
        
    results.sort(key=lambda x: x["last_activity"] or datetime.min, reverse=True)
    return results

@router.get("/admin/projects/{project_id}/users/{user_id}/pages", response_model=List[NotePageListItem])
def get_user_project_pages(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    workspace = db.query(NoteWorkspace).filter(NoteWorkspace.user_id == user_id).first()
    if not workspace:
        return []

    pages = db.query(NotePage).filter(
        NotePage.workspace_id == workspace.id,
        NotePage.project_id == project_id,
        NotePage.is_archived == False
    ).order_by(NotePage.is_pinned.desc(), NotePage.updated_at.desc()).all()

    return [_get_page_list_item(p) for p in pages]


@router.get("/admin/pages/{page_id}", response_model=NotePageResponse)
def get_page_admin(
    page_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    page = db.query(NotePage).filter(NotePage.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page
