import re

path = r'e:\sam projects\SPMS\PMS-Frontend\app\employee\timesheets\add\page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('`n', '\n')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed!")
