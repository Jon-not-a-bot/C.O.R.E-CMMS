import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NAV = '#1B2D4F';
const BLUE = '#3AACDC';
const CRIT_COLORS = { A: '#ef4444', B: '#f59e0b', C: '#22c55e' };
const CRIT_LABELS = { A: 'Critical', B: 'Important', C: 'Standard' };

const CATEGORIES = ['All', 'PIT Fleet', 'Dock Equipment', 'HVAC & Heating', 'Electrical', 'Life Safety', 'Building Envelope', 'Utilities'];

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterCrit, setFilterCrit] = useState('All');
  const navigate = useNavigate();

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterCat !== 'All') params.category = filterCat;
      if (filterCrit !== 'All') params.criticality = filterCrit;
      const res = await axios.get('/api/assets', { params });
      setAssets(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAssets(); }, [search, filterCat, filterCrit]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAV }}>Asset Registry</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{assets.length} assets</p>
        </div>
        <button onClick={() => navigate('/assets/new')} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add Asset
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Search name, ID, location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
        />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCrit} onChange={e => setFilterCrit(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' }}>
          {['All', 'A', 'B', 'C'].map(c => <option key={c}>{c === 'All' ? 'All Criticality' : `Tier ${c}`}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>Loading...</div>
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 600, color: NAV }}>No assets found</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Try a different search or add a new asset</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Asset ID', 'Name', 'Category', 'Location', 'Tier', 'Condition', 'Next PM', 'Managed By', ''].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((a, i) => (
                  <tr key={a.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '12px 14px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{a.asset_id || '—'}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: NAV }}>{a.name}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{a.category}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{a.location || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: CRIT_COLORS[a.criticality] + '20', color: CRIT_COLORS[a.criticality], padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        {a.criticality}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                        background: { New: '#dbeafe', Good: '#dcfce7', Fair: '#fef9c3', Poor: '#fee2e2', Critical: '#fce7f3' }[a.condition] || '#f1f5f9',
                        color: { New: '#1d4ed8', Good: '#16a34a', Fair: '#ca8a04', Poor: '#dc2626', Critical: '#be185d' }[a.condition] || '#64748b'
                      }}>{a.condition}</span>
                    </td>
                    <td style={{ padding: '12px 14px', color: a.next_pm_date && new Date(a.next_pm_date) <= new Date(Date.now() + 30*86400000) ? '#ef4444' : '#475569', fontSize: 13 }}>
                      {a.next_pm_date ? new Date(a.next_pm_date).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, background: '#f1f5f9', color: '#475569' }}>
                        {a.management_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => navigate(`/assets/${a.id}`)} style={{ background: 'transparent', border: `1px solid ${BLUE}`, color: BLUE, borderRadius: 6, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
