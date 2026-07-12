import React from 'react';
import { Filter, X } from 'lucide-react';

export interface FilterState {
  search: string;
  status: string[];
  type: string[];
  region: string[];
  license_category: string[];
  safety_score: string[]; // 'excellent', 'good', 'average', 'poor'
}

interface VehicleFilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  regions: string[];
  onClear: () => void;
}

const VehicleFilterPanel: React.FC<VehicleFilterPanelProps> = ({ filters, setFilters, regions, onClear }) => {
  const toggleArrayItem = (key: keyof FilterState, value: string) => {
    setFilters(prev => {
      const arr = prev[key] as string[];
      if (arr.includes(value)) {
        return { ...prev, [key]: arr.filter(i => i !== value) };
      }
      return { ...prev, [key]: [...arr, value] };
    });
  };

  return (
    <div className="filter-panel glass-panel" style={{ padding: '16px', marginBottom: '20px', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}><Filter size={16} /> Advanced Filters</h4>
        <button className="btn btn-secondary" onClick={onClear} style={{ padding: '4px 8px', fontSize: '12px' }}>
          Clear All
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {/* Search */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Search</label>
          <input 
            type="text" 
            placeholder="Reg no, Make, Model" 
            className="input-field" 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        {/* Status */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'OUT_OF_SERVICE', 'IDLE'].map(s => (
              <span 
                key={s} 
                onClick={() => toggleArrayItem('status', s)}
                style={{ 
                  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: filters.status.includes(s) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: filters.status.includes(s) ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Type */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['Bus', 'Truck', 'Van', 'SUV', 'Sedan', 'Electric', 'Mini Truck', 'Trailer'].map(s => (
              <span 
                key={s} 
                onClick={() => toggleArrayItem('type', s)}
                style={{ 
                  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: filters.type.includes(s) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: filters.type.includes(s) ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Region */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Region (Dynamic)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {regions.map(s => (
              <span 
                key={s} 
                onClick={() => toggleArrayItem('region', s)}
                style={{ 
                  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: filters.region.includes(s) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: filters.region.includes(s) ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* License Category */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>License</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['LMV', 'HMV', 'Transport', 'Commercial', 'Hazardous Goods'].map(s => (
              <span 
                key={s} 
                onClick={() => toggleArrayItem('license_category', s)}
                style={{ 
                  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: filters.license_category.includes(s) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: filters.license_category.includes(s) ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Safety Score */}
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Safety Score</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {[
              { label: 'Excellent', val: 'excellent' },
              { label: 'Good', val: 'good' },
              { label: 'Average', val: 'average' },
              { label: 'Poor', val: 'poor' }
            ].map(s => (
              <span 
                key={s.val} 
                onClick={() => toggleArrayItem('safety_score', s.val)}
                style={{ 
                  padding: '4px 8px', fontSize: '11px', borderRadius: '4px', cursor: 'pointer',
                  backgroundColor: filters.safety_score.includes(s.val) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                  color: filters.safety_score.includes(s.val) ? '#fff' : 'var(--text-secondary)'
                }}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VehicleFilterPanel;
