import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = """                          <td>
                            <div>{d.license_number}</div>
                            <div style={{ fontSize: '12px', color: isExpired ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                              Expiry: {renderDate(d.license_expiry)} {isExpired && '(EXPIRED)'}
                            </div>
                          </td>"""

replacement = """                          <td style={isExpired ? { background: 'rgba(220, 38, 38, 0.05)', borderLeft: '3px solid #DC2626' } : {}}>
                            <div>{d.license_number}</div>
                            <div style={{ fontSize: '12px', color: isExpired ? '#DC2626' : 'var(--text-secondary)', fontWeight: isExpired ? 'bold' : 'normal', display: 'flex', alignItems: 'center' }}>
                              Expiry: {renderDate(d.license_expiry)} 
                              {isExpired && <span style={{ padding: '2px 6px', background: '#DC2626', color: 'white', borderRadius: '4px', marginLeft: '6px', fontSize: '10px' }}>EXPIRED</span>}
                            </div>
                          </td>"""

content = content.replace(target, replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx to highlight expired licenses")
