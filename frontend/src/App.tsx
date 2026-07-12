import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Truck, UserCheck, Compass, 
  Wrench, Fuel, DollarSign, AlertTriangle, 
  LogOut, Plus, CheckCircle2, Trash2, Calendar, FileText, MapPin
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import LiveTripTracker from './LiveTripTracker';
import PaymentGatewayModal, { PaymentTarget } from './PaymentGatewayModal';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');

interface KPI {
  active_trips: number;
  completed_trips: number;
  total_vehicles: number;
  v_available: number;
  v_on_trip: number;
  v_maintenance: number;
  total_drivers: number;
  d_available: number;
  d_on_trip: number;
  d_inactive: number;
  utilization_rate: number;
  expired_licenses: number;
  expiring_soon: number;
  total_expenses: number;
  breakdown: {
    fuel: number;
    maintenance: number;
    toll: number;
    others: number;
  };
}

interface MonthlyHistory {
  name: string;
  fuel: number;
  maintenance: number;
  others: number;
  total: number;
}

interface DriverAlert {
  id: number;
  name: string;
  employee_code: string;
  license_number: string;
  license_expiry: string;
  days_left: number;
  status: 'EXPIRED' | 'EXPIRING_SOON';
}

interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  capacity_kg: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'MAINTENANCE';
}

interface Driver {
  id: number;
  employee_code: string;
  name: string;
  license_number: string;
  license_expiry: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'INACTIVE';
}

interface Trip {
  id: number;
  vehicle_id: number;
  vehicle: Vehicle | null;
  driver_id: number;
  driver: Driver | null;
  origin: string;
  destination: string;
  status: 'DISPATCHED' | 'COMPLETED';
  dispatch_time: string;
  completion_time: string | null;
  cargo_weight_kg: number;
}

interface MaintenanceRecord {
  id: number;
  vehicle_id: number;
  vehicle: Vehicle | null;
  description: string;
  cost: number;
  status: 'IN_PROGRESS' | 'COMPLETED';
  start_date: string;
  end_date: string | null;
}

interface FuelLog {
  id: number;
  vehicle_id: number;
  vehicle: Vehicle | null;
  liters: number;
  cost: number;
  date: string;
}

