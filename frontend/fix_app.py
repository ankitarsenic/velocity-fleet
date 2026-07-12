import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update default active tab to 'dashboard'
tab_target = "const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'expenses' | 'fuel' | 'reports'>('vehicles');"
tab_replacement = "const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'expenses' | 'fuel' | 'reports'>('dashboard');"
content = content.replace(tab_target, tab_replacement)

# 2. Update Dispatch Buttons
btn_target = """                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setTripForm({ vehicleId: '', driverId: '', origin: '', dest: '', weight: '' });
                    setFormError('');
                    setActiveModal('trip');
                  }}
                >
                  <Plus size={16} /> Dispatch New Trip
                </button>"""

btn_replacement = """                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setTripForm({ vehicleId: '', driverId: '', origin: '', dest: '', weight: '' });
                      setFormError('');
                      setActiveModal('trip_manual');
                    }}
                  >
                    Manual Dispatch
                  </button>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveModal('trip_ai');
                    }}
                  >
                    <Plus size={16} /> AI Dispatch Assistant
                  </button>
                </div>"""
content = content.replace(btn_target, btn_replacement)

# 3. Add back the manual modal and update the AI modal condition
modal_target = """      {activeModal === 'trip' && (
        <AIDispatchModal onClose={() => setActiveModal(null)} onDispatch={handleAIDispatch} />
      )}"""

modal_replacement = """      {activeModal === 'trip_ai' && (
        <AIDispatchModal onClose={() => setActiveModal(null)} onDispatch={handleAIDispatch} />
      )}

      {activeModal === 'trip_manual' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Dispatch New Active Trip</h3>
            <form onSubmit={handleTripSubmit}>
              <div className="form-group">
                <label className="form-label">Assign Vehicle</label>
                <select 
                  className="form-select" required
                  value={tripForm.vehicleId} onChange={(e) => setTripForm({ ...tripForm, vehicleId: e.target.value })}
                >
                  <option value="">-- Choose Available Vehicle --</option>
                  {vehicles.filter(v => v.status === 'AVAILABLE').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.make} {v.model} (Max: {v.capacity_kg}kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Driver</label>
                <select 
                  className="form-select" required
                  value={tripForm.driverId} onChange={(e) => setTripForm({ ...tripForm, driverId: e.target.value })}
                >
                  <option value="">-- Choose Available Driver --</option>
                  {drivers.filter(d => d.status === 'AVAILABLE').map(d => {
                    const isExpired = new Date(d.license_expiry) < new Date();
                    return (
                      <option key={d.id} value={d.id} disabled={isExpired}>
                        {d.name} ({d.employee_code}) {isExpired ? ' - LICENSE EXPIRED' : ` - Exp: ${d.license_expiry}`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Origin Location</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Mumbai Port"
                  value={tripForm.origin} onChange={(e) => setTripForm({ ...tripForm, origin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination Location</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Delhi Depot"
                  value={tripForm.dest} onChange={(e) => setTripForm({ ...tripForm, dest: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cargo Loading Weight (kg)</label>
                <input 
                  type="number" className="form-input" required placeholder="e.g. 5000"
                  value={tripForm.weight} onChange={(e) => setTripForm({ ...tripForm, weight: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Dispatch Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}"""
      
content = content.replace(modal_target, modal_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated App.tsx successfully.")
