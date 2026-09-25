import re

files = [
    'js/qr-generator.js',
    'js/data/consultation-catalog.js',
    'js/models/patient-record.js',
    'js/services/medical-service.js',
    'js/validaciones-globales.js',
    'js/state.js',
    'js/auth.js',
    'js/patient.js',
    'js/doctor.js',
    'js/accountant.js',
    'js/app.js'
]

combined = ['// Montepiedra Salud - Bundle Unificado (Compatible con file:/// y http://)\n']

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove single and multi-line import statements
    content = re.sub(r'import\s+[\s\S]*?from\s+[\'"][^\'"]*?[\'"];?\n?', '', content)
    content = re.sub(r'import\s+[\'"][^\'"]*?[\'"];?\n?', '', content)

    # Remove export keywords
    content = re.sub(r'export\s+default\s+', '', content)
    content = re.sub(r'export\s+async\s+function\s+', 'async function ', content)
    content = re.sub(r'export\s+(const|let|var|function|class)\s+', r'\1 ', content)
    # Remove standalone export { ... };
    content = re.sub(r'export\s*\{[\s\S]*?\};?\n?', '', content)

    combined.append(f'\n// ==================== {filepath} ====================\n')
    combined.append(content)

bundle_path = 'js/app.bundle.js'
with open(bundle_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(combined))

print(f"Bundle successfully created at {bundle_path} with {len(''.join(combined))} chars.")
