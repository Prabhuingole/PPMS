from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
import uuid
import hashlib
import os
from fastapi.responses import JSONResponse
from app.database.session import get_db
from app.models.user import User
from app.models.session import UserSession
from app.schemas.user import LoginSchema, TokenResponse, ProfileUpdateSchema, ChangePasswordSchema, ForgotPasswordSchema, ResetPasswordSchema, VerifyMFASchema, SetupAccountSchema
from app.core.security import verify_password, create_access_token, get_password_hash, create_reset_token, verify_reset_token, create_refresh_token, hash_refresh_token, verify_refresh_token_hash, hash_session_id
from app.core.deps import get_current_user, oauth2_scheme
from app.core.email import send_password_reset_email, send_mfa_otp_email
import random
import string
from app.core.limiter import limiter
from datetime import datetime, timedelta
from fastapi import Response
from app.core.audit import create_audit_log

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/login")
@limiter.limit("5/minute")
def login(request: Request, response: Response, payload: LoginSchema, db: Session = Depends(get_db)):
    email = payload.email.strip()
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    if user.role == "reporting_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reporting manager profiles are for structural use only and cannot log in."
        )
        
    # Check lockout
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account locked. Try again later."
        )
        
    if not verify_password(payload.password, user.hashed_password):
        from app.core.config import settings
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= settings.MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.utcnow() + timedelta(minutes=settings.LOCKOUT_MINUTES)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
        
    # Reset lockout on successful password verification
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
        
    if not user.is_active:
        reason_msg = f" Reason: {user.deactivation_reason}" if user.deactivation_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account has been deactivated.{reason_msg} Please contact your administrator."
        )

    if user.is_mfa_enabled:
        # Check if user has verified MFA in the last 24 hours
        if user.last_mfa_verified_at and user.last_mfa_verified_at > datetime.utcnow() - timedelta(hours=24):
            # Skip MFA, proceed to token generation
            pass
        else:
            otp = "".join(random.choices(string.digits, k=6))
            user.mfa_otp = otp
            user.mfa_otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
            db.commit()
            send_mfa_otp_email(user.email, user.full_name, otp)
            return {
                "mfa_required": True,
                "email": user.email,
                "message": "OTP sent to your email"
            }

    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Capture device info
    user_agent = request.headers.get("user-agent", "Unknown Device")
    ip_address = request.client.host if request.client else "Unknown IP"
    
    # Generate Refresh Token
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_refresh_token(refresh_token)
    refresh_expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Save session to DB
    new_session = UserSession(
        user_id=user.id,
        session_id=hash_session_id(session_id),
        device_info=user_agent,
        ip_address=ip_address,
        refresh_token_hash=refresh_token_hash,
        refresh_token_expires_at=refresh_expires_at
    )
    db.add(new_session)
    user.last_login_at = datetime.utcnow()
    db.commit()

    create_audit_log(
        db=db,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        user=user,
        request=request
    )

    token = create_access_token(data={"sub": user.email, "role": user.role, "jti": session_id})
    
    # Set Cookies for Hybrid Auth
    is_prod = os.environ.get("NODE_ENV") == "production"
    
    content = {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "employee_id": user.employee_id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "designation": user.designation,
            "bio": user.bio,
            "mobile_number": user.mobile_number,
            "must_change_password": user.must_change_password,
            "password_updated_at": user.password_updated_at.isoformat() if user.password_updated_at else None,
            "is_mfa_enabled": user.is_mfa_enabled,
            "account_status": user.account_status,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
        }
    }
    
    json_response = JSONResponse(content=content)
    json_response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=604800
    )
    json_response.set_cookie(
        key="is_authenticated",
        value="true",
        httponly=False,
        secure=True,
        samesite="none",
        max_age=604800
    )
    
    return json_response

@router.post("/verify-mfa", response_model=TokenResponse)
@limiter.limit("5/minute")
def verify_mfa(request: Request, response: Response, payload: VerifyMFASchema, db: Session = Depends(get_db)):
    email = payload.email.strip()
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if not user.is_mfa_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA is not enabled for this user")
        
    if not user.mfa_otp or user.mfa_otp != payload.otp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid OTP")
        
    if not user.mfa_otp_expires_at or user.mfa_otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="OTP has expired")
        
    # Valid OTP
    user.mfa_otp = None
    user.mfa_otp_expires_at = None
    user.last_mfa_verified_at = datetime.utcnow()
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    
    # Capture device info
    user_agent = request.headers.get("user-agent", "Unknown Device")
    ip_address = request.client.host if request.client else "Unknown IP"
    
    # Generate Refresh Token
    refresh_token = create_refresh_token()
    refresh_token_hash = hash_refresh_token(refresh_token)
    refresh_expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Save session to DB
    new_session = UserSession(
        user_id=user.id,
        session_id=hash_session_id(session_id),
        device_info=user_agent,
        ip_address=ip_address,
        refresh_token_hash=refresh_token_hash,
        refresh_token_expires_at=refresh_expires_at
    )
    db.add(new_session)
    user.last_login_at = datetime.utcnow()
    db.commit()

    create_audit_log(
        db=db,
        action="USER_LOGIN",
        entity_type="user",
        entity_id=user.id,
        user=user,
        request=request,
        metadata_info={"mfa": True}
    )

    token = create_access_token(data={"sub": user.email, "role": user.role, "jti": session_id})
    
    # Set Cookies for Hybrid Auth
    is_prod = os.environ.get("NODE_ENV") == "production"

    content = {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "designation": user.designation,
            "bio": user.bio,
            "mobile_number": user.mobile_number,
            "must_change_password": user.must_change_password,
            "password_updated_at": user.password_updated_at.isoformat() if user.password_updated_at else None,
            "is_mfa_enabled": user.is_mfa_enabled,
            "account_status": user.account_status,
            "last_login_at": user.last_login_at.isoformat() if user.last_login_at else None
        }
    }

    json_response = JSONResponse(content=content)
    json_response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=604800
    )
    json_response.set_cookie(
        key="is_authenticated",
        value="true",
        httponly=False,
        secure=True,
        samesite="none",
        max_age=604800
    )
    
    return json_response

