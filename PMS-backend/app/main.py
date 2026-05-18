import uvicorn
from fastapi import FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

# Internal imports
from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.reporting_manager import ReportingManager
from app.models.document import ProjectDocument
from app.models.template import DocumentTemplate
from app.core.config import settings
from app.core.security import get_password_hash
from app.routes import auth, employee_management, reporting_manager, project_management, documents, templates

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

# 1. Database Seeding - Creates superadmin if it doesn't exist
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- STARTING DATABASE SEEDING ---")
    db = SessionLocal()
    try:
        admin_email = settings.SUPERADMIN_EMAIL
        print(f"Checking for admin: {admin_email}")
        # Check if the superadmin from .env already exists
        user = db.query(User).filter(User.email == admin_email).first()
        
        if not user:
            print(f"--- Seeding Superadmin: {admin_email} ---")
            hashed_pwd = get_password_hash(settings.SUPERADMIN_PASSWORD)
            new_admin = User(
                email=admin_email,
                hashed_password=hashed_pwd,
                full_name="System Administrator",
                role="superadmin",
                designation="Root"
            )
            db.add(new_admin)
            db.commit()
            print("--- Superadmin created successfully ---")
        else:
            print(f"--- Superadmin already exists: {user.email} ---")

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()
    print("--- FINISHED DATABASE SEEDING ---")
    yield

app = FastAPI(title="Sambhav PMS API", version="1.0.0", lifespan=lifespan)

# 2. CORS Setup - Allows your Next.js frontend to access this API
# NOTE: Covers all dev port combos: frontend may be on 3000 or 3001,
#       and both localhost + 127.0.0.1 are included (Edge uses 127.0.0.1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 3. Authentication & Management Routes
app.include_router(auth.router)
app.include_router(employee_management.router)
app.include_router(reporting_manager.router)
app.include_router(project_management.router)
app.include_router(documents.router)
app.include_router(templates.router)

# 4. Health Check
@app.get("/health")
def health_check():
    return {"status": "online", "system": "Sambhav API"}

if __name__ == "__main__":
    import socket

    def is_port_free(port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", port))
                return True
            except OSError:
                return False

    preferred_ports = [8000, 8001]
    chosen_port = None
    for p in preferred_ports:
        if is_port_free(p):
            chosen_port = p
            break
        else:
            print(f"⚠️  Port {p} is busy, trying next...")

    if chosen_port is None:
        print("❌  Both port 8000 and 8001 are busy. Free up a port and retry.")
    else:
        print(f"✅  Starting backend on http://localhost:{chosen_port}")
        uvicorn.run("app.main:app", host="0.0.0.0", port=chosen_port, reload=True)