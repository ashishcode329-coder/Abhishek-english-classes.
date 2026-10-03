import re

with open('src/components/admin/AdminDashboard.tsx') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    # remove strings and comments roughly
    s = re.sub(r'//.*', '', line)
    s = re.sub(r'"[^"]*"', '""', s)
    s = re.sub(r"'[^']*'", "''", s)
    s = re.sub(r'`[^`]*`', '``', s)
    for j, ch in enumerate(s):
        if ch == '{':
            stack.append((i + 1, s.strip()))
        elif ch == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra closing brace at line {i+1}")

print(f"Total unclosed: {len(stack)}")
for item in stack:
    print(f"Line {item[0]}: {item[1]}")
