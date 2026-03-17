import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderForm from './pages/WorkOrderForm';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkRequest from './pages/WorkRequest';
import Users from './pages/Users';
import VendorList from './pages/VendorList';
import VendorForm from './pages/VendorForm';
import VendorDetail from './pages/VendorDetail';
import PMTemplateList from './pages/PMTemplateList';
import PMTemplateForm from './pages/PMTemplateForm';
import TechLayout from './pages/TechLayout';

const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/assets', label: 'Assets' },
  { to: '/workorders', label: 'Work Orders' },
  { to: '/vendors', label: 'Vendors' },
  { to: '/pm-schedules', label: 'PM Schedules' },
];

function HamburgerIcon({ open }) {
  return (
    <div style={{ width: 24, height: 18, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer' }}>
      <span style={{ display: 'block', height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'translateY(8px) rotate(45deg)' : 'none' }} />
      <span style={{ display: 'block', height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', opacity: open ? 0 : 1 }} />
      <span style={{ display: 'block', height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.2s', transform: open ? 'translateY(-8px) rotate(-45deg)' : 'none' }} />
    </div>
  );
}

function NewDropdown({ isAdmin }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!e.target.closest('#new-dropdown')) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const items = [
    { to: '/assets/new', label: '🔧 New Asset' },
    { to: '/workorders/new', label: '📋 New Work Order' },
    { to: '/vendors/new', label: '🏢 New Vendor' },
    { to: '/pm-schedules/new', label: '🔁 New PM Schedule' },
    ...(isAdmin ? [{ to: '/users', label: '👤 Manage Users', divider: true }] : []),
  ];

  return (
    <div id="new-dropdown" style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 7, padding: '8px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
        + New <span style={{ fontSize: 10, opacity: 0.8 }}>▼</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', minWidth: 200, zIndex: 500, overflow: 'hidden' }}>
          {items.map(item => (
            <NavLink key={item.to} to={item.to}
              style={{ display: 'block', padding: '11px 16px', fontSize: 13, fontWeight: 500, color: '#1e293b', textDecoration: 'none', borderTop: item.divider ? '1px solid #e2e8f0' : 'none', borderBottom: '1px solid #f1f5f9' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
function ChangePassword() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const API = process.env.REACT_APP_API_URL || '';
  const NAVY2 = '#1B2D4F'; const BLUE2 = '#3AACDC';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async () => {
    setError('');
    if (!form.current_password || !form.new_password || !form.confirm_password) { setError('All fields are required.'); return; }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (form.new_password !== form.confirm_password) { setError('New passwords do not match.'); return; }
    setSaving(true);
    const res = await authFetch(`${API}/api/auth/change-password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to update password.'); } else { setSuccess(true); setTimeout(() => navigate('/'), 2000); }
    setSaving(false);
  };
  const inp = { padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' };
  if (success) return <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center' }}><div style={{ fontSize: 48 }}>✅</div><h2 style={{ color: NAVY2 }}>Password updated!</h2><p style={{ color: '#64748b' }}>Redirecting...</p></div>;
  return (
    <div style={{ maxWidth: 440, margin: '48px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>← Back</button>
        <h1 style={{ color: NAVY2, fontSize: 20, fontWeight: 700, margin: 0 }}>Change Password</h1>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Current Password</label><input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>New Password</label><input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} style={inp} /></div>
          <div><label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Confirm New Password</label><input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)} style={inp} /></div>
        </div>
        <button onClick={handleSubmit} disabled={saving} style={{ width: '100%', background: NAVY2, color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
function Layout({ children }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('#drawer') && !e.target.closest('#hamburger-btn')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const drawerLinkStyle = (isActive) => ({
    color: isActive ? BLUE : '#cbd5e1',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: 15,
    padding: '13px 24px',
    borderLeft: `3px solid ${isActive ? BLUE : 'transparent'}`,
    display: 'block',
    background: isActive ? 'rgba(58,172,220,0.08)' : 'transparent',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* ── NAV BAR ── */}
      <nav style={{ background: NAVY, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: 2, color: '#fff', padding: '16px 0', flexShrink: 0 }}>
          C.O.R.E. <span style={{ fontWeight: 300, fontSize: 14, color: '#94a3b8', letterSpacing: 0 }}>CMMS</span>
        </div>
        <div id="hamburger-btn" onClick={() => setMenuOpen(o => !o)} style={{ padding: 8, cursor: 'pointer' }}>
          <HamburgerIcon open={menuOpen} />
        </div>
      </nav>

      {/* ── DRAWER ── */}
      <div id="drawer" style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 290,
        background: NAVY, zIndex: 300, display: 'flex', flexDirection: 'column',
        transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        boxShadow: menuOpen ? '-4px 0 20px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 2, color: '#fff' }}>
            C.O.R.E. <span style={{ fontWeight: 300, fontSize: 13, color: '#94a3b8' }}>CMMS</span>
          </div>
          <div onClick={() => setMenuOpen(false)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 22, lineHeight: 1 }}>✕</div>
        </div>

        {/* User info */}
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{user?.name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>

        {/* Nav links */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8 }}>
          <div style={{ padding: '8px 24px 4px', fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Navigate</div>
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => drawerLinkStyle(isActive)}>{label}</NavLink>
          ))}
          {user?.role === 'admin' && (
            <NavLink to="/users" style={({ isActive }) => drawerLinkStyle(isActive)}>Users</NavLink>
          )}

          {/* Quick actions */}
          <div style={{ padding: '16px 24px 8px', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 8 }}>
            <div style={{ fontSize: 10, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Quick Create</div>
            <NavLink to="/assets/new" style={{ display: 'block', background: BLUE, color: '#fff', textDecoration: 'none', borderRadius: 8, padding: '11px 16px', fontWeight: 600, fontSize: 14, marginBottom: 8, textAlign: 'center' }}>+ New Asset</NavLink>
            <NavLink to="/workorders/new" style={{ display: 'block', background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, textDecoration: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 14, textAlign: 'center', marginBottom: 8 }}>+ New Work Order</NavLink>
            <NavLink to="/vendors/new" style={{ display: 'block', background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, textDecoration: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 14, textAlign: 'center', marginBottom: 8 }}>+ New Vendor</NavLink>
            <NavLink to="/pm-schedules/new" style={{ display: 'block', background: 'transparent', color: BLUE, border: `1px solid ${BLUE}`, textDecoration: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, fontSize: 14, textAlign: 'center' }}>+ New PM Schedule</NavLink>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <NavLink to="/change-password" style={{ display: 'block', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', textDecoration: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>
            🔑 Change Password
          </NavLink>
          <button onClick={logout} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '12px', fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 299 }} />
      )}

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>{children}</main>

      <style>{`
        @media (max-width: 768px) {
          main { padding: 16px 16px !important; }
        }
      `}</style>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Loading C.O.R.E....</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/request" element={<WorkRequest />} />
      <Route path="/tech/*" element={
        <ProtectedRoute>
          {user?.role === 'technician' ? <TechLayout /> : <Navigate to="/" replace />}
        </ProtectedRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute>
          {user?.role === 'technician' ? <Navigate to="/tech" replace /> :
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<AssetList />} />
              <Route path="/assets/new" element={<AssetForm />} />
              <Route path="/assets/:id" element={<AssetDetail />} />
              <Route path="/assets/:id/edit" element={<AssetForm />} />
              <Route path="/workorders" element={<WorkOrders />} />
              <Route path="/workorders/new" element={<WorkOrderForm />} />
              <Route path="/workorders/:id" element={<WorkOrderDetail />} />
              <Route path="/workorders/:id/edit" element={<WorkOrderForm />} />
              <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
              <Route path="/vendors" element={<VendorList />} />
              <Route path="/vendors/new" element={<VendorForm />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/vendors/:id/edit" element={<VendorForm />} />
              <Route path="/pm-schedules" element={<PMTemplateList />} />
              <Route path="/pm-schedules/new" element={<PMTemplateForm />} />
              <Route path="/pm-schedules/:id/edit" element={<PMTemplateForm />} />
              <Route path="/change-password" element={<ChangePassword />} />
            </Routes>
          </Layout>}
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
