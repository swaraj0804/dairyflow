import os
import glob
import re

views_dir = 'src/views'
view_files = glob.glob(os.path.join(views_dir, '*.tsx'))

def update_top_bar(content):
    # Change the container of the Top Bar
    content = re.sub(
        r'<div className="bg-white/60 backdrop-blur-md px-6 py-5 shadow-sm border-b border-white sticky top-0 z-30">',
        r'<div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">',
        content
    )
    
    # Text colors inside the Top bar:
    # We can be safe by replacing text-brand-900 and text-brand-900/50 etc. but ONLY in the top bar block.
    # A safer way: regex to find the Top Bar block, replace inside it, then put it back.
    
    # We will do simple string replacements if we know what to look for, or just use a custom regex block.
    
    return content

for file in view_files:
    if file.endswith('HomeView.tsx'):
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    if '<div className="bg-white/60 backdrop-blur-md px-6 py-5 shadow-sm border-b border-white sticky top-0 z-30">' in content:
        # We know there's a top bar. Let's do a more robust block replacement.
        parts = content.split('<div className="bg-white/60 backdrop-blur-md px-6 py-5 shadow-sm border-b border-white sticky top-0 z-30">')
        
        new_content = parts[0]
        for part in parts[1:]:
            # The top bar ends at the next `</div>` that matches the block. But to be simpler, let's just replace the text colors until the next major section (like `{/* Main Content */}` or `overflow-y-auto`).
            # Actually, `part` starts right after the opening div. We can split `part` by `      {/*` (which often indicates the next section) or just replace colors for the first 15 lines.
            
            lines = part.split('\n')
            for i in range(min(40, len(lines))):
                if 'text-brand-900/50' in lines[i]:
                    lines[i] = lines[i].replace('text-brand-900/50', 'text-brand-100')
                if 'text-brand-900/70' in lines[i]:
                    lines[i] = lines[i].replace('text-brand-900/70', 'text-brand-100')
                if 'text-brand-900' in lines[i]:
                    lines[i] = lines[i].replace('text-brand-900', 'text-white')
                if 'border-white' in lines[i]:
                    lines[i] = lines[i].replace('border-white', 'border-white/10')
                if 'bg-white/80' in lines[i]:
                    lines[i] = lines[i].replace('bg-white/80', 'bg-white/10')
                if 'hover:bg-white/50' in lines[i]:
                    lines[i] = lines[i].replace('hover:bg-white/50', 'hover:bg-white/10')
                if 'hover:bg-white/20' in lines[i]:
                    lines[i] = lines[i].replace('hover:bg-white/20', 'hover:bg-white/10')
                if 'hover:bg-brand-900/10' in lines[i]:
                    lines[i] = lines[i].replace('hover:bg-brand-900/10', 'hover:bg-white/10')

            new_part = '\n'.join(lines)
            new_content += '<div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">\n' + new_part
        
        with open(file, 'w') as f:
            f.write(new_content)
        print(f"Updated {file}")

