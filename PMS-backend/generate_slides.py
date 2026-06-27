from pptx import Presentation

def create_presentation():
    prs = Presentation()
    
    # Slide layouts
    title_slide_layout = prs.slide_layouts[0]
    title_and_content_layout = prs.slide_layouts[1]
    
    slides_data = [
        {
            "title": "Sambhav PMS",
            "content": "Enterprise Project & Resource Management\n\nPrepared By: Lead Architect\nVersion: 1.0 (Production)\nDate: June 2026\nConfidentiality: Internal & Investor Use Only",
            "is_cover": True
        },
        {
            "title": "Agenda",
            "content": "• Business Problem & Objectives\n• Key Features & User Roles\n• High-Level Architecture & Tech Stack\n• Deep Dive: Frontend, Backend, & Database\n• Security, Scalability & DevOps\n• Production Readiness & Future Roadmap",
        },
        {
            "title": "Problem Statement",
            "content": "• Fragmented time tracking and manual attendance audits.\n• Disconnected client billing across multiple tenant companies.\n• Inefficient timesheet approvals and missing audit trails.\n• Sambhav PMS unifies these operations under a single, multi-tenant architecture.",
        },
        {
            "title": "Business Objectives",
            "content": "• Goals: Centralize HR & Project operations.\n• KPIs: 99.9% Uptime, <500ms API response times, 100% automated timesheet rollups.\n• Success Metrics: Reduced administrative overhead by 40%, faster billing cycles.",
        },
        {
            "title": "Project Overview",
            "content": "• What is it? A B2B multi-tenant Project Management System.\n• Users: IT Agencies, Consultants, Internal HR, Client Stakeholders.\n• Value: End-to-end visibility from employee clock-in to client invoicing.",
        },
        {
            "title": "Key Features",
            "content": "• Core HR: Geo/IP-restricted Attendance, Automated Timesheets.\n• Project Management: Multi-tier project allocations, Task tracking.\n• Financials: Automated Invoice Generation, Template Engine.\n• Compliance: Comprehensive Activity Logs (Audit Trails).",
        },
        {
            "title": "User Roles & Access Matrix",
            "content": "• Superadmin: Global oversight across all tenants.\n• Admin: Tenant/Company specific operations.\n• Reporting Manager: Timesheet approvals, team oversight.\n• Employee/Intern: Time logging, task updates.\n\n* Security and isolation are key. Our RBAC ensures data privacy across roles and companies.",
        },
        {
            "title": "System Workflow",
            "content": "End-to-End Flow:\n1. Clock-In\n2. Project Allocation\n3. Timesheet Entry\n4. Manager Approval\n5. Invoice Generation\n\n* Data flows seamlessly from daily attendance to financial billing.",
        },
        {
            "title": "High-Level Architecture",
            "content": "• Client: React/Next.js Web App\n• Gateway/Proxy: Nginx / Vercel Edge\n• API Layer: FastAPI REST Services\n• Data Layer: PostgreSQL, S3 (Blob Storage)\n\n* Decoupled, scalable, stateless backend architecture.",
        },
        {
            "title": "Technology Stack",
            "content": "• Frontend: Next.js 15, React 19, Tailwind CSS v4, Zustand, Shadcn UI\n• Backend: Python, FastAPI, SQLAlchemy, Alembic\n• Database: PostgreSQL (Neon Serverless)\n• Infrastructure: Vercel (Front), Render/EC2 (Back), AWS S3",
        },
        {
            "title": "Frontend Architecture",
            "content": "• State Management: Zustand for global auth, React Query for server state.\n• Styling: TailwindCSS with CSS Variables for dynamic Dark/Light theming.\n• Optimization: Server Components (RSC) where applicable, lazy loading.",
        },
        {
            "title": "Backend Architecture",
            "content": "• Pattern: Controller-Service-Repository abstracted via FastAPI.\n• Middleware: Tenant context injection, CORS, Request Timing.\n• Validation: Pydantic v2 schemas for strict I/O typing.",
        },
        {
            "title": "Database Architecture",
            "content": "• Core Tables: Users, Companies, Projects, Timesheets, Attendance, AuditLogs.\n• Relationships: One-to-Many (Company->Users), Many-to-Many (Users<->Projects).\n• Optimization: Indexes on foreign keys and date columns.",
        },
        {
            "title": "Authentication & Authorization",
            "content": "• Auth: Stateless JWT via PyJWT, Bearer Tokens, Bcrypt password hashing.\n• Access Control: FastAPI Depends injection for role verification.\n• Multi-tenancy: Row-level security where Admins only see data tied to current_tenant_ctx.",
        },
        {
            "title": "Security Architecture",
            "content": "• Data in transit: TLS/HTTPS enforcement.\n• Application: Pydantic input sanitization prevents SQLi/XSS.\n• Audit: Comprehensive AuditLog table tracking every CRUD action.",
        },
        {
            "title": "Performance & Scalability",
            "content": "• DB Optimization: Connection pooling, specific indexing on date/status.\n• Frontend: Debounced search, optimized Next.js loading.\n• Scalability: Stateless FastAPI backend, Serverless Postgres (Neon) scales compute on demand.",
        },
        {
            "title": "DevOps & Deployment Flow",
            "content": "• Pipeline: Git Push -> Vercel Trigger (Frontend).\n• Backend: Automated pull, Alembic database migrations, Uvicorn restart.\n• Infrastructure: Vercel Edge Network, Containerized hosting, Neon DB.",
        },
        {
            "title": "Testing Strategy & Production Readiness",
            "content": "• Quality Assurance: Extensive Python test scripts, local SQLite fallback.\n• Production Readiness: Fully migrated schema, secured .env management, role isolation heavily tested.",
        },
        {
            "title": "Current Challenges & Future Roadmap",
            "content": "• Current Limits: Heavy document generation can block the main thread.\n• Short-term: Implement Celery/Redis for background jobs.\n• Medium-term: Integrate AI for timesheet anomaly detection.\n• Long-term: Native mobile application via React Native.",
        },
        {
            "title": "Summary & Q&A",
            "content": "• Highly secure, multi-tenant B2B platform.\n• Built on modern, scalable technologies.\n• Reduces administrative overhead drastically while ensuring data integrity.\n\nThank You! Any questions regarding architecture, security, or deployment?",
        }
    ]
    
    for slide_data in slides_data:
        if slide_data.get("is_cover"):
            slide = prs.slides.add_slide(title_slide_layout)
            title = slide.shapes.title
            subtitle = slide.placeholders[1]
            title.text = slide_data["title"]
            subtitle.text = slide_data["content"]
        else:
            slide = prs.slides.add_slide(title_and_content_layout)
            title = slide.shapes.title
            content = slide.placeholders[1]
            title.text = slide_data["title"]
            
            tf = content.text_frame
            tf.text = slide_data["content"]
            
    prs.save('Sambhav_PMS_Presentation.pptx')
    print("Presentation generated successfully: Sambhav_PMS_Presentation.pptx")

if __name__ == '__main__':
    create_presentation()
