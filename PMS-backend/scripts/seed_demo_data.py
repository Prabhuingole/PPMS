import os
import sys
from datetime import datetime, timedelta
import random

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.reporting_manager import ReportingManager
from app.models.deliverable import Deliverable
from app.models.task import Task
from app.models.task_comment import TaskComment
from app.models.timesheet import Timesheet
from app.models.resource_allocation import ResourceAllocation
from app.models.invoice import Invoice
from app.core.security import get_password_hash

def get_or_create(session, model, defaults=None, **kwargs):
    instance = session.query(model).filter_by(**kwargs).first()
    if instance:
        return instance, False
    else:
        params = dict((k, v) for k, v in kwargs.items())
        params.update(defaults or {})
        instance = model(**params)
        session.add(instance)
        session.commit()
        session.refresh(instance)
        return instance, True

def seed_data():
    db = SessionLocal()
    print("Starting Idempotent Demo Data Seeder...")

    # 1. Companies
    acme, _ = get_or_create(db, Company, code="ACME", defaults={"name": "Acme Consulting", "email": "info@acme.com"})
    globex, _ = get_or_create(db, Company, code="GLBX", defaults={"name": "Globex Technologies", "email": "info@globex.com"})
    
    print("Seeded Companies.")

    # 2. Users
    pwd = get_password_hash("DemoPass123!")
    
    # Superadmin
    superadmin, _ = get_or_create(db, User, email="demo.superadmin@sambhav.com", defaults={
        "full_name": "Demo Superadmin", "role": UserRole.SUPERADMIN, "hashed_password": pwd, "is_active": True
    })

    # Admins (3)
    admins = []
    for i in range(1, 4):
        admin, _ = get_or_create(db, User, email=f"admin{i}@acme.com", defaults={
            "full_name": f"Admin {i}", "role": UserRole.ADMIN, "company_id": acme.id, "hashed_password": pwd, "is_active": True
        })
        admins.append(admin)

    # Reporting Managers (3)
    managers = []
    user_managers = []
    for i in range(1, 4):
        # Create User account
        user_mgr, _ = get_or_create(db, User, email=f"manager{i}@acme.com", defaults={
            "full_name": f"Reporting Manager {i}", "role": UserRole.REPORTING_MANAGER, "company_id": acme.id, "hashed_password": pwd, "is_active": True
        })
        user_managers.append(user_mgr)
        # Create corresponding ReportingManager record
        mgr, _ = get_or_create(db, ReportingManager, email=f"manager{i}@acme.com", defaults={
            "full_name": f"Reporting Manager {i}", "status": "active"
        })
        managers.append(mgr)

    # Consultants (10)
    consultants = []
    for i in range(1, 11):
        cons, _ = get_or_create(db, User, email=f"consultant{i}@acme.com", defaults={
            "full_name": f"Consultant {i}", "role": UserRole.EMPLOYEE, "company_id": acme.id, "hashed_password": pwd, "is_active": True,
            "weekly_capacity_hours": 40.0
        })
        consultants.append(cons)

    print("Seeded Users.")

    # 3. Projects
    healthy_proj, _ = get_or_create(db, Project, code="PRJ-HLTH", defaults={
        "name": "Healthy Project", "owner_company_id": acme.id, "reporting_manager_id": managers[0].id, "total_hours": 1000.0
    })
    critical_proj, _ = get_or_create(db, Project, code="PRJ-CRIT", defaults={
        "name": "Critical Project", "owner_company_id": acme.id, "reporting_manager_id": managers[1].id, "total_hours": 200.0
    })
    understaffed_proj, _ = get_or_create(db, Project, code="PRJ-UNDS", defaults={
        "name": "Understaffed Project", "owner_company_id": acme.id, "reporting_manager_id": managers[2].id, "total_hours": 500.0
    })

    projects = [healthy_proj, critical_proj, understaffed_proj]
    
    # Associate users to projects via user_projects association table
    for p in projects:
        if superadmin not in p.members:
            p.members.append(superadmin)
        for mgr in user_managers:
            if mgr not in p.members:
                p.members.append(mgr)
        for cons in consultants:
            if cons not in p.members:
                p.members.append(cons)
    db.commit()

    print("Seeded Projects.")

    # 4. Allocations
    # Healthy gets 5 consultants @ 20hrs
    for cons in consultants[0:5]:
        get_or_create(db, ResourceAllocation, project_id=healthy_proj.id, user_id=cons.id, defaults={
            "allocated_hours_per_week": 20.0, "start_date": datetime.utcnow() - timedelta(days=30), "end_date": datetime.utcnow() + timedelta(days=60)
        })
    # Critical gets 2 consultants @ 40hrs
    for cons in consultants[5:7]:
        get_or_create(db, ResourceAllocation, project_id=critical_proj.id, user_id=cons.id, defaults={
            "allocated_hours_per_week": 40.0, "start_date": datetime.utcnow() - timedelta(days=15), "end_date": datetime.utcnow() + timedelta(days=15)
        })
    # Understaffed gets 1 consultant @ 10hrs
    get_or_create(db, ResourceAllocation, project_id=understaffed_proj.id, user_id=consultants[7].id, defaults={
        "allocated_hours_per_week": 10.0, "start_date": datetime.utcnow() - timedelta(days=5), "end_date": datetime.utcnow() + timedelta(days=90)
    })
    
    print("Seeded Allocations.")

    # 5. Deliverables & Tasks
    statuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'DONE']
    priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    for p_idx, proj in enumerate(projects):
        # 7 deliverables per project = 21 total
        for d_idx in range(1, 8):
            d_name = f"Deliverable {p_idx}-{d_idx}"
            deliv, _ = get_or_create(db, Deliverable, project_id=proj.id, name=d_name, defaults={"status": "active"})
            
            # ~3 tasks per deliverable = 60+ tasks total
            for t_idx in range(1, 4):
                t_title = f"Task {p_idx}-{d_idx}-{t_idx}"
                est_hrs = random.choice([4.0, 8.0, 16.0, 24.0])
                
                status = random.choice(statuses)
                if proj == critical_proj and t_idx == 1:
                    status = 'BLOCKED'
                elif proj == healthy_proj and t_idx == 1:
                    status = 'DONE'

                actual = est_hrs * 1.5 if proj == critical_proj else (est_hrs * 0.8 if status == 'DONE' else 0)

                get_or_create(db, Task, project_id=proj.id, title=t_title, defaults={
                    "deliverable_id": deliv.id,
                    "assignee_id": random.choice(consultants).id,
                    "creator_id": user_managers[0].id,
                    "estimated_hours": est_hrs,
                    "actual_hours": actual,
                    "status": status,
                    "priority": random.choice(priorities)
                })
    print("Seeded Deliverables and Tasks.")

    # 6. Timesheets (4 weeks history)
    # Give Healthy project lots of approved timesheets
    now = datetime.utcnow()
    for week_back in range(4):
        for cons in consultants[0:5]:
            ts_date = now - timedelta(days=(week_back*7 + 2))
            get_or_create(db, Timesheet, user_id=cons.id, project_id=healthy_proj.id, date=ts_date, defaults={
                "hours": 8.0,
                "description": f"Worked on Healthy Project week -{week_back}",
                "status": "approved",
                "company_id": acme.id
            })
            
    # Give Critical project some excessive hours (overburn)
    for week_back in range(2):
        for cons in consultants[5:7]:
            ts_date = now - timedelta(days=(week_back*7 + 1))
            get_or_create(db, Timesheet, user_id=cons.id, project_id=critical_proj.id, date=ts_date, defaults={
                "hours": 12.0, # overtime
                "description": f"Firefighting Critical Project",
                "status": "approved",
                "company_id": acme.id
            })

    print("Seeded Timesheets.")

    # 7. Invoices
    inv1, _ = get_or_create(db, Invoice, invoice_number="INV-DEMO-001", defaults={
        "vendor_company_id": acme.id, "client_company_id": globex.id, "status": "paid",
        "total_amount": 5000.0, "currency": "USD", "issued_date": now - timedelta(days=20), "due_date": now - timedelta(days=5),
        "billing_period_start": now - timedelta(days=50), "billing_period_end": now - timedelta(days=20)
    })
    
    inv2, _ = get_or_create(db, Invoice, invoice_number="INV-DEMO-002", defaults={
        "vendor_company_id": acme.id, "client_company_id": globex.id, "status": "overdue",
        "total_amount": 3200.0, "currency": "USD", "issued_date": now - timedelta(days=10), "due_date": now - timedelta(days=2),
        "billing_period_start": now - timedelta(days=40), "billing_period_end": now - timedelta(days=10)
    })

    inv3, _ = get_or_create(db, Invoice, invoice_number="INV-DEMO-003", defaults={
        "vendor_company_id": acme.id, "client_company_id": globex.id, "status": "draft",
        "total_amount": 8000.0, "currency": "USD", "issued_date": now, "due_date": now + timedelta(days=15),
        "billing_period_start": now - timedelta(days=30), "billing_period_end": now
    })

    print("Seeded Invoices.")
    print("DONE! Demo dataset is primed.")

if __name__ == "__main__":
    seed_data()
