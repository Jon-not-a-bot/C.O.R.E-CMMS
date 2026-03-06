import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NAV = '#1B2D4F';
const BLUE = '#3AACDC';

const CRIT_COLORS = { A: '#ef4444', B: '#f59e0b', C: '#22c55e' };
const CRIT_LABELS = { A: 'Critical', B: 'Important', C: 'Standard' };

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      axios.get('/api/assets/meta/stats').catch(() => ({ data: null })),
      axios.get('/api/assets?limit=5').catch(() => ({ data: [] }))
    ]).then(([statsRes, assetsRes]) => {
      setStats(statsRes.data);
      setRecentAssets(Array.isArray(assetsRes.data) ? assetsRes.data.slice(0, 6) : []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading dashboard...</div>;

  const kpis = [
    { label: 'Total Assets', value: stats?.total ?? 0, color: BLUE },
    { label: 'A-Tier Critical', value: stats?.byCriticality?.find(r => r.criticality === 'A')?.count ?? 0, color: '#ef4444' },
    { label: 'PM Due ≤30 Days', value: stats?.pmDueSoon ?? 0, color: '#f59e0b' },
    { label: 'Vendor Managed', value: recentAssets.filter(a => a.management_type === 'Vendor').length, color: '#8b5cf6' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: NAV }}>Facilities Dashboard</h1>
        <p style={{ color: '#64748b', marginTop: 4 }}>C.O.R.E. — Conditions · Operations · Reliability · Engineering</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Category Breakdown */}
      {stats?.byCategory?.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NAV, marginBottom: 16 }}>Assets by Category</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {stats.byCategory.map(c => (
              <div key={c.category} style={{ background: '#f1f5f9', borderRadius: 8, padding: '8px 16px', fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: NAV }}>{c.category}</span>
                <span style={{ color: '#64748b', marginLeft: 8 }}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Assets */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: NAV }}>Asset Registry</h2>
          <button onClick={() => navigate('/assets')} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
            View All
          </button>
        </div>
        {recentAssets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600 }}>No assets yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Add your first asset to get started</div>
            <button onClick={() => navigate('/assets/new')} style={{ marginTop: 16, background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
              + Add First Asset
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['ID', 'Name', 'Category', 'Location', 'Criticality', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAssets.map((a, i) => (
                  <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '10px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: 12 }}>{a.asset_id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: NAV }}>{a.name}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{a.category}</td>
                    <td style={{ padding: '10px 12px', color: '#475569' }}>{a.location}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: CRIT_COLORS[a.criticality] + '20', color: CRIT_COLORS[a.criticality], padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                        {a.criticality} — {CRIT_LABELS[a.criticality]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: a.status === 'Active' ? '#dcfce7' : '#fee2e2', color: a.status === 'Active' ? '#16a34a' : '#dc2626', padding: '2px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                        {a.status}
                      </span>
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
