import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const PRIORITY_COLORS = { Emergency: '#ef4444', High: '#f59e0b', Medium: '#3AACDC', Low: '#22c55e' };
const STATUS_COLORS = { Open: '#ef4444', 'In Progress': '#f59e0b', 'On Hold': '#8b5cf6', Closed: '#22c55e' };

// ── BOTTOM TAB BAR ──
function TabBar() {
  const tabs = [
    { to: '/tech', label: 'My WOs', icon: '📋', end: true },
    { to: '/tech/pm', label: 'PM', icon: '🔧' },
    { to: '/tech/scan', label: 'Scan', icon: '📷' },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: NAVY, display: 'flex', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
      {tabs.map(t => (
        <NavLink key={t.to} to={t.to} end={t.end} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '10px 0 12px', textDecoration: 'none', gap: 3,
          color: isActive ? BLUE : '#94a3b8',
          borderTop: isActive ? `2px solid ${BLUE}` : '2px solid transparent',
        })}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{t.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

// ── MY WORK ORDERS ──
function TechWorkOrders() {
  const { user, authFetch } = useAuth();
  const [wos, setWos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    authFetch(`${API}/api/workorders`)
      .then(r => r.json())
      .then(data => {
        const mine = Array.isArray(data)
          ? data.filter(w => w.status !== 'Closed' && w.assigned_to?.toLowerCase().includes(user?.name?.toLowerCase().split(' ')[0]))
          : [];
        setWos(mine);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = (wo) => { setSelected(wo); setNote(''); setStatus(wo.status); };
  const closeDetail = () => { setSelected(null); setNote(''); setStatus(''); };

  const saveUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    await authFetch(`${API}/api/workorders/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...selected,
        status,
        resolution_notes: note ? (selected.resolution_notes ? selected.resolution_notes + '\n\n' + note : note) : selected.resolution_notes,
      })
    });
    setSaving(false);
    closeDetail();
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading your work orders...</div>;

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 700, margin: 0 }}>My Work Orders</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{wos.length} open assigned to you</p>
      </div>

      {wos.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          ✅ No open work orders assigned to you.
        </div>
      ) : wos.map(w => (
        <div key={w.id} onClick={() => openDetail(w)}
          style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${PRIORITY_COLORS[w.priority] || '#94a3b8'}`, cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{w.wo_number}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ background: (PRIORITY_COLORS[w.priority] || '#94a3b8') + '20', color: PRIORITY_COLORS[w.priority] || '#94a3b8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{w.priority}</span>
              <span style={{ background: (STATUS_COLORS[w.status] || '#94a3b8') + '20', color: STATUS_COLORS[w.status] || '#94a3b8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{w.status}</span>
            </div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{w.title}</div>
          <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {w.location && <span>📍 {w.location}</span>}
            {w.asset_name && <span>🔧 {w.asset_name}</span>}
          </div>
        </div>
      ))}

      {/* WO Detail Sheet */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '20px 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 4 }}>{selected.wo_number}</div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>{selected.title}</h2>
              </div>
              <div onClick={closeDetail} style={{ fontSize: 22, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>✕</div>
            </div>

            {selected.description && (
              <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                {selected.description}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Location', value: selected.location },
                { label: 'Asset', value: selected.asset_name },
                { label: 'Priority', value: selected.priority },
                { label: 'Due', value: selected.due_date ? new Date(selected.due_date).toLocaleDateString() : null },
              ].filter(x => x.value).map(x => (
                <div key={x.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{x.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{x.value}</div>
                </div>
              ))}
            </div>

            {/* Update status */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Update Status</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Open', 'In Progress', 'On Hold', 'Closed'].map(s => (
                  <div key={s} onClick={() => setStatus(s)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: `2px solid ${status === s ? STATUS_COLORS[s] : '#e2e8f0'}`, background: status === s ? STATUS_COLORS[s] + '15' : '#fff', cursor: 'pointer', fontSize: 13, fontWeight: status === s ? 700 : 400, color: status === s ? STATUS_COLORS[s] : '#64748b' }}>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Add a Note</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What did you do? Any parts needed? Issues found?"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, minHeight: 90, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }} />
            </div>

            <button onClick={saveUpdate} disabled={saving}
              style={{ width: '100%', background: NAVY, color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Update'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PM CHECKLISTS ──
function TechPM() {
  const { user, authFetch } = useAuth();
  const [wos, setWos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    authFetch(`${API}/api/workorders`)
      .then(r => r.json())
      .then(data => {
        const pmWos = Array.isArray(data)
          ? data.filter(w => w.type === 'PM' && w.status !== 'Closed' && w.assigned_to?.toLowerCase().includes(user?.name?.toLowerCase().split(' ')[0]))
          : [];
        setWos(pmWos);
        setLoading(false);
      }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openPM = (wo) => {
    setSelected(wo);
    const cl = Array.isArray(wo.checklist) ? wo.checklist : (typeof wo.checklist === 'string' ? JSON.parse(wo.checklist || '[]') : []);
    setChecklist(cl.map(item => ({ ...item, checked: item.checked || false })));
  };

  const toggleItem = (idx) => {
    setChecklist(prev => prev.map((item, i) => i === idx ? { ...item, checked: !item.checked } : item));
  };

  const closePM = async () => {
    if (!selected) return;
    const allChecked = checklist.every(item => item.checked);
    if (!allChecked) {
      if (!window.confirm('Not all checklist items are complete. Close WO anyway?')) return;
    }
    setSaving(true);
    await authFetch(`${API}/api/workorders/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...selected, status: 'Closed', checklist })
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  const saveProgress = async () => {
    if (!selected) return;
    setSaving(true);
    await authFetch(`${API}/api/workorders/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...selected, checklist, status: 'In Progress' })
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading PM work orders...</div>;

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 700, margin: 0 }}>PM Checklists</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{wos.length} PM{wos.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      {wos.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#94a3b8' }}>
          ✅ No PM work orders assigned to you.
        </div>
      ) : wos.map(w => {
        const cl = Array.isArray(w.checklist) ? w.checklist : (typeof w.checklist === 'string' ? JSON.parse(w.checklist || '[]') : []);
        const checked = cl.filter(i => i.checked).length;
        return (
          <div key={w.id} onClick={() => openPM(w)}
            style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${BLUE}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginBottom: 4 }}>{w.wo_number}</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{w.title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#64748b' }}>{w.location || '—'}{w.asset_name ? ` · ${w.asset_name}` : ''}</div>
              {cl.length > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: checked === cl.length ? '#22c55e' : '#f59e0b' }}>
                  {checked}/{cl.length} done
                </span>
              )}
            </div>
            {cl.length > 0 && (
              <div style={{ marginTop: 8, background: '#f1f5f9', borderRadius: 20, height: 6, overflow: 'hidden' }}>
                <div style={{ width: `${cl.length > 0 ? (checked / cl.length) * 100 : 0}%`, height: '100%', background: checked === cl.length ? '#22c55e' : BLUE, borderRadius: 20, transition: 'width 0.3s' }} />
              </div>
            )}
          </div>
        );
      })}

      {/* PM Checklist Sheet */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '20px 20px 40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: NAVY, margin: 0 }}>{selected.title}</h2>
              <div onClick={() => setSelected(null)} style={{ fontSize: 22, color: '#94a3b8', cursor: 'pointer' }}>✕</div>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              {checklist.filter(i => i.checked).length} of {checklist.length} items complete
            </div>

            {checklist.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 14, padding: '20px 0' }}>No checklist items on this PM.</div>
            ) : checklist.map((item, idx) => (
              <div key={item.id || idx} onClick={() => toggleItem(idx)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${item.checked ? '#22c55e' : '#cbd5e1'}`, background: item.checked ? '#22c55e' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {item.checked && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 15, color: item.checked ? '#94a3b8' : '#1e293b', textDecoration: item.checked ? 'line-through' : 'none', flex: 1 }}>{item.text}</span>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={saveProgress} disabled={saving}
                style={{ flex: 1, background: '#f1f5f9', color: NAVY, border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Save Progress
              </button>
              <button onClick={closePM} disabled={saving}
                style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Saving...' : 'Complete PM ✓'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── ASSET QR SCAN ──
function TechScan() {
  const { authFetch } = useAuth();
  const [assetId, setAssetId] = useState('');
  const [asset, setAsset] = useState(null);
  const [wos, setWos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-handle QR scan URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('asset');
    if (id) lookup(id);
  }, []);

  const lookup = async (id) => {
    const searchId = id || assetId;
    if (!searchId) return;
    setLoading(true); setError(''); setAsset(null);
    try {
      const [aRes, wRes] = await Promise.all([
        authFetch(`${API}/api/assets/${searchId}`).then(r => r.ok ? r.json() : null),
        authFetch(`${API}/api/workorders?asset_id=${searchId}`).then(r => r.json()).catch(() => []),
      ]);
      if (!aRes) { setError('Asset not found.'); }
      else { setAsset(aRes); setWos(Array.isArray(wRes) ? wRes.filter(w => w.status !== 'Closed') : []); }
    } catch { setError('Something went wrong.'); }
    setLoading(false);
  };

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 700, margin: 0 }}>Asset Lookup</h1>
        <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>Scan a QR code or enter an asset ID</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <input value={assetId} onChange={e => setAssetId(e.target.value)} placeholder="Enter asset ID..."
          style={{ flex: 1, padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          onKeyDown={e => e.key === 'Enter' && lookup()} />
        <button onClick={() => lookup()} disabled={loading}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          {loading ? '...' : 'Look Up'}
        </button>
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {asset && (
        <div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{asset.asset_id}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginBottom: 8 }}>{asset.name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Category', value: asset.category },
                { label: 'Location', value: asset.location },
                { label: 'Condition', value: asset.condition },
                { label: 'Criticality', value: asset.criticality ? `${asset.criticality}-Tier` : null },
              ].filter(x => x.value).map(x => (
                <div key={x.label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{x.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{x.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>
            Open Work Orders ({wos.length})
          </div>
          {wos.length === 0 ? (
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '14px 16px', color: '#16a34a', fontSize: 14 }}>
              ✅ No open work orders for this asset.
            </div>
          ) : wos.map(w => (
            <div key={w.id} style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.07)', borderLeft: `3px solid ${PRIORITY_COLORS[w.priority] || '#94a3b8'}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>{w.title}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ background: (PRIORITY_COLORS[w.priority] || '#94a3b8') + '20', color: PRIORITY_COLORS[w.priority] || '#94a3b8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{w.priority}</span>
                <span style={{ background: (STATUS_COLORS[w.status] || '#94a3b8') + '20', color: STATUS_COLORS[w.status] || '#94a3b8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── TECH LAYOUT WRAPPER ──
export default function TechLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Top bar */}
      <div style={{ background: NAVY, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 2, color: '#fff' }}>C.O.R.E. <span style={{ fontWeight: 300, fontSize: 12, color: '#94a3b8' }}>CMMS</span></div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{user?.name}</div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<TechWorkOrders />} />
        <Route path="/pm" element={<TechPM />} />
        <Route path="/scan" element={<TechScan />} />
        <Route path="*" element={<Navigate to="/tech" replace />} />
      </Routes>

      <TabBar />
    </div>
  );
}
