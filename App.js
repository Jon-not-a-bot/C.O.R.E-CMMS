import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderForm from './pages/WorkOrderForm';
import WorkOrderDetail from './pages/WorkOrderDetail';
import WorkRequest from './pages/WorkRequest';
import VendorList from './pages/VendorList';
import VendorForm from './pages/VendorForm';
import VendorDetail from './pages/VendorDetail';

const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

function Layout({ children }) {
  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9' }}>
      <nav style={{ background:NAVY, padding:'0 24px', display:'flex', alignItems:'center', gap:32, boxShadow:'0 2px 8px rgba(0,0,0,0.15)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontWeight:900, fontSize:20, letterSpacing:2, color:'#fff', padding:'16px 0' }}>
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
            padding:'20px 4px', borderBottom:`3px solid ${isActive ? BLUE : 'transparent'}`, transition:'all 0.15s'
          })}>{label}</NavLink>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:12, alignItems:'center' }}>
          <NavLink to="/assets/new" style={{ background:BLUE, color:'#fff', textDecoration:'none', borderRadius:7, padding:'8px 16px', fontWeight:600, fontSize:13 }}>+ Add Asset</NavLink>
          <NavLink to="/workorders/new" style={{ background:'transparent', color:BLUE, border:`1px solid ${BLUE}`, textDecoration:'none', borderRadius:7, padding:'7px 14px', fontWeight:600, fontSize:13 }}>+ Work Order</NavLink>
        </div>
      </nav>
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'32px 24px' }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/request" element={<WorkRequest />} />
        <Route path="/*" element={
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
              <Route path="/vendors" element={<VendorList />} />
              <Route path="/vendors/new" element={<VendorForm />} />
              <Route path="/vendors/:id" element={<VendorDetail />} />
              <Route path="/vendors/:id/edit" element={<VendorForm />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  );
}
