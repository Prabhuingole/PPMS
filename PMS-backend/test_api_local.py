import requests
import json

def test():
    # Login
    login_data = {
        "email": "admin@sambhav.com",
        "password": "admin@123"
    }
    
    # Use 127.0.0.1 just in case localhost resolution differs
    login_url = "http://127.0.0.1:8000/auth/login"
    r = requests.post(login_url, json=login_data)
    
    if r.status_code != 200:
        print("Login failed!", r.status_code, r.text)
        return
        
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        "/employees/?limit=1",
        "/projects/?limit=5",
        "/timesheets/dashboard-stats",
        "/companies/"
    ]
    
    for ep in endpoints:
        print(f"Testing {ep} ...")
        res = requests.get(f"http://127.0.0.1:8000{ep}", headers=headers)
        if res.status_code != 200:
            print(f"FAILED: {ep} - Status {res.status_code}")
            try:
                print(res.json())
            except:
                print(res.text)
        else:
            print(f"SUCCESS: {ep}")

if __name__ == "__main__":
    test()
