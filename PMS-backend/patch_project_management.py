import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\project_management.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "from app.services.visibility import ProjectVisibilityService" not in content:
    content = content.replace(
        "from app.core.tenant import require_project_access, current_tenant_ctx",
        "from app.core.tenant import require_project_access, current_tenant_ctx\nfrom app.services.visibility import ProjectVisibilityService"
    )

# Replace get_projects logic
content = re.sub(
    r'if current_user\.role == "admin":\s+tenant_id = current_tenant_ctx\.get\(\)\s+query = query\.filter\(\s+\(Project\.owner_company_id == tenant_id\) \|\s+\(Project\.participating_companies\.any\(Company\.id == tenant_id\)\)\s+\)\s+elif current_user\.role not in \["superadmin", "admin"\]:\s+if include_unassigned:\s+query = query\.filter\(\s+\(Project\.members\.any\(User\.id == current_user\.id\)\) \|\s+\(Project\.status == "active"\)\s+\)\s+else:\s+query = query\.filter\(Project\.members\.any\(User\.id == current_user\.id\)\)',
    r'query = ProjectVisibilityService.get_visible_query(current_user, db, query)',
    content
)

# Add member validation in create_project
old_val = """        for member in members:
            if not member.is_active:
                raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
            new_project.members.append(member)"""
new_val = """        valid_company_ids = part_ids + [payload.owner_company_id]
        for member in members:
            if not member.is_active:
                raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
            if member.company_id not in valid_company_ids:
                raise HTTPException(status_code=403, detail=f"Member {member.full_name} belongs to a company not participating in this project")
            new_project.members.append(member)"""
content = content.replace(old_val, new_val)

# Add member validation in update_project
old_upd_val = """            for member in members:
                if not member.is_active:
                    raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
            
            project.members = members"""
new_upd_val = """            valid_company_ids = [c.id for c in project.participating_companies] + [project.owner_company_id]
            for member in members:
                if not member.is_active:
                    raise HTTPException(status_code=400, detail=f"Member {member.full_name} is not active")
                if member.company_id not in valid_company_ids:
                    raise HTTPException(status_code=403, detail=f"Member {member.full_name} belongs to a company not participating in this project")
            
            project.members = members"""
content = content.replace(old_upd_val, new_upd_val)

# Add /available_members route
new_route = """
@router.get("/{project_id}/available_members")
def get_available_members(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    if not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=403, detail="Not authorized to view this project")
        
    part_ids = [c.id for c in project.participating_companies] + [project.owner_company_id]
    
    users = db.query(User).filter(User.company_id.in_(part_ids), User.is_active == True).all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email, "company_name": u.company.name if u.company else "Independent", "role": u.role, "consultant_type": u.consultant_type} for u in users]
"""
if "/available_members" not in content:
    content += new_route

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("project_management.py patched successfully!")
