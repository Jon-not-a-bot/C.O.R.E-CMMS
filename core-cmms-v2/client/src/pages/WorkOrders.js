import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const PRIORITY_COLORS = { Emergency: '#ef4444', High: '#f59e0b', Medium: '#3AACDC', Low: '#22c55e' };
const STATUS_COLORS = { Open: '#ef4444', 'In Progress': '#f59e0b', 'On Hold': '#8b5cf6', Closed: '#22c55e' };

export default function WorkOrders() {
  const [wos, setWos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  useEffect(() => {
    authFetch(`${API}/api/workorders`)
      .then(r => r.json())
      .then(data => { setWos(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = wos.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.title.toLowerCase().includes(q) || (w.wo_number || '').toLowerCase().includes(q) || (w.location || '').toLowerCase().includes(q);
    const matchStatus = !filterStatus || w.status === filterStatus;
    const matchPriority = !filterPriority || w.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const open = wos.filter(w => w.status !== 'Closed').length;
  const emergency = wos.filter(w => w.priority === 'Emergency' && w.status !== 'Closed').length;

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading work orders...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 700, margin: 0 }}>Work Orders</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>{open} open · {emergency > 0 ? <span style={{ color: '#ef4444' }}>{emergency} emergency</span> : '0 emergency'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.open('/request', '_blank')}
            style={{ background: '#fff', color: NAVY, border: `1px solid ${NAVY}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🔗 Request Link
          </button>
          <button onClick={() => navigate('/workorders/new')}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + New Work Order
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {['Open', 'In Progress', 'On Hold', 'Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Priorities</option>
          {['Emergency', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {['WO #', 'Title', 'Priority', 'Status', 'Asset', 'Location', 'Assigned To', 'Due', 'Source'].map(h => (
                <th key={h} style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                {wos.length === 0 ? 'No work orders yet.' : 'No work orders match your filters.'}
              </td></tr>
            ) : filtered.map((w, i) => {
              const due = w.due_date ? new Date(w.due_date) : null;
              const overdue = due && due < new Date() && w.status !== 'Closed';
              return (
                <tr key={w.id} onClick={() => navigate(`/workorders/${w.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{w.wo_number}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{w.title}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: (PRIORITY_COLORS[w.priority] || '#94a3b8') + '20', color: PRIORITY_COLORS[w.priority] || '#94a3b8', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>{w.priority}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: (STATUS_COLORS[w.status] || '#94a3b8') + '20', color: STATUS_COLORS[w.status] || '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 20 }}>{w.status}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{w.asset_name || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{w.location || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{w.assigned_to || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 700 : 400 }}>
                    {due ? due.toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: w.source === 'Request' ? '#fef3c7' : '#f1f5f9', color: w.source === 'Request' ? '#d97706' : '#64748b', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{w.source || 'Internal'}</span>
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
