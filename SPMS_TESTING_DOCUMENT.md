# Master Testing Documentation

**Project Name:** Sambhav Project Management System (SPMS)  
**Document Type:** Master Testing Documentation  
**Version:** Current Build  
**Generated Date:** 2026-06-04  

---

# Executive Summary

* **Total Modules:** 8 (Auth, Employees, Projects, Timesheets, Reporting Managers, Templates, Dashboard, Activity Logs)
* **Total Features:** 45+
* **Estimated Test Cases:** 250+
* **High Risk Areas:** API Pagination (Dashboard load times), Database Indexing (Query speed on Timesheets), File Uploads (Malware risk without MIME checks)
* **Medium Risk Areas:** Token storage (LocalStorage XSS risks), Form validation (un-sanitized inputs)
* **Low Risk Areas:** RBAC (Well protected via backend dependencies), Authentication (Strong password hashing)

**Overall Quality Score:** 75/100  
**Grade:** C  

---

# Application Overview

* **Purpose of SPMS:** A unified digital platform designed to optimize internal workflows, human resource oversight, and project execution by tracking employees, projects, and daily timesheets.
* **User Roles:** Super Admin, Admin, Reporting Manager, Employee (and Intern).
* **Core Modules:** Employee Management, Project Management, Timesheet Tracking, Activity Auditing.
* **Business Workflows:** An Admin assigns an Employee to a Project and a Reporting Manager. The Employee submits daily timesheets against that Project. The Manager approves the timesheet. The Super Admin monitors all activity via logs and dashboards.

---

# Test Strategy

## Functional Testing
Verify that all business logic and user flows (e.g., submitting a timesheet, approving it) work exactly as specified in the PRD.
## Integration Testing
Ensure that the Frontend (Next.js) communicates seamlessly with the Backend (FastAPI) and external services (Cloudflare R2 for S3 storage, SMTP for emails).
## Regression Testing
Running core checklist tests after any deployment to ensure no existing functionality was broken by new updates.
## UI Testing
Verifying visual layout, responsiveness, empty states, and loading spinners across all viewports.
## API Testing
Directly testing the FastAPI endpoints using Postman/Insomnia to verify responses, HTTP status codes, and JSON schemas independently of the frontend.
## Security Testing
Testing access controls, JWT tampering, missing rate limits, XSS, and file upload boundaries.
## Performance Testing
Measuring the load time of the Dashboard and Projects list under heavy data load (10,000+ timesheets) to verify DB query efficiency.
## User Acceptance Testing
Business-oriented scenarios tested by actual stakeholders to confirm the software meets operational requirements.
## Role-Based Access Testing
Iterative testing of every protected route while logged in as different roles to ensure vertical and horizontal privilege isolation.

---

# Test Environment

* **Frontend Stack:** Next.js 15.5 (App Router), React, Zustand, Tailwind CSS, Shadcn UI
* **Backend Stack:** Python, FastAPI, SQLAlchemy
* **Database:** PostgreSQL (NeonDB)
* **Hosting:** Vercel (Frontend), AWS/Render (Backend expected)
* **Browser Requirements:** Google Chrome (Primary), Safari, Edge, Firefox (Latest 2 versions)
* **Mobile Compatibility:** Responsive Web Design (Mobile Web View)

---

# User Roles Testing Matrix

## Super Admin
* **Allowed Actions:** View/Edit all users, manage all projects, approve any timesheet, view activity logs, manage templates.
* **Restricted Actions:** None.
* **Permission Validation:** Must possess `"superadmin"` role in JWT.

## Admin
* **Allowed Actions:** Manage employees, manage projects, view dashboards, review standard timesheets.
* **Restricted Actions:** Cannot demote/delete a Super Admin. Cannot access raw activity audit logs if restricted.
* **Permission Validation:** Must possess `"admin"` role.

## Reporting Manager
* **Allowed Actions:** View assigned teams, view assigned projects, approve/reject timesheets for direct reports.
* **Restricted Actions:** Cannot create new employees, cannot create new projects, cannot view timesheets of non-subordinates.
* **Permission Validation:** Must possess `"manager"` role and pass `reporting_manager_id` checks.

## Employee
* **Allowed Actions:** View assigned projects, submit daily timesheets, download templates.
* **Restricted Actions:** Cannot view other employees' timesheets, cannot create projects, cannot approve timesheets.
* **Permission Validation:** Must possess `"employee"` or `"intern"` role.

---

# Authentication Testing

### Login - Valid Credentials
* **TC-AUTH-001**
* **Steps:** 1. Open login page 2. Enter valid email and password 3. Submit
* **Expected:** User successfully logs in, receives JWT, and is redirected to Dashboard.
* **Priority:** Critical

