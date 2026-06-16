from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.project import Project
from contextvars import ContextVar

current_tenant_ctx: ContextVar[int] = ContextVar("current_tenant_ctx", default=None)

def verify_tenant_access(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> int:
    """
    Derives company context from authenticated user.
    Never trusts client-provided company_id or headers for base authorization.
    """
    if current_user.role == "superadmin":
        return None # Unrestricted
        
    company_id = current_user.company_id
    if company_id:
        current_tenant_ctx.set(company_id)
        
    return company_id

def require_company_access(target_company_id: int):
    def validator(current_user: User = Depends(get_current_user)):
        if current_user.role == "superadmin":
            return True
        if current_user.company_id != target_company_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
        return True
    return validator

def require_project_access(project_id: int):
    def validator(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
        if current_user.role == "superadmin":
            return True
            
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
            
        if current_user.role == "admin":
            participating_ids = [c.id for c in project.participating_companies]
            if current_user.company_id != project.owner_company_id and current_user.company_id not in participating_ids:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
            return project
            
        # Employee or Consultant
        member_ids = [m.id for m in project.members]
        if current_user.id not in member_ids:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
            
        return project
    return validator
