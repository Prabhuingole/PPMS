# QA Stabilization Sprint Report

**Date:** 2026-06-08
**Sprint:** QA Stabilization & Performance Hardening
**Objective:** Halt Enterprise UI Migration and address all critical security, performance, and operational defects identified in `SPMS_TESTING_DOCUMENT.md`.

---

## 🔴 P0 Critical (Must Fix Immediately)

### 1. N+1 Query in Projects API Causing Severe Lag
* **Module:** Projects (`project_management.py`)
* **Reproduction Steps:** Navigate to Projects tab.
* **Expected Result:** API responds in <200ms.
* **Actual Result:** API executes 2 additional database queries per project to calculate timesheet totals, resulting in >3000ms load times under stress.
* **Recommended Fix:** Refactor `get_projects` endpoint to use a single `group_by` aggregate SQL query outside the loop instead of iterating row-by-row.

### 2. Malware Risk without MIME Checks on File Uploads
* **Module:** Documents & Timesheets (`documents.py`, `timesheets.py`)
* **Reproduction Steps:** Upload a `.exe` or `.sh` script disguised as an attachment or project document.
* **Expected Result:** API rejects unsupported file types.
* **Actual Result:** API accepts any arbitrary file extension and MIME type and stores it in Cloudflare R2, posing a critical security vulnerability.
* **Recommended Fix:** Implement a strict allowlist of file extensions (`.pdf`, `.jpg`, `.png`, `.csv`, `.xlsx`, `.docx`) and enforce validation via `python-magic` or direct header verification.

---

## 🟠 P1 Major (Must Fix in Current Sprint)

### 3. API Pagination & Memory Overflow (Dashboard Load Times)
* **Module:** Dashboard & Timesheets (`timesheets.py`, `dashboard/page.tsx`)
* **Reproduction Steps:** Log in to the SuperAdmin dashboard with 10,000+ timesheets in the database.
* **Expected Result:** Dashboard loads quickly using aggregated stats.
* **Actual Result:** The frontend executes `GET /timesheets/all` without pagination, pulling the entire database into memory to compute metrics (e.g. pending/approved counts, weekly hours).
* **Recommended Fix:** Create a dedicated `/timesheets/dashboard-stats` API endpoint that computes these aggregates natively in PostgreSQL. Update the frontend dashboard to consume this new endpoint and add pagination to `/timesheets/all`.

### 4. Missing Database Indexing on Timesheets Table
* **Module:** Database Schema (`timesheet.py`)
* **Reproduction Steps:** Execute standard Timesheet filtering by `status`, `project_id`, or `user_id`.
* **Expected Result:** Rapid query execution utilizing B-Tree indexes.
* **Actual Result:** Full table scans are performed due to missing indexes on highly queried foreign keys and status flags.
* **Recommended Fix:** Add `index=True` to `user_id`, `project_id`, `date`, and `status` columns in the SQLAlchemy `Timesheet` model.

### 5. Token Storage XSS Risk
* **Module:** Auth (`authStore.ts`)
* **Reproduction Steps:** Run automated security scan against the frontend.
* **Expected Result:** Tokens are stored securely.
* **Actual Result:** JWTs are stored in LocalStorage, vulnerable to Cross-Site Scripting (XSS).
* **Recommended Fix:** The current implementation also sets an `auth_token` cookie. We must enforce `SameSite=Lax` and `HttpOnly` flags via the backend Set-Cookie header. *(Note: Given current architectural constraints, this will be logged and mitigated via XSS escaping, as full backend HttpOnly session management requires a major auth refactor).*

---

## 🟡 P2 Minor UI (Deferred)

### 6. Missing Empty States and Loading Spinners
* **Module:** Global UI Components
* **Reproduction Steps:** Load a module before data arrives or when data is empty.
* **Expected Result:** Skeleton loaders and styled empty states.
* **Actual Result:** Inconsistent handling across some tertiary modal views.
* **Recommended Fix:** Deferred. Will be addressed automatically when Enterprise UI Migration resumes.

---

## 🟢 P3 Cosmetic (Deferred)

### 7. Form Validation - Unsanitized Optional Text Inputs
* **Module:** General Forms
* **Reproduction Steps:** Enter unusual characters into bio or feedback fields.
* **Expected Result:** Backend strips tags.
* **Actual Result:** Pydantic validators do not actively strip HTML, relying entirely on React's automatic XSS escaping.
* **Recommended Fix:** Deferred.

---

## 🚀 Recommended Stabilization Roadmap

1. **Phase 1 (Security & Data Integrity)**
   - Lock down all upload endpoints (`documents.py`, `timesheets.py`).
   - Add database indexes to `timesheet.py`.

2. **Phase 2 (Performance Optimization)**
   - Eliminate N+1 query loops in `project_management.py`.
   - Implement `GET /timesheets/dashboard-stats` backend endpoint.
   - Refactor `dashboard/page.tsx` to consume the new stats endpoint natively.

3. **Phase 3 (Verification)**
   - Re-run `npm run build` and `tsc`.
   - Verify performance metrics.
