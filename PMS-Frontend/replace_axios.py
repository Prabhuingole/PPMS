import os
import re
import glob

frontend_dir = r"e:\sam projects\SPMS\PMS-Frontend"
target_files = glob.glob(os.path.join(frontend_dir, "app", "**", "*.tsx"), recursive=True)

for filepath in target_files:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    if "import axios from" not in content and "axios." not in content:
        continue

    # 1. Replace import
    content = re.sub(r"import axios from 'axios';", "import api from '@/services/api';\nimport { handleApiError } from '@/utils/handleApiError';\nimport { ErrorState } from '@/components/ui/error-state';", content)

    # 2. Replace NEXT_PUBLIC_API_URL interpolations
    # e.g. `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/some/path` -> `/some/path`
    content = re.sub(r"\`\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| 'http://localhost:8000'\}", "`", content)
    
    # Also if it's stored in a variable `const api = process.env...` and used as `${api}/path`
    content = re.sub(r"\`\$\{api\}", "`", content)

    # 3. Remove headers parameter
    # axios.get(`/path`, { headers }) -> api.get(`/path`)
    content = re.sub(r",\s*\{\s*headers(?:\s*:\s*headers)?\s*\}", "", content)

    # 4. Remove { headers: { Authorization: ... } } inline
    content = re.sub(r",\s*\{\s*headers\s*:\s*\{\s*Authorization\s*:\s*`Bearer \$\{token\}`\s*\}\s*\}", "", content)

    # 5. Change axios to api
    content = re.sub(r"axios\.(get|post|put|delete|patch)\(", r"api.\1(", content)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

print("Replacement complete.")
