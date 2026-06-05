# SPMS System Health Report

Generated On: 2026-06-03T18:45:00+05:30

---

# Executive Summary

* **Overall Health Score**: 65/100
* **Maintainability Score**: 75/100
* **Performance Score**: 50/100
* **Scalability Score**: 40/100
* **Security Score**: 85/100
* **Frontend Health Score**: 70/100
* **Backend Health Score**: 55/100

**Categorize project status:**
🟠 Serious Issues

The SPMS system is functional and structurally well-organized but suffers from critical bottlenecks that will severely degrade performance as the user base and data volume grow. The primary concerns revolve around massive unpaginated data fetching, missing database indexes, and N+1 query patterns in the backend.

---

# Project Architecture Analysis

**Folder structure**: Well-structured. Frontend uses Next.js App Router cleanly. Backend separates routes, models, schemas, and core services effectively.
**Module organization**: Good logical separation of domains (Timesheets, Projects, Users).
**Separation of concerns**: Adequate. The backend isolates database logic from routing, though some heavy business logic is leaking into the route handlers.
**API architecture**: RESTful with FastAPI. Standardized responses, but lacks enforcement of strict pagination on aggregate endpoints.
**Component architecture**: React components are mostly modular, though some pages serve as "God components" handling too much fetching and state.
**Reusability**: Shadcn UI provides a solid base of reusable, unstyled components.
**Technical debt**: Medium. Quick fixes in API routes for data grouping have bypassed the database engine.

**Identify:**
* **Tight coupling**: Dashboard metrics are tightly coupled to raw timesheet objects rather than utilizing dedicated aggregated API endpoints.
* **God components**: `DashboardPage` handles fetching, data aggregation, and rendering for the entire application's summary.
* **Redundant modules**: Multiple routes performing similar timesheet groupings (`/grouped` vs `/grouped/paginated`).

---

# Frontend Health Audit

### Page Performance

**Dashboard (`/superadmin/dashboard`)**
Weight: Extremely Heavy
Reason:
* Fetches `/timesheets/all` which downloads the entire timesheet history of the company into browser memory.
* Performs intensive `.filter()` and `.reduce()` operations on thousands of objects on the main thread.
Impact:
* Critical slowdowns, high memory usage, and browser freezing as the database grows.
Recommendation:
* Create aggregated summary endpoints in the backend (e.g., `/timesheets/summary`).
* Offload calculations to the database.

**Projects Page (`/employee/projects` & `/superadmin/projects`)**
Weight: Heavy
Reason:
* Backend endpoint takes a long time to respond due to N+1 queries.
Impact:
* Slow initial render and delayed interactivity.
Recommendation:
* Fix backend query optimization.

**Timesheets Page (`/superadmin/timesheets`)**
Weight: Medium
Reason:
* Renders a large list of timesheets.
Impact:
* Noticeable DOM lag if pages exceed 50 items.
Recommendation:
* Implement component virtualization for long lists.

---

# React Performance Audit

* **Missing useMemo**: In `app/superadmin/dashboard/page.tsx`, heavy calculations like `pendingCount`, `approvedCount`, `rejectedCount`, and `totalHoursAllTime` are recalculated on every single render cycle.
* **Excessive state updates**: Resolved recently in `EmployeeNotesPage` via isolated `LocalInput` components, but similar patterns may exist in deeply nested dialogs.
* **Large context providers**: `useAuthStore` (Zustand) is well-implemented and avoids context provider hell.

---

# Bundle Size Analysis

* **framer-motion**
  Weight: Medium
  Impact: ~130KB
  Used in: Almost all pages for micro-animations.
  Recommendation: Import `m` and `LazyMotion` to reduce the main bundle size.

* **recharts**
  Weight: Heavy
  Impact: ~400KB
  Used in: Dashboards (`BarChart`, `ResponsiveContainer`).
  Recommendation: Lazy load the chart components (`next/dynamic`) so the initial page shell loads instantly.

---

# Backend Health Audit

**FastAPI/Django architecture**: FastAPI implementation is solid with proper dependency injection.
**API organization**: Grouped logically by prefix.
**Query efficiency**: Poor. Relies heavily on ORM lazy-loading and iterative database hits.
**Service layer design**: Missing. Most business logic is written directly inside router functions.

