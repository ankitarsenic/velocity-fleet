import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\index.css"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """
.light-theme {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-glass: rgba(255, 255, 255, 0.85);
  --border-glass: rgba(0, 0, 0, 0.08);
  --border-glass-hover: rgba(0, 0, 0, 0.16);
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

"""

content = content.replace(target, "")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted index.css")
