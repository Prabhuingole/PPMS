from sqlalchemy.orm import Session
from sqlalchemy import func, case, extract
from app.models.timesheet import Timesheet, BillingStatus
from app.models.invoice import Invoice, InvoiceStatus
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.associations import user_projects

class ReportingService:
    @staticmethod
    def get_billing_report(db: Session, vendor_id: int = None, client_id: int = None, project_id: int = None):
        # 1. Timesheet Aggregations (Consultant & Cost Metrics)
        ts_query = db.query(
            func.sum(Timesheet.hours).label("total_hours"),
            func.sum(case((Timesheet.is_billable == True, Timesheet.hours), else_=0)).label("billable_hours"),
            func.sum(case((Timesheet.is_billable == False, Timesheet.hours), else_=0)).label("non_billable_hours"),
            func.sum(Timesheet.hours * Timesheet.billed_rate).label("total_cost")
        )
        
        if vendor_id:
            ts_query = ts_query.filter(Timesheet.company_id == vendor_id)
        if project_id:
            ts_query = ts_query.filter(Timesheet.project_id == project_id)
        if client_id:
            ts_query = ts_query.join(Project, Timesheet.project_id == Project.id).filter(Project.owner_company_id == client_id)
            
        ts_result = ts_query.first()
        
        total_hours = ts_result.total_hours or 0.0
        billable_hours = ts_result.billable_hours or 0.0
        non_billable_hours = ts_result.non_billable_hours or 0.0
        total_cost = ts_result.total_cost or 0.0
        utilization_percentage = (billable_hours / total_hours * 100) if total_hours > 0 else 0.0

        # 2. Grouped Costs
        # Cost by Project
        cbp_query = db.query(Timesheet.project_id, Project.name, func.sum(Timesheet.hours * Timesheet.billed_rate).label("cost"))\
            .join(Project, Timesheet.project_id == Project.id)\
            .group_by(Timesheet.project_id, Project.name)
        if vendor_id: cbp_query = cbp_query.filter(Timesheet.company_id == vendor_id)
        if project_id: cbp_query = cbp_query.filter(Timesheet.project_id == project_id)
        if client_id: cbp_query = cbp_query.filter(Project.owner_company_id == client_id)
        cost_by_project = [{"project_id": r.project_id, "project_name": r.name, "cost": r.cost} for r in cbp_query.all() if r.cost is not None]

        # Cost by Consultant
        cbc_query = db.query(Timesheet.user_id, User.full_name, func.sum(Timesheet.hours * Timesheet.billed_rate).label("cost"))\
            .join(User, Timesheet.user_id == User.id)\
            .group_by(Timesheet.user_id, User.full_name)
        if vendor_id: cbc_query = cbc_query.filter(Timesheet.company_id == vendor_id)
        if project_id: cbc_query = cbc_query.filter(Timesheet.project_id == project_id)
        if client_id: cbc_query = cbc_query.join(Project, Timesheet.project_id == Project.id).filter(Project.owner_company_id == client_id)
        cost_by_consultant = [{"user_id": r.user_id, "consultant_name": r.full_name, "cost": r.cost} for r in cbc_query.all() if r.cost is not None]

        # Cost by Company
        from app.models.company import Company
        cbco_query = db.query(Timesheet.company_id, Company.name, func.sum(Timesheet.hours * Timesheet.billed_rate).label("cost"))\
            .join(Company, Timesheet.company_id == Company.id)\
            .group_by(Timesheet.company_id, Company.name)
        if vendor_id: cbco_query = cbco_query.filter(Timesheet.company_id == vendor_id)
        if project_id: cbco_query = cbco_query.filter(Timesheet.project_id == project_id)
        if client_id: cbco_query = cbco_query.join(Project, Timesheet.project_id == Project.id).filter(Project.owner_company_id == client_id)
        cost_by_company = [{"company_id": r.company_id, "company_name": r.name, "cost": r.cost} for r in cbco_query.all() if r.cost is not None]
        
        # Monthly Cost Trends (YYYY-MM)
        mct_query = db.query(
            func.strftime('%Y-%m', Timesheet.date).label('month'),
            func.sum(Timesheet.hours * Timesheet.billed_rate).label("cost")
        ).group_by(func.strftime('%Y-%m', Timesheet.date))
        
        if vendor_id: mct_query = mct_query.filter(Timesheet.company_id == vendor_id)
        if project_id: mct_query = mct_query.filter(Timesheet.project_id == project_id)
        if client_id: mct_query = mct_query.join(Project, Timesheet.project_id == Project.id).filter(Project.owner_company_id == client_id)
        
        monthly_cost_trends = [{"month": r.month, "cost": r.cost} for r in mct_query.all() if r.month and r.cost is not None]
        monthly_cost_trends.sort(key=lambda x: x["month"])

        # 3. Resource Planning Metrics
        ac_query = db.query(User).filter(User.role == UserRole.CONSULTANT, User.is_active == True)
        if vendor_id: ac_query = ac_query.filter(User.company_id == vendor_id)
        active_consultants = ac_query.count()

        asc_query = db.query(User).join(user_projects).join(Project).filter(
            User.role == UserRole.CONSULTANT, 
            User.is_active == True,
            Project.status != 'archived'
        ).distinct()
        if vendor_id: asc_query = asc_query.filter(User.company_id == vendor_id)
        assigned_consultants = asc_query.count()

        unassigned_consultants = active_consultants - assigned_consultants

        op_query = db.query(Project).filter(Project.status != 'archived')
        if client_id: op_query = op_query.filter(Project.owner_company_id == client_id)
        if vendor_id: op_query = op_query.join(user_projects).join(User).filter(User.company_id == vendor_id).distinct()
        open_projects = op_query.count()

        # Preserve dummy AR fields so legacy frontend widgets don't crash before they are removed
        return {
            "total_hours": round(total_hours, 2),
            "billable_hours": round(billable_hours, 2),
            "non_billable_hours": round(non_billable_hours, 2),
            "utilization_percentage": round(utilization_percentage, 2),
            
            "total_cost": round(total_cost, 2),
            "cost_by_project": cost_by_project,
            "cost_by_consultant": cost_by_consultant,
            "cost_by_company": cost_by_company,
            "monthly_cost_trends": monthly_cost_trends,
            
            "active_consultants": active_consultants,
            "assigned_consultants": assigned_consultants,
            "unassigned_consultants": unassigned_consultants,
            "open_projects": open_projects,
            
            # Legacy AR preserved to avoid breaking changes
            "pending_revenue": 0.0,
            "invoiced_revenue": 0.0,
            "paid_revenue": 0.0,
            "outstanding_amount": 0.0,
            "overdue_amount": 0.0,
            "unpaid_invoice_count": 0,
            "average_collection_time_days": 0.0,
            "days_sales_outstanding": 0.0
        }
