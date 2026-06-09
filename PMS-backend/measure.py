import urllib.request
import json
import time

url_projects = "http://localhost:8000/projects/?limit=100"
url_timesheets = "http://localhost:8000/timesheets/all"

data = json.dumps({"email": "superadmin@example.com", "password": "password"}).encode("utf-8")
req = urllib.request.Request("http://localhost:8000/auth/login", data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        token = res.get("access_token")
except Exception as e:
    print("Login failed:", e)
    if hasattr(e, 'read'):
        print(e.read().decode())
    exit(1)

req_proj = urllib.request.Request(url_projects, headers={"Authorization": f"Bearer {token}"})
t0 = time.time()
with urllib.request.urlopen(req_proj) as response:
    content = response.read()
    t1 = time.time()
    print(f"Projects (Baseline): {t1-t0:.3f}s, size: {len(content)} bytes, status: {response.status}")

req_ts = urllib.request.Request(url_timesheets, headers={"Authorization": f"Bearer {token}"})
t0 = time.time()
with urllib.request.urlopen(req_ts) as response:
    content = response.read()
    t1 = time.time()
    print(f"Timesheets All (Baseline): {t1-t0:.3f}s, size: {len(content)} bytes, status: {response.status}")
