import time
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User

client = TestClient(app)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_performance_audit():
    db = next(get_db())
    admin = db.query(User).filter(User.role == 'admin').first()
    
    # Warm up login
    if admin:
        client.post("/auth/login", json={"email": admin.email, "password": "Password123!"})
        
        start_time = time.time()
        res = client.post("/auth/login", json={"email": admin.email, "password": "Password123!"})
        end_time = time.time()
        
        login_time_ms = (end_time - start_time) * 1000
        print(f"Login Time (Warm): {login_time_ms:.2f} ms")
        
        access_token = res.json().get("access_token")
        headers = {"Authorization": f"Bearer {access_token}"}
        
        start_time = time.time()
        client.get("/projects/", headers=headers)
        projects_time_ms = (time.time() - start_time) * 1000
        print(f"Project List Time: {projects_time_ms:.2f} ms")

        start_time = time.time()
        client.get("/timesheets/grouped", headers=headers)
        ts_time_ms = (time.time() - start_time) * 1000
        print(f"Timesheet Grouped Time: {ts_time_ms:.2f} ms")
        
    db.close()

if __name__ == '__main__':
    run_performance_audit()
