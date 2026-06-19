from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.models.task import Task
from app.models.project import Project

from app.core.tenant import current_tenant_ctx

class TaskVisibilityService:
    @staticmethod
    def get_visible_query(user: User, db: Session, base_query):
        if user.role == "superadmin":
            return base_query

        if user.role in ["consultant", "employee", "intern"]:
            # Consultant/Employee/Intern: only see tasks on projects they are a member of, OR tasks assigned to them
            return base_query.join(Task.project).filter(
                or_(
                    Project.members.any(User.id == user.id),
                    Task.assignee_id == user.id
                )
            )

        if user.role == "reporting_manager":
            # RM sees tasks where they manage the project OR they are a member of the project
            return base_query.join(Task.project).filter(
                or_(
                    Project.reporting_manager_id == user.id,
                    Project.members.any(User.id == user.id)
                )
            )

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            # Failsafe: if tenant context is missing for admin, return empty
            return base_query.filter(Task.id == -1)

        if user.role == "admin":
            # Admin sees all tasks within their tenant projects
            return base_query.join(Task.project).filter(Project.owner_company_id == tenant_id)

        return base_query.filter(Task.id == -1)
    @staticmethod
    def can_view(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        # Consultant / Employee / Intern
        if user.role in ["consultant", "employee", "intern"]:
            if task.assignee_id == user.id:
                return True
            return user.id in [m.id for m in task.project.members]

        if user.role == "reporting_manager":
            if task.project.reporting_manager_id == user.id:
                return True
            return user.id in [m.id for m in task.project.members]

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        return False

    @staticmethod
    def can_edit(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        if user.role in ["consultant", "employee", "intern"]:
            # Consultant / Employee / Intern: edit only if assigned to them
            return task.assignee_id == user.id

        if user.role == "reporting_manager":
            # RMs can edit tasks on projects they manage
            if task.project.reporting_manager_id == user.id:
                return True
            # If they are just a member, they can only edit if assigned to them
            return task.assignee_id == user.id

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        return False

    @staticmethod
    def can_delete(user: User, task: Task, db: Session) -> bool:
        if user.role == "superadmin":
            return True

        if user.role in ["consultant", "employee", "intern"]:
            # Consultant / Employee / Intern: cannot delete unless it is assigned to them
            return task.assignee_id == user.id

        if user.role == "reporting_manager":
            # RMs can delete tasks on projects they manage
            return task.project.reporting_manager_id == user.id

        tenant_id = current_tenant_ctx.get()
        if not tenant_id:
            return False

        if user.role == "admin":
            return task.project.owner_company_id == tenant_id

        return False

    @staticmethod
    def get_task(db: Session, task_id: int, user: User):
        """Fetch a task if it is visible to the current user, else return None."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            return None
        if not TaskVisibilityService.can_view(user, task, db):
            return None
        return task
