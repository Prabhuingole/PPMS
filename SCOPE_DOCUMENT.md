# Scope of Work

## Project Information

**Project Name:**  
Sambhav Project Management System (SPMS)

**Document Type:**  
Scope of Work

**Document Status:**  
Current System Scope

**Version:**  
Auto-generated from codebase

**Generated Date:**  
2026-06-04

---

# Executive Summary

The Sambhav Project Management System (SPMS) is a modernized, unified digital platform designed to optimize internal workflows, human resource oversight, and project execution. Built to eliminate fragmented tracking methods, SPMS provides a centralized hub where organizations can securely oversee their workforce and project lifecycles. 

The primary business objectives of SPMS are to enforce accountability, streamline daily operations, and reduce administrative overhead. By solving the core problems of disjointed task tracking, manual timesheet reviews, and poor project visibility, SPMS empowers leadership to make data-driven decisions while ensuring employees have a frictionless environment to report their daily progress. The intended users range from executive leadership (Super Admins) to daily operational staff (Employees and Interns).

---

# Project Overview

SPMS operates as a centralized web-based Project Management System explicitly engineered to manage the following core operational pillars:

* **Employees:** Comprehensive lifecycle and profile management.
* **Reporting Managers:** Hierarchical team assignments and oversight.
* **Projects:** End-to-end tracking of project details, milestones, and documentation.
* **Timesheets:** Daily logging of billable/non-billable hours with a structured approval flow.
* **Templates:** Standardized governance artifacts (e.g., PRD, BRD).
* **Activity Tracking:** Continuous auditing of system and user events.
* **Administrative Operations:** Granular control over platform access and configurations.

By seamlessly connecting project assignments with daily time tracking and managerial oversight, SPMS radically improves project visibility and overall operational efficiency.

---

# System Architecture

## Frontend
* **Framework:** Next.js (App Router)
* **UI Technology:** React, Tailwind CSS, Shadcn UI, Radix UI primitives, Framer Motion (animations)
* **State Management:** Zustand (global state), React local state
* **Routing:** Next.js native file-based routing

## Backend
* **Framework:** FastAPI (Python)
* **APIs:** RESTful architecture with WebSocket support for real-time updates
* **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing

## Database
* **Database Technology:** Relational Database (via SQLAlchemy ORM, compatible with PostgreSQL/SQLite)
* **Entity Relationships:** Deeply relational architecture linking Users to Projects, Timesheets to Users and Projects, and Audit Logs tracking entities system-wide.

---

# User Roles & Permissions

SPMS enforces a robust Role-Based Access Control (RBAC) architecture. The implemented roles and their capabilities are defined below:

## Super Admin
* Manage all Admins, Employees, and Reporting Managers
* Full CRUD (Create, Read, Update, Delete) access to Projects
* Manage Master Templates and Governance Documents
* View and export global Activity Logs (Audit Trail)
* Oversee all Timesheets (Approve/Reject globally)
* Configure master system Settings and view Active Sessions

## Admin
* Manage Employees and Reporting Managers
* Manage Projects and Team Assignments
* Oversee Timesheet approval queues
* Access Activity Logs
* View Master Templates

## Reporting Manager
* View assigned team members
* Manage and track Projects assigned to their purview
* Review, approve, and reject Timesheets submitted by direct reports
* View Project Documents and Master Templates

## Employee
* View assigned Projects and associated documentation
* Submit daily Timesheets and view approval status
* Maintain personal To-Do lists and Notes
* Access Master Templates for daily operations
* Manage personal profile settings

## Intern
* Functionally similar to the Employee role with restricted administrative visibility, focused purely on task execution and daily timesheet submission.

---

# Functional Modules

## Authentication & Authorization
* **Login/Logout:** Secure credential-based authentication returning JWT access tokens.
* **Session Management:** Tracking of active login sessions and device information via User-Agent parsing.
* **Role-Based Access Control:** API and Route-level guards ensuring strict adherence to role privileges.

## Dashboard Module
* **Dashboard Widgets:** Real-time counters for Total Employees, Active Projects, and Pending/Approved Timesheets.
* **Metrics:** Weekly hours trends, status distributions, and team utilization charts.
* **Quick Insights:** Live feeds of recent organizational activity and timesheet submissions.

## Employee Management Module
* **Create/Edit/Delete Employee:** Full lifecycle management of user accounts.
* **Employee Profiles:** Detailed views including designations, roles, and contact information.
* **Employee Assignment:** Assigning employees to specific Reporting Managers and Projects.

## Reporting Manager Module
* **Manager Creation:** Upgrading employees to manager status.
* **Manager Assignment:** Linking managers to specific projects for direct oversight.
* **Team Management:** Visibility into the performance and timesheets of assigned team members.

## Project Management Module
### Features
* **Project Creation & Editing:** Defining project scope, client details, and total allocated hours.
* **Project & Team Assignment:** Allocating specific employees and managers to project rosters.
* **Project Status Tracking:** Monitoring active, completed, or on-hold statuses.
* **Project Timeline Tracking:** Start and end date management against logged hours.
* **Project Documents:** Secure upload, storage (via S3/R2), and inline viewing of project-specific files.
* **Project Details View:** Aggregated metrics displaying total hours worked vs. total hours remaining.

## Timesheet Management Module
* **Timesheet Creation:** Employees logging daily hours against specific projects or general categories.
* **Timesheet Submission:** Restriction limiting submissions to one consolidated timesheet per day to prevent fragmentation.
* **Timesheet Approval Flow:** A dual-queue system allowing Managers/Admins to bulk approve or reject timesheets with mandatory feedback.
* **Time Tracking:** Calculation of daily, weekly, and project-lifetime hours.
* **Historical Records:** Read-only archives of past approved or rejected timesheets.