@router.post("/setup-account")
def setup_account(payload: SetupAccountSchema, request: Request, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not current_user.must_change_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account setup already completed")

    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    # Check if new email already exists
    if current_user.email != payload.new_email:
        existing_user = db.query(User).filter(func.lower(User.email) == func.lower(payload.new_email)).first()
        if existing_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    old_values = {
        "email": current_user.email,
        "must_change_password": True
    }

    current_user.email = payload.new_email
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.password_updated_at = datetime.utcnow()
    current_user.must_change_password = False

    db.commit()

    create_audit_log(
        db=db,
        action="ACCOUNT_SETUP_COMPLETED",
        entity_type="user",
        entity_id=current_user.id,
        user=current_user,
        old_values=old_values,
        new_values={"email": current_user.email, "must_change_password": False},
        request=request
    )

    # Generate a new session because the email (sub) changed
    session_id = str(uuid.uuid4())
    user_agent = request.headers.get("user-agent", "Unknown Device")
    ip_address = request.client.host if request.client else "Unknown IP"
    
    new_session = UserSession(
        user_id=current_user.id,
        session_id=hash_session_id(session_id),
        device_info=user_agent,
        ip_address=ip_address
    )
    db.add(new_session)
    db.commit()

    token = create_access_token(data={"sub": current_user.email, "role": current_user.role, "jti": session_id})

    return {
        "message": "Account setup completed successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(current_user.id),
            "employee_id": current_user.employee_id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
            "designation": current_user.designation,
            "bio": current_user.bio,
            "mobile_number": current_user.mobile_number,
            "must_change_password": current_user.must_change_password,
            "is_mfa_enabled": current_user.is_mfa_enabled,
            "account_status": current_user.account_status,
        }
    }

@router.get("/sessions")
def get_active_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    from jose import jwt
    from app.core.config import settings
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    current_jti = payload.get("jti")
    current_jti_hashed = hash_session_id(current_jti) if current_jti else None

    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id, UserSession.is_active == True).order_by(UserSession.last_active_at.desc()).all()
    
    result = []
    for s in sessions:
        result.append({
            "session_id": s.session_id,
            "device_info": s.device_info,
            "ip_address": s.ip_address,
            "created_at": s.created_at,
            "last_active_at": s.last_active_at,
            "is_current": s.session_id == current_jti_hashed
        })
    return result

@router.delete("/sessions/all")
def revoke_all_other_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user), token: str = Depends(oauth2_scheme)):
    from jose import jwt
    from app.core.config import settings
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    current_jti = payload.get("jti")
    current_jti_hashed = hash_session_id(current_jti) if current_jti else None

    db.query(UserSession).filter(
        UserSession.user_id == current_user.id, 
        UserSession.session_id != current_jti
    ).update({"is_active": False})
    
    db.commit()
    return {"message": "All other sessions revoked"}

@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.session_id == session_id
    ).update({"is_active": False})
    
    db.commit()
    return {"message": "Session revoked"}

