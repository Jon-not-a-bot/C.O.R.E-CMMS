import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AssetList from './pages/AssetList';
import AssetForm from './pages/AssetForm';
import AssetDetail from './pages/AssetDetail';

const NAV = '#1B2D4F';
const BLUE = '#3AACDC';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        {/* Top Nav */}
        <nav style={{ background: NAV, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <div style={{ color: BLUE, fontWeight: 800, fontSize: 20, letterSpacing: 3 }}>C.O.R.E.</div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginLeft: -20 }}>CMMS</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
            {[['/', 'Dashboard'], ['/assets', 'Assets'], ['/assets/new', '+ Add Asset']].map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'} style={({ isActive }) => ({
                color: isActive ? BLUE : '#cbd5e1',
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'rgba(58,172,220,0.12)' : 'transparent',
                transition: 'all 0.15s'
              })}>{label}</NavLink>
            ))}
          </div>
        </nav>

        {/* Page Content */}
        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetForm />} />
            <Route path="/assets/:id" element={<AssetDetail />} />
            <Route path="/assets/:id/edit" element={<AssetForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
