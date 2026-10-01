import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

n = content.count('use_container_width')
print(f'use_container_width occurrences: {n}')

content = content.replace('use_container_width=True', "width='stretch'")
content = content.replace('use_container_width=False', "width='content'")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed. Remaining:', content.count('use_container_width'))
