from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.database.session import get_db
from app.models.template import DocumentTemplate
from app.models.user import User
from app.schemas.template import DocumentTemplateResponse
from app.core.deps import get_current_user, get_superadmin
from app.core.s3 import storage

router = APIRouter(prefix="/templates", tags=["templates"])

TEMPLATE_DIR = "uploads/templates"
os.makedirs(TEMPLATE_DIR, exist_ok=True)

@router.post("/update", response_model=DocumentTemplateResponse)
async def update_template(
    doc_type: str = Form(...),
    html_content: str = Form(None),
    file: UploadFile = File(None),
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == doc_type).first()
    
    if not template:
        template = DocumentTemplate(doc_type=doc_type)
        db.add(template)
    
    if html_content is not None:
        template.html_content = html_content
    
    if file:
        unique_key = f"templates/{doc_type}_{file.filename}"
        storage.upload_file(file.file, unique_key, content_type=file.content_type)
        template.filename = file.filename
        template.file_path = unique_key
        
    db.commit()
    db.refresh(template)
    return template

@router.get("/", response_model=List[DocumentTemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DocumentTemplate).all()

@router.get("/{doc_type}", response_model=DocumentTemplateResponse)
def get_template_by_type(
    doc_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == doc_type).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

from fastapi.responses import FileResponse

@router.get("/download/{doc_type}")
def download_template_file(
    doc_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == doc_type).first()
    from fastapi.responses import RedirectResponse
    
    download_url = storage.get_download_url(template.file_path, template.filename)
    return RedirectResponse(url=download_url)