interface Expense {
  id: number;
  trip_id: number | null;
  trip: Trip | null;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function App() {
  // Authentication State
  const [token, setToken] = useState<string | null>(tokenVal => {
    return localStorage.getItem('token');
  });
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'expenses' | 'fuel'>('dashboard');

  // Core Data Lists
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Dashboard Stats
  const [kpis, setKpis] = useState<KPI | null>(null);
  const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
  const [driverAlerts, setDriverAlerts] = useState<DriverAlert[]>([]);

  // Modals Visibility and Form States
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [trackingTrip, setTrackingTrip] = useState<Trip | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Entity Form states
  const [vehicleForm, setVehicleForm] = useState({ id: 0, reg: '', make: '', model: '', cap: '' });
  const [driverForm, setDriverForm] = useState({ id: 0, code: '', name: '', licNum: '', licExp: '' });
  const [tripForm, setTripForm] = useState({ vehicleId: '', driverId: '', origin: '', dest: '', weight: '' });
  const [maintForm, setMaintForm] = useState({ vehicleId: '', desc: '', cost: '', startDate: '' });
  const [maintCompleteForm, setMaintCompleteForm] = useState({ logId: 0, cost: '', endDate: '' });
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', category: 'Other', description: '', date: '', tripId: '' });

  // Handle Fetch Operations
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
      // Session Expired
      logout();
      throw new Error('Session expired. Please login again.');
    }
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.message || 'Login failed');
      }

      setToken(resData.access_token);
      setUser(resData.user);
      localStorage.setItem('token', resData.access_token);
      localStorage.setItem('user', JSON.stringify(resData.user));
    } catch (err: any) {
      setLoginError(err.message || 'Connecting to backend failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Load Data based on active screen
  const loadDashboardData = async () => {
    try {
      const res = await fetchWithAuth('/dashboard');
      const data = await res.json();
      if (res.ok) {
        setKpis(data.kpis);
        setMonthlyHistory(data.monthly_history);
        setDriverAlerts(data.driver_alerts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await fetchWithAuth('/vehicles');
      const data = await res.json();
      if (res.ok) setVehicles(data);
    } catch (err) { console.error(err); }
  };

  const loadDrivers = async () => {
    try {
      const res = await fetchWithAuth('/drivers');
      const data = await res.json();
      if (res.ok) setDrivers(data);
    } catch (err) { console.error(err); }
  };

  const loadTrips = async () => {
    try {
      const res = await fetchWithAuth('/trips');
      const data = await res.json();
      if (res.ok) setTrips(data);
    } catch (err) { console.error(err); }
  };

  const loadMaintenance = async () => {
    try {
      const res = await fetchWithAuth('/maintenance');
      const data = await res.json();
      if (res.ok) setMaintenance(data);
    } catch (err) { console.error(err); }
  };

  const loadFuelLogs = async () => {
    try {
      const res = await fetchWithAuth('/fuel');
      const data = await res.json();
      if (res.ok) setFuelLogs(data);
    } catch (err) { console.error(err); }
  };

  const loadExpenses = async () => {
    try {
      const res = await fetchWithAuth('/expenses');
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'dashboard') loadDashboardData();
      else if (activeTab === 'vehicles') loadVehicles();
      else if (activeTab === 'drivers') loadDrivers();
      else if (activeTab === 'trips') {
        loadTrips();
        loadVehicles();
        loadDrivers();
      }
      else if (activeTab === 'maintenance') {
        loadMaintenance();
        loadVehicles();
      }
      else if (activeTab === 'fuel') {
        loadFuelLogs();
        loadVehicles();
      }
      else if (activeTab === 'expenses') {
        loadExpenses();
        loadTrips();
      }
    }
  }, [token, activeTab]);

  // Submit handlers
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        registration_number: vehicleForm.reg,
        make: vehicleForm.make,
        model: vehicleForm.model,
        capacity_kg: parseInt(vehicleForm.cap)
      };
      const url = vehicleForm.id > 0 ? `/vehicles/${vehicleForm.id}` : '/vehicles';
      const method = vehicleForm.id > 0 ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setFormSuccess('Vehicle saved successfully!');
      setActiveModal(null);
      loadVehicles();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const deleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      const res = await fetchWithAuth(`/vehicles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      loadVehicles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        employee_code: driverForm.code,
        name: driverForm.name,
        license_number: driverForm.licNum,
        license_expiry: driverForm.licExp
      };
      const url = driverForm.id > 0 ? `/drivers/${driverForm.id}` : '/drivers';
      const method = driverForm.id > 0 ? 'PUT' : 'POST';

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setFormSuccess('Driver saved successfully!');
      setActiveModal(null);
      loadDrivers();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const deleteDriver = async (id: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    try {
      const res = await fetchWithAuth(`/drivers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      loadDrivers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        vehicle_id: parseInt(tripForm.vehicleId),
        driver_id: parseInt(tripForm.driverId),
        origin: tripForm.origin,
        destination: tripForm.dest,
        cargo_weight_kg: parseInt(tripForm.weight)
      };

      const res = await fetchWithAuth('/trips', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Dispatch failed');

      setActiveModal(null);
      loadTrips();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const completeTrip = async (id: number) => {
    try {
      const res = await fetchWithAuth(`/trips/${id}/complete`, { method: 'POST' });
      if (res.ok) loadTrips();
      else {
        const data = await res.json();
        alert(data.message || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        vehicle_id: parseInt(maintForm.vehicleId),
        description: maintForm.desc,
        cost: parseFloat(maintForm.cost || '0'),
        start_date: maintForm.startDate
      };
      const res = await fetchWithAuth('/maintenance', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to schedule maintenance');

      setActiveModal(null);
      loadMaintenance();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleMaintCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        cost: parseFloat(maintCompleteForm.cost),
        end_date: maintCompleteForm.endDate || undefined
      };
      const res = await fetchWithAuth(`/maintenance/${maintCompleteForm.logId}/complete`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');

      setActiveModal(null);
      loadMaintenance();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleFuelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        vehicle_id: parseInt(fuelForm.vehicleId),
        liters: parseFloat(fuelForm.liters),
        cost: parseFloat(fuelForm.cost),
        date: fuelForm.date
      };
      const res = await fetchWithAuth('/fuel', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Logging fuel failed');

      setActiveModal(null);
      loadFuelLogs();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        date: expenseForm.date,
        trip_id: expenseForm.tripId ? parseInt(expenseForm.tripId) : undefined
      };
      const res = await fetchWithAuth('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Logging expense failed');

      setActiveModal(null);
      loadExpenses();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Helper date renderer
  const renderDate = (dString: string | null) => {
    if (!dString) return '-';
    return new Date(dString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const renderDateTime = (dtString: string | null) => {
    if (!dtString) return '-';
    return new Date(dtString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // LOGIN PAGE VIEW
  if (!token) {
    return (
      <div className="login-page-bg">
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px' }}>
          <div className="text-center mb-6">
            <h2 className="logo-text" style={{ fontSize: '28px', marginBottom: '8px' }}>TransitOps</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enterprise Transport Fleet Manager</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="admin@transitops.local"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            {loginError && (
              <div className="error-text" style={{ marginBottom: '16px', textAlign: 'center' }}>
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loginLoading}>
              {loginLoading ? <div className="loading-spinner" /> : 'Sign In'}
            </button>
          </form>
          
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
            Admin Credentials: <br />
            <strong>admin@transitops.local</strong> / <strong>ChangeMe123!</strong>
          </div>
        </div>
      </div>
    );
  }

  // MAIN APPLICATION LAYOUT
  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <aside className="sidebar">
        <div className="logo-container">
          <Truck size={24} style={{ color: 'var(--accent-primary)' }} />
          <span className="logo-text">TransitOps</span>
        </div>

        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Dashboard
          </div>

          <div 
            className={`nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            <Truck size={18} /> Vehicles
          </div>

          <div 
            className={`nav-item ${activeTab === 'drivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            <UserCheck size={18} /> Drivers
          </div>

          <div 
            className={`nav-item ${activeTab === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveTab('trips')}
          >
            <Compass size={18} /> Dispatch Trips
          </div>

          <div 
            className={`nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <Wrench size={18} /> Maintenance
          </div>

          <div 
            className={`nav-item ${activeTab === 'fuel' ? 'active' : ''}`}
            onClick={() => setActiveTab('fuel')}
          >
            <Fuel size={18} /> Fuel Logs
          </div>

          <div 
            className={`nav-item ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <DollarSign size={18} /> Expenses
          </div>
        </nav>

        <div className="user-profile-section">
          <div className="user-details">
            <span className="user-name">{user?.name || 'System Admin'}</span>
            <span className="user-role">{user?.role || 'Admin'}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="topbar">
          <h1 className="page-title">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry
          </h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Operations Active
          </div>
        </header>

        <div className="content-body">
          
          {/* DASHBOARD TAB VIEW */}
          {activeTab === 'dashboard' && kpis && (
            <>
              {/* KPIs summary cards */}
              <div className="metrics-grid">
                <div className="glass-panel metric-card">
                  <div>
                    <span className="metric-label">Active Dispatches</span>
                    <h3 className="metric-value">{kpis.active_trips}</h3>
                  </div>
                  <div className="metric-icon-wrapper metric-blue">
                    <Compass size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div>
                    <span className="metric-label">Fleet Utilization</span>
                    <h3 className="metric-value">{kpis.utilization_rate}%</h3>
                  </div>
                  <div className="metric-icon-wrapper metric-purple">
                    <Truck size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div>
                    <span className="metric-label">Monthly Expenses</span>
                    <h3 className="metric-value">${kpis.total_expenses.toLocaleString()}</h3>
                  </div>
                  <div className="metric-icon-wrapper metric-green">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="glass-panel metric-card">
                  <div>
                    <span className="metric-label">Alert Flags</span>
                    <h3 className="metric-value">{kpis.expired_licenses + kpis.expiring_soon}</h3>
                  </div>
                  <div className="metric-icon-wrapper metric-warning">
                    <AlertTriangle size={24} />
                  </div>
                </div>
              </div>

              {/* Chart & Driver Alert Section */}
              <div className="dashboard-layout-grid">
                {/* Monthly cost history chart */}
                <div className="glass-panel section-panel">
                  <div className="section-header">
                    <h3 className="section-title">Expense Trend (Last 6 Months)</h3>
                  </div>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <AreaChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="maintGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                        <YAxis stroke="var(--text-secondary)" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)' }} />
                        <Legend verticalAlign="top" height={36} />
                        <Area type="monotone" dataKey="fuel" name="Fuel Expense" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#fuelGrad)" />
                        <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#maintGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Driver safety alert panel */}
                <div className="glass-panel section-panel">
                  <div className="section-header">
                    <h3 className="section-title">License Risk Control</h3>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {driverAlerts.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>
                        All driver licenses are fully valid.
                      </p>
                    ) : (
                      driverAlerts.map(alert => (
                        <div 
                          key={alert.id} 
                          className={`alert-item ${alert.status === 'EXPIRED' ? 'alert-danger' : 'alert-warning'}`}
                        >
                          <div>
                            <div className="alert-title">{alert.name} ({alert.employee_code})</div>
                            <div className="alert-desc">
                              Lic. Number: {alert.license_number} <br />
                              {alert.status === 'EXPIRED' 
                                ? `Expired ${Math.abs(alert.days_left)} days ago` 
                                : `Expires in ${alert.days_left} days (${renderDate(alert.license_expiry)})`
                              }
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}


          {/* VEHICLES TAB VIEW */}
          {activeTab === 'vehicles' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Active Vehicles ({vehicles.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setVehicleForm({ id: 0, reg: '', make: '', model: '', cap: '' });
                    setFormError('');
                    setActiveModal('vehicle');
                  }}
                >
                  <Plus size={16} /> Add Vehicle
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Registration</th>
                      <th>Make & Model</th>
                      <th>Weight Capacity</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map(v => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.registration_number}</td>
                        <td>{v.make} {v.model}</td>
                        <td>{v.capacity_kg.toLocaleString()} kg</td>
                        <td>
                          <span className={`badge ${
                            v.status === 'AVAILABLE' ? 'badge-success' : 
                            v.status === 'ON_TRIP' ? 'badge-info' : 'badge-warning'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => {
                                setVehicleForm({
                                  id: v.id,
                                  reg: v.registration_number,
                                  make: v.make,
                                  model: v.model,
                                  cap: v.capacity_kg.toString()
                                });
                                setFormError('');
                                setActiveModal('vehicle');
                              }}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ color: 'var(--accent-danger)' }}
                              onClick={() => deleteVehicle(v.id)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* DRIVERS TAB VIEW */}
          {activeTab === 'drivers' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Driver Staff Registry ({drivers.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setDriverForm({ id: 0, code: '', name: '', licNum: '', licExp: '' });
                    setFormError('');
                    setActiveModal('driver');
                  }}
                >
                  <Plus size={16} /> Register Driver
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee Code</th>
                      <th>Driver Name</th>
                      <th>License Details</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(d => {
                      const isExpired = new Date(d.license_expiry) < new Date();
                      return (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 600 }}>{d.employee_code}</td>
                          <td>{d.name}</td>
                          <td>
                            <div>{d.license_number}</div>
                            <div style={{ fontSize: '12px', color: isExpired ? 'var(--accent-danger)' : 'var(--text-secondary)' }}>
                              Expiry: {renderDate(d.license_expiry)} {isExpired && '(EXPIRED)'}
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${
                              d.status === 'AVAILABLE' ? 'badge-success' : 
                              d.status === 'ON_TRIP' ? 'badge-info' : 'badge-danger'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => {
                                  setDriverForm({
                                    id: d.id,
                                    code: d.employee_code,
                                    name: d.name,
                                    licNum: d.license_number,
                                    licExp: d.license_expiry
                                  });
                                  setFormError('');
                                  setActiveModal('driver');
                                }}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn-icon" 
                                style={{ color: 'var(--accent-danger)' }}
                                onClick={() => deleteDriver(d.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* DISPATCH TRIPS TAB VIEW */}
          {activeTab === 'trips' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Trips & Dispatch logs ({trips.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setTripForm({ vehicleId: '', driverId: '', origin: '', dest: '', weight: '' });
                    setFormError('');
                    setActiveModal('trip');
                  }}
                >
                  <Plus size={16} /> Dispatch New Trip
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Trip ID</th>
                      <th>Vehicle Info</th>
                      <th>Driver Info</th>
                      <th>Route Details</th>
                      <th>Cargo Load</th>
                      <th>Dispatch Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(t => (
                      <tr key={t.id}>
                        <td>#{t.id}</td>
                        <td>
                          {t.vehicle ? (
                            <div>
                              <strong>{t.vehicle.registration_number}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.vehicle.make} {t.vehicle.model}</div>
                            </div>
                          ) : 'Unknown Vehicle'}
                        </td>
                        <td>
                          {t.driver ? (
                            <div>
                              <strong>{t.driver.name}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t.driver.employee_code}</div>
                            </div>
                          ) : 'Unknown Driver'}
                        </td>
                        <td>
                          <div><strong>From:</strong> {t.origin}</div>
                          <div><strong>To:</strong> {t.destination}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Dispatched: {renderDateTime(t.dispatch_time)} <br />
                            {t.completion_time && `Completed: ${renderDateTime(t.completion_time)}`}
                          </div>
                        </td>
                        <td>{t.cargo_weight_kg.toLocaleString()} kg</td>
                        <td>
                          <span className={`badge ${
                            (t.status === 'COMPLETED' || t.status === 'PAID') ? 'badge-success' : 'badge-warning'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          {t.status === 'DISPATCHED' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn"
                                style={{ padding: '6px 12px', fontSize: '12px', background: '#F97316', color: 'white', border: 'none' }}
                                onClick={() => setTrackingTrip(t)}
                              >
                                <MapPin size={14} style={{ marginRight: '4px' }} /> Live Tracking
                              </button>
                              <button 
                                className="btn btn-success"
                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                onClick={() => completeTrip(t.id)}
                              >
                                <CheckCircle2 size={14} /> Complete
                              </button>
                            </div>
                          )}
                          {t.status === 'COMPLETED' && (
                            <button 
                              className="btn btn-success"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => setPaymentTarget({ type: 'trip', id: t.id, amount: t.cargo_weight_kg * 15 })}
                            >
                              Settle Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* MAINTENANCE LIFECYCLE TAB VIEW */}
          {activeTab === 'maintenance' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Maintenance Records ({maintenance.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setMaintForm({ vehicleId: '', desc: '', cost: '0', startDate: new Date().toISOString().split('T')[0] });
                    setFormError('');
                    setActiveModal('maintenance');
                  }}
                >
                  <Plus size={16} /> Schedule Maintenance
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Vehicle Registration</th>
                      <th>Service Details</th>
                      <th>Lifecycle Timeline</th>
                      <th>Reported Cost</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.map(m => (
                      <tr key={m.id}>
                        <td>#{m.id}</td>
                        <td>
                          {m.vehicle ? (
                            <div>
                              <strong>{m.vehicle.registration_number}</strong>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.vehicle.make} {m.vehicle.model}</div>
                            </div>
                          ) : 'Unknown Vehicle'}
                        </td>
                        <td>{m.description}</td>
                        <td>
                          <div><strong>Scheduled:</strong> {renderDate(m.start_date)}</div>
                          <div><strong>Completed:</strong> {renderDate(m.end_date)}</div>
                        </td>
                        <td>${m.cost.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${
                            (m.status === 'COMPLETED' || m.status === 'PAID') ? 'badge-success' : 'badge-warning'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          {m.status === 'IN_PROGRESS' && (
                            <button 
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '12px' }}
                              onClick={() => {
                                setMaintCompleteForm({
                                  logId: m.id,
                                  cost: m.cost.toString(),
                                  endDate: new Date().toISOString().split('T')[0]
                                });
                                setFormError('');
                                setActiveModal('maintenanceComplete');
                              }}
                            >
                              <CheckCircle2 size={14} /> Complete Work
                            </button>
                          )}
                          {m.status === 'COMPLETED' && (
                            <button 
                              className="btn btn-success"
                              style={{ padding: '6px 12px', fontSize: '12px', marginLeft: '8px' }}
                              onClick={() => setPaymentTarget({ type: 'maintenance', id: m.id, amount: m.cost })}
                            >
                              Settle Payment
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* FUEL LOGS TAB VIEW */}
          {activeTab === 'fuel' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Fuel Refuel Records ({fuelLogs.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setFuelForm({ vehicleId: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
                    setFormError('');
                    setActiveModal('fuel');
                  }}
                >
                  <Plus size={16} /> Log Fuel Purchase
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Log ID</th>
                      <th>Vehicle</th>
                      <th>Refuel Volume</th>
                      <th>Total Cost</th>
                      <th>Fueling Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map(f => (
                      <tr key={f.id}>
                        <td>#{f.id}</td>
                        <td>{f.vehicle?.registration_number || 'Unknown'}</td>
                        <td>{f.liters} L</td>
                        <td>${f.cost.toLocaleString()}</td>
                        <td>{renderDate(f.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* EXPENSES TAB VIEW */}
          {activeTab === 'expenses' && (
            <div className="glass-panel section-panel">
              <div className="section-header">
                <h3 className="section-title">Expense logs & ledger ({expenses.length})</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setExpenseForm({ amount: '', category: 'Other', description: '', date: new Date().toISOString().split('T')[0], tripId: '' });
                    setFormError('');
                    setActiveModal('expense');
                  }}
                >
                  <Plus size={16} /> Log Expense
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Expense ID</th>
                      <th>Ledger Category</th>
                      <th>Description</th>
                      <th>Trip ID Reference</th>
                      <th>Charge Amount</th>
                      <th>Transaction Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id}>
                        <td>#{e.id}</td>
                        <td>
                          <span className={`badge ${
                            e.category === 'Fuel' ? 'badge-info' : 
                            e.category === 'Maintenance' ? 'badge-purple' : 
                            e.category === 'Toll' ? 'badge-warning' : 'badge-secondary'
                          }`}>
                            {e.category}
                          </span>
                        </td>
                        <td>{e.description}</td>
                        <td>{e.trip_id ? `#${e.trip_id}` : '-'}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          ${e.amount.toLocaleString()}
                        </td>
                        <td>{renderDate(e.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* --- ALL FORM MODALS OVERLAYS --- */}

      {/* 1. VEHICLE FORM MODAL */}
      {activeModal === 'vehicle' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>
              {vehicleForm.id > 0 ? 'Edit Vehicle Info' : 'Register New Vehicle'}
            </h3>
            <form onSubmit={handleVehicleSubmit}>
              <div className="form-group">
                <label className="form-label">Registration Number</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. MH-12-AB-1234"
                  value={vehicleForm.reg} onChange={(e) => setVehicleForm({ ...vehicleForm, reg: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Make Brand</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Tata"
                  value={vehicleForm.make} onChange={(e) => setVehicleForm({ ...vehicleForm, make: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Model Name</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Prima"
                  value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Weight Capacity (kg)</label>
                <input 
                  type="number" className="form-input" required placeholder="e.g. 12000"
                  value={vehicleForm.cap} onChange={(e) => setVehicleForm({ ...vehicleForm, cap: e.target.value })}
                />
              </div>
              
              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. DRIVER FORM MODAL */}
      {activeModal === 'driver' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>
              {driverForm.id > 0 ? 'Edit Driver Info' : 'Register New Driver'}
            </h3>
            <form onSubmit={handleDriverSubmit}>
              <div className="form-group">
                <label className="form-label">Employee Code</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. DRV-102"
                  value={driverForm.code} onChange={(e) => setDriverForm({ ...driverForm, code: e.target.value })}
                  disabled={driverForm.id > 0}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Driver Full Name</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Ramesh Kumar"
                  value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Driver License Number</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. DL-1234567"
                  value={driverForm.licNum} onChange={(e) => setDriverForm({ ...driverForm, licNum: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">License Expiry Date</label>
                <input 
                  type="date" className="form-input" required
                  value={driverForm.licExp} onChange={(e) => setDriverForm({ ...driverForm, licExp: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DISPATCH TRIP MODAL */}
      {activeModal === 'trip' && (
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
      )}

      {/* 4. SCHEDULE MAINTENANCE MODAL */}
      {activeModal === 'maintenance' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Schedule Maintenance Service</h3>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="form-group">
                <label className="form-label">Vehicle for Maintenance</label>
                <select 
                  className="form-select" required
                  value={maintForm.vehicleId} onChange={(e) => setMaintForm({ ...maintForm, vehicleId: e.target.value })}
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.filter(v => v.status === 'AVAILABLE').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service Details & Description</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Engine Oil check and Brake repairs"
                  value={maintForm.desc} onChange={(e) => setMaintForm({ ...maintForm, desc: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input 
                  type="date" className="form-input" required
                  value={maintForm.startDate} onChange={(e) => setMaintForm({ ...maintForm, startDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Service Cost ($)</label>
                <input 
                  type="number" className="form-input" placeholder="e.g. 250"
                  value={maintForm.cost} onChange={(e) => setMaintForm({ ...maintForm, cost: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. COMPLETE MAINTENANCE MODAL */}
      {activeModal === 'maintenanceComplete' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Complete Maintenance Log</h3>
            <form onSubmit={handleMaintCompleteSubmit}>
              <div className="form-group">
                <label className="form-label">Final Service Cost ($)</label>
                <input 
                  type="number" className="form-input" required placeholder="e.g. 350"
                  value={maintCompleteForm.cost} onChange={(e) => setMaintCompleteForm({ ...maintCompleteForm, cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Completion End Date</label>
                <input 
                  type="date" className="form-input" required
                  value={maintCompleteForm.endDate} onChange={(e) => setMaintCompleteForm({ ...maintCompleteForm, endDate: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Complete Service</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. LOG FUEL PURCHASE MODAL */}
      {activeModal === 'fuel' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Log Fuel Refuel Purchase</h3>
            <form onSubmit={handleFuelSubmit}>
              <div className="form-group">
                <label className="form-label">Vehicle</label>
                <select 
                  className="form-select" required
                  value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration_number} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Fuel Volume (Liters)</label>
                <input 
                  type="number" step="0.01" className="form-input" required placeholder="e.g. 50"
                  value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Refuel Total Cost ($)</label>
                <input 
                  type="number" step="0.01" className="form-input" required placeholder="e.g. 75"
                  value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Fueling Date</label>
                <input 
                  type="date" className="form-input" required
                  value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Fuel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. LOG EXPENSE MODAL */}
      {activeModal === 'expense' && (
        <div className="modal-overlay">
          <div className="glass-panel modal-panel">
            <h3 className="section-title" style={{ marginBottom: '24px' }}>Log Expense Invoice</h3>
            <form onSubmit={handleExpenseSubmit}>
              <div className="form-group">
                <label className="form-label">Charge Amount ($)</label>
                <input 
                  type="number" step="0.01" className="form-input" required placeholder="e.g. 120"
                  value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ledger Category</label>
                <select 
                  className="form-select" required
                  value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="Toll">Toll Expense</option>
                  <option value="Fuel">Fuel Cost</option>
                  <option value="Maintenance">Maintenance Charge</option>
                  <option value="Other">Other Miscellaneous</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Reference Trip ID (Optional)</label>
                <select 
                  className="form-select"
                  value={expenseForm.tripId} onChange={(e) => setExpenseForm({ ...expenseForm, tripId: e.target.value })}
                >
                  <option value="">-- No Trip Reference --</option>
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      Trip #{t.id}: {t.origin} to {t.destination}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Expense Description</label>
                <input 
                  type="text" className="form-input" required placeholder="e.g. Highway toll taxes"
                  value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transaction Date</label>
                <input 
                  type="date" className="form-input" required
                  value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                />
              </div>

              {formError && <p className="error-text" style={{ marginBottom: '16px' }}>{formError}</p>}
              
              <div className="flex-row flex-end gap-3 mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Log Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {trackingTrip && (
        <LiveTripTracker trip={trackingTrip} onClose={() => setTrackingTrip(null)} />
      )}

      {paymentTarget && (
        <PaymentGatewayModal 
          target={paymentTarget} 
          onClose={() => setPaymentTarget(null)}
          onSuccess={() => {
            setPaymentTarget(null);
            loadDashboardData();
          }}
        />
      )}

    </div>
  );
}