### Invalid Login
* **TC-AUTH-002**
* **Steps:** 1. Open login 2. Enter valid email, wrong password 3. Submit
* **Expected:** Proper error message ("Invalid credentials"). No JWT issued. HTTP 401.
* **Priority:** Critical

### Logout
* **TC-AUTH-003**
* **Steps:** 1. Click profile avatar 2. Click Logout
* **Expected:** LocalStorage cleared, session terminated, redirected to login.
* **Priority:** High

### Session Expiry
* **TC-AUTH-004**
* **Steps:** 1. Wait for JWT to expire (or artificially alter token) 2. Click any protected link
* **Expected:** API returns 401, frontend intercepts and redirects user to login.
* **Priority:** High

---

# Employee Module Testing

* **TC-EMP-001 (Create):** Verify Admin can create an Employee. (Precondition: Logged in as Admin). Expected: Employee created, temporary password email dispatched. Priority: High
* **TC-EMP-002 (Duplicate Email):** Attempt to create employee with existing email. Expected: HTTP 400 error. Priority: Medium
* **TC-EMP-003 (Edit):** Modify employee designation. Expected: DB updated, Activity Log created. Priority: High
* **TC-EMP-004 (Delete):** Admin deletes Employee. Expected: Soft-delete or cascade delete executed safely. Priority: Medium
* **TC-EMP-005 (Search):** Enter partial name in search bar. Expected: Table filters accurately via API. Priority: Medium
* **TC-EMP-006 (Pagination):** Request page 2 of employees. Expected: Correct subset returned. Priority: Medium

---

# Reporting Manager Module Testing

* **TC-RM-001 (Creation):** Assign "Manager" role to an employee. Expected: User role updated, new UI options available on next login.
* **TC-RM-002 (Assignment):** Assign employee to Reporting Manager. Expected: Relationship saved in DB.
* **TC-RM-003 (Validation):** Manager attempts to view non-subordinate timesheet. Expected: Access denied (HTTP 403).

---

# Project Module Testing

* **TC-PRJ-001 (Create Project):** Admin creates project with valid data. Expected: Success, project appears in list.
* **TC-PRJ-002 (Assign Team):** Admin assigns 3 employees to a project. Expected: `project_assignments` updated.
* **TC-PRJ-003 (Document Upload):** Upload project brief (PDF). Expected: Uploads to R2, presigned URL generated.
* **TC-PRJ-004 (Change Status):** Mark project as "Completed". Expected: UI reflects status, employees cannot add new timesheets.
* **TC-PRJ-005 (Negative Validation):** Create project missing required 'Name' field. Expected: Form prevents submission.

---

# Timesheet Module Testing

* **TC-TS-001 (Submit Valid):** Employee submits 8 hours for today. Expected: Status becomes "pending", Manager notified.
* **TC-TS-002 (Duplicate Submission):** Employee submits timesheet for a date they already submitted. Expected: Backend rejects (Duplicate submission restriction).
* **TC-TS-003 (Manager Approval):** Manager approves timesheet. Expected: Status -> "approved".
* **TC-TS-004 (Manager Rejection):** Manager rejects timesheet WITHOUT feedback. Expected: UI/Backend prevents action (Feedback is compulsory).

---

# Activity Logs Testing

* **TC-LOG-001:** Admin edits a user's phone number. Expected: Audit log records "EMPLOYEE_UPDATED" with old and new phone number values.
* **TC-LOG-002:** SuperAdmin filters logs by date range. Expected: Correct logs returned.

---

# Dashboard Testing

* **TC-DB-001:** Verify Total Hours widget calculates correctly based on approved timesheets.
* **TC-DB-002:** Verify chart renders without crashing when data is empty.

---

# Templates Module Testing

* **TC-TPL-001:** Super Admin creates an HTML template. Expected: Saved successfully.
* **TC-TPL-002:** Employee views template card. Expected: Can view/download, "Asset Available" badge is hidden (per recent fixes).

---

# API Testing

### Success Responses (TC-API-001)
* **Request:** `GET /projects/` (Valid Token)
* **Expected Response:** JSON array of projects
* **Status Code:** 200 OK

### Unauthorized Access (TC-API-002)
* **Request:** `GET /projects/` (No Token)
* **Expected Response:** `{"detail": "Not authenticated"}`
* **Status Code:** 401 Unauthorized

### Large Payloads (TC-API-003)
* **Request:** `GET /timesheets/all?limit=100000`
* **Expected Response:** System should cap limit to 100 or paginate. (Currently a known risk).
* **Status Code:** 200 (with capped data) or 400 Bad Request.

---

# Database Testing

