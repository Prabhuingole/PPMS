"""
Phase 12B - Task Visibility Integration Tests
Tests that role-based visibility rules are enforced for task operations.
"""
import requests
import sys

BASE_URL = "http://localhost:8000"

def log(msg, status="PASS"):
    symbol = "[OK]" if status == "PASS" else "[X]" if status == "FAIL" else "[i]"
    print(f"  {symbol} [{status}] {msg}")

def get_token(email, password="admin@123"):
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    data = res.json()
    token = data.get("access_token")
    if not token and data.get("requires_mfa"):
        return None
    return token

def run_tests():
    print("\n=== TASK VISIBILITY TESTS ===\n")
    
    # --- 1. Superadmin can see all tasks ---
    admin_token = get_token("admin@sambhav.com")
    if not admin_token:
        log("Could not get superadmin token", "FAIL")
        return False
    
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    passed = 0
    failed = 0

    # Create a task as superadmin
    res = requests.get(f"{BASE_URL}/projects/?limit=1", headers=admin_headers)
    projects = res.json()
    if not projects.get("items"):
        log("No projects available. Cannot test visibility.", "FAIL")
        return False
    
    project_id = projects["items"][0]["id"]

    task_res = requests.post(f"{BASE_URL}/tasks/", json={
        "project_id": project_id,
        "title": "Visibility Test Task",
        "estimated_hours": 4.0,
        "status": "BACKLOG",
        "priority": "MEDIUM"
    }, headers=admin_headers)
    
    if task_res.status_code == 201:
        task_id = task_res.json()["id"]
        log(f"Superadmin created task ID={task_id}", "INFO")
    else:
        log(f"Failed to create test task: {task_res.status_code} - {task_res.text}", "FAIL")
        return False

    # Superadmin should see the task
    res = requests.get(f"{BASE_URL}/tasks/{task_id}", headers=admin_headers)
    if res.status_code == 200:
        log("Superadmin can view task")
        passed += 1
    else:
        log(f"Superadmin view task: {res.status_code}", "FAIL")
        failed += 1

    # Superadmin can list all tasks
    res = requests.get(f"{BASE_URL}/tasks/", headers=admin_headers)
    if res.status_code == 200 and res.json()["total"] >= 1:
        log(f"Superadmin can list tasks: total={res.json()['total']}")
        passed += 1
    else:
        log(f"Superadmin list tasks: {res.status_code}", "FAIL")
        failed += 1

    # Superadmin can update the task
    res = requests.put(f"{BASE_URL}/tasks/{task_id}", json={"title": "Updated by Admin"}, headers=admin_headers)
    if res.status_code == 200:
        log("Superadmin can update task")
        passed += 1
    else:
        log(f"Superadmin update task: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # Superadmin can delete the task
    res = requests.delete(f"{BASE_URL}/tasks/{task_id}", headers=admin_headers)
    if res.status_code == 204:
        log("Superadmin can delete task")
        passed += 1
    else:
        log(f"Superadmin delete task: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 2. Non-member employee should NOT see tasks ---
    # Try to find a non-member employee
    emp_res = requests.get(f"{BASE_URL}/employees/?limit=10", headers=admin_headers)
    emp_data = emp_res.json()
    employees = emp_data.get("items", emp_data) if isinstance(emp_data, dict) else emp_data
    
    project_members = projects["items"][0].get("members", [])
    member_ids = {m["id"] for m in project_members}
    
    non_member = None
    if isinstance(employees, list):
        for emp in employees:
            if emp.get("id") not in member_ids and emp.get("role") not in ["superadmin", "admin"]:
                non_member = emp
                break
    
    if non_member:
        # Create another task for the isolation test
        task_res2 = requests.post(f"{BASE_URL}/tasks/", json={
            "project_id": project_id,
            "title": "Isolation Test Task",
            "estimated_hours": 2.0
        }, headers=admin_headers)
        
        if task_res2.status_code == 201:
            task_id2 = task_res2.json()["id"]
            
            non_member_token = get_token(non_member["email"], "Password@123")
            if non_member_token:
                nm_headers = {"Authorization": f"Bearer {non_member_token}"}
                res = requests.get(f"{BASE_URL}/tasks/{task_id2}", headers=nm_headers)
                if res.status_code == 404:
                    log("Non-member employee cannot view project task")
                    passed += 1
                else:
                    log(f"Non-member employee isolation: Expected 404, got {res.status_code}", "FAIL")
                    failed += 1
            else:
                log("Could not authenticate non-member employee. Skipping isolation test.", "INFO")
            
            # Cleanup
            requests.delete(f"{BASE_URL}/tasks/{task_id2}", headers=admin_headers)
        else:
            log("Could not create isolation test task", "INFO")
    else:
        log("No non-member employee found. Skipping isolation test.", "INFO")

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
