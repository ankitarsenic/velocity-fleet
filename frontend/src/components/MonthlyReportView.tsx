import React, { useState, useEffect } from 'react';
import { 
  FileText, Calendar, CheckCircle, Truck, DollarSign, Activity, BarChart2,
  AlertTriangle, ShieldCheck, Download, Users, TrendingUp, AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function MonthlyReportView() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const generateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/reports/monthly?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch report data');
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

  return (
    <div className="report-container">
      {/* Hide controls when printing via CSS */}
      <div className="report-controls no-print glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText /> Monthly Fleet Operations Report
        </h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Month</label>
            <select className="form-control" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Year</label>
            <input type="number" className="form-control" value={year} onChange={e => setYear(Number(e.target.value))} />
          </div>
          <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          {reportData && (
            <button className="btn btn-secondary" onClick={handlePrint} style={{ marginLeft: 'auto' }}>
              <Download size={16} /> Export PDF
            </button>
          )}
        </div>
        {error && <div className="error-message" style={{ marginTop: '16px' }}>{error}</div>}
      </div>

      {reportData && (
        <div className="report-document print-area" id="printable-report">
          {/* Header */}
          <div className="report-header" style={{ borderBottom: '2px solid var(--border)', paddingBottom: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: 'var(--text)' }}>TransitOps</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '18px', marginTop: '8px' }}>Monthly Fleet Operations Report</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>{monthName} {year}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <h3 className="report-section-title">Executive Summary</h3>
          <div className="report-grid">
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563EB' }}><Truck /></div>
              <div className="kpi-details">
                <div className="kpi-label">Total Trips Dispatched</div>
                <div className="kpi-value">{reportData.summary.total_trips}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><CheckCircle /></div>
              <div className="kpi-details">
                <div className="kpi-label">Completed Trips</div>
                <div className="kpi-value">{reportData.summary.completed_trips}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><Activity /></div>
              <div className="kpi-details">
                <div className="kpi-label">Total Distance</div>
                <div className="kpi-value">{reportData.summary.total_distance.toLocaleString()} km</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><DollarSign /></div>
              <div className="kpi-details">
                <div className="kpi-label">Total Operations Cost</div>
                <div className="kpi-value">${reportData.summary.total_operational_expenses.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="report-grid" style={{ marginTop: '24px' }}>
            <div className="kpi-card">
              <div className="kpi-details">
                <div className="kpi-label">Avg Fuel Efficiency</div>
                <div className="kpi-value">{reportData.summary.avg_fuel_efficiency.toFixed(2)} km/L</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-details">
                <div className="kpi-label">Total Fuel Logged</div>
                <div className="kpi-value">{reportData.summary.total_fuel_liters.toLocaleString()} L</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-details">
                <div className="kpi-label">Maintenance Cost</div>
                <div className="kpi-value">${reportData.summary.total_maintenance_cost.toLocaleString()}</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-details">
                <div className="kpi-label">Fleet Health</div>
                <div className="kpi-value" style={{ 
                  color: reportData.summary.fleet_health === 'Excellent' ? '#10B981' : 
                         reportData.summary.fleet_health === 'Good' ? '#3B82F6' : 
                         reportData.summary.fleet_health === 'Needs Attention' ? '#F59E0B' : '#EF4444' 
                }}>
                  {reportData.summary.fleet_health}
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '40px', pageBreakInside: 'avoid' }}>
            <div className="chart-container glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ marginBottom: '16px' }}>Expense Breakdown</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(reportData.expense_breakdown).map(([name, value]) => ({ name, value }))}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(reportData.expense_breakdown).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="chart-container glass-panel" style={{ padding: '20px' }}>
              <h4 style={{ marginBottom: '16px' }}>Top Vehicles by Trips</h4>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.fleet_performance.slice(0, 5)} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                    <XAxis type="number" />
                    <YAxis dataKey="registration" type="category" axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="trips" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Vehicle Performance Table */}
          <h3 className="report-section-title" style={{ marginTop: '40px', pageBreakBefore: 'always' }}>Fleet Performance</h3>
          <div className="table-container" style={{ pageBreakInside: 'avoid' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Reg. Number</th>
                  <th>Trips</th>
                  <th>Distance (km)</th>
                  <th>Fuel Efficiency</th>
                  <th>Expenses</th>
                </tr>
              </thead>
              <tbody>
                {reportData.fleet_performance.map((v: any, i: number) => (
                  <tr key={i} style={i === 0 ? { backgroundColor: 'rgba(16, 185, 129, 0.05)' } : {}}>
                    <td>
                      {i === 0 && <span title="Most Utilized" style={{ marginRight: '8px' }}>🏆</span>}
                      {v.name}
                    </td>
                    <td>{v.registration}</td>
                    <td>{v.trips}</td>
                    <td>{v.distance.toLocaleString()}</td>
                    <td>{v.fuel_efficiency.toFixed(2)} km/L</td>
                    <td>${v.expenses.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Driver Performance Table */}
          <h3 className="report-section-title" style={{ marginTop: '40px' }}>Driver Performance</h3>
          <div className="table-container" style={{ pageBreakInside: 'avoid' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>Code</th>
                  <th>Trips</th>
                  <th>Distance (km)</th>
                  <th>Safety Score</th>
                </tr>
              </thead>
              <tbody>
                {reportData.driver_performance.map((d: any, i: number) => (
                  <tr key={i}>
                    <td>
                      {i === 0 && <span title="Top Driver" style={{ marginRight: '8px' }}>🥇</span>}
                      {d.name}
                    </td>
                    <td>{d.employee_code}</td>
                    <td>{d.trips}</td>
                    <td>{d.distance.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${d.safety_score >= 90 ? 'badge-success' : d.safety_score >= 70 ? 'badge-info' : 'badge-danger'}`}>
                        {d.safety_score} / 100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Insights */}
          <div className="insights-container glass-panel" style={{ marginTop: '40px', padding: '24px', pageBreakInside: 'avoid', borderLeft: '4px solid var(--primary)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0, marginBottom: '16px' }}>
              <TrendingUp size={24} color="var(--primary)" /> AI-Generated Insights
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {reportData.insights.map((insight: string, i: number) => (
                <li key={i} style={{ marginBottom: '12px', fontSize: '15px', lineHeight: 1.5 }}>
                  {insight.includes('Warning') ? <strong><span style={{ color: '#EF4444' }}>{insight}</span></strong> : insight}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="report-footer" style={{ marginTop: '60px', borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '12px' }}>
            <div>TransitOps Fleet Management Platform - Confidential</div>
            <div>Generated by {localStorage.getItem('token') ? 'Authorized User' : 'System'}</div>
            <div>Page 1 of 1</div>
          </div>
        </div>
      )}

      <style>{`
        .report-section-title {
          font-size: 20px;
          margin-bottom: 20px;
          color: var(--text);
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }
        .report-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        .kpi-card {
          background: var(--surface-2);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid var(--border);
        }
        .kpi-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .kpi-label {
          font-size: 13px;
          color: var(--text-secondary);
          margin-bottom: 4px;
        }
        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .glass-panel {
            background: none !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
          .no-print {
            display: none !important;
          }
          :root {
            --surface: #ffffff;
            --surface-2: #f8fafc;
            --text: #0f172a;
            --text-secondary: #475569;
            --border: #e2e8f0;
          }
        }
      `}</style>
    </div>
  );
}
