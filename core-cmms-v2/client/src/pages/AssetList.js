import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CONDITION_COLORS = { Excellent: '#22c55e', Good: '#3AACDC', Fair: '#f59e0b', Poor: '#f97316', Critical: '#ef4444' };

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  useEffect(() => {
    authFetch(`${API}/api/assets`)
      .then(r => r.json())
      .then(data => { setAssets(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(assets.map(a => a.category).filter(Boolean))].sort();

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || (a.asset_id || '').toLowerCase().includes(q) || (a.location || '').toLowerCase().includes(q);
    const matchCategory = !filterCategory || a.category === filterCategory;
    const matchCondition = !filterCondition || a.condition === filterCondition;
    return matchSearch && matchCategory && matchCondition;
  });

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading assets...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 700, margin: 0 }}>Assets</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{assets.length} total · {assets.filter(a => a.condition === 'Critical' || a.condition === 'Poor').length} offline</p>
        </div>
        <button onClick={() => navigate('/assets/new')}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + New Asset
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Conditions</option>
          {['Excellent', 'Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {['Asset ID', 'Name', 'Category', 'Location', 'Condition', 'Criticality', 'Next PM'].map(h => (
                <th key={h} style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                {assets.length === 0 ? 'No assets yet. Add your first asset.' : 'No assets match your filters.'}
              </td></tr>
            ) : filtered.map((a, i) => {
              const pmDate = a.next_pm_date ? new Date(a.next_pm_date) : null;
              const pmOverdue = pmDate && pmDate < new Date();
              return (
                <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{a.asset_id || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{a.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{a.category || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{a.location || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: (CONDITION_COLORS[a.condition] || '#94a3b8') + '20', color: CONDITION_COLORS[a.condition] || '#94a3b8', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>{a.condition || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: a.criticality === 'A' ? '#ef4444' : '#64748b' }}>{a.criticality || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: pmOverdue ? '#ef4444' : '#64748b', fontWeight: pmOverdue ? 700 : 400 }}>
                    {pmDate ? pmDate.toLocaleDateString() : '—'}{pmOverdue ? ' ⚠️' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
