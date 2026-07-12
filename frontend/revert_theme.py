import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert button
button_target = """        <div className="user-profile-section">
          <div className="user-details">
            <span className="user-name">{user?.name || 'System Admin'}</span>
            <span className="user-role">{user?.role || 'Admin'}</span>
          </div>
          <button className="btn-icon" onClick={() => setIsLightMode(!isLightMode)} title="Toggle Theme" style={{ marginRight: '8px' }}>
            {isLightMode ? <Moon size={16} color="var(--text-secondary)" /> : <Sun size={16} color="var(--accent-warning)" />}
          </button>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>"""

button_replacement = """        <div className="user-profile-section">
          <div className="user-details">
            <span className="user-name">{user?.name || 'System Admin'}</span>
            <span className="user-role">{user?.role || 'Admin'}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>"""
content = content.replace(button_target, button_replacement)

# Revert imports
content = content.replace("import { Sun, Moon, ", "import { ")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Reverted App.tsx")