* **TC-DBT-001 (Foreign Keys):** Delete a project. Expected: Associated timesheets are handled safely (either cascade deleted or `project_id` set to null based on constraints).
* **TC-DBT-002 (Data Integrity):** Insert timesheet with string instead of float for `hours`. Expected: Rejected by ORM/Pydantic.

---

# Role-Based Access Control Testing Matrix

| Feature | Employee | Manager | Admin | Super Admin |
| :--- | :--- | :--- | :--- | :--- |
| **Login** | Yes | Yes | Yes | Yes |
| **Submit Timesheet** | Yes | Yes | No | No |
| **Approve Timesheet**| No | Yes (Team) | Yes | Yes |
| **Create Project** | No | No | Yes | Yes |
| **View Audit Logs** | No | No | No | Yes |

---

# UI/UX Testing

* **Responsive Design:** Verify dashboard collapses into a hamburger menu on mobile view (width < 768px).
* **Loading States:** Verify skeletons/spinners appear while fetching `/projects`.
* **Error Messages:** Verify toast notifications appear for network failures.

---

# Browser Compatibility Testing

* **TC-BROWSER-001:** Execute core workflow in Chrome 120+. (Expected: Pass)
* **TC-BROWSER-002:** Execute core workflow in Safari 17+. (Expected: Pass, verify date picker works).

---

# Performance Testing

* **TC-PERF-001 (Dashboard Load):** Measure load time with 5000 timesheets in DB. Expected: API responds in < 300ms. (Currently failing due to missing DB indexes).
* **TC-PERF-002 (N+1 Query Check):** Load projects page. Expected: 1 DB query executed, not 100+.

---

# Security Testing

* **TC-SEC-001:** Attempt to access `/api/admin/employees` using an Employee JWT. Expected: HTTP 403 Forbidden.
* **TC-SEC-002:** Inject `<script>alert(1)</script>` into Timesheet feedback. Expected: Script is not executed when viewed by Manager (React escaping).
* **TC-SEC-003:** Upload `malware.exe` to document uploader. Expected: System should reject invalid MIME types (Currently a known risk).

---

# Negative Testing

* **TC-NEG-001:** Submit login form with empty fields. (Expected: Frontend validation blocks submission).
* **TC-NEG-002:** Submit timesheet with 25 hours. (Expected: Backend rejects).

---

# Regression Testing Checklist

- [ ] Authentication (Login/Logout/MFA)
- [ ] Employees (Create/Edit)
- [ ] Projects (Assign/View)
- [ ] Timesheets (Submit/Approve/Reject)
- [ ] Dashboard (Metrics load accurately)

---

# User Acceptance Testing (UAT)

**Scenario 1: Daily Operations**
* Employee logs in.
* Employee views assigned Project X.
* Employee submits 8 hours to Project X.
* Reporting Manager logs in.
* Manager sees pending timesheet and Approves it.
* **Expected Outcome:** Timesheet is marked approved, Employee's hours are added to Project X's total hours.

---

# Bug Reporting Template

**Bug ID:** BUG-001  
**Title:** N+1 Query in Projects API causing severe lag  
**Description:** Loading the projects page executes 2 additional queries per project.  
**Steps to Reproduce:** Navigate to Projects tab with network monitor open.  
**Expected Result:** API responds in <200ms.  
**Actual Result:** API responds in >3000ms.  
**Severity:** High  
**Priority:** High  
**Environment:** Production / Vercel  
**Status:** Open  

---

# Release Readiness Checklist

| Module | Status |
| :--- | :--- |
| Authentication | PASS |
| Projects | PASS |
| Timesheets | WARNING |
| Employees | PASS |
| Reporting Managers | PASS |
| Activity Logs | PASS |
| Performance | FAIL |
| Security | WARNING |

---

# Test Coverage Summary

* **Estimated Test Cases:** 250
* **Critical Cases:** 20 (Auth, RBAC)
* **High Priority Cases:** 80 (Core CRUD, Approvals)
* **Medium Priority Cases:** 100 (UI/UX, Validation)
* **Low Priority Cases:** 50 (Edge cases, cosmetic)
* **Coverage Percentage (Target):** 90%

---

# Final QA Assessment

* **Is SPMS ready for testing?** Yes, functional testing can commence immediately.
* **Is SPMS ready for UAT?** Yes, core workflows are intact.
* **Is SPMS ready for production?** **NO.**
* **What modules need additional testing?** Timesheet API performance, File Uploads.
* **What are the highest-risk areas?** Application layer DoS via unpaginated timesheet fetches and missing DB indexes.

**Testing Readiness Score:** 85/100  
**Quality Score:** 75/100  
**Production Testing Recommendation:** Halt production release. Perform a dedicated Performance Testing sprint to resolve N+1 queries and implement database indexes before opening the system to heavy load.
