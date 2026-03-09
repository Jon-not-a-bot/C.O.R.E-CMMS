import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const SCOPE_COLORS = {
  'Building Maintenance': '#3AACDC',
  'Roof': '#8b5cf6',
  'HVAC': '#f59e0b',
  'PIT': '#ef4444',
  'Machinery': '#f97316',
  'Electrical': '#eab308',
  'Plumbing': '#06b6d4',
  'Fire & Life Safety': '#dc2626',
  'Pest Control': '#84cc16',
  'Landscaping': '#22c55e',
  'Janitorial': '#64748b',
  'IT / Technology': '#6366f1',
  'General': '#94a3b8',
};

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('');
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  useEffect(() => {
    authFetch(`${API}/api/vendors`)
      .then(r => r.json())
      .then(data => { setVendors(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scopes = [...new Set(vendors.map(v => v.scope).filter(Boolean))].sort();

  const filtered = vendors.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      (v.primary_contact || '').toLowerCase().includes(q) ||
      (v.email || '').toLowerCase().includes(q) ||
      (v.scope || '').toLowerCase().includes(q);
    const matchScope = !filterScope || v.scope === filterScope;
    return matchSearch && matchScope;
  });

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading vendors...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 700, margin: 0 }}>Vendors</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in directory</p>
        </div>
        <button onClick={() => navigate('/vendors/new')}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + Add Vendor
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors, contacts, email..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <select value={filterScope} onChange={e => setFilterScope(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Scopes</option>
          {scopes.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 60, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <div style={{ color: '#94a3b8', fontSize: 15 }}>{vendors.length === 0 ? 'No vendors yet. Add your first vendor.' : 'No vendors match your search.'}</div>
          {vendors.length === 0 && (
            <button onClick={() => navigate('/vendors/new')}
              style={{ marginTop: 16, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              Add First Vendor
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(v => {
            const scopeColor = SCOPE_COLORS[v.scope] || '#94a3b8';
            return (
              <div key={v.id} onClick={() => navigate(`/vendors/${v.id}`)}
                style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderTop: `3px solid ${scopeColor}`, transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>{v.name}</div>
                    {v.primary_contact && <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>👤 {v.primary_contact}</div>}
                  </div>
                  <span style={{ background: scopeColor + '20', color: scopeColor, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {v.scope || 'General'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {v.phone && <div style={{ fontSize: 13, color: '#475569' }}>📞 {v.phone}</div>}
                  {v.email && <div style={{ fontSize: 13, color: '#475569' }}>✉️ {v.email}</div>}
                  {v.website && <div style={{ fontSize: 12, color: BLUE, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>🌐 {v.website}</div>}
                </div>
                {v.notes && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {v.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
