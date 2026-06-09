import requests

BASE_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def get_superadmin_token():
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@sambhav.com", "password": "password"})
    return res.json().get("access_token")

def run_tests():
    token = get_superadmin_token()
    if not token:
        log("Could not get superadmin token", "ERROR")
        return
    
    headers = {"Authorization": f"Bearer {token}"}

    # ==========================
    # 1. Employee CRUD
    # ==========================
    emp_payload = {
        "employee_id": "TEST_EMP_01",
        "full_name": "Test Employee",
        "email": "test_emp01@sambhav.com",
        "mobile_number": "9999999991",
        "role": "employee",
        "designation": "Tester",
        "joining_date": "2025-01-01"
    }

    # Create
    res = requests.post(f"{BASE_URL}/employees/", json=emp_payload, headers=headers)
    if res.status_code == 201:
        emp_id = res.json()["id"]
        log(f"Employee Create: PASS (ID: {emp_id})")
    else:
        log(f"Employee Create: FAIL ({res.status_code} - {res.text})", "ERROR")
        return

    # Read
    res = requests.get(f"{BASE_URL}/employees/{emp_id}", headers=headers)
    if res.status_code == 200 and res.json()["email"] == emp_payload["email"]:
        log("Employee Read: PASS")
    else:
        log(f"Employee Read: FAIL ({res.status_code})", "ERROR")

    # Update
    res = requests.put(f"{BASE_URL}/employees/{emp_id}", json={"designation": "Senior Tester"}, headers=headers)
    if res.status_code == 200 and res.json()["designation"] == "Senior Tester":
        log("Employee Update: PASS")
    else:
        log(f"Employee Update: FAIL ({res.status_code})", "ERROR")

    # Delete
    res = requests.delete(f"{BASE_URL}/employees/{emp_id}", headers=headers)
    if res.status_code == 204:
        log("Employee Delete: PASS")
    else:
        log(f"Employee Delete: FAIL ({res.status_code})", "ERROR")


    # ==========================
    # 2. Admin CRUD
    # ==========================
    admin_payload = {
        "employee_id": "TEST_ADM_01",
        "full_name": "Test Admin",
        "email": "test_admin01@sambhav.com",
        "mobile_number": "9999999992",
        "role": "admin",
        "designation": "Admin",
        "joining_date": "2025-01-01"
    }

    # Create
    res = requests.post(f"{BASE_URL}/admins/", json=admin_payload, headers=headers)
    if res.status_code == 201:
        adm_id = res.json()["id"]
        log(f"Admin Create: PASS (ID: {adm_id})")
    else:
        log(f"Admin Create: FAIL ({res.status_code} - {res.text})", "ERROR")
        adm_id = None

    if adm_id:
        # Read
        res = requests.get(f"{BASE_URL}/admins/{adm_id}", headers=headers)
        if res.status_code == 200 and res.json()["email"] == admin_payload["email"]:
            log("Admin Read: PASS")
        else:
            log(f"Admin Read: FAIL ({res.status_code})", "ERROR")

        # Update
        res = requests.put(f"{BASE_URL}/admins/{adm_id}", json={"designation": "Senior Admin"}, headers=headers)
        if res.status_code == 200 and res.json()["designation"] == "Senior Admin":
            log("Admin Update: PASS")
        else:
            log(f"Admin Update: FAIL ({res.status_code})", "ERROR")

        # Delete
        res = requests.delete(f"{BASE_URL}/admins/{adm_id}", headers=headers)
        if res.status_code == 204:
            log("Admin Delete: PASS")
        else:
            log(f"Admin Delete: FAIL ({res.status_code})", "ERROR")


    # ==========================
    # 3. Reporting Manager CRUD
    # ==========================
    rm_payload = {
        "employee_id": "TEST_RM_01",
        "full_name": "Test Reporting Manager",
        "email": "test_rm01@sambhav.com",
        "mobile_number": "9999999993",
        "role": "reporting_manager",
        "designation": "Manager",
        "joining_date": "2025-01-01"
    }

    # Create
    res = requests.post(f"{BASE_URL}/reporting-managers/", json=rm_payload, headers=headers)
    if res.status_code == 201:
        rm_id = res.json()["id"]
        log(f"RM Create: PASS (ID: {rm_id})")
    else:
        log(f"RM Create: FAIL ({res.status_code} - {res.text})", "ERROR")
        rm_id = None

    if rm_id:
        # Read
        res = requests.get(f"{BASE_URL}/reporting-managers/{rm_id}", headers=headers)
        if res.status_code == 200 and res.json()["email"] == rm_payload["email"]:
            log("RM Read: PASS")
        else:
            log(f"RM Read: FAIL ({res.status_code})", "ERROR")

        # Update
        res = requests.put(f"{BASE_URL}/reporting-managers/{rm_id}", json={"designation": "Senior RM"}, headers=headers)
        if res.status_code == 200 and res.json()["designation"] == "Senior RM":
            log("RM Update: PASS")
        else:
            log(f"RM Update: FAIL ({res.status_code})", "ERROR")

        # Delete
        res = requests.delete(f"{BASE_URL}/reporting-managers/{rm_id}", headers=headers)
        if res.status_code == 204:
            log("RM Delete: PASS")
        else:
            log(f"RM Delete: FAIL ({res.status_code})", "ERROR")

if __name__ == "__main__":
    run_tests()
