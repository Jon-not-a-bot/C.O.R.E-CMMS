import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const SCOPE_COLORS = [
  '#3AACDC', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
];

function getScopeColor(scope, allScopes) {
  const idx = allScopes.indexOf(scope);
  return SCOPE_COLORS[idx % SCOPE_COLORS.length];
}

export default function VendorList() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${API}/api/vendors`)
      .then(r => r.json())
      .then(data => { setVendors(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Collect all unique scopes across all vendors
  const allScopes = [...new Set(vendors.flatMap(v => Array.isArray(v.scope) ? v.scope : (v.scope ? [v.scope] : [])))].sort();

  const filtered = vendors.filter(v => {
    const scopes = Array.isArray(v.scope) ? v.scope : (v.scope ? [v.scope] : []);
    const matchSearch = !search || [v.name, v.primary_contact, v.email].some(f => f?.toLowerCase().includes(search.toLowerCase()));
    const matchScope = !scopeFilter || scopes.includes(scopeFilter);
    return matchSearch && matchScope;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Vendors</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} in directory</p>
        </div>
        <button onClick={() => navigate('/vendors/new')}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          + Add Vendor
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search vendors, contacts, email..."
          style={{ flex: 1, padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <select value={scopeFilter} onChange={e => setScopeFilter(e.target.value)}
          style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', minWidth: 160 }}>
          <option value="">All Scopes</option>
          {allScopes.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Loading vendors...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
          {vendors.length === 0 ? 'No vendors yet — add your first one!' : 'No vendors match your search.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(v => {
            const scopes = Array.isArray(v.scope) ? v.scope : (v.scope ? [v.scope] : []);
            return (
              <div key={v.id} onClick={() => navigate(`/vendors/${v.id}`)}
                style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', border: '1px solid #f1f5f9', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: NAVY, flex: 1, marginRight: 8 }}>{v.name}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                    {scopes.map((s, i) => (
                      <span key={s} style={{
                        background: getScopeColor(s, allScopes) + '20',
                        color: getScopeColor(s, allScopes),
                        border: `1px solid ${getScopeColor(s, allScopes)}40`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap'
                      }}>{s}</span>
                    ))}
                  </div>
                </div>
                {v.primary_contact && <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>👤 {v.primary_contact}</div>}
                {v.phone && <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>📞 {v.phone}</div>}
                {v.email && <div style={{ fontSize: 13, color: BLUE, marginBottom: 4 }}>✉️ {v.email}</div>}
                {v.website && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>🌐 {v.website.replace(/^https?:\/\//, '')}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
