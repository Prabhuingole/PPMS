import urllib.request
import urllib.error
import json
from app.core.security import create_access_token
from app.database.session import SessionLocal
from app.models.user import User
from app.models.session import UserSession

db = SessionLocal()
user = db.query(User).filter(User.role == "superadmin").first()

session = db.query(UserSession).filter(UserSession.user_id == user.id, UserSession.is_active == True).first()
jti = session.session_id if session else "dummy-session"

token = create_access_token({"sub": user.email, "jti": jti})

# Test getAdmins
req = urllib.request.Request("http://localhost:8000/admins/?limit=100", headers={"Authorization": f"Bearer {token}"})
try:
    response = urllib.request.urlopen(req)
    print("STATUS:", response.status)
    print("BODY:", response.read().decode())
except urllib.error.HTTPError as e:
    print("STATUS:", e.code)
    print("BODY:", e.read().decode())
