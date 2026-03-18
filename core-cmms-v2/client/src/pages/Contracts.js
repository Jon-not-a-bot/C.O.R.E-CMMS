import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CONTRACT_TYPES = ['Service','Maintenance','Lease','Warranty','SLA','Insurance','Vendor','Other'];

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

function getContractStatus(contract) {
  if (!contract.end_date) return { label: 'No Expiry', color: '#94a3b8', bg: '#f1f5f9' };
  const now = new Date();
  const end = new Date(contract.end_date);
  const notice = new Date(contract.notice_date || end);
  const daysToEnd = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  if (end < now) return { label: 'Expired', color: '#ef4444', bg: '#fef2f2', daysToEnd };
  if (now >= notice) return { label: 'Action Required', color: '#f59e0b', bg: '#fffbeb', daysToEnd };
  if (daysToEnd <= 90) return { label: 'Expiring Soon', color: '#f59e0b', bg: '#fffbeb', daysToEnd };
  return { label: 'Active', color: '#22c55e', bg: '#f0fdf4', daysToEnd };
}

// ── Calendar View ──
function ContractCalendar({ contracts }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selected, setSelected] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // Build event map: date string → array of events
  const events = {};
  contracts.forEach(c => {
    if (c.end_date) {
      const key = c.end_date.split('T')[0];
      if (!events[key]) events[key] = [];
      events[key].push({ ...c, eventType: 'expiry' });
    }
    if (c.notice_date) {
      const key = c.notice_date.split('T')[0];
      if (!events[key]) events[key] = [];
      events[key].push({ ...c, eventType: 'notice' });
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Calendar header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={() => setCurrentDate(new Date(year, month - 1))}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>←</button>
        <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 700 }}>{monthNames[month]} {year}</h2>
        <button onClick={() => setCurrentDate(new Date(year, month + 1))}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>→</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444', display: 'inline-block' }} /> Expiry date</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b', display: 'inline-block' }} /> Notice deadline</span>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 2 }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', padding: '6px 0' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayEvents = events[dateStr] || [];
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          const expiryEvents = dayEvents.filter(e => e.eventType === 'expiry');
          const noticeEvents = dayEvents.filter(e => e.eventType === 'notice');
          return (
            <div key={idx} onClick={() => dayEvents.length && setSelected({ date: dateStr, events: dayEvents })}
              style={{ minHeight: 64, background: isToday ? '#f0f9ff' : '#fff', border: `1px solid ${isToday ? BLUE : '#f1f5f9'}`, borderRadius: 8, padding: 4, cursor: dayEvents.length ? 'pointer' : 'default', transition: 'all 0.1s' }}>
              <div style={{ fontSize: 12, fontWeight: isToday ? 700 : 400, color: isToday ? BLUE : '#374151', marginBottom: 2 }}>{day}</div>
              {expiryEvents.slice(0,2).map((e, i) => (
                <div key={i} style={{ background: '#fef2f2', color: '#ef4444', fontSize: 10, fontWeight: 600, borderRadius: 3, padding: '1px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ⚠ {e.name}
                </div>
              ))}
              {noticeEvents.slice(0,2).map((e, i) => (
                <div key={i} style={{ background: '#fffbeb', color: '#d97706', fontSize: 10, fontWeight: 600, borderRadius: 3, padding: '1px 4px', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  📋 {e.name}
                </div>
              ))}
              {dayEvents.length > 2 && <div style={{ fontSize: 10, color: '#94a3b8' }}>+{dayEvents.length - 2} more</div>}
            </div>
          );
        })}
      </div>

      {/* Day detail modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 440, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ color: NAVY, fontSize: 16, fontWeight: 700 }}>{new Date(selected.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>
              <div onClick={() => setSelected(null)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 20 }}>✕</div>
            </div>
            {selected.events.map((e, i) => (
              <div key={i} style={{ background: e.eventType === 'expiry' ? '#fef2f2' : '#fffbeb', borderRadius: 10, padding: 14, marginBottom: 10, borderLeft: `4px solid ${e.eventType === 'expiry' ? '#ef4444' : '#f59e0b'}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{e.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {e.eventType === 'expiry' ? '⚠️ Contract expires' : '📋 Notice deadline — action required'}
                </div>
                {e.vendor_name && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Vendor: {e.vendor_name}</div>}
                {e.auto_renew && <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>↻ Auto-renews</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Contract Form Modal ──
function ContractForm({ contract, vendors, assets, onSave, onClose }) {
  const { authFetch } = useAuth();
  const scanInputRef = React.useRef();
  const [form, setForm] = useState({
    name: contract?.name || '',
    vendor_id: contract?.vendor_id || '',
    asset_id: contract?.asset_id || '',
    type: contract?.type || 'Service',
    status: contract?.status || 'Active',
    start_date: contract?.start_date ? contract.start_date.split('T')[0] : '',
    end_date: contract?.end_date ? contract.end_date.split('T')[0] : '',
    notice_period_days: contract?.notice_period_days || 30,
    auto_renew: contract?.auto_renew || false,
    value: contract?.value || '',
    notes: contract?.notes || '',
    document_url: contract?.document_url || '',
  });
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' };

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true); setScanResult(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await authFetch(`${API}/api/scan-contract`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setForm(prev => ({
        ...prev,
        name: f.name || prev.name,
        type: f.type || prev.type,
        value: f.value || prev.value,
        start_date: f.start_date || prev.start_date,
        end_date: f.end_date || prev.end_date,
        notice_period_days: f.notice_period_days || prev.notice_period_days,
        auto_renew: f.auto_renew !== undefined ? f.auto_renew : prev.auto_renew,
        notes: f.notes ? (prev.notes ? prev.notes + '\n\n' + f.notes : f.notes) : prev.notes,
        document_url: data.document_url || prev.document_url,
      }));
      setScanResult({ success: true, vendor_name: f.vendor_name });
    } catch (err) { setScanResult({ success: false, error: err.message }); }
    setScanning(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Contract name is required'); return; }
    setSaving(true); setError('');
    const url = contract ? `${API}/api/contracts/${contract.id}` : `${API}/api/contracts`;
    const method = contract ? 'PUT' : 'POST';
    const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { onSave(); onClose(); }
    else { const d = await res.json(); setError(d.error || 'Save failed'); }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, padding: 28, maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ color: NAVY, fontSize: 18, fontWeight: 700, margin: 0 }}>{contract ? 'Edit Contract' : 'New Contract'}</h2>
          <div onClick={onClose} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: 22 }}>✕</div>
        </div>

        {/* Scan banner */}
        <div style={{ background: NAVY, borderRadius: 10, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>📄 Upload Contract Document</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>PDF or image — AI will auto-fill fields from the document</div>
          </div>
          <div>
            <input ref={scanInputRef} type="file" accept="image/*,.pdf" onChange={handleScan} style={{ display: 'none' }} />
            <button onClick={() => scanInputRef.current.click()} disabled={scanning}
              style={{ background: scanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
              {scanning ? 'Scanning...' : 'Upload & Scan'}
            </button>
          </div>
        </div>

        {scanResult && (
          <div style={{ background: scanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
            {scanResult.success
              ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Contract scanned — fields auto-filled. Review before saving.{scanResult.vendor_name ? ` Detected vendor: ${scanResult.vendor_name}` : ''}</span>
              : <span style={{ color: '#dc2626' }}>Scan failed: {scanResult.error}</span>}
          </div>
        )}

        {form.document_url && (
          <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>📎 Document attached</span>
            <a href={form.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: BLUE, fontWeight: 600, textDecoration: 'none' }}>View →</a>
          </div>
        )}

        {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Contract Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. HVAC Annual Service Agreement" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Type</label>
            <select value={form.type} onChange={e => set('type', e.target.value)} style={{ ...inp, background: '#fff' }}>
              {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={{ ...inp, background: '#fff' }}>
              {['Active','Pending','Expired','Cancelled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Vendor</label>
            <select value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="">— No vendor —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Linked Asset</label>
            <select value={form.asset_id} onChange={e => set('asset_id', e.target.value)} style={{ ...inp, background: '#fff' }}>
              <option value="">— No asset —</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Start Date</label>
            <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Expiration Date</label>
            <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Notice Period (days)</label>
            <input type="number" value={form.notice_period_days} onChange={e => set('notice_period_days', parseInt(e.target.value))} style={inp} min={0} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Annual Value ($)</label>
            <input type="number" value={form.value} onChange={e => set('value', e.target.value)} placeholder="0.00" style={inp} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="checkbox" id="auto_renew" checked={form.auto_renew} onChange={e => set('auto_renew', e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="auto_renew" style={{ fontSize: 14, color: '#374151' }}>Auto-renews</label>
          </div>
          {form.end_date && form.notice_period_days && (
            <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: BLUE }}>
              📋 Notice deadline: <strong>{new Date(new Date(form.end_date) - form.notice_period_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Key terms, contacts, renewal conditions..." style={{ ...inp, minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : contract ? 'Save Changes' : 'Create Contract'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Contracts Page ──
export default function Contracts() {
  const { authFetch } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const load = () => {
    Promise.all([
      authFetch(`${API}/api/contracts`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/vendors`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/assets`).then(r => r.json()).catch(() => []),
    ]).then(([c, v, a]) => {
      setContracts(Array.isArray(c) ? c : []);
      setVendors(Array.isArray(v) ? v : []);
      setAssets(Array.isArray(a) ? a : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return;
    await authFetch(`${API}/api/contracts/${id}`, { method: 'DELETE' });
    load();
  };

  const now = new Date();
  const actionRequired = contracts.filter(c => {
    if (!c.end_date) return false;
    const notice = new Date(c.notice_date || c.end_date);
    return notice <= now && new Date(c.end_date) > now;
  });
  const expiringSoon = contracts.filter(c => {
    if (!c.end_date) return false;
    const end = new Date(c.end_date);
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    const notice = new Date(c.notice_date || c.end_date);
    return days > 0 && days <= 90 && notice > now;
  });
  const expired = contracts.filter(c => c.end_date && new Date(c.end_date) < now);

  const filtered = contracts.filter(c => {
    const s = getContractStatus(c);
    const matchStatus = !filterStatus || s.label === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || (c.vendor_name || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading contracts...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, margin: 0 }}>Contracts</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>
            {contracts.length} total · <span style={{ color: actionRequired.length > 0 ? '#ef4444' : '#64748b' }}>{actionRequired.length} action required</span> · {expiringSoon.length} expiring soon
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 8, padding: 3 }}>
            {['list','calendar'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{ background: view === v ? '#fff' : 'transparent', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: view === v ? NAVY : '#94a3b8', boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                {v === 'list' ? '📋 List' : '📅 Calendar'}
              </button>
            ))}
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + New Contract
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active', value: contracts.filter(c => getContractStatus(c).label === 'Active').length, color: '#22c55e' },
          { label: 'Action Required', value: actionRequired.length, color: actionRequired.length > 0 ? '#ef4444' : '#94a3b8' },
          { label: 'Expiring Soon', value: expiringSoon.length, color: expiringSoon.length > 0 ? '#f59e0b' : '#94a3b8' },
          { label: 'Expired', value: expired.length, color: expired.length > 0 ? '#ef4444' : '#94a3b8' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${k.color}`, cursor: 'pointer' }}
            onClick={() => setFilterStatus(filterStatus === k.label ? '' : k.label)}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {view === 'calendar' ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <ContractCalendar contracts={contracts} />
        </div>
      ) : (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts..."
              style={{ flex: 1, minWidth: 160, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' }}>
              <option value="">All Statuses</option>
              {['Active','Action Required','Expiring Soon','Expired','No Expiry'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Contract list */}
          {filtered.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              No contracts yet. <span style={{ color: BLUE, cursor: 'pointer' }} onClick={() => setShowForm(true)}>Add your first →</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(c => {
                const s = getContractStatus(c);
                const noticeDt = c.notice_date ? new Date(c.notice_date + 'T12:00:00') : null;
                const endDt = c.end_date ? new Date(c.end_date + 'T12:00:00') : null;
                return (
                  <div key={c.id} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{c.name}</span>
                          <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{s.label}</span>
                          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>{c.type}</span>
                          {c.auto_renew && <span style={{ background: '#f0fdf4', color: '#16a34a', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>↻ Auto-renew</span>}
                        </div>
                        {/* Meta */}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                          {c.vendor_name && <span>🏢 {c.vendor_name}</span>}
                          {c.asset_name && <span>🔧 {c.asset_name}</span>}
                          {c.value && <span>💰 ${parseFloat(c.value).toLocaleString()}/yr</span>}
                        </div>
                        {/* Dates */}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                          {noticeDt && (
                            <span style={{ color: now >= noticeDt ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                              📋 Notice by: {noticeDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                          {endDt && (
                            <span style={{ color: s.color, fontWeight: s.label !== 'Active' ? 700 : 400 }}>
                              ⚠ Expires: {endDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {s.daysToEnd > 0 && ` (${s.daysToEnd}d)`}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {c.document_url && (
                          <a href={c.document_url} target="_blank" rel="noopener noreferrer"
                            style={{ background: '#f0f9ff', color: BLUE, border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none' }}>📎 View</a>
                        )}
                        <button onClick={() => { setEditing(c); setShowForm(true); }}
                          style={{ background: '#f1f5f9', color: NAVY, border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      {showForm && (
        <ContractForm
          contract={editing}
          vendors={vendors}
          assets={assets}
          onSave={load}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
