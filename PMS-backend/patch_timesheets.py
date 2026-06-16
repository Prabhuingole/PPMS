import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\timesheets.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace inline tenant logic with Service in get_all_timesheets, get_grouped_timesheets
content = re.sub(
    r'if admin\.role == "admin":\s*query = query\.filter\(Timesheet\.company_id == current_tenant_ctx\.get\(\)\)',
    r'query = TimesheetVisibilityService.get_visible_query(admin, db, query)',
    content
)

# For get_grouped_timesheets_paginated
#     if admin.role == "admin":
#         subq = subq.filter(Timesheet.company_id == current_tenant_ctx.get())
content = re.sub(
    r'if admin\.role == "admin":\s*subq = subq\.filter\(Timesheet\.company_id == current_tenant_ctx\.get\(\)\)',
    r'subq = TimesheetVisibilityService.get_visible_query(admin, db, subq)',
    content
)

# Snapshot billed_rate
#             status="pending",
#             is_unassigned_project=is_unassigned
content = re.sub(
    r'(status="pending",\s*is_unassigned_project=is_unassigned)',
    r'\1,\n            billed_rate=current_user.hourly_rate',
    content
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("timesheets.py patched successfully!")
