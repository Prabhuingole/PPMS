"""
Phase 12B - Resource Allocation CRUD Integration Tests
Tests allocation creation, listing, capacity validation, overlap, and deletion.
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
    print("\n=== RESOURCE ALLOCATION CRUD TESTS ===\n")
    token = get_superadmin_token()
    if not token:
        log("Could not get superadmin token", "FAIL")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    passed = 0
    failed = 0

    # --- Get a project and a user ---
    res = requests.get(f"{BASE_URL}/projects/?limit=1", headers=headers)
    projects = res.json()
    if not projects.get("items"):
        log("No projects found. Cannot run allocation tests.", "FAIL")
        return False
    
    project_id = projects["items"][0]["id"]
    members = projects["items"][0].get("members", [])
    
    if members:
        user_id = members[0]["id"]
    else:
        # Fallback: use any employee
        emp_res = requests.get(f"{BASE_URL}/employees/?limit=1", headers=headers)
        emp_data = emp_res.json()
        employees = emp_data.get("items", emp_data) if isinstance(emp_data, dict) else emp_data
        if isinstance(employees, list) and len(employees) > 0:
            user_id = employees[0]["id"]
        else:
            log("No users found to test allocations against.", "FAIL")
            return False

    log(f"Using project_id={project_id}, user_id={user_id}", "INFO")

    # --- 1. CREATE ---
    res = requests.post(f"{BASE_URL}/allocations/", json={
        "project_id": project_id,
        "user_id": user_id,
        "allocated_hours_per_week": 20.0,
        "start_date": "2026-07-01T00:00:00",
        "end_date": "2026-09-30T00:00:00",
        "is_active": True,
        "override_capacity": False
    }, headers=headers)
    if res.status_code == 201:
        alloc_id = res.json()["id"]
        log(f"Create Allocation: ID={alloc_id}")
        passed += 1
    else:
        log(f"Create Allocation: {res.status_code} - {res.text}", "FAIL")
        failed += 1
        return False

    # --- 2. READ ---
    res = requests.get(f"{BASE_URL}/allocations/{alloc_id}", headers=headers)
    if res.status_code == 200 and res.json()["allocated_hours_per_week"] == 20.0:
        log("Read Allocation")
        passed += 1
    else:
        log(f"Read Allocation: {res.status_code}", "FAIL")
        failed += 1

    # --- 3. LIST ---
    res = requests.get(f"{BASE_URL}/allocations/?project_id={project_id}", headers=headers)
    if res.status_code == 200 and res.json()["total"] >= 1:
        log(f"List Allocations: total={res.json()['total']}")
        passed += 1
    else:
        log(f"List Allocations: {res.status_code}", "FAIL")
        failed += 1

    # --- 4. UPDATE ---
    res = requests.put(f"{BASE_URL}/allocations/{alloc_id}", json={
        "allocated_hours_per_week": 25.0
    }, headers=headers)
    if res.status_code == 200 and res.json()["allocated_hours_per_week"] == 25.0:
        log("Update Allocation")
        passed += 1
    else:
        log(f"Update Allocation: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 5. OVERLAP VALIDATION: second allocation same period should hit capacity ---
    res = requests.post(f"{BASE_URL}/allocations/", json={
        "project_id": project_id,
        "user_id": user_id,
        "allocated_hours_per_week": 20.0,
        "start_date": "2026-07-15T00:00:00",
        "end_date": "2026-08-15T00:00:00",
        "is_active": True,
        "override_capacity": False
    }, headers=headers)
    if res.status_code == 400 or res.status_code == 201:
        # Might pass if total is within capacity (25 + 20 = 45 > 40), should fail
        if res.status_code == 400:
            log("Reject overlapping allocation exceeding capacity")
            passed += 1
        else:
            # Cleanup the second allocation
            alloc2_id = res.json()["id"]
            requests.delete(f"{BASE_URL}/allocations/{alloc2_id}", headers=headers)
            log("Overlap validation did not reject (total may be within capacity)", "FAIL")
            failed += 1
    else:
        log(f"Overlap validation: Unexpected {res.status_code}", "FAIL")
        failed += 1

    # --- 6. OVERRIDE CAPACITY ---
    res = requests.post(f"{BASE_URL}/allocations/", json={
        "project_id": project_id,
        "user_id": user_id,
        "allocated_hours_per_week": 20.0,
        "start_date": "2026-07-15T00:00:00",
        "end_date": "2026-08-15T00:00:00",
        "is_active": True,
        "override_capacity": True
    }, headers=headers)
    if res.status_code == 201:
        alloc2_id = res.json()["id"]
        log(f"Override Capacity: Created allocation ID={alloc2_id}")
        passed += 1
        # Cleanup
        requests.delete(f"{BASE_URL}/allocations/{alloc2_id}", headers=headers)
    else:
        log(f"Override Capacity: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 7. VALIDATION: start_date >= end_date ---
    res = requests.post(f"{BASE_URL}/allocations/", json={
        "project_id": project_id,
        "user_id": user_id,
        "allocated_hours_per_week": 10.0,
        "start_date": "2026-12-01T00:00:00",
        "end_date": "2026-11-01T00:00:00",
        "is_active": True
    }, headers=headers)
    if res.status_code == 400:
        log("Reject start_date >= end_date")
        passed += 1
    else:
        log(f"Reject start_date >= end_date: Expected 400, got {res.status_code}", "FAIL")
        failed += 1

    # --- 8. VALIDATION: allocated_hours <= 0 ---
    res = requests.post(f"{BASE_URL}/allocations/", json={
        "project_id": project_id,
        "user_id": user_id,
        "allocated_hours_per_week": -5.0,
        "start_date": "2026-07-01T00:00:00",
        "end_date": "2026-09-30T00:00:00"
    }, headers=headers)
    if res.status_code == 422 or res.status_code == 400:
        log("Reject allocated_hours <= 0")
        passed += 1
    else:
        log(f"Reject allocated_hours <= 0: Expected 4xx, got {res.status_code}", "FAIL")
        failed += 1

    # --- 9. DELETE ---
    res = requests.delete(f"{BASE_URL}/allocations/{alloc_id}", headers=headers)
    if res.status_code == 204:
        log("Delete Allocation")
        passed += 1
    else:
        log(f"Delete Allocation: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 10. Verify deletion ---
    res = requests.get(f"{BASE_URL}/allocations/{alloc_id}", headers=headers)
    if res.status_code == 404:
        log("Verify Allocation Deleted")
        passed += 1
    else:
        log(f"Verify Allocation Deleted: Expected 404, got {res.status_code}", "FAIL")
        failed += 1

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
