import React, { useState } from 'react';
import { 
  Truck, User, Activity, AlertTriangle, CheckCircle, Navigation, 
  MapPin, Shield, Zap, RefreshCw, Info, ChevronRight, Check
} from 'lucide-react';

interface AIDispatchModalProps {
  onClose: () => void;
  onDispatch: (tripData: any) => void;
}

export default function AIDispatchModal({ onClose, onDispatch }: AIDispatchModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [selectedRank, setSelectedRank] = useState(0);

  // Form Data
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [roadType, setRoadType] = useState('City');

  const fetchRecommendations = async () => {
    if (!origin || !destination || !cargoWeight) {
      alert("Please fill out origin, destination, and cargo weight.");
      return;
    }
    setLoading(true);
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/dispatch/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          origin,
          destination,
          cargo_weight: Number(cargoWeight),
          priority,
          road_type: roadType
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get recommendations');
      
      setRecommendations(data.recommendations);
      setStep(2);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    const rec = recommendations[selectedRank];
    if (!rec) return;
    
    // Pass to parent
    onDispatch({
      vehicleId: rec.vehicle.id,
      driverId: rec.driver.id,
      origin,
      dest: destination,
      weight: cargoWeight
    });
  };

  const currentRec = recommendations[selectedRank];

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ width: '900px', maxWidth: '95vw', padding: 0, overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={24} color="#F59E0B" fill="#F59E0B" /> 
            AI Dispatch Recommendation Engine
          </h2>
          <button className="btn-icon" onClick={onClose}>&times;</button>
        </div>

        {step === 1 && (
          <div style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Enter the trip parameters below. Our AI assistant will analyze real-time fleet data, maintenance records, and safety scores to recommend the optimal vehicle and driver combination.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Origin</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                  <input type="text" className="form-control" style={{ paddingLeft: '32px' }} value={origin} onChange={e => setOrigin(e.target.value)} placeholder="e.g., Warehouse A" />
                </div>
              </div>
              <div className="form-group">
                <label>Destination</label>
                <div style={{ position: 'relative' }}>
                  <Navigation size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-secondary)' }} />
                  <input type="text" className="form-control" style={{ paddingLeft: '32px' }} value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g., Fulfillment Center B" />
                </div>
              </div>
              <div className="form-group">
                <label>Cargo Weight (kg)</label>
                <input type="number" className="form-control" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} placeholder="e.g., 2500" />
              </div>
              <div className="form-group">
                <label>Delivery Priority</label>
                <select className="form-control" value={priority} onChange={e => setPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Road Terrain</label>
                <select className="form-control" value={roadType} onChange={e => setRoadType(e.target.value)}>
                  <option>City</option>
                  <option>Highway</option>
                  <option>Mountain</option>
                  <option>Rural</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={fetchRecommendations} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {loading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />} 
                {loading ? 'Analyzing Fleet...' : 'Recommend Best Driver'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && currentRec && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top Stats Bar */}
            <div style={{ display: 'flex', padding: '16px 24px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dispatch Confidence Score</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: currentRec.confidence >= 90 ? '#10B981' : currentRec.confidence >= 70 ? '#F59E0B' : '#EF4444' }}>
                  {currentRec.confidence}%
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Route Risk Level</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold', color: currentRec.route_risk === 'Low' ? '#10B981' : currentRec.route_risk === 'Medium' ? '#F59E0B' : '#EF4444' }}>
                  {currentRec.route_risk === 'Low' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                  {currentRec.route_risk} ({currentRec.risk_percent}%)
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Estimated Cost</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  ₹{currentRec.estimated_cost.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Split Content */}
            <div style={{ display: 'flex', padding: '24px', gap: '24px', flex: 1 }}>
              {/* Vehicle Card */}
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{currentRec.vehicle.make} {currentRec.vehicle.model}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{currentRec.vehicle.registration_number} • Cap: {currentRec.vehicle.capacity_kg}kg</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Vehicle Suitability Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${currentRec.vehicle_health}%`, background: '#10B981' }}></div>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{currentRec.vehicle_health}%</span>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Why this vehicle?</div>
                  {currentRec.vehicle_reasons.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', marginBottom: '6px', color: r.includes('⚠') ? '#F59E0B' : 'var(--text)' }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Card */}
              <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{currentRec.driver.name}</h3>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Code: {currentRec.driver.employee_code} • Lic: {currentRec.driver.license_number}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Driver Suitability Score</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${currentRec.driver_reliability}%`, background: '#10B981' }}></div>
                    </div>
                    <span style={{ fontWeight: 'bold' }}>{currentRec.driver_reliability}%</span>
                  </div>
                </div>

                <div style={{ background: 'var(--surface)', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Why this driver?</div>
                  {currentRec.driver_reasons.map((r: string, i: number) => (
                    <div key={i} style={{ fontSize: '13px', marginBottom: '6px', color: r.includes('⚠') ? '#F59E0B' : 'var(--text)' }}>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Alternative Ranks */}
            {recommendations.length > 1 && (
              <div style={{ padding: '0 24px 20px', display: 'flex', gap: '12px' }}>
                {recommendations.map((rec, idx) => (
                  <button 
                    key={idx}
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      background: selectedRank === idx ? 'rgba(37, 99, 235, 0.1)' : 'var(--surface-2)', 
                      border: `1px solid ${selectedRank === idx ? '#2563EB' : 'var(--border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onClick={() => setSelectedRank(idx)}
                  >
                    <div style={{ fontWeight: 'bold', color: selectedRank === idx ? '#2563EB' : 'var(--text)', marginBottom: '4px' }}>Option #{idx + 1}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{rec.vehicle.make} + {rec.driver.name}</div>
                    <div style={{ fontSize: '12px', marginTop: '4px', fontWeight: 'bold' }}>{rec.confidence}% Match</div>
                  </button>
                ))}
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back to Details
              </button>
              <button className="btn btn-primary" onClick={handleConfirm} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Check size={18} />
                Accept Recommendation & Dispatch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
