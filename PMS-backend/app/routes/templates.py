from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.database.session import get_db
from app.models.template import DocumentTemplate
from app.models.user import User
from app.schemas.template import DocumentTemplateResponse
from app.core.deps import get_current_user, get_superadmin
from app.core.audit import create_audit_log
from app.core.s3 import storage
from fastapi import BackgroundTasks
from app.core.websockets import manager

router = APIRouter(prefix="/templates", tags=["templates"])

#TEMPLATE_DIR = "uploads/templates"
#os.makedirs(TEMPLATE_DIR, exist_ok=True)

@router.post("/update", response_model=DocumentTemplateResponse)
async def update_template(
    request: Request,
    doc_type: str = Form(...),
    old_doc_type: str = Form(None),
    html_content: str = Form(None),
    remove_file: bool = Form(False),
    file: UploadFile = File(None),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    query_doc_type = old_doc_type if old_doc_type else doc_type
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == query_doc_type).first()
    
    is_new = False
    old_values = None
    if not template:
        is_new = True
        template = DocumentTemplate(doc_type=doc_type)
        db.add(template)
    else:
        old_values = {"doc_type": template.doc_type, "filename": template.filename}
        template.doc_type = doc_type
    
    if html_content is not None:
        template.html_content = html_content
    
    if remove_file:
        template.filename = None
        template.file_path = None
    elif file:
        unique_key = f"templates/{doc_type}_{file.filename}"
        storage.upload_file(file.file, unique_key, content_type=file.content_type)
        template.filename = file.filename
        template.file_path = unique_key
        
    db.commit()
    db.refresh(template)
    
    create_audit_log(
        db=db,
        action="TEMPLATE_CREATED" if is_new else "TEMPLATE_UPDATED",
        entity_type="template",
        entity_id=template.id,
        user=admin,
        old_values=old_values,
        new_values={"doc_type": template.doc_type, "filename": template.filename},
        request=request
    )
    
    if background_tasks:
        background_tasks.add_task(manager.broadcast, {"event": "TEMPLATES_UPDATED"})
    return template

@router.get("/", response_model=List[DocumentTemplateResponse])
def get_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DocumentTemplate).order_by(DocumentTemplate.updated_at.desc()).all()

@router.delete("/delete/{doc_type}")
def delete_template(
    doc_type: str,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db),
    admin: User = Depends(get_superadmin)
):
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == doc_type).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    old_values = {"doc_type": template.doc_type, "filename": template.filename}
    template_id = template.id
    
    db.delete(template)
    db.commit()
    
    create_audit_log(
        db=db,
        action="TEMPLATE_DELETED",
        entity_type="template",
        entity_id=template_id,
        user=admin,
        old_values=old_values,
        request=request
    )
    
    background_tasks.add_task(manager.broadcast, {"event": "TEMPLATES_UPDATED"})
    return {"message": "Template deleted successfully"}

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
    request: Request,
    inline: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(DocumentTemplate).filter(DocumentTemplate.doc_type == doc_type).first()
    if not template or not template.file_path:
        raise HTTPException(status_code=404, detail="Template file not found")
        
    download_url = storage.get_download_url(template.file_path, template.filename, inline=inline)
    
    create_audit_log(
        db=db,
        action="TEMPLATE_VIEWED" if inline else "TEMPLATE_DOWNLOADED",
        entity_type="template",
        entity_id=template.id,
        user=current_user,
        request=request
    )
    
    return {"url": download_url, "filename": template.filename}
