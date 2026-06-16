import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\documents.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Add imports
if "from app.services.visibility import DocumentVisibilityService, ProjectVisibilityService" not in content:
    content = content.replace(
        "from app.core.tenant import require_project_access, current_tenant_ctx",
        "from app.core.tenant import current_tenant_ctx\nfrom app.services.visibility import DocumentVisibilityService, ProjectVisibilityService"
    )

# upload_document: replace require_project_access
old_upload = """    # Verify project exists
    # Use require_project_access for security validation
    project = require_project_access(db, project_id, current_user)"""
new_upload = """    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")"""
content = content.replace(old_upload, new_upload)

# get_project_documents: replace require_project_access
old_get = """    # Verify project access
    require_project_access(db, project_id, current_user)"""
new_get = """    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not ProjectVisibilityService.can_view(current_user, project):
        raise HTTPException(status_code=404, detail="Project not found")"""
content = content.replace(old_get, new_get)

# download_document
old_download = """    # Tenant IDOR check
    if current_user.role != "superadmin" and doc.company_id and doc.company_id != current_tenant_ctx.get():
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check access to project
    require_project_access(db, doc.project_id, current_user)"""
new_download = """    if not DocumentVisibilityService.can_view(current_user, doc):
        raise HTTPException(status_code=404, detail="Document not found")"""
content = content.replace(old_download, new_download)

# delete_document
old_delete = """    # Tenant IDOR check
    if current_user.role != "superadmin" and doc.company_id and doc.company_id != current_tenant_ctx.get():
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Check access to project
    require_project_access(db, doc.project_id, current_user)"""
new_delete = """    if not DocumentVisibilityService.can_delete(current_user, doc):
        raise HTTPException(status_code=404, detail="Not authorized to delete document")"""
content = content.replace(old_delete, new_delete)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("documents.py patched successfully!")
