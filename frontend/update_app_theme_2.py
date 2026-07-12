import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Sun/Moon imports (check if already added)
if "Sun, Moon," not in content:
    import_target = "import { "
    import_replacement = "import { Sun, Moon, "
    content = content.replace(import_target, import_replacement, 1)

# Add state for theme and effect to toggle class on body
if "isLightMode" not in content:
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

# Add toggle button in the sidebar (user profile section)
button_target = """        <div className="user-profile-section">
          <div className="user-details">
            <span className="user-name">{user?.name || 'System Admin'}</span>
            <span className="user-role">{user?.role || 'Admin'}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>"""

button_replacement = """        <div className="user-profile-section">
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
content = content.replace(button_target, button_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx with theme toggle properly")
