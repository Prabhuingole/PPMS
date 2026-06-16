import requests
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.session import SessionLocal
from app.models.session import UserSession
from app.models.user import User
from app.core.security import get_password_hash

base_url = 'http://127.0.0.1:8000/auth'

print('--- PREPARE USER ---')
db = SessionLocal()
user = db.query(User).filter(User.is_active == True).first()
if not user:
    print('No active user found!')
    sys.exit(1)

test_email = user.email
user.hashed_password = get_password_hash('password123')
db.commit()
print(f'Using user {test_email}')

session = requests.Session()

print('\n--- TEST 1: LOGIN ---')
response = session.post(f'{base_url}/login', json={'email': test_email, 'password': 'password123'})
if response.status_code == 200:
    print('Login successful')
    for c in session.cookies:
        print(f'Cookie: {c.name}, HttpOnly: {c.has_nonstandard_attr("HttpOnly") or c.has_nonstandard_attr("httponly")}')
else:
    print('Login failed:', response.status_code, response.text)

# Manually extract the refresh token because requests drops it for HTTP since it's Secure=True
refresh_token = session.cookies.get('refresh_token')

print('\n--- TEST 2: DATABASE SESSION ---')
try:
    latest_session = db.query(UserSession).filter(UserSession.user_id == user.id).order_by(UserSession.created_at.desc()).first()
    print('Latest Session ID:', latest_session.session_id)
    print('Refresh Token Hash:', latest_session.refresh_token_hash)
    print('Refresh Token Expires At:', latest_session.refresh_token_expires_at)
    print('Is Active:', latest_session.is_active)
    original_hash = latest_session.refresh_token_hash
except Exception as e:
    print('DB Error:', e)

print('\n--- TEST 3: REFRESH FLOW ---')
# Explicitly pass cookies to simulate browser behavior over HTTPS
cookies = {'refresh_token': refresh_token}
refresh_resp = requests.post(f'{base_url}/refresh', cookies=cookies)
if refresh_resp.status_code == 200:
    print('Refresh successful')
    print('New Cookies:', list(refresh_resp.cookies.keys()))
    
    # Update manual cookie
    new_refresh_token = refresh_resp.cookies.get('refresh_token')
    
    db.expire_all()
    latest_session = db.query(UserSession).filter(UserSession.user_id == user.id).order_by(UserSession.created_at.desc()).first()
    print('Latest Session after refresh:', latest_session.session_id)
    print('Refresh Token Hash:', latest_session.refresh_token_hash)
    if latest_session.refresh_token_hash != original_hash:
        print('SUCCESS: Refresh token hash rotated in DB')
else:
    print('Refresh failed:', refresh_resp.status_code, refresh_resp.text)
    new_refresh_token = None

print('\n--- TEST 5: LOGOUT ---')
if new_refresh_token:
    logout_resp = requests.post(f'{base_url}/logout', cookies={'refresh_token': new_refresh_token})
    if logout_resp.status_code == 200:
        print('Logout successful')
        print('Cookies after logout:', logout_resp.cookies.get_dict())
        
        db.expire_all()
        latest_session = db.query(UserSession).filter(UserSession.user_id == user.id).order_by(UserSession.created_at.desc()).first()
        print('Latest Session Is Active:', latest_session.is_active)
        print('Latest Session Refresh Hash:', latest_session.refresh_token_hash)
    else:
        print('Logout failed:', logout_resp.status_code, logout_resp.text)

db.close()
