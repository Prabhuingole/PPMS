import sys
import urllib.request
import urllib.error

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkb2hlcmlzQGdtaWwuY29tIiwiZXhwIjoxNzc5Nzg4OTczfQ.jRpuRetKXQAkQkPMCaxiLAa3Z4_NCKMrLwkVVgXg0LI"
req = urllib.request.Request(
    'http://localhost:8000/notifications/me',
    headers={'Authorization': f'Bearer {token}'}
)
try:
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode())
except Exception as e:
    print(e)
