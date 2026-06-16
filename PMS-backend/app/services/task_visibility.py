from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.reporting_manager import ReportingManager
from app.core.tenant import current_tenant_ctx

class TaskVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query
            
        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            # Failsafe: if tenant context is missing for non-superadmin, return empty
            return base_query.filter(Task.id == -1)

        if user.role == "admin":
            # Admin sees all tasks within their tenant projects
            return base_query.join(Task.project).filter(Project.owner_company_id == tenant_id)

        if user.role == "reporting_manager":
            # Find ReportingManager record corresponding to user's email
            rm = db.query(ReportingManager).filter(ReportingManager.email == user.email).first()
            rm_id = rm.id if rm else -1
            
            # RM sees tasks where they manage the project OR they are a member of the project
            return base_query.join(Task.project).filter(
                or_(
                    Project.reporting_manager_id == rm_id,
                    Project.members.any(User.id == user.id)
                )
            )

        # Consultant/Employee/Intern: only see tasks on projects they are a member of
        return base_query.join(Task.project).filter(Project.members.any(User.id == user.id))

    @staticmethod
    def can_view(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True
            
        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        if user.role == "reporting_manager":
            rm = db.query(ReportingManager).filter(ReportingManager.email == user.email).first()
            rm_id = rm.id if rm else -1
            if task.project.reporting_manager_id == rm_id:
                return True
            return user.id in [m.id for m in task.project.members]

        # Consultant / Employee / Intern
        return user.id in [m.id for m in task.project.members]

    @staticmethod
    def can_edit(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True
            
        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        if user.role == "reporting_manager":
            rm = db.query(ReportingManager).filter(ReportingManager.email == user.email).first()
            rm_id = rm.id if rm else -1
            # RMs can edit tasks on projects they manage
            if task.project.reporting_manager_id == rm_id:
                return True
            # If they are just a member, they can only edit if assigned to them
            return task.assignee_id == user.id

        # Consultant / Employee / Intern: edit only if assigned to them
        return task.assignee_id == user.id

    @staticmethod
    def can_delete(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        if user.role == "reporting_manager":
            rm = db.query(ReportingManager).filter(ReportingManager.email == user.email).first()
            rm_id = rm.id if rm else -1
            # RMs can delete tasks on projects they manage
            return task.project.reporting_manager_id == rm_id

        # Consultant / Employee / Intern: cannot delete unless it is assigned to them (foreign task constraint)
        return task.assignee_id == user.id
