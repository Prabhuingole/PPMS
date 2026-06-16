"""
Phase 12B - Task CRUD Integration Tests
Tests task creation, listing, updating, deletion, and validation rules.
"""
import requests
import sys

BASE_URL = "http://localhost:8000"

def log(msg, status="PASS"):
    symbol = "[OK]" if status == "PASS" else "[X]" if status == "FAIL" else "[i]"
    print(f"  {symbol} [{status}] {msg}")

def get_superadmin_token():
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@sambhav.com", "password": "admin@123"})
    data = res.json()
    token = data.get("access_token")
    if not token and data.get("requires_mfa"):
        print("MFA is enabled for superadmin. Skipping tests.")
        return None
    return token

def run_tests():
    print("\n=== TASK CRUD TESTS ===\n")
    token = get_superadmin_token()
    if not token:
        log("Could not get superadmin token", "FAIL")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    passed = 0
    failed = 0

    # --- Get a project and member ---
    res = requests.get(f"{BASE_URL}/projects/?limit=1", headers=headers)
    projects = res.json()
    if not projects.get("items"):
        log("No projects found. Cannot run task tests.", "FAIL")
        return False
    
    project = projects["items"][0]
    project_id = project["id"]
    
    # Find a member of the project (or use superadmin)
    members = project.get("members", [])
    assignee_id = members[0]["id"] if members else None
    
    log(f"Using project_id={project_id}, assignee_id={assignee_id}", "INFO")

    # --- 1. CREATE ---
    payload = {
        "project_id": project_id,
        "title": "Phase 12B Test Task",
        "description": "Automated test task",
        "estimated_hours": 8.0,
        "actual_hours": 0.0,
        "status": "BACKLOG",
        "priority": "MEDIUM",
        "is_active": True
    }
    if assignee_id:
        payload["assignee_id"] = assignee_id

    res = requests.post(f"{BASE_URL}/tasks/", json=payload, headers=headers)
    if res.status_code == 201:
        task_id = res.json()["id"]
        log(f"Create Task: ID={task_id}")
        passed += 1
    else:
        log(f"Create Task: {res.status_code} - {res.text}", "FAIL")
        failed += 1
        return False

    # --- 2. READ ---
    res = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    if res.status_code == 200 and res.json()["title"] == "Phase 12B Test Task":
        log("Read Task")
        passed += 1
    else:
        log(f"Read Task: {res.status_code}", "FAIL")
        failed += 1

    # --- 3. LIST ---
    res = requests.get(f"{BASE_URL}/tasks/?project_id={project_id}", headers=headers)
    if res.status_code == 200 and res.json()["total"] >= 1:
        log(f"List Tasks: total={res.json()['total']}")
        passed += 1
    else:
        log(f"List Tasks: {res.status_code}", "FAIL")
        failed += 1

    # --- 4. UPDATE ---
    res = requests.put(f"{BASE_URL}/tasks/{task_id}", json={
        "title": "Updated Task Title",
        "status": "IN_PROGRESS",
        "priority": "HIGH",
        "actual_hours": 2.5
    }, headers=headers)
    if res.status_code == 200:
        data = res.json()
        if data["title"] == "Updated Task Title" and data["status"] == "IN_PROGRESS" and data["priority"] == "HIGH":
            log("Update Task")
            passed += 1
        else:
            log(f"Update Task: Values mismatch - {data}", "FAIL")
            failed += 1
    else:
        log(f"Update Task: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 5. VALIDATION: estimated_hours <= 0 ---
    res = requests.post(f"{BASE_URL}/tasks/", json={
        "project_id": project_id,
        "title": "Bad Task",
        "estimated_hours": -5.0
    }, headers=headers)
    if res.status_code == 422 or res.status_code == 400:
        log("Reject estimated_hours <= 0")
        passed += 1
    else:
        log(f"Reject estimated_hours <= 0: Expected 4xx, got {res.status_code}", "FAIL")
        failed += 1

    # --- 6. VALIDATION: missing title ---
    res = requests.post(f"{BASE_URL}/tasks/", json={
        "project_id": project_id,
        "title": "",
        "estimated_hours": 4.0
    }, headers=headers)
    if res.status_code == 422 or res.status_code == 400:
        log("Reject empty title")
        passed += 1
    else:
        log(f"Reject empty title: Expected 4xx, got {res.status_code}", "FAIL")
        failed += 1

    # --- 7. VALIDATION: assignee not in project ---
    res = requests.post(f"{BASE_URL}/tasks/", json={
        "project_id": project_id,
        "title": "Non-member Task",
        "estimated_hours": 4.0,
        "assignee_id": 999999
    }, headers=headers)
    if res.status_code == 400:
        log("Reject assignee not in project")
        passed += 1
    else:
        log(f"Reject assignee not in project: Expected 400, got {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 8. DELETE ---
    res = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    if res.status_code == 204:
        log("Delete Task")
        passed += 1
    else:
        log(f"Delete Task: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 9. Verify deletion ---
    res = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
    if res.status_code == 404:
        log("Verify Task Deleted")
        passed += 1
    else:
        log(f"Verify Task Deleted: Expected 404, got {res.status_code}", "FAIL")
        failed += 1

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
