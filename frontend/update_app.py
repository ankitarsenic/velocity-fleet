import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update active tab
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'expenses' | 'fuel'>('vehicles');",
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'expenses' | 'fuel' | 'reports'>('vehicles');"
)

# 2. Add Nav Item
nav_item_target = """          {hasPermission(['manage_trips', 'manage_expenses', 'view_financials']) && (
            <div 
              className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <DollarSign size={18} /> Expenses
            </div>
          )}"""

nav_item_replacement = """          {hasPermission(['manage_trips', 'manage_expenses', 'view_financials']) && (
            <div 
              className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <DollarSign size={18} /> Expenses
            </div>
          )}
          
          {hasPermission(['view_reports', 'manage_trips', 'view_financials']) && (
            <div 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <FileText size={18} /> Reports
            </div>
          )}"""

content = content.replace(nav_item_target, nav_item_replacement)

# 3. Add Topbar conditional
topbar_target = """      {/* Main Panel Content */}
      <main className="main-content">
        <header className="topbar">
          <h1 className="page-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Operations Active
          </div>
        </header>"""

topbar_replacement = """      {/* Main Panel Content */}
      <main className="main-content">
        {activeTab !== 'reports' && (
          <header className="topbar">
            <h1 className="page-title">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry
            </h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Operations Active
            </div>
          </header>
        )}"""

content = content.replace(topbar_target, topbar_replacement)

# 4. Add Driver Warning Badge
badge_target = "<td>{d.name}</td>"
badge_replacement = """<td>
                            {d.name}
                            {d.warnings_count > 0 && (
                              <span style={{ 
                                marginLeft: '8px', 
                                padding: '2px 6px', 
                                borderRadius: '12px', 
                                backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                                color: '#DC2626', 
                                fontSize: '10px', 
                                fontWeight: 'bold' 
                              }}>
                                ⚠️ {d.warnings_count} Speed {d.warnings_count === 1 ? 'Warning' : 'Warnings'}
                              </span>
                            )}
                          </td>"""
content = content.replace(badge_target, badge_replacement)

# 5. Add Reports Component and Import
import_target = "import LiveTripTracker from './LiveTripTracker';"
import_replacement = "import LiveTripTracker from './LiveTripTracker';\nimport MonthlyReportView from './components/MonthlyReportView';"
content = content.replace(import_target, import_replacement)

view_target = """            </div>
          )}

        </div>
      </main>"""
view_replacement = """            </div>
          )}

          {/* REPORTS TAB VIEW */}
          {activeTab === 'reports' && (
            <MonthlyReportView />
          )}

        </div>
      </main>"""
content = content.replace(view_target, view_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx successfully.")