**Categorize endpoints:**
* `/projects/` - 🔴 Very Slow (N+1 queries)
* `/timesheets/all` - 🔴 Very Slow (Unpaginated bulk fetch)
* `/timesheets/grouped` - 🟠 Slow (In-memory grouping)
* `/employees/` - 🟡 Moderate (Allows `limit=1000`)

**Identify:**
* **N+1 queries**: Present in `get_projects()` and `get_project_details()`.
* **Duplicate queries**: In-memory grouping in `get_grouped_timesheets` fetches all relationships manually instead of utilizing SQL `GROUP BY`.

---

# Database Performance Audit

**Identify:**
* **Missing indexes**: The `timesheets` table is heavily queried by `user_id`, `project_id`, `date`, and `status`, yet none of these columns possess an index.
* **Expensive queries**: Fetching sum of hours inside Python loops instead of using SQL aggregation.

**Estimate future scalability:**

`timesheets` table
Current Risk: Low
Future Risk: Critical after 10,000 records.
Recommendation: 
Add indexes to `user_id`, `project_id`, `date`, and `status`. Add a composite index on `(user_id, date)`.

`users` table
Current Risk: Low
Future Risk: Medium.
Recommendation:
Add an index to the `role` column to speed up superadmin lookups.

---

# API Performance Audit

**`GET /projects/`**
* Complexity: High (Iterates over items to run separate sum queries)
* Query count: 1 + (2 * N) queries per request.
* Response size: Moderate.
* Classify: 🔴 Very Slow
* Reason: Executes multiple aggregation queries per project loop.

**`GET /timesheets/all`**
* Complexity: Low
* Query count: 1
* Response size: Massive
* Classify: 🔴 Very Slow
* Reason: Fetches all rows without bounds. Response payload will easily exceed 10MB in production.

**`GET /timesheets/grouped`**
* Complexity: High
* Query count: 1
* Response size: Large
* Classify: 🟠 Slow
* Reason: Fetches all records and processes the grouping dictionary in Python.

---

# Build & Compilation Analysis

**Frontend build process**: Fast, utilizing Next.js Turbopack/Webpack.
**Compilation times**: Acceptable.
**Hot reload performance**: Occasionally slow due to heavy unpaginated data fetches triggering on mount, which stalls the browser during development.

**Identify:**
* **Large modules**: `recharts` and `framer-motion` slow down initial compilation.

---

# Memory Usage Audit

**Identify:**
* **Large states**: `timesheets` array in `DashboardPage` holding thousands of objects.
* **Potential memory leaks**: Continuous WebSocket connections might need rigorous cleanup verification in `EmployeeNotesPage` to prevent stale closures.

---

# Network Audit

**Check:**
* **Over-fetching**: Dashboard fetches full timesheet objects (including descriptions and attachment paths) just to count statuses and sum hours.
* **Large payloads**: `/employees/?limit=1000` and `/projects/?limit=1000` in the Dashboard.
* **Missing pagination**: `/timesheets/all`

---

# Security Health Audit

**Identify:**
* **Missing validation bounds**: Limit parameters allow up to `1000`, making the system vulnerable to Application-layer DoS.
* **Missing authorization checks**: None detected in critical routes; role checking is implemented properly.
* **Insecure uploads**: None. S3/R2 presigned URLs are securely generated.

**Severity:**
Medium (Due to potential DoS via large `limit` parameters and `/all` endpoints).

---

# Scalability Analysis

**100 users**: 🟢 System will run smoothly.
**500 users**: 🟡 Noticeable lag on Dashboards and Project lists.
**1,000 users**: 🟠 Dashboards will take 5-10 seconds to load. APIs will timeout.
**5,000 users**: 🔴 Total system failure due to OOM errors on the backend and browser crashes from massive JSON payloads.

**Identify bottlenecks:**
1. Lack of API pagination.
2. In-memory data aggregations.
3. Missing database indexes.

---

# Technical Debt Analysis

**List:**
* **Quick fixes**: `/timesheets/grouped` in-memory processing. (High)
* **Code smells**: N+1 queries in `projects.py`. (High)
* **Overly complex components**: `DashboardPage` handles too much data logic. (Medium)
* **Unused code**: Legacy category fields in models. (Low)

---

# Performance Bottlenecks

**#1 Dashboard Data Fetching (`/timesheets/all`)**
Severity: Critical
Issue: Downloads entire database table.
Impact: Browser freeze, excessive bandwidth, backend OOM.
Recommended Fix: Create a `/timesheets/summary` endpoint that returns pre-calculated SQL aggregates.

