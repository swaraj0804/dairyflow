import os

files = ['src/views/ReportsView.tsx', 'src/views/MonthlyFinanceReportView.tsx']

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    parts = content.split('<div className="bg-white px-6 py-5 shadow-sm sticky top-0 z-30 border-b border-white">')
    if len(parts) > 1:
        new_content = parts[0]
        part = parts[1]
        
        lines = part.split('\n')
        for i in range(min(40, len(lines))):
            if 'text-brand-900/50' in lines[i]:
                lines[i] = lines[i].replace('text-brand-900/50', 'text-brand-100')
            if 'text-brand-900' in lines[i]:
                lines[i] = lines[i].replace('text-brand-900', 'text-white')
            if 'hover:bg-cream-50' in lines[i]:
                lines[i] = lines[i].replace('hover:bg-cream-50', 'hover:bg-white/10')
            if 'hover:bg-brand-900/10' in lines[i]:
                lines[i] = lines[i].replace('hover:bg-brand-900/10', 'hover:bg-white/10')

        new_part = '\n'.join(lines)
        new_content += '<div className="bg-gradient-to-br from-brand-900 to-brand-700 rounded-b-[40px] px-6 pt-12 pb-6 shadow-lg text-white sticky top-0 z-30 shrink-0">\n' + new_part
        
        with open(file, 'w') as f:
            f.write(new_content)
        print(f"Updated {file}")
