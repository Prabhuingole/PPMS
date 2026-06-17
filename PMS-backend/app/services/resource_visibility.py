from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.models.resource_allocation import ResourceAllocation
from app.models.project import Project

from app.core.tenant import current_tenant_ctx

class ResourceVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return base_query.filter(ResourceAllocation.id == -1)

        if user.role == "admin":
            # Admin sees allocations for projects owned by their company
            return base_query.join(ResourceAllocation.project).filter(Project.owner_company_id == tenant_id)

        if user.role == "reporting_manager":
            # RM sees allocations for projects they manage
            return base_query.join(ResourceAllocation.project).filter(Project.reporting_manager_id == user.id)

        # Consultant / Employee / Intern only see their own allocations
        return base_query.filter(ResourceAllocation.user_id == user.id)

    @staticmethod
    def can_view(user: User, allocation: ResourceAllocation, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return allocation.project.owner_company_id == tenant_id

        if user.role == "reporting_manager":
            return allocation.project.reporting_manager_id == user.id

        # Consultant / Employee / Intern
        return allocation.user_id == user.id

    @staticmethod
    def can_edit(user: User, allocation: ResourceAllocation, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return allocation.project.owner_company_id == tenant_id

        if user.role == "reporting_manager":
            return allocation.project.reporting_manager_id == user.id

        # Consultants / Employees / Interns cannot modify allocations
        return False

    @staticmethod
    def can_delete(user: User, allocation: ResourceAllocation, db: Session) -> bool:
        return ResourceVisibilityService.can_edit(user, allocation, db)
