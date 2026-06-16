"""
Phase 12B - Deliverable CRUD Integration Tests
Tests deliverable creation, listing, updating, and deletion via the API.
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
    print("\n=== DELIVERABLE CRUD TESTS ===\n")
    token = get_superadmin_token()
    if not token:
        log("Could not get superadmin token", "FAIL")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    passed = 0
    failed = 0

    # --- Get a project ID to test with ---
    res = requests.get(f"{BASE_URL}/projects/?limit=1", headers=headers)
    projects = res.json()
    if not projects.get("items"):
        log("No projects found to test deliverables against. Creating test project...", "INFO")
        # Attempt to find a company
        comp_res = requests.get(f"{BASE_URL}/companies/", headers=headers)
        companies = comp_res.json()
        if isinstance(companies, list) and len(companies) > 0:
            company_id = companies[0]["id"]
        else:
            log("No companies found. Cannot create test project.", "FAIL")
            return False
        
        proj_res = requests.post(f"{BASE_URL}/projects/", json={
            "name": "Deliverable Test Project",
            "code": "DTP-001",
            "owner_company_id": company_id,
            "participating_company_ids": [company_id],
            "status": "active"
        }, headers=headers)
        if proj_res.status_code != 201:
            log(f"Failed to create test project: {proj_res.status_code} - {proj_res.text}", "FAIL")
            return False
        project_id = proj_res.json()["id"]
    else:
        project_id = projects["items"][0]["id"]

    log(f"Using project_id={project_id} for tests", "INFO")

    # --- 1. CREATE ---
    res = requests.post(f"{BASE_URL}/deliverables/", json={
        "project_id": project_id,
        "name": "Phase 12B Test Deliverable",
        "description": "Automated test deliverable",
        "status": "active",
        "is_active": True,
        "target_date": "2026-12-31T00:00:00"
    }, headers=headers)
    if res.status_code == 201:
        deliv_id = res.json()["id"]
        log(f"Create Deliverable: ID={deliv_id}")
        passed += 1
    else:
        log(f"Create Deliverable: {res.status_code} - {res.text}", "FAIL")
        failed += 1
        return False

    # --- 2. READ (single) ---
    res = requests.get(f"{BASE_URL}/deliverables/{deliv_id}", headers=headers)
    if res.status_code == 200 and res.json()["name"] == "Phase 12B Test Deliverable":
        log("Read Deliverable")
        passed += 1
    else:
        log(f"Read Deliverable: {res.status_code}", "FAIL")
        failed += 1

    # --- 3. LIST ---
    res = requests.get(f"{BASE_URL}/deliverables/?project_id={project_id}", headers=headers)
    if res.status_code == 200 and res.json()["total"] >= 1:
        log(f"List Deliverables: total={res.json()['total']}")
        passed += 1
    else:
        log(f"List Deliverables: {res.status_code}", "FAIL")
        failed += 1

    # --- 4. UPDATE ---
    res = requests.put(f"{BASE_URL}/deliverables/{deliv_id}", json={
        "name": "Updated Deliverable Name",
        "status": "completed"
    }, headers=headers)
    if res.status_code == 200 and res.json()["name"] == "Updated Deliverable Name":
        log("Update Deliverable")
        passed += 1
    else:
        log(f"Update Deliverable: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 5. DELETE ---
    res = requests.delete(f"{BASE_URL}/deliverables/{deliv_id}", headers=headers)
    if res.status_code == 204:
        log("Delete Deliverable")
        passed += 1
    else:
        log(f"Delete Deliverable: {res.status_code} - {res.text}", "FAIL")
        failed += 1

    # --- 6. Verify deletion ---
    res = requests.get(f"{BASE_URL}/deliverables/{deliv_id}", headers=headers)
    if res.status_code == 404:
        log("Verify Deliverable Deleted")
        passed += 1
    else:
        log(f"Verify Deliverable Deleted: Expected 404, got {res.status_code}", "FAIL")
        failed += 1

    # --- 7. Invalid project_id ---
    res = requests.post(f"{BASE_URL}/deliverables/", json={
        "project_id": 999999,
        "name": "Invalid Project Deliverable"
    }, headers=headers)
    if res.status_code == 404:
        log("Reject Deliverable with invalid project_id")
        passed += 1
    else:
        log(f"Reject Deliverable with invalid project_id: Expected 404, got {res.status_code}", "FAIL")
        failed += 1

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