@router.put("/update-profile")
def update_profile(
    payload: ProfileUpdateSchema, 
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    old_values = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "bio": current_user.bio,
        "mobile_number": current_user.mobile_number,
        "designation": current_user.designation,
        "is_mfa_enabled": current_user.is_mfa_enabled
    }

    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.email:
        if payload.email != current_user.email:
            existing = db.query(User).filter(User.email == payload.email).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = payload.email
    if payload.bio is not None:
        current_user.bio = payload.bio
    if payload.mobile_number is not None:
        current_user.mobile_number = payload.mobile_number
    if payload.designation is not None:
        current_user.designation = payload.designation
    if payload.is_mfa_enabled is not None:
        current_user.is_mfa_enabled = payload.is_mfa_enabled
        
    db.commit()
    db.refresh(current_user)
    
    new_values = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "bio": current_user.bio,
        "mobile_number": current_user.mobile_number,
        "designation": current_user.designation,
        "is_mfa_enabled": current_user.is_mfa_enabled
    }
    
    if old_values != new_values:
        from app.core.audit import create_audit_log
        
        # Check if MFA status changed specifically to log it clearly
        if old_values["is_mfa_enabled"] != new_values["is_mfa_enabled"]:
            mfa_action = "MFA_ENABLED" if new_values["is_mfa_enabled"] else "MFA_DISABLED"
            create_audit_log(
                db=db,
                action=mfa_action,
                entity_type="employee",
                entity_id=current_user.id,
                user=current_user,
                old_values={"is_mfa_enabled": old_values["is_mfa_enabled"]},
                new_values={"is_mfa_enabled": new_values["is_mfa_enabled"]},
                request=request
            )
            
        # Log general profile updates if other fields changed
        other_old = {k: v for k, v in old_values.items() if k != "is_mfa_enabled"}
        other_new = {k: v for k, v in new_values.items() if k != "is_mfa_enabled"}
        
        if other_old != other_new:
            create_audit_log(
                db=db,
                action="PROFILE_UPDATED",
                entity_type="employee",
                entity_id=current_user.id,
                user=current_user,
                old_values=other_old,
                new_values=other_new,
                request=request
            )

    
    return {
        "id": str(current_user.id),
        "employee_id": current_user.employee_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "bio": current_user.bio,
        "mobile_number": current_user.mobile_number,
        "designation": current_user.designation,
        "is_mfa_enabled": current_user.is_mfa_enabled
    }

@router.put("/update-password")
def update_password(
    payload: ChangePasswordSchema,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = get_password_hash(payload.new_password)
    current_user.must_change_password = False
    current_user.password_updated_at = datetime.utcnow()
    db.commit()
    
    from app.core.audit import create_audit_log
    create_audit_log(
        db=db,
        action="PASSWORD_CHANGED",
        entity_type="employee",
        entity_id=current_user.id,
        user=current_user,
        request=request
    )
    
    return {"message": "Password updated successfully"}

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(payload: ForgotPasswordSchema, request: Request, db: Session = Depends(get_db)):
    email = payload.email.strip()
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    
    if not user or user.role == "reporting_manager":
        # Prevent timing attacks by delaying or just returning a generic message
        return {"message": "If an account exists, a password reset link has been sent."}
    
    token = create_reset_token(email=user.email)
    import hashlib
    user.reset_token = hashlib.sha256(token.encode()).hexdigest()
    db.commit()
    from app.core.config import settings
    frontend_url = settings.FRONTEND_URL
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    send_password_reset_email(to_email=user.email, employee_name=user.full_name, reset_link=reset_link)
    
    return {"message": "If an account exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordSchema, request: Request, db: Session = Depends(get_db)):
    email = verify_reset_token(payload.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user = db.query(User).filter(func.lower(User.email) == func.lower(email)).first()
    import hashlib
    if not user or not user.reset_token or user.reset_token != hashlib.sha256(payload.token.encode()).hexdigest() or user.role == "reporting_manager":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
        
    user.hashed_password = get_password_hash(payload.new_password)
    user.must_change_password = False
    user.reset_token = None
    user.password_updated_at = datetime.utcnow()
    db.commit()
    
    from app.core.audit import create_audit_log
    create_audit_log(
        db=db,
        action="PASSWORD_RESET",
        entity_type="employee",
        entity_id=user.id,
        user=user,
        request=request
    )
    
    return {"message": "Password has been successfully reset."}

@router.post("/refresh")
@limiter.limit("10/minute")
def refresh_token_endpoint(request: Request, response: Response, db: Session = Depends(get_db)):
    print("--- REFRESH COOKIE DEBUG ---")
    print("Cookies:", request.cookies)
    
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
        
    token_hash = hash_refresh_token(refresh_token)
    session = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash, UserSession.is_active == True).first()
    
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
        
    if session.refresh_token_expires_at and session.refresh_token_expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired")
        
    user = session.user
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive")
        
    # Rotate refresh token
    new_refresh_token = create_refresh_token()
    session.refresh_token_hash = hash_refresh_token(new_refresh_token)
    session.refresh_token_expires_at = datetime.utcnow() + timedelta(days=7)
    session.last_active_at = datetime.utcnow()
    db.commit()
    
    # Issue new access token
    token = create_access_token(data={"sub": user.email, "role": user.role, "jti": session.session_id})

    is_prod = os.environ.get("NODE_ENV") == "production"
    json_response = JSONResponse(content={"access_token": token, "token_type": "bearer"})
    
    # Update cookie
    json_response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        max_age=604800
    )
    json_response.set_cookie(
        key="is_authenticated",
        value="true",
        httponly=False,
        secure=is_prod,
        samesite="lax",
        max_age=604800
    )
    
    return json_response

@router.post("/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        token_hash = hash_refresh_token(refresh_token)
        session = db.query(UserSession).filter(UserSession.refresh_token_hash == token_hash).first()
        if session:
            session.is_active = False
            session.refresh_token_hash = None
            session.refresh_token_expires_at = None
            db.commit()
            
    json_response = JSONResponse(content={"message": "Logged out"})
    
    json_response.delete_cookie("refresh_token", path="/")
    json_response.delete_cookie("is_authenticated", path="/")
    json_response.delete_cookie("auth_token", path="/")
    
    return json_response