**#2 Projects API N+1 Queries**
Severity: High
Issue: `get_projects` runs `db.query(func.sum)` in a `for` loop.
Impact: Exponential database load.
Estimated Improvement: 90% reduction in API response time.
Recommended Fix: Use SQLAlchemy `outerjoin` and `group_by` to fetch sums in a single query.

**#3 Missing Database Indexes**
Severity: High
Issue: `timesheets` table lacks indexes on heavily queried columns.
Impact: Slow sequential scans during timesheet lookups.
Recommended Fix: Add `index=True` to `user_id`, `project_id`, `date`, `status` in SQLAlchemy models.

---

# Optimization Roadmap

## Quick Wins (< 1 day)
* Add `index=True` to critical columns in `models/timesheet.py` and `models/user.py`.
* Wrap derived calculations in `useMemo` inside `DashboardPage`.

## Short-Term Improvements (1–7 days)
* Rewrite `get_projects` API to use SQL `JOIN` and `GROUP BY` instead of N+1 loops.
* Introduce a backend `/summary` endpoint to replace the `/timesheets/all` call in the frontend dashboard.

## Medium-Term Improvements (1–4 weeks)
* Lazy load `recharts` in Next.js to improve initial page load speed.
* Implement component virtualization for large data tables.

## Long-Term Improvements
* Refactor backend architecture to use dedicated Service classes instead of writing all business logic inside route handlers.
* Implement Redis caching for expensive dashboard aggregate queries.

---

# Top 10 Most Critical Issues

1. **Massive Unpaginated Fetch** (`DashboardPage`) - Impact: Application freeze. Fix: Aggregation API. Benefit: Instant dashboard loading.
2. **N+1 Query in Projects API** (`projects.py`) - Impact: Database exhaustion. Fix: SQL `group_by`. Benefit: 10x faster project list loading.
3. **Missing Foreign Key Indexes** (`timesheets.py`) - Impact: Slow queries. Fix: Add indexes. Benefit: O(log N) query speeds.
4. **In-Memory Grouping** (`timesheets.py /grouped`) - Impact: High RAM usage. Fix: SQL aggregation. Benefit: Lower server costs.
5. **Missing useMemo for Calculations** (`DashboardPage`) - Impact: Stuttering UI. Fix: Wrap in `useMemo`. Benefit: Smoother interactions.
6. **Large `limit` parameters** (`limit=1000`) - Impact: DoS vulnerability. Fix: Cap limit at 100. Benefit: Better security.
7. **Heavy Charting Library in Main Bundle** (`recharts`) - Impact: Slow Time-to-Interactive. Fix: `next/dynamic`. Benefit: -400KB bundle size.
8. **Missing Index on User Role** (`user.py`) - Impact: Slow admin filtering. Fix: Add index. Benefit: Faster user management.
9. **Component Tight Coupling** - Impact: Hard to maintain. Fix: Extract Dashboard metric cards. Benefit: Reusability.
10. **Business Logic in Routes** - Impact: Hard to test. Fix: Extract to `/services`. Benefit: Maintainable codebase.

---

# Final Verdict

**Why the system feels slow:**
The frontend forces the backend to deliver excessive amounts of raw data (e.g., fetching 1,000 projects or every timesheet ever logged) to calculate simple metrics like total hours.

**What causes most latency:**
The N+1 query loop in `get_projects`, which forces the database to answer hundreds of independent sum requests per API call.

**What causes slow page loads:**
The massive JSON payload size over the network, followed by the browser struggling to parse and reduce thousands of timesheet objects on the main thread.

**What should be fixed first:**
1. Replace `/timesheets/all` with a backend aggregate endpoint.
2. Fix the N+1 query in `get_projects`.
3. Add database indexes to `Timesheet`.

**Expected performance gain after fixes:**
API response times will drop from seconds to milliseconds (~90% improvement). Dashboard load times will be near-instant, and memory usage will be stabilized, allowing the system to scale comfortably beyond 10,000 users.

**Final Health Assessment:**
The system's foundation is solid, utilizing modern frameworks (Next.js, FastAPI), but it is currently crippled by unoptimized database interactions and heavy frontend data processing. Fixing the top 3 critical issues will elevate the application from "Serious Issues" to "Healthy."
