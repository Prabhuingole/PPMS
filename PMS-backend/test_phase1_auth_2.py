import requests

BASE_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def run_tests():
    # Login as an employee (e.g. prabhuingole.sam@gmail.com)
    # Wait, we need the password. Let's assume it's 'password'
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "prabhuingole.sam@gmail.com", "password": "password"})
    if res.status_code == 200:
        emp_token = res.json().get("access_token")
    else:
        emp_token = None
        log(f"Failed to login as employee: {res.status_code}", "ERROR")

    # Test Reset Password with invalid token
    res = requests.post(f"{BASE_URL}/auth/reset-password", json={"token": "invalid_token", "new_password": "newpassword123", "confirm_password": "newpassword123"})
    if res.status_code == 400:
        log("Reset password with invalid token returns 400: PASS")
    else:
        log(f"Reset password with invalid token returned {res.status_code}: FAIL", "ERROR")

    # Test Permissions: access superadmin route as employee
    if emp_token:
        headers = {"Authorization": f"Bearer {emp_token}"}
        res = requests.get(f"{BASE_URL}/projects", headers=headers)
        # /projects might be accessible. Let's try /employees/ which is superadmin/admin only
        res_emp = requests.get(f"{BASE_URL}/employees/", headers=headers)
        if res_emp.status_code == 403:
            log("Employee accessing /employees/ returns 403 Forbidden: PASS")
        else:
            log(f"Employee accessing /employees/ returned {res_emp.status_code}: FAIL", "ERROR")

if __name__ == "__main__":
    run_tests()