## Notes & To-Do Module
* **Personal Workspaces:** Private areas for employees to manage daily tasks.
* **Checklists:** Interactive task lists with real-time saving and debounce optimization.
* **Pinning & Organization:** Ability to pin important notes for quick access.

## Templates Module
* **Template Creation & Management:** Admins uploading Master Templates (PRD, BRD, Scope Documents).
* **Template Usage:** Employees downloading or securely viewing governance templates inline without needing external software.

## Activity Logs Module
* **System Tracking:** Automatic backend logging of critical database mutations.
* **User Activity Monitoring:** Tracking who performed what action and when.
* **Audit Trail:** Read-only historical ledger of events like `PROJECT_CREATED`, `TIMESHEET_APPROVED`, and `TIMESHEET_EDITED`.

## Settings Module
* **Profile Settings:** User-level password and bio updates.
* **System Settings:** Super Admin visibility into active user sessions, device types, and operating systems.

---

# Data Management

* **Employee Data:** Secure storage of PII, hashed passwords, and organizational hierarchy links.
* **Project Data:** Centralized repository for project metadata, timelines, and hour budgets.
* **Timesheet Data:** Highly relational tracking of time spent per project, per employee, per day.
* **Activity Log Data:** Immutable ledger for compliance and security auditing.
* **Document Storage:** Integration with cloud object storage (S3/R2 compatible) for project files, timesheet attachments, and master templates, utilizing secure presigned URLs.

---

# Key Features

* **Role-Based Access Control:** Strict data siloing ensuring users only see what they are authorized to see.
* **Project Tracking:** Granular monitoring of project health through timesheet hour aggregation.
* **Team Management:** Clear hierarchical structures tying employees to managers.
* **Document Management:** Secure, inline viewing and downloading of enterprise artifacts.
* **Activity Monitoring:** Comprehensive auditing for enterprise accountability.
* **Timesheet Tracking:** Streamlined, strict daily time-logging with mandatory manager feedback loops.

---

# Workflow Overview

**Core Operational Workflow:**
1. **Admin** creates a Project and assigns a **Reporting Manager** and **Employees**.
2. **Employee** logs into the portal, views the assigned Project, and accesses necessary Master Templates.
3. **Employee** works on tasks, optionally utilizing the Notes/To-Do module.
4. **Employee** submits a consolidated daily Timesheet detailing hours spent on the Project.
5. **Reporting Manager** receives a notification, reviews the Timesheet, and Approves or Rejects it with mandatory feedback.
6. **Super Admin** monitors high-level Dashboard metrics to ensure operational efficiency and project budget adherence.

---

# Security & Access Control

* **Authentication:** Required for all API interactions; enforced via Bearer JWTs.
* **Authorization:** Backend dependency injection checks user roles before executing mutations.
* **Protected Routes:** Next.js middleware and layout guards prevent unauthorized UI access.
* **Data Access Restrictions:** Employees can only fetch timesheets and projects assigned explicitly to them. Document access requires generating ephemeral, securely signed URLs.

---

# Current Scope Boundaries

To ensure clarity on the current state of the platform, **the following modules are explicitly NOT part of the current implemented scope:**

* Attendance Management (Clock-in/Clock-out tracking)
* Leave Management & Approval Workflows
* Payroll Processing & Invoice Generation
* Face Recognition / Biometrics
* Location / GPS Tracking
* Recruitment Management (ATS)
* Performance Evaluation System

---

# Non-Functional Requirements

* **Performance Expectations:** Optimized React rendering minimizing layout thrashing. Asynchronous backend processing for notifications and websockets.
* **Scalability:** Stateless API design allowing for horizontal backend scaling, heavily reliant on a centralized PostgreSQL/Relational database.
* **Security:** Prevention of insecure direct object references (IDOR) via strict row-level authorization checks in API endpoints.
* **Maintainability:** Modular component architecture using Tailwind and Shadcn, alongside a FastAPI architecture cleanly separating routes and models.
* **Availability:** Web-based architecture accessible 24/7 via modern web browsers.

---

# Future Enhancement Opportunities

*The following features are slated for the future product roadmap and are not currently active:*

* Dedicated Attendance System
* Integrated Leave Management
* Automated Payroll & Invoicing
* Granular Notification System (Email/Push)
* Advanced Analytics Dashboard (Predictive Project Budgeting)
* Native Mobile Application

---

# Deliverables Summary

* **Modules Delivered:** Dashboard, Employee Management, Project Management, Timesheets, Notes/To-Do, Templates, Activity Logs, Settings.
* **Features Delivered:** Secure Authentication, S3 Document Integration, Real-time WebSockets, Audit Trails, Hierarchical Data Filtering.
* **User Roles Supported:** Super Admin, Admin, Reporting Manager, Employee, Intern.
* **Current System Capabilities:** Comprehensive, secure, and centralized project and time tracking suitable for mid-to-large organizational deployment.

---

# Conclusion

The Sambhav Project Management System (SPMS) successfully delivers a highly capable, centralized project management platform. Through its implementation of strict role-based access control, integrated document handling, and rigorous timesheet governance, SPMS streamlines employee management, project tracking, and administrative oversight. The current scope provides a robust foundation that solves immediate operational inefficiencies, paving the way for future scalability and enterprise enhancements.
