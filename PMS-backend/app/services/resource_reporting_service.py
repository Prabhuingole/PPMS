from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.resource_allocation import ResourceAllocation
from app.models.timesheet import Timesheet
from app.models.task import Task
from app.services.reporting_service import ReportingService

class ResourceReportingService:
    @staticmethod
    def get_resource_summary(db: Session, company_id: int = None):
        # Active consultants
        ac_query = db.query(User).filter(User.role == UserRole.CONSULTANT, User.is_active == True)
        if company_id:
            ac_query = ac_query.filter(User.company_id == company_id)
        active_consultants = ac_query.count()

        # Assigned consultants
        asc_query = db.query(User).join(ResourceAllocation).filter(
            User.role == UserRole.CONSULTANT, 
            User.is_active == True,
            ResourceAllocation.is_active == True
        ).distinct()
        if company_id:
            asc_query = asc_query.filter(User.company_id == company_id)
        assigned_consultants = asc_query.count()

        unassigned_consultants = active_consultants - assigned_consultants

        # Open Projects
        op_query = db.query(Project).filter(Project.status.in_(['active', 'planning']))
        if company_id:
            op_query = op_query.filter(Project.owner_company_id == company_id)
        open_projects = op_query.count()

        # Total Capacity
        cap_query = db.query(func.sum(User.weekly_capacity_hours)).filter(User.role == UserRole.CONSULTANT, User.is_active == True)
        if company_id:
            cap_query = cap_query.filter(User.company_id == company_id)
        total_capacity_hours = cap_query.scalar() or 0.0

        # Total Allocated Hours
        alloc_query = db.query(func.sum(ResourceAllocation.allocated_hours_per_week)).join(User).filter(
            User.role == UserRole.CONSULTANT,
            User.is_active == True,
            ResourceAllocation.is_active == True
        )
        if company_id:
            alloc_query = alloc_query.filter(User.company_id == company_id)
        total_allocated_hours = alloc_query.scalar() or 0.0

        available_capacity_hours = total_capacity_hours - total_allocated_hours
        utilization_percentage = (total_allocated_hours / total_capacity_hours * 100) if total_capacity_hours > 0 else 0.0

        return {
            "active_consultants": active_consultants,
            "assigned_consultants": assigned_consultants,
            "unassigned_consultants": unassigned_consultants,
            "open_projects": open_projects,
            "total_capacity_hours": round(total_capacity_hours, 2),
            "total_allocated_hours": round(total_allocated_hours, 2),
            "available_capacity_hours": round(available_capacity_hours, 2),
            "utilization_percentage": round(utilization_percentage, 2)
        }

    @staticmethod
    def get_utilization(db: Session, company_id: int = None):
        # Return per consultant: user_id, consultant_name, weekly_capacity_hours, allocated_hours, logged_hours, utilization_percentage, status
        
        # We need to calculate this per consultant. For logged_hours, we might just look at all time or maybe current week?
        # The prompt says "Logged Hours". I'll use a subquery or join for recent logged hours, but given scope reduction, all-time logged hours might be skewed. Let's assume total or we can just fetch total allocations and timesheets.
        
        # Get active consultants
        consultants_query = db.query(User).filter(User.role == UserRole.CONSULTANT, User.is_active == True)
        if company_id:
            consultants_query = consultants_query.filter(User.company_id == company_id)
        consultants = consultants_query.all()

        results = []
        for c in consultants:
            # Allocated hours
            alloc_hours = db.query(func.sum(ResourceAllocation.allocated_hours_per_week)).filter(
                ResourceAllocation.user_id == c.id,
                ResourceAllocation.is_active == True
            ).scalar() or 0.0

            # Logged hours (total) - maybe restrict to recent 30 days or just total
            # Let's just use total for simplicity as requested MVP
            logged_hours = db.query(func.sum(Timesheet.hours)).filter(Timesheet.user_id == c.id).scalar() or 0.0

            utilization = (alloc_hours / c.weekly_capacity_hours * 100) if c.weekly_capacity_hours > 0 else 0.0

            if utilization < 60:
                status = "UNDERUTILIZED"
            elif utilization <= 90:
                status = "HEALTHY"
            elif utilization <= 100:
                status = "FULL_CAPACITY"
            else:
                status = "OVERALLOCATED"

            results.append({
                "user_id": c.id,
                "consultant_name": c.full_name,
                "weekly_capacity_hours": c.weekly_capacity_hours,
                "allocated_hours": round(alloc_hours, 2),
                "logged_hours": round(logged_hours, 2),
                "utilization_percentage": round(utilization, 2),
                "status": status
            })
            
        return results

    @staticmethod
    def get_project_health(db: Session, company_id: int = None):
        # Return: project_id, project_name, financial_burn_rate, execution_progress, variance, risk
        projects_query = db.query(Project).filter(Project.status.in_(['active', 'planning']))
        if company_id:
            projects_query = projects_query.filter(Project.owner_company_id == company_id)
        projects = projects_query.all()

        results = []
        for p in projects:
            # Financial Burn: Total Cost / Budget (if budget exists, wait, Project model doesn't have budget. It has total_hours maybe?)
            # Prompt: "Financial Burn Rate. Execution Progress. Variance = Financial Burn % - Execution Progress %"
            # If no budget, we can use total_cost vs arbitrary, or total logged hours vs total estimated hours?
            # We don't have a budget field, but we have Project.total_hours (which might be the target). Let's check `Timesheet` cost.
            # I will calculate:
            # execution_progress = sum(completed task est hours) / sum(all task est hours)
            tasks_all = db.query(Task).filter(Task.project_id == p.id, Task.is_active == True).all()
            total_est = sum(t.estimated_hours for t in tasks_all)
            completed_est = sum(t.estimated_hours for t in tasks_all if t.status == 'DONE')
            exec_progress = (completed_est / total_est * 100) if total_est > 0 else 0.0

            # Financial Burn: Since we don't have budget, maybe logged hours / total_hours? Or maybe logged hours vs estimated hours?
            # Let's use logged hours / total_hours if total_hours > 0 else logged / estimated
            logged = db.query(func.sum(Timesheet.hours)).filter(Timesheet.project_id == p.id).scalar() or 0.0
            
            budget_hours = p.total_hours if p.total_hours > 0 else total_est
            burn_rate = (logged / budget_hours * 100) if budget_hours > 0 else 0.0

            variance = burn_rate - exec_progress

            # Risk Rules: 0-10 = Healthy, 10-25 = Watch, 25+ = Critical
            # Also if variance is negative (ahead of schedule), it's Healthy
            if variance < 10:
                risk = "HEALTHY"
            elif variance < 25:
                risk = "WATCH"
            else:
                risk = "CRITICAL"

            results.append({
                "project_id": p.id,
                "project_name": p.name,
                "financial_burn_rate": round(burn_rate, 2),
                "execution_progress": round(exec_progress, 2),
                "variance": round(variance, 2),
                "risk": risk
            })
            
        return results
