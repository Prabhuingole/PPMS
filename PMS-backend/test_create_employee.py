import requests

response = requests.post(
    "http://127.0.0.1:8000/auth/login",
    json={"email": "admin@sambhav.com", "password": "admin@sam"}
)
print("Login:", response.status_code)
if response.status_code == 200:
    token = response.json().get("access_token")
    res = requests.post(
        "http://127.0.0.1:8000/employees/",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "employee_id": "TEST002",
            "full_name": "Test Employee",
            "email": "hr.sambhavai@gmail.com",
            "mobile_number": "1234567891",
            "role": "employee",
            "designation": "Developer",
            "joining_date": "2026-06-08T00:00:00Z"
        }
    )
    print("Create Employee:", res.status_code)
    print(res.json())
