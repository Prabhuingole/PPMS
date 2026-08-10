import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

# Internal imports
from app.database.session import engine, Base, SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.timesheet import Timesheet
from app.models.document import ProjectDocument
from app.models.template import DocumentTemplate
from app.models.notification import Notification
from app.models.session import UserSession
from app.models.audit_log import AuditLog
from app.models.note import NoteWorkspace, NotePage, NoteChecklistItem
from app.models.deliverable import Deliverable
from app.models.task import Task
from app.models.resource_allocation import ResourceAllocation
from app.core.config import settings
from app.core.security import get_password_hash
from app.routes.billing import router as billing_router
from app.routes.deliverables import router as deliverables_router
from app.routes.tasks import router as tasks_router
from app.routes.task_comments import router as task_comments_router
from app.routes.allocations import router as allocations_router
from app.routes.resource_reporting import router as resource_reporting_router
from app.routes import auth, employee_management, project_management, templates, timesheets, notifications, audit_logs, notes, admin_management, documents, attendance, companies, integrations, reports, ai_assistant
from app.core.websockets import manager
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

# Initialize Database Tables
# TEMPORARILY DISABLED FOR VERCEL ISOLATION TEST
# Base.metadata.create_all(bind=engine)

import alembic.config

# 1. Database Migrations & Seeding
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("--- RUNNING DATABASE MIGRATIONS ---")
    try:
        alembic_args = ['--raiseerr', 'upgrade', 'head']
        alembic.config.main(argv=alembic_args)
        print("--- DATABASE MIGRATIONS COMPLETE ---")
    except Exception as e:
        print(f"Error running migrations: {e}")

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

# TEMPORARILY DISABLED lifespan FOR VERCEL ISOLATION TEST
app = FastAPI(title="Sambhav PMS API", version="1.0.0")

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add Rate Limiter Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. CORS Setup - Allows your Next.js frontend to access this API
origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; connect-src 'self' ws: wss: http: https:; frame-ancestors 'none';"
    return response

# 3. Authentication & Management Routes
app.include_router(auth.router)
app.include_router(employee_management.router)

app.include_router(project_management.router)
app.include_router(documents.router)
app.include_router(billing_router, prefix='/api/billing', tags=['billing'])
app.include_router(attendance.router)
app.include_router(templates.router)
app.include_router(timesheets.router)
app.include_router(notifications.router)
app.include_router(audit_logs.router)
app.include_router(notes.router)
app.include_router(admin_management.router)
app.include_router(companies.router)
app.include_router(deliverables_router)
app.include_router(tasks_router)
app.include_router(task_comments_router)
app.include_router(allocations_router)
app.include_router(resource_reporting_router)
app.include_router(reports.router)
app.include_router(integrations.router)
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])

# 4. Health Check
@app.get("/health")
def health_check():
    return {"status": "online", "system": "Sambhav API"}

# 5. WebSocket Endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open and listen for client messages (if any) or disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
