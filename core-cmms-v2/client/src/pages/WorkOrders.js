import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const PRIORITY_COLORS = { Emergency: '#ef4444', High: '#f59e0b', Medium: '#3AACDC', Low: '#22c55e' };
const STATUS_COLORS = { Open: '#ef4444', 'In Progress': '#f59e0b', 'On Hold': '#8b5cf6', Closed: '#22c55e' };

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

// Inline quick-edit select — stops click propagation so row doesn't navigate
function QuickSelect({ value, options, onChange, colorMap }) {
  const color = colorMap?.[value] || '#64748b';
  return (
    <select
      value={value}
      onClick={e => e.stopPropagation()}
      onChange={e => { e.stopPropagation(); onChange(e.target.value); }}
      style={{
        background: color + '18', color, border: `1px solid ${color}40`,
        borderRadius: 20, padding: '2px 8px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none',
        paddingRight: 20, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='${encodeURIComponent(color)}'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center',
      }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function QuickAssign({ value, users, onChange }) {
  return (
    <select
      value={value || ''}
      onClick={e => e.stopPropagation()}
      onChange={e => { e.stopPropagation(); onChange(e.target.value); }}
      style={{
        background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
        borderRadius: 6, padding: '2px 8px', fontSize: 12, cursor: 'pointer',
        outline: 'none', maxWidth: 140,
      }}>
      <option value="">— Unassigned —</option>
      {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
      <optgroup label="── Roles ──">
        {['PIT Tech','Dock Tech','HVAC Tech','Electrical Tech','Safety Tech','Facilities Tech'].map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </optgroup>
    </select>
  );
}

export default function WorkOrders() {
  const [wos, setWos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';

  const load = () => {
    authFetch(`${API}/api/workorders`)
      .then(r => r.json())
      .then(data => { setWos(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      authFetch(`${API}/api/users`).then(r => r.json()).then(data => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
    }
  }, []);

  const quickUpdate = async (woId, field, value) => {
    const wo = wos.find(w => w.id === woId);
    if (!wo) return;
    // Optimistic update
    setWos(prev => prev.map(w => w.id === woId ? { ...w, [field]: value } : w));
    try {
      await authFetch(`${API}/api/workorders/${woId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wo, [field]: value })
      });
    } catch {
      // Revert on failure
      setWos(prev => prev.map(w => w.id === woId ? wo : w));
    }
  };

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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, margin: 0 }}>Work Orders</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
            {open} open · <span style={{ color: emergency > 0 ? '#ef4444' : '#64748b' }}>{emergency} emergency</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, width: isMobile ? '100%' : 'auto' }}>
          {!isMobile && (
            <button onClick={() => window.open('/request', '_blank')}
              style={{ background: '#fff', color: NAVY, border: `1px solid ${NAVY}`, borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              🔗 Request Link
            </button>
          )}
          <button onClick={() => navigate('/workorders/new')}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', flex: isMobile ? 1 : 'none' }}>
            + New Work Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search work orders..."
          style={{ flex: 1, minWidth: 160, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
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

      {filtered.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {wos.length === 0 ? 'No work orders yet.' : 'No work orders match your filters.'}
        </div>
      ) : isMobile ? (
        /* ── MOBILE CARD LIST ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(w => {
            const due = w.due_date ? new Date(w.due_date) : null;
            const overdue = due && due < new Date() && w.status !== 'Closed';
            return (
              <div key={w.id} onClick={() => navigate(`/workorders/${w.id}`)}
                style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: `4px solid ${PRIORITY_COLORS[w.priority] || '#94a3b8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{w.wo_number}</span>
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {isAdmin ? (
                      <QuickSelect value={w.priority} options={['Emergency','High','Medium','Low']} colorMap={PRIORITY_COLORS} onChange={v => quickUpdate(w.id, 'priority', v)} />
                    ) : (
                      <span style={{ background: (PRIORITY_COLORS[w.priority] || '#94a3b8') + '20', color: PRIORITY_COLORS[w.priority] || '#94a3b8', fontWeight: 700, fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{w.priority}</span>
                    )}
                    <span style={{ background: (STATUS_COLORS[w.status] || '#94a3b8') + '20', color: STATUS_COLORS[w.status] || '#94a3b8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{w.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{w.title}</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#64748b', alignItems: 'center' }}>
                  {w.location && <span>📍 {w.location}</span>}
                  {isAdmin ? (
                    <span onClick={e => e.stopPropagation()}>
                      👤 <QuickAssign value={w.assigned_to} users={users} onChange={v => quickUpdate(w.id, 'assigned_to', v)} />
                    </span>
                  ) : w.assigned_to && <span>👤 {w.assigned_to}</span>}
                  {due && <span style={{ color: overdue ? '#ef4444' : '#64748b', fontWeight: overdue ? 700 : 400 }}>📅 {due.toLocaleDateString()}{overdue ? ' ⚠️' : ''}</span>}
                  {w.source === 'Request' && <span style={{ background: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: 10 }}>Request</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DESKTOP TABLE ── */
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
              {filtered.map((w, i) => {
                const due = w.due_date ? new Date(w.due_date) : null;
                const overdue = due && due < new Date() && w.status !== 'Closed';
                return (
                  <tr key={w.id} onClick={() => navigate(`/workorders/${w.id}`)}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafafa' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{w.wo_number}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{w.title}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => isAdmin && e.stopPropagation()}>
                      {isAdmin ? (
                        <QuickSelect value={w.priority} options={['Emergency','High','Medium','Low']} colorMap={PRIORITY_COLORS} onChange={v => quickUpdate(w.id, 'priority', v)} />
                      ) : (
                        <span style={{ background: (PRIORITY_COLORS[w.priority] || '#94a3b8') + '20', color: PRIORITY_COLORS[w.priority] || '#94a3b8', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>{w.priority}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: (STATUS_COLORS[w.status] || '#94a3b8') + '20', color: STATUS_COLORS[w.status] || '#94a3b8', fontSize: 12, padding: '2px 8px', borderRadius: 20 }}>{w.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{w.asset_name || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{w.location || '—'}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => isAdmin && e.stopPropagation()}>
                      {isAdmin ? (
                        <QuickAssign value={w.assigned_to} users={users} onChange={v => quickUpdate(w.id, 'assigned_to', v)} />
                      ) : (
                        <span style={{ fontSize: 13, color: '#475569' }}>{w.assigned_to || '—'}</span>
                      )}
                    </td>
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
      )}
    </div>
  );
}
