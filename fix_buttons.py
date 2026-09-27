import os
import glob

views_dir = 'src/views'
view_files = glob.glob(os.path.join(views_dir, '*.tsx'))

for file in view_files:
    if file.endswith('HomeView.tsx'):
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    # Let's replace button rounded-xl or rounded-2xl with rounded-[24px] if it's a major button (bg-brand-600, bg-cream-50, etc)
    content = content.replace('rounded-xl', 'rounded-[20px]')
    content = content.replace('rounded-2xl', 'rounded-[20px]')
    content = content.replace('rounded-3xl', 'rounded-[20px]')
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Updated {file}")

