import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\timesheets.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add ProjectVisibilityService import
if "ProjectVisibilityService" not in content:
    content = content.replace(
        "from app.services.visibility import TimesheetVisibilityService",
        "from app.services.visibility import TimesheetVisibilityService, ProjectVisibilityService"
    )

old_logic = """        if ts.project_id:
            project = require_project_access(db, ts.project_id, current_user)
            company_id = project.owner_company_id"""
new_logic = """        if ts.project_id:
            project = db.query(Project).filter(Project.id == ts.project_id).first()
            if not project or not ProjectVisibilityService.can_view(current_user, project):
                raise HTTPException(status_code=403, detail="Not authorized to submit timesheets for this project")
            company_id = project.owner_company_id"""
content = content.replace(old_logic, new_logic)

old_logic_2 = """        if ts_data.project_id:
            project = require_project_access(db, ts_data.project_id, current_user)
            company_id = project.owner_company_id"""
new_logic_2 = """        if ts_data.project_id:
            project = db.query(Project).filter(Project.id == ts_data.project_id).first()
            if not project or not ProjectVisibilityService.can_view(current_user, project):
                raise HTTPException(status_code=403, detail="Not authorized to submit timesheets for this project")
            company_id = project.owner_company_id"""
content = content.replace(old_logic_2, new_logic_2)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("timesheets.py require_project_access patched successfully!")
