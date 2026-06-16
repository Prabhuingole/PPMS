from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.project import Project

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    # Find two different companies
    comp1 = db.query(Company).first()
    comp2 = db.query(Company).filter(Company.id != comp1.id).first()
    
    # Get admin from comp1
    admin1 = db.query(User).filter(User.company_id == comp1.id, User.role == 'admin').first()
    
    if not admin1 or not comp2:
        print("Missing required data for cross-company tests.")
        return
        
    # Get a project from comp2
    project2 = db.query(Project).filter(Project.owner_company_id == comp2.id).first()
    
    print(f"Testing Admin {admin1.email} (Company {comp1.id}) accessing Project {project2.id if project2 else 'None'} (Company {comp2.id})")
    
    # Login as admin1
    res = client.post("/auth/login", json={"email": admin1.email, "password": "Password123!"})
    token = res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    if project2:
        res = client.get(f"/projects/{project2.id}", headers=headers)
        print(f"Cross-company Project Access: {res.status_code}")
        assert res.status_code == 404
        
    print("All Tenant Isolation Tests Passed.")
    db.close()

if __name__ == "__main__":
    run_tests()
