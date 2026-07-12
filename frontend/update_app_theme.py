import os
import re

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Sun/Moon imports
import_target = "import { "
import_replacement = "import { Sun, Moon, "
content = content.replace(import_target, import_replacement, 1)

# 2. Add state for theme and effect to toggle class on body
state_target = "  const [user, setUser] = useState<any>(null);"
state_replacement = """  const [user, setUser] = useState<any>(null);
  
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);"""
content = content.replace(state_target, state_replacement)

# 3. Add toggle button in the sidebar (user profile section)
button_target = """        <div className="user-profile-section">
          <div className="avatar">
            {user?.role === 'Super Admin' ? 'SA' : user?.role === 'Fleet Manager' ? 'FM' : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-role">{user?.role || 'Guest'}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} color="var(--accent-danger)" />
          </button>
        </div>"""

button_replacement = """        <div className="user-profile-section">
          <div className="avatar">
            {user?.role === 'Super Admin' ? 'SA' : user?.role === 'Fleet Manager' ? 'FM' : 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.username || 'User'}</div>
            <div className="user-role">{user?.role || 'Guest'}</div>
          </div>
          <button className="btn-icon" onClick={() => setIsLightMode(!isLightMode)} title="Toggle Theme" style={{ marginRight: '4px' }}>
            {isLightMode ? <Moon size={18} color="var(--text-secondary)" /> : <Sun size={18} color="var(--accent-warning)" />}
          </button>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} color="var(--accent-danger)" />
          </button>
        </div>"""
content = content.replace(button_target, button_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx with theme toggle")
