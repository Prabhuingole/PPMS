from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class AttendanceSummaryRecord(BaseModel):
    user_id: int
    name: str
    employee_id: str
    company: str
    role: str

    total_working_days: int
    present_days: int
    absent_days: int
    half_days: int
    leave_days: int
    missing_clock_in: int
    missing_clock_out: int
    late_arrivals: int
    early_leaves: int
    average_working_hours: float
    total_working_hours: float
    overtime_hours: float
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None

class DailyAttendanceRecord(BaseModel):
    user_id: int
    name: str
    employee_id: str
    company: str
    role: str
    date: date
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    break_time: Optional[float] = 0.0
    total_hours: Optional[float] = 0.0
    status: str
    timesheet_filled: bool = False

class TimesheetComplianceRecord(BaseModel):
    user_id: int
    name: str
    expected_timesheets: int
    submitted: int
    approved: int
    pending: int
    rejected: int
    missing: int
    compliance_percentage: float

class ProductivityRecord(BaseModel):
    user_id: int
    name: str
    assigned_tasks: int
    completed_tasks: int
    in_progress: int
    blocked: int
    estimated_hours: float
    actual_hours: float
    timesheet_hours: float
    efficiency_percentage: float

class MissingAttendanceRecord(BaseModel):
    user_id: int
    name: str
    date: date
    forgot_clock_in: bool
    forgot_clock_out: bool
    did_not_submit_timesheet: bool
    absent_without_timesheet: bool
