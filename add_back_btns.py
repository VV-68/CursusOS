import os
import re

MAPPINGS = {
    'advisor/ClassInternals.jsx': 'oversight',
    'advisor/Timetable.jsx': 'oversight'
}

BASE_DIR = '/home/user/CODES/SMS/sms_frontend/src/pages'

BACK_BTN_HTML = "<button style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }} onClick={() => navigate('/dashboard?tab={tab}')}>← Back</button>"

for rel_path, tab in MAPPINGS.items():
    file_path = os.path.join(BASE_DIR, rel_path)
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
        
    # Check if back button already exists
    if 'navigate(\'/dashboard?tab=' in content or "navigate('/dashboard?tab=" in content or '← Back' in content:
        if 'navigate(-1)' in content or "navigate('/" in content:
             print(f"File {rel_path} has an old back button, attempting replacement.")
             # replace old back buttons
             content = re.sub(r'navigate\([\'-][^\)]+\)', f"navigate('/dashboard?tab={tab}')", content)
             with open(file_path, 'w') as f:
                 f.write(content)
        else:
             print(f"File {rel_path} already has a back button. Skipping.")
        continue
        
    # Add useNavigate import if needed
    if 'useNavigate' not in content:
        content = re.sub(r'(import .* from \'react-router-dom\';?)', r"\1\nimport { useNavigate } from 'react-router-dom';", content)
        if 'useNavigate' not in content:
            content = "import { useNavigate } from 'react-router-dom';\n" + content

    # Add const navigate = useNavigate(); if needed
    if 'const navigate = useNavigate();' not in content:
        # Find the component function
        func_match = re.search(r'(function \w+\([^)]*\)\s*\{|const \w+\s*=\s*\([^)]*\)\s*=>\s*\{)', content)
        if func_match:
            insert_pos = func_match.end()
            content = content[:insert_pos] + "\n  const navigate = useNavigate();" + content[insert_pos:]
        else:
            print(f"Could not find function signature in {rel_path}")
            continue

    # Inject the button right after the first return ( <div ...>
    # Try to find `return (\n    <div`
    btn_code = BACK_BTN_HTML.replace('{tab}', tab)
    return_match = re.search(r'return\s*\(\s*<div[^>]*>', content)
    if return_match:
        insert_pos = return_match.end()
        content = content[:insert_pos] + f"\n      {btn_code}" + content[insert_pos:]
    else:
        return_match2 = re.search(r'return\s*\(\s*<>', content)
        if return_match2:
             insert_pos = return_match2.end()
             content = content[:insert_pos] + f"\n      {btn_code}" + content[insert_pos:]
        else:
             print(f"Could not find return statement to inject button in {rel_path}")
             continue

    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Successfully added back button to {rel_path}")

