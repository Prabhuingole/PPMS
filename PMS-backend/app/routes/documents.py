from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
from datetime import datetime

from app.database.session import get_db
from app.models.document import ProjectDocument
from app.models.project import Project
from app.models.user import User
from app.schemas.document import ProjectDocumentResponse
from app.core.deps import get_current_user
from app.core.tenant import current_tenant_ctx
from app.services.visibility import DocumentVisibilityService, ProjectVisibilityService
from app.core.s3 import storage
from fastapi import BackgroundTasks, Request
from app.core.websockets import manager
from app.core.audit import create_audit_log

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads/projects"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ProjectDocumentResponse)
async def upload_document(
    request: Request,
    project_id: int = Form(...),
    doc_type: str = Form(...),
    display_name: str = Form(None),
    preparation_date: str = Form(None),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")

    ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".csv", ".xlsx", ".docx", ".zip", ".txt"}
    ALLOWED_MIMES = {
        "application/pdf", 
        "image/jpeg", 
        "image/png", 
        "text/csv", 
        "text/plain",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
        "application/zip",
        "application/x-zip-compressed"
    }
    
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension. Allowed: pdf, jpg, jpeg, png, csv, xlsx, docx, zip, txt")
        
    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail="Unsupported MIME type")
        
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    unique_key = f"projects/{project_id}/{uuid.uuid4()}{file_extension}"
    
    storage.upload_file(file.file, unique_key, content_type=file.content_type)

    prep_date = None
    if preparation_date:
        try:
            # Try parsing ISO format (YYYY-MM-DD)
            prep_date = datetime.fromisoformat(preparation_date.replace("Z", "+00:00"))
        except ValueError:
            prep_date = None

    new_doc = ProjectDocument(
        filename=file.filename,
        file_path=unique_key, # Using key as file_path
        doc_type=doc_type,
        display_name=display_name or file.filename,
        preparation_date=prep_date,
        project_id=project_id,
        company_id=project.owner_company_id,
        uploaded_by_id=current_user.id
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    create_audit_log(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity_type="project",
        entity_id=project_id,
        user=current_user,
        new_values={"document_name": new_doc.display_name, "document_type": new_doc.doc_type},
        request=request
    )
    
    if background_tasks:
        background_tasks.add_task(manager.broadcast, {"event": "DOCUMENTS_UPDATED"})
    
    return new_doc

@router.get("/project/{project_id}", response_model=List[ProjectDocumentResponse])
def get_project_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")
            
    return db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id).all()

from fastapi.responses import FileResponse

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    request: Request,
    inline: bool = False,
    as_json: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(ProjectDocument).filter(ProjectDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not DocumentVisibilityService.can_view(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")
            
    from fastapi.responses import RedirectResponse
    
    download_url = storage.get_download_url(doc.file_path, doc.filename, inline=inline)
    
    create_audit_log(
        db=db,
        action="DOCUMENT_DOWNLOADED",
        entity_type="project",
        entity_id=doc.project_id,
        user=current_user,
        new_values={"document_name": doc.display_name},
        request=request
    )
    
    if inline or as_json:
        return {"url": download_url, "filename": doc.filename}
        
    return RedirectResponse(url=download_url)

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    request: Request,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(ProjectDocument).filter(ProjectDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if not DocumentVisibilityService.can_view(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")
            
    # Try deleting from storage
    try:
        storage.delete_file(doc.file_path)
    except Exception as e:
        print(f"Error deleting file from storage: {e}")
        
    old_values = {"document_name": doc.display_name, "document_type": doc.doc_type}
    project_id = doc.project_id
        
    db.delete(doc)
    db.commit()
    
    create_audit_log(
        db=db,
        action="DOCUMENT_DELETED",
        entity_type="project",
        entity_id=project_id,
        user=current_user,
        old_values=old_values,
        request=request
    )
    
    if background_tasks:
        background_tasks.add_task(manager.broadcast, {"event": "DOCUMENTS_UPDATED"})
        
    return {"message": "Document deleted successfully"}
