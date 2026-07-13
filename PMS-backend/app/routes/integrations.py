from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.core.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/integrations", tags=["Integrations"])

@router.post("/mail/sso")
def get_mail_sso_token(current_user=Depends(get_current_user)):
    """
    Generate a short-lived JWT token for Mail Automation SSO.
    Maps SPMS roles to Mail Automation roles.
    """
    # Map roles
    if current_user.role in ["superadmin", "admin"]:
        mail_role = "MAIL_ADMIN"
    else:
        mail_role = "MAIL_EMPLOYEE"

    payload = {
        "sub": current_user.email,
        "role": mail_role,
        "full_name": current_user.full_name,
        "exp": datetime.now(timezone.utc) + timedelta(seconds=60)
    }

    token = jwt.encode(payload, settings.MAIL_SSO_SECRET, algorithm="HS256")
    
    redirect_url = f"{settings.MAIL_AUTOMATION_URL}/sso/login?token={token}"
    
    return {"redirect_url": redirect_url}
