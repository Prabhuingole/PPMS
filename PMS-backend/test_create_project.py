import requests

url = "http://localhost:8000/projects/"

payload = {
    "name": "Test Project 3",
    "status": "planning",
    "owner_company_id": 1,
    "participating_company_ids": [1],
    "code": ""
}

try:
    with open('C:/Users/HP/.gemini/antigravity-ide/brain/4bf757bc-dea2-49e3-b1bc-0a74102ff15d/temp_token.txt', 'r') as f:
        token = f.read().strip()
    resp = requests.post(url, json=payload, headers={'Authorization': f'Bearer {token}'})
    print(f"Status Code: {resp.status_code}")
    print(f"Response: {resp.text}")
except Exception as e:
    print(f"Error: {e}")
