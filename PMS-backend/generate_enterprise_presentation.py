from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor

def create_presentation():
    prs = Presentation()
    
    # Use standard 16:9 aspect ratio if possible, but default is 4:3. We'll stick to default for reliability.
    
    title_slide_layout = prs.slide_layouts[0]
    content_layout = prs.slide_layouts[1]
    
    slides_data = [
        # Slide 1
        {
            "title": "Sambhav PMS",
            "content": (
                "Project Overview: Enterprise Resource and Project Management System\n"
                "Purpose: Centralize workforce management, project allocation, and attendance tracking.\n"
                "Problem Statement: Fragmented legacy systems causing data silos and administrative overhead.\n"
                "Target Users: Enterprise clients, Internal HR, Super Admins, Employees.\n"
                "Business Domain: HRTech & Enterprise SaaS."
            )
        },
        # Slide 2
        {
            "title": "Executive Summary",
            "content": (
                "• Project Capabilities: End-to-end employee lifecycle, project tracking, and attendance management.\n"
                "• Major Features: Multi-tenant company isolation, dynamic project allocation, automated timesheets, robust audit logging.\n"
                "• Technology Overview: Next.js (React), FastAPI (Python), PostgreSQL, deployed on Vercel/Render.\n"
                "• Architecture: Decoupled client-server model with RESTful APIs and JWT stateless authentication.\n"
                "• Scale & Complexity: Enterprise-grade multitenancy with role-based access control (RBAC)."
            )
        },
        # Slide 3
        {
            "title": "High-Level System Architecture",
            "content": (
                "• Frontend: Next.js SPA/SSR handling UI/UX and client state.\n"
                "• Backend: FastAPI handling business logic, validation, and API routing.\n"
                "• Database: PostgreSQL (Relational) via SQLAlchemy ORM.\n"
                "• Authentication: JWT (JSON Web Tokens) with Bcrypt hashing.\n"
                "• Storage: AWS S3 / Local volume for document uploads.\n"
                "• Communication Flow: Client -> HTTPS -> Nginx/Vercel Edge -> FastAPI -> PostgreSQL.\n"
                "\n[Diagram Placeholder: 3-Tier Architecture Diagram]"
            )
        },
        # Slide 4
        {
            "title": "Complete Technology Stack",
            "content": (
                "• Frontend: Next.js 15, React 19, Tailwind CSS v4, Zustand. (Selected for SSR capabilities and modern UI components).\n"
                "• Backend: FastAPI, Python 3. (Selected for async performance and automatic OpenAPI docs).\n"
                "• Database & ORM: PostgreSQL, SQLAlchemy, Alembic. (Selected for ACID compliance and robust migrations).\n"
                "• Authentication & Security: PyJWT, Passlib, CORS middleware.\n"
                "• DevOps & Deployment: Docker, Vercel, Uvicorn/Gunicorn. (Selected for CI/CD automation and scaling)."
            )
        },
        # Slide 5
        {
            "title": "Complete Folder Structure",
            "content": (
                "Frontend:\n"
                "  /app: Next.js App Router (Pages & Layouts)\n"
                "  /components: Reusable UI, Shadcn, layout wrappers\n"
                "  /store: Zustand global state (authStore)\n"
                "  /lib & /utils: Helper functions, API clients (Axios)\n\n"
                "Backend:\n"
                "  /app/routes: FastAPI endpoint controllers\n"
                "  /app/models: SQLAlchemy DB schemas\n"
                "  /app/schemas: Pydantic validation models\n"
                "  /app/core: Security, config, DB session, tenant middleware\n"
                "  /alembic: Database migration scripts"
            )
        },
        # Slide 6
        {
            "title": "Frontend Architecture",
            "content": (
                "• Routing: Next.js App Router for nested layouts and protected routes.\n"
                "• State Management: Zustand for lightweight, global auth state; React hooks for local state.\n"
                "• API Layer: Axios instance with request/response interceptors for token injection and error handling.\n"
                "• Validation: Zod schemas integrated with React Hook Form.\n"
                "• Reusable Components: Modular Shadcn UI architecture.\n"
                "• Authentication Flow: Login -> Store JWT in Zustand/Cookies -> Attach to Axios -> Protected Route rendering."
            )
        },
        # Slide 7
        {
            "title": "Backend Architecture",
            "content": (
                "• Controllers (Routes): FastAPI router functions mapping HTTP verbs to business logic.\n"
                "• Services/Business Logic: Handled within routes or abstracted core modules.\n"
                "• Repositories (Models): SQLAlchemy ORM models abstracting SQL queries.\n"
                "• Middleware: TenantContext middleware for isolating database queries per company.\n"
                "• Validation: Pydantic v2 ensuring strict request payload typing.\n"
                "• Configuration: Pydantic BaseSettings loading .env secrets."
            )
        },
        # Slide 8
        {
            "title": "Database Design",
            "content": (
                "• Type: PostgreSQL (Relational).\n"
                "• Core Tables: Users, Companies, Projects, Timesheets, Attendance, AuditLogs.\n"
                "• Relationships: Company 1:N Users. Users M:N Projects (Allocations).\n"
                "• Normalization: 3NF applied to eliminate redundancy.\n"
                "• Constraints & Indexes: Foreign keys enforce referential integrity; unique constraints on emails; indexes on date/tenant columns.\n"
                "• Audit Columns: created_at, updated_at on all entities."
            )
        },
        # Slide 9
        {
            "title": "Authentication",
            "content": (
                "• Flow: User POSTs credentials -> Validated against DB -> JWT issued.\n"
                "• JWT: Contains sub (user_id), role, and tenant context. Short-lived for security.\n"
                "• Password Hashing: Bcrypt (via Passlib) with salt rounds to prevent rainbow table attacks.\n"
                "• Session Management: Stateless. Client stores token securely and attaches as Bearer token.\n"
                "• Logout: Client-side token destruction."
            )
        },
        # Slide 10
        {
            "title": "Authorization",
            "content": (
                "• Model: Role-Based Access Control (RBAC).\n"
                "• Roles: Superadmin (Global), Admin (Tenant-level), Employee, Intern.\n"
                "• Route Protection: FastAPI Dependencies (`get_current_user`) verify role claims on every request.\n"
                "• Row-Level Isolation: Tenant middleware ensures Admins only query/modify data within their `company_id`.\n"
                "\n[Diagram Placeholder: Access Matrix Table]"
            )
        },
        # Slide 11
        {
            "title": "User Panels",
            "content": (
                "• Superadmin Panel: Global visibility, manages all companies, global audit logs. Full CRUD on system.\n"
                "• Admin Panel: Scoped to a specific company. Manages internal employees, projects, and attendance.\n"
                "• Employee Panel: Self-service dashboard. Logs attendance, submits timesheets, views personal project allocations.\n"
                "• Guest/Public: Minimal login interface. No internal access."
            )
        },
        # Slide 12
        {
            "title": "Role Hierarchy",
            "content": (
                "Hierarchy:\n"
                "1. Superadmin (Ultimate ownership, cross-tenant visibility)\n"
                "2. Admin (Tenant ownership, manages managers/employees)\n"
                "3. Employee / Intern (Individual contributors)\n\n"
                "• Inheritance: Superadmins inherit Admin capabilities universally.\n"
                "• Visibility: Admins cannot see other tenants' data."
            )
        },
        # Slide 13
        {
            "title": "Major Features",
            "content": (
                "• Project Allocation: Admins assign employees to projects. Backend verifies tenant scopes. Frontend displays allocated tasks.\n"
                "• Attendance Tracking: Employees clock in/out. Backend logs timestamps and calculates durations. IP/Geo-fencing supported.\n"
                "• Timesheets: Daily hour logging against specific projects. Requires validation and approval workflows.\n"
                "• Audit Logging: Global middleware intercepts critical actions (Create, Update, Delete) and logs who/when/what to the AuditLogs table."
            )
        },
        # Slide 14
        {
            "title": "Complete Module Breakdown",
            "content": (
                "• Auth Module: Login, token generation, identity verification.\n"
                "• Companies Module: Tenant management, settings.\n"
                "• Users Module: Employee lifecycle, profile management, role assignment.\n"
                "• Projects Module: Project creation, client association, team allocation.\n"
                "• Timesheets Module: Daily logging, submission.\n"
                "• Attendance Module: Clock-in/out, monthly summaries, automated WFH triggers.\n"
                "• Audit Logs Module: Immutable record of system changes for compliance."
            )
        },
        # Slide 15
        {
            "title": "API Architecture",
            "content": (
                "• Paradigm: RESTful JSON APIs.\n"
                "• Endpoints: Pluralized nouns (e.g., /api/projects, /api/users).\n"
                "• Validation: Pydantic strictly validates incoming JSON against expected schemas. Returns 422 on failure.\n"
                "• Response Structure: Standardized payloads (items, total, page data).\n"
                "• Status Codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found)."
            )
        },
        # Slide 16
        {
            "title": "Request Lifecycle",
            "content": (
                "1. Browser -> Axios HTTP Request\n"
                "2. Vercel/Nginx Reverse Proxy\n"
                "3. FastAPI Middleware (CORS, Tenant Context)\n"
                "4. Auth Dependency (Decodes JWT, fetches User)\n"
                "5. Pydantic Validation (Checks body/params)\n"
                "6. Route Controller (Business logic executed)\n"
                "7. SQLAlchemy ORM (Database query)\n"
                "8. JSON Response -> Client"
            )
        },
        # Slide 17
        {
            "title": "Security Architecture",
            "content": (
                "• Authentication: Stateless JWT, no server-side session hijacking.\n"
                "• Authorization: Strict RBAC and Multi-tenant data isolation.\n"
                "• Passwords: Bcrypt hashing. Never stored in plaintext.\n"
                "• Web Security: CORS policies restrict allowed origins. Pydantic prevents SQL Injection and XSS via strict type casting.\n"
                "• Audit Logs: Immutable tracking of all write operations.\n"
                "• Environment Secrets: Handled via secure .env configurations, not in source control."
            )
        },
        # Slide 18
        {
            "title": "Middleware Architecture",
            "content": (
                "• CORS Middleware: Controls which domains can communicate with the API.\n"
                "• Context Middleware: Sets current context (e.g., Tenant ID) for the request lifecycle, ensuring logs and queries are scoped correctly.\n"
                "• DB Session Middleware: Yields a clean SQLAlchemy session per request, ensuring transactional integrity and automatic rollback on failure."
            )
        },
        # Slide 19
        {
            "title": "Validation Strategy",
            "content": (
                "• Frontend: React Hook Form + Zod provide immediate visual feedback before network requests.\n"
                "• Backend: Pydantic v2 enforces strict type checks, max lengths, and regex patterns at the API boundary.\n"
                "• Database: SQLAlchemy enforces NOT NULL, UNIQUE constraints, and Foreign Key integrity at the storage level."
            )
        },
        # Slide 20
        {
            "title": "Logging & Monitoring",
            "content": (
                "• Application Logs: AuditLog table records functional business events (who edited what project).\n"
                "• System Logs: FastAPI/Uvicorn standard output captures HTTP requests, latencies, and traceback errors.\n"
                "• Error Tracking: Global exception handlers intercept crashes and return sanitized error messages to the client to avoid leaking stack traces."
            )
        },
        # Slide 21
        {
            "title": "Performance Optimizations",
            "content": (
                "• Database: Connection pooling via SQLAlchemy; selective indexing on high-read columns (user_id, date).\n"
                "• API: Server-side pagination (limit/offset) for all list endpoints to prevent memory exhaustion.\n"
                "• Frontend: Debounced search inputs, lazy loading of routes, and efficient re-rendering via Zustand."
            )
        },
        # Slide 22
        {
            "title": "Deployment Architecture",
            "content": (
                "• Frontend: Deployed to Vercel (Edge Network/CDN) for global low-latency asset delivery.\n"
                "• Backend: Containerized or run via Uvicorn/Gunicorn on Render/EC2 instances.\n"
                "• Database: Neon Serverless Postgres for dynamic scaling and high availability.\n"
                "• CI/CD: Automated deployments triggered by Git pushes to the main branch."
            )
        },
        # Slide 23
        {
            "title": "Third-Party Integrations",
            "content": (
                "• Storage: AWS S3 integration for storing user-uploaded documents and templates.\n"
                "• Cloud Database: Neon (Managed Serverless Postgres).\n"
                "• Frontend Hosting: Vercel Cloud Platform.\n"
                "(Note: Architecture supports easy expansion for Email/SMS providers via decoupled service layers)."
            )
        },
        # Slide 24
        {
            "title": "Project Workflows",
            "content": (
                "• User Creation Flow: Superadmin creates Admin -> Admin logs in -> Admin creates Employee -> Employee logs in.\n"
                "• Task Lifecycle: Admin creates Project -> Allocates Employee -> Employee logs Time -> System calculates attendance.\n"
                "• Document Flow: User uploads file -> Backend validates MIME type -> Stores in S3 -> DB saves URL reference."
            )
        },
        # Slide 25
        {
            "title": "Error Handling Strategy",
            "content": (
                "• Global Exception Handler: FastAPI captures uncaught exceptions, preventing server crashes.\n"
                "• Graceful Degradation: Frontend catches 4xx/5xx errors and displays user-friendly Toasts (via Sonner) instead of breaking the UI.\n"
                "• Validation Errors: 422 Unprocessable Entity returns specific field-level validation messages mapped to form inputs."
            )
        },
        # Slide 26
        {
            "title": "Project Strengths",
            "content": (
                "• Security: Impeccable multi-tenant isolation and audit trails.\n"
                "• Maintainability: Modular code structure, typed payloads (TypeScript + Pydantic).\n"
                "• Scalability: Stateless architecture allows horizontal scaling of backend servers.\n"
                "• Developer Experience: Hot-reloading, automated migrations (Alembic), component-driven UI."
            )
        },
        # Slide 27
        {
            "title": "Possible Future Enhancements",
            "content": (
                "• Asynchronous Background Jobs: Implement Celery/Redis for heavy document generation and batch emails.\n"
                "• Caching Layer: Introduce Redis to cache frequent read-heavy queries (e.g., user profiles).\n"
                "• Microservices: Extract specific heavy modules into dedicated services if scaling demands increase.\n"
                "• Observability: Integrate Datadog or Sentry for advanced APM and error tracing."
            )
        },
        # Slide 28
        {
            "title": "Key Engineering Learnings",
            "content": (
                "• DRY & KISS Principles: Reusable Shadcn components significantly reduced frontend code duplication.\n"
                "• Dependency Injection: FastAPI's 'Depends' system proved invaluable for decoupled, testable auth and database session management.\n"
                "• Schema Driven Design: Defining database models and Pydantic schemas first ensured a robust, bug-free data flow."
            )
        },
        # Slide 29
        {
            "title": "Complete Summary",
            "content": (
                "• The Sambhav PMS is a production-ready, highly secure, and scalable Enterprise application.\n"
                "• It solves critical business data fragmentation using modern, robust technologies (React, FastAPI, Postgres).\n"
                "• Strict role-based multi-tenancy ensures data integrity, backed by comprehensive audit trails.\n"
                "• Designed with maintainability in mind, ready for future expansion and horizontal scaling.\n\n"
                "Thank You."
            )
        }
    ]
    
    for slide_data in slides_data:
        slide = prs.slides.add_slide(content_layout)
        title_shape = slide.shapes.title
        content_shape = slide.placeholders[1]
        
        title_shape.text = slide_data["title"]
        
        tf = content_shape.text_frame
        tf.clear() # Clear default paragraph
        
        # Split content by newlines to manage paragraphs
        paragraphs = slide_data["content"].split('\n')
        for i, para_text in enumerate(paragraphs):
            if i == 0:
                p = tf.paragraphs[0]
            else:
                p = tf.add_paragraph()
                
            p.text = para_text
            # Simple formatting
            p.font.size = Pt(16)
            if para_text.startswith('•'):
                p.level = 0
            elif para_text.startswith(' '):
                p.level = 1
                
    prs.save('Enterprise_Technical_Presentation.pptx')
    print("Successfully generated Enterprise_Technical_Presentation.pptx")

if __name__ == '__main__':
    create_presentation()
