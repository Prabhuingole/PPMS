import requests

BASE_URL = "http://localhost:8000"

def log(msg, status="INFO"):
    print(f"[{status}] {msg}")

def run_tests():
    # Test 1: Invalid Login
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "nonexistent@example.com", "password": "wrong"})
    if res.status_code == 401:
        log("Invalid login returns 401: PASS")
    else:
        log(f"Invalid login returned {res.status_code}: FAIL", "ERROR")

    # Test 2: Valid Login
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": "admin@sambhav.com", "password": "password"})
    if res.status_code == 200:
        log("Valid login returns 200: PASS")
        token = res.json().get("access_token")
    else:
        log(f"Valid login returned {res.status_code}: FAIL", "ERROR")
        token = None

    # Test 3: Forgot password flow
    res = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": "admin@sambhav.com"})
    if res.status_code == 200:
        log("Forgot password (valid email) returns 200: PASS")
    else:
        log(f"Forgot password (valid email) returned {res.status_code}: FAIL", "ERROR")
        
    res = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": "nobody@example.com"})
    if res.status_code == 200:
        log("Forgot password (invalid email) returns 200 (timing attack prevention): PASS")
    else:
        log(f"Forgot password (invalid email) returned {res.status_code}: FAIL", "ERROR")

if __name__ == "__main__":
    run_tests()
