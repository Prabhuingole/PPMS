import subprocess
import os

print("Current dir:", os.getcwd())
res = subprocess.run(["git", "restore", "app/routes/timesheets.py"], capture_output=True, text=True)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)
print("Done")
