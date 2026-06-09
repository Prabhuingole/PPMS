import os
import glob

pattern = "e:/sam projects/SPMS/PMS-Frontend/app/**/*.tsx"
files = glob.glob(pattern, recursive=True)

broken_str = '`n<span className="sr-only">Open menu</span>`n<MoreHorizontal className="h-4 w-4" />`n'
fixed_str = '\n<span className="sr-only">Open menu</span>\n<MoreHorizontal className="h-4 w-4" />\n'

count = 0
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    if broken_str in content:
        new_content = content.replace(broken_str, fixed_str)
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        count += 1
        print(f"Fixed: {f}")

print(f"Total files fixed: {count}")
