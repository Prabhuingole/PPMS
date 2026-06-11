import re

with open("app/routes/auth.py", "r") as f:
    content = f.read()

# 1. Add hashlib
if "import hashlib" not in content:
    content = content.replace("import uuid", "import uuid\nimport hashlib")

# 2. Hash session id in UserSession instantiation
content = re.sub(
    r"session_id=session_id,\s*device_info=user_agent,",
    r"session_id=hashlib.sha256(session_id.encode()).hexdigest(),\n        device_info=user_agent,",
    content
)

# 3. get_active_sessions
content = content.replace(
    """    current_jti = payload.get("jti")""",
    """    current_jti = payload.get("jti")\n    current_jti_hashed = hashlib.sha256(current_jti.encode()).hexdigest() if current_jti else None"""
)
content = content.replace(
    """"is_current": s.session_id == current_jti""",
    """"is_current": s.session_id == current_jti_hashed"""
)

# 4. revoke_all_other_sessions
content = content.replace(
    """    current_jti = payload.get("jti")\n\n    db.query(UserSession).filter(\n        UserSession.user_id == current_user.id, \n        UserSession.session_id != current_jti\n    ).update({"is_active": False})""",
    """    current_jti = payload.get("jti")\n    current_jti_hashed = hashlib.sha256(current_jti.encode()).hexdigest() if current_jti else None\n\n    db.query(UserSession).filter(\n        UserSession.user_id == current_user.id, \n        UserSession.session_id != current_jti_hashed\n    ).update({"is_active": False})"""
)

# 5. forgot_password
old_forgot = """@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordSchema, request: Request, db: Session = Depends(get_db)):"""
new_forgot = """@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(payload: ForgotPasswordSchema, request: Request, db: Session = Depends(get_db)):"""
content = content.replace(old_forgot, new_forgot)

content = content.replace(
    """    token = create_reset_token(email=user.email)
    from app.core.config import settings
    frontend_url = settings.FRONTEND_URL""",
    """    token = create_reset_token(email=user.email)
    import hashlib
    user.reset_token = hashlib.sha256(token.encode()).hexdigest()
    db.commit()
    from app.core.config import settings
    frontend_url = settings.FRONTEND_URL"""
)

# 6. reset_password
content = content.replace(
    """    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user.hashed_password = get_password_hash(payload.new_password)
    user.must_change_password = False
    user.password_updated_at = datetime.utcnow()""",
    """    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    import hashlib
    if not user or not user.reset_token or user.reset_token != hashlib.sha256(payload.token.encode()).hexdigest():
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user.hashed_password = get_password_hash(payload.new_password)
    user.must_change_password = False
    user.reset_token = None
    user.password_updated_at = datetime.utcnow()"""
)

with open("app/routes/auth.py", "w") as f:
    f.write(content)

print("auth.py patched")
