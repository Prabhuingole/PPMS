import requests

url = "http://localhost:8000/auth/login"
response = requests.post(url, json={"email": "employee1@example.com", "password": "password123"})
if response.status_code == 200:
    token = response.json()["access_token"]
    print("Logged in!")
    
    payload = [{
        "project_id": 1,
        "date": "2026-05-18T00:00:00.000Z",
        "hours": 5.5,
        "description": "Test",
        "task_status": "Ongoing",
        "category": None,
        "subcategory": None
    }]
    res = requests.post("http://localhost:8000/timesheets/", json=payload, headers={"Authorization": f"Bearer {token}"})
    print(res.status_code, res.text)
else:
    print("Login failed", response.status_code, response.text)
