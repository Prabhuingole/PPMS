from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from app.database.session import get_db
from app.models.document import ProjectDocument
from app.models.project import Project
from app.models.user import User
from app.schemas.document import ProjectDocumentResponse
from app.core.deps import get_current_user
from app.core.s3 import storage

router = APIRouter(prefix="/documents", tags=["documents"])

UPLOAD_DIR = "uploads/projects"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ProjectDocumentResponse)
async def upload_document(
    project_id: int = Form(...),
    doc_type: str = Form(...),
    display_name: str = Form(None),
    preparation_date: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify project exists
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check if user is member or superadmin
    if current_user.role != "superadmin":
        is_member = any(m.id == current_user.id for m in project.members)
        if not is_member:
            raise HTTPException(status_code=403, detail="Not authorized to upload to this project")

    # Upload to R2
    file_extension = os.path.splitext(file.filename)[1]
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
        uploaded_by_id=current_user.id
    )
    
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return new_doc

@router.get("/project/{project_id}", response_model=List[ProjectDocumentResponse])
def get_project_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Check access
    if current_user.role != "superadmin":
        is_member = any(m.id == current_user.id for m in project.members)
        if not is_member:
            raise HTTPException(status_code=403, detail="Not authorized to view documents for this project")
            
    return db.query(ProjectDocument).filter(ProjectDocument.project_id == project_id).all()

from fastapi.responses import FileResponse

@router.get("/download/{document_id}")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(ProjectDocument).filter(ProjectDocument.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check access to project
    project = db.query(Project).filter(Project.id == doc.project_id).first()
    if current_user.role != "superadmin":
        is_member = any(m.id == current_user.id for m in project.members)
        if not is_member:
            raise HTTPException(status_code=403, detail="Not authorized to download this document")
            
    from fastapi.responses import RedirectResponse
    
    download_url = storage.get_download_url(doc.file_path, doc.filename)
    return RedirectResponse(url=download_url)
