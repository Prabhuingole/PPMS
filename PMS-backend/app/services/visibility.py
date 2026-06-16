from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.models.timesheet import Timesheet
from app.models.project import Project
from app.models.company import Company
from app.models.document import ProjectDocument
from app.core.tenant import current_tenant_ctx
from fastapi import HTTPException

class TimesheetVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query
        
        tenant_id = current_tenant_ctx.get() or user.company_id
        if not tenant_id:
            return base_query.filter(Timesheet.id == -1) # Failsafe
            
        if user.role == "admin":
            return base_query.filter(
                or_(
                    Timesheet.company_id == tenant_id,
                    Timesheet.user.has(company_id=tenant_id)
                )
            )
        
        # Regular users only see their own
        return base_query.filter(Timesheet.user_id == user.id)

    @staticmethod
    def can_view(user: User, timesheet: Timesheet) -> bool:
        if user.role == "superadmin":
            return True
        tenant_id = current_tenant_ctx.get() or user.company_id
        if user.role == "admin":
            return timesheet.company_id == tenant_id or (timesheet.user and timesheet.user.company_id == tenant_id)
        return timesheet.user_id == user.id

    @staticmethod
    def can_edit(user: User, timesheet: Timesheet) -> bool:
        if user.role == "superadmin":
            return True
        # Admins can only edit if it belongs to their own project
        if user.role == "admin":
            return timesheet.company_id == (current_tenant_ctx.get() or user.company_id)
        return timesheet.user_id == user.id

    @staticmethod
    def can_delete(user: User, timesheet: Timesheet) -> bool:
        return TimesheetVisibilityService.can_edit(user, timesheet)


class ProjectVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query
            
        tenant_id = current_tenant_ctx.get() or user.company_id
        if not tenant_id:
            return base_query.filter(Project.id == -1)
            
        if user.role == "admin":
            return base_query.filter(
                or_(
                    Project.owner_company_id == tenant_id,
                    Project.participating_companies.any(Company.id == tenant_id)
                )
            )
        
        return base_query.filter(Project.members.any(User.id == user.id))

    @staticmethod
    def can_view(user: User, project: Project) -> bool:
        if user.role == "superadmin":
            return True
        tenant_id = current_tenant_ctx.get() or user.company_id
        if user.role == "admin":
            if project.owner_company_id == tenant_id:
                return True
            part_ids = [c.id for c in project.participating_companies]
            return tenant_id in part_ids
        return user.id in [m.id for m in project.members]

    @staticmethod
    def can_edit(user: User, project: Project) -> bool:
        if user.role == "superadmin":
            return True
        if user.role == "admin":
            return project.owner_company_id == (current_tenant_ctx.get() or user.company_id)
        return False

    @staticmethod
    def can_delete(user: User, project: Project) -> bool:
        return ProjectVisibilityService.can_edit(user, project)


class DocumentVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query
            
        tenant_id = current_tenant_ctx.get() or user.company_id
        if not tenant_id:
            return base_query.filter(ProjectDocument.id == -1)
            
        if user.role == "admin":
            # Admin can view documents on projects they participate in or own
            # This requires joining with project
            return base_query.join(ProjectDocument.project).filter(
                or_(
                    Project.owner_company_id == tenant_id,
                    Project.participating_companies.any(Company.id == tenant_id)
                )
            )
            
        # Users see docs for projects they are members of
        return base_query.join(ProjectDocument.project).filter(Project.members.any(User.id == user.id))

    @staticmethod
    def can_view(user: User, document: ProjectDocument) -> bool:
        return ProjectVisibilityService.can_view(user, document.project)

    @staticmethod
    def can_edit(user: User, document: ProjectDocument) -> bool:
        if user.role == "superadmin":
            return True
        if user.role == "admin":
            return document.company_id == (current_tenant_ctx.get() or user.company_id)
        return document.uploaded_by == user.id

    @staticmethod
    def can_delete(user: User, document: ProjectDocument) -> bool:
        return DocumentVisibilityService.can_edit(user, document)
