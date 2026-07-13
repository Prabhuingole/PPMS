import requests
import time
from app.core.config import settings

def sync_user_to_mail(user_payload: dict):
    """
    Background task to sync newly created SPMS users to Mail Automation.
    user_payload must contain: email, name, role, status
    """
    if not settings.MAIL_AUTOMATION_URL:
        print("⚠️ MAIL_AUTOMATION_URL not configured, skipping sync.")
        return

    sync_url = f"{settings.MAIL_AUTOMATION_URL.rstrip('/')}/api/internal/users/sync"
    
    headers = {
        "Content-Type": "application/json"
    }
    if settings.MAIL_INTERNAL_SECRET:
        headers["Authorization"] = f"Bearer {settings.MAIL_INTERNAL_SECRET}"

    print(f"\n--- MAIL SYNC INITIATED ---")
    print(f"Destination URL: {sync_url}")
    print(f"Payload: {user_payload}")
    
    start_time = time.time()
    try:
        response = requests.post(sync_url, json=user_payload, headers=headers, timeout=5)
        elapsed_time = time.time() - start_time
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        print(f"Elapsed time: {elapsed_time:.3f}s")
        
        response.raise_for_status()
        print(f"✅ Successfully synced user {user_payload.get('email')} to Mail Automation")
        
    except requests.exceptions.RequestException as e:
        elapsed_time = time.time() - start_time
        print(f"Response status: N/A (Failed to connect)")
        print(f"Response body: N/A")
        print(f"Elapsed time: {elapsed_time:.3f}s")
        print(f"❌ Failed to sync user {user_payload.get('email')} to Mail Automation: {e}")
    print("---------------------------\n")
