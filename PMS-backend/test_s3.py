import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.s3 import storage
import io

try:
    print("Testing S3 connection...")
    storage.upload_file(io.BytesIO(b"test data"), "test_file.txt", "text/plain")
    print("Upload successful!")
except Exception as e:
    print(f"Error: {e}")
