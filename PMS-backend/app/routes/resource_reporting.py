from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.core.deps import get_current_user, get_superadmin
from app.models.user import User
from app.core.tenant import verify_tenant_access
from app.services.resource_reporting_service import ResourceReportingService

router = APIRouter(prefix="/resource-reports", tags=["resource_reports"])

class ResourceSummaryResponse(BaseModel):
    active_consultants: int
    assigned_consultants: int
    unassigned_consultants: int
    open_projects: int
    total_capacity_hours: float
    total_allocated_hours: float
    available_capacity_hours: float
    utilization_percentage: float

class UtilizationResponse(BaseModel):
    user_id: int
    consultant_name: str
    weekly_capacity_hours: float
    allocated_hours: float
    logged_hours: float
    utilization_percentage: float
    status: str

class ProjectHealthResponse(BaseModel):
    project_id: int
    project_name: str
    financial_burn_rate: float
    execution_progress: float
    variance: float
    risk: str

@router.get("/resource-summary", response_model=ResourceSummaryResponse)
def get_resource_summary(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    cid = company_id if company_id else tenant_id
    if current_user.role == "superadmin":
        cid = company_id
    return ResourceReportingService.get_resource_summary(db, cid)

@router.get("/utilization", response_model=List[UtilizationResponse])
def get_utilization(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    cid = company_id if company_id else tenant_id
    if current_user.role == "superadmin":
        cid = company_id
    return ResourceReportingService.get_utilization(db, cid)

@router.get("/project-health", response_model=List[ProjectHealthResponse])
def get_project_health(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_superadmin),
    tenant_id: Optional[int] = Depends(verify_tenant_access)
):
    cid = company_id if company_id else tenant_id
    if current_user.role == "superadmin":
        cid = company_id
    return ResourceReportingService.get_project_health(db, cid)
