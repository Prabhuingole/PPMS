from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        jti: str = payload.get("jti")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
        
    if not user.is_active:
        reason_msg = f" Reason: {user.deactivation_reason}" if user.deactivation_reason else ""
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your account has been deactivated.{reason_msg} Please contact your administrator."
        )
        
    if user.role == "reporting_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reporting manager profiles are for structural use only and cannot authenticate."
        )
        
    # Validate session if jti is present (for backwards compatibility with old tokens, we only check if jti exists)
    if jti:
        from app.models.session import UserSession
        import hashlib
        hashed_jti = hashlib.sha256(jti.encode()).hexdigest()
        session_record = db.query(UserSession).filter(
            UserSession.session_id == hashed_jti,
            UserSession.user_id == user.id,
            UserSession.is_active == True
        ).first()
        if not session_record:
            raise credentials_exception
            
        # Optional: Update last active time (could be heavy on DB for every request, skipped for now or do it async)

    return user

def get_superadmin(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["superadmin", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

def check_roles(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The user does not have enough privileges"
            )
        return current_user
    return role_checker
