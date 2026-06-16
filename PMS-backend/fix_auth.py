import re

path = r"e:\sam projects\SPMS\PMS-backend\app\routes\auth.py"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace duplicated cookie arguments
content = re.sub(
    r'max_age=604800,\s*httponly=True,\s*secure=True,\s*samesite="lax"',
    r'max_age=604800',
    content
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("auth.py fixed successfully!")
