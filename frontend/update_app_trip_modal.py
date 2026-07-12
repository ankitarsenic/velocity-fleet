import os

filepath = r"c:\Users\Omesh\OneDrive\Desktop\Velocity fleet\frontend\src\App.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Import
import_target = "import MonthlyReportView from './components/MonthlyReportView';"
import_replacement = "import MonthlyReportView from './components/MonthlyReportView';\nimport AIDispatchModal from './components/AIDispatchModal';"
content = content.replace(import_target, import_replacement)

# 2. Add handleAIDispatch function
handle_trip_target = "const handleTripSubmit = async (e: React.FormEvent) => {"
handle_trip_replacement = """const handleAIDispatch = async (tripData: any) => {
    try {
      const response = await fetchWithAuth('/trips', {
        method: 'POST',
        body: JSON.stringify({
          vehicle_id: parseInt(tripData.vehicleId),
          driver_id: parseInt(tripData.driverId),
          origin: tripData.origin,
          destination: tripData.dest,
          cargo_weight_kg: parseInt(tripData.weight)
        })
      });
      if (response.status === 201) {
        setActiveModal(null);
        loadTrips();
        loadVehicles();
        loadDrivers();
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Error dispatching trip');
      }
    } catch (err: any) {
      alert('Failed to connect to server');
    }
  };

  const handleTripSubmit = async (e: React.FormEvent) => {"""
content = content.replace(handle_trip_target, handle_trip_replacement)

# 3. Replace Modal
modal_target = """      {activeModal === 'trip' && (
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
      
modal_replacement = """      {activeModal === 'trip' && (
        <AIDispatchModal onClose={() => setActiveModal(null)} onDispatch={handleAIDispatch} />
      )}"""
      
content = content.replace(modal_target, modal_replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.tsx successfully.")
