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
      <Route path="/*" element={
        <ProtectedRoute>
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
            </Routes>
          </Layout>
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
