import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
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

const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9' }}>
      <nav style={{ background:NAVY, padding:'0 24px', display:'flex', alignItems:'center', gap:28, boxShadow:'0 2px 8px rgba(0,0,0,0.15)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontWeight:900, fontSize:20, letterSpacing:2, color:'#fff', padding:'16px 0', flexShrink:0 }}>
          C.O.R.E. <span style={{ fontWeight:300, fontSize:14, color:'#94a3b8', letterSpacing:0 }}>CMMS</span>
        </div>
        {[
          { to:'/', label:'Dashboard' },
          { to:'/assets', label:'Assets' },
          { to:'/workorders', label:'Work Orders' },
          { to:'/vendors', label:'Vendors' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} end={to==='/'} style={({ isActive }) => ({
            color: isActive ? BLUE : '#94a3b8', textDecoration:'none', fontWeight:600, fontSize:14,
            padding:'20px 4px', borderBottom:`3px solid ${isActive ? BLUE : 'transparent'}`, transition:'all 0.15s', flexShrink:0
          })}>{label}</NavLink>
        ))}
        {user?.role === 'admin' && (
          <NavLink to="/users" style={({ isActive }) => ({
            color: isActive ? BLUE : '#94a3b8', textDecoration:'none', fontWeight:600, fontSize:14,
            padding:'20px 4px', borderBottom:`3px solid ${isActive ? BLUE : 'transparent'}`, flexShrink:0
          })}>Users</NavLink>
        )}
        <div style={{ marginLeft:'auto', display:'flex', gap:12, alignItems:'center' }}>
          <NavLink to="/assets/new" style={{ background:BLUE, color:'#fff', textDecoration:'none', borderRadius:7, padding:'8px 16px', fontWeight:600, fontSize:13, flexShrink:0 }}>+ Asset</NavLink>
          <NavLink to="/workorders/new" style={{ background:'transparent', color:BLUE, border:`1px solid ${BLUE}`, textDecoration:'none', borderRadius:7, padding:'7px 14px', fontWeight:600, fontSize:13, flexShrink:0 }}>+ WO</NavLink>
          <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft:12, borderLeft:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'#94a3b8', textTransform:'capitalize' }}>{user?.role}</div>
            </div>
            <button onClick={logout} style={{ background:'rgba(255,255,255,0.1)', color:'#94a3b8', border:'none', borderRadius:6, padding:'6px 12px', fontSize:12, cursor:'pointer', fontWeight:500 }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'32px 24px' }}>{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding:60, textAlign:'center', color:'#64748b' }}>Loading C.O.R.E....</div>;

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
