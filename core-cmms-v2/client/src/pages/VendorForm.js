import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const DEFAULT_SCOPES = [
  'HVAC & Mechanical', 'Electrical', 'Plumbing', 'Fire & Life Safety',
  'Dock Equipment', 'PIT / Forklift', 'Pest Control', 'Cleaning & Janitorial',
  'Security', 'IT & Technology', 'Landscaping', 'Roofing', 'Sprinkler Systems',
  'General Contractor', 'Flooring', 'Waste & Recycling', 'Other'
];

const SCOPE_COLORS = {
  'HVAC & Mechanical': '#ef4444', 'Electrical': '#f59e0b', 'Plumbing': '#3b82f6',
  'Fire & Life Safety': '#ef4444', 'Dock Equipment': '#8b5cf6', 'PIT / Forklift': '#8b5cf6',
  'Pest Control': '#22c55e', 'Cleaning & Janitorial': '#06b6d4', 'Security': '#64748b',
  'IT & Technology': '#6366f1', 'Landscaping': '#22c55e', 'Roofing': '#92400e',
  'Sprinkler Systems': '#3b82f6', 'General Contractor': '#f59e0b', 'Flooring': '#a16207',
  'Waste & Recycling': '#16a34a', 'Other': '#94a3b8'
};

const getScopeColor = (scope) => SCOPE_COLORS[scope] || '#3AACDC';

const inputStyle = { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' };

const Field = ({ label, required, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: 11, color: '#94a3b8' }}>{hint}</div>}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
    <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>{children}</div>
  </div>
);

function ScopeSelector({ scopes, onChange }) {
  const [customInput, setCustomInput] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const addScope = (scope) => {
    const trimmed = scope.trim();
    if (trimmed && !scopes.includes(trimmed)) onChange([...scopes, trimmed]);
    setCustomInput('');
    setShowDropdown(false);
  };

  const removeScope = (scope) => onChange(scopes.filter(s => s !== scope));

  const availableScopes = DEFAULT_SCOPES.filter(s =>
    !scopes.includes(s) &&
    (customInput === '' || s.toLowerCase().includes(customInput.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: scopes.length > 0 ? 10 : 0 }}>
        {scopes.map(scope => (
          <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: 6, background: getScopeColor(scope) + '15', border: `1px solid ${getScopeColor(scope)}40`, borderRadius: 20, padding: '4px 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: getScopeColor(scope) }}>{scope}</span>
            <button onClick={() => removeScope(scope)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: getScopeColor(scope), fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={customInput} onChange={e => { setCustomInput(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={e => { if (e.key === 'Enter' && customInput.trim()) { e.preventDefault(); addScope(customInput); } }}
            placeholder="Search or type a custom scope..."
            style={{ ...inputStyle, flex: 1 }} />
          {customInput.trim() && (
            <button onClick={() => addScope(customInput)}
              style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              + Add
            </button>
          )}
        </div>
        {showDropdown && availableScopes.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
            {availableScopes.map(scope => (
              <div key={scope} onClick={() => addScope(scope)}
                style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: getScopeColor(scope), flexShrink: 0 }} />
                {scope}
              </div>
            ))}
          </div>
        )}
      </div>
      {showDropdown && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowDropdown(false)} />}
    </div>
  );
}

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, token } = useAuth();
  const isEdit = Boolean(id);
  const scanInputRef = useRef();
  const dropZoneRef = useRef();

  const [form, setForm] = useState({
    name: '', scopes: [], phone: '', email: '',
    primary_contact: '', website: '', notes: '',
    contract_start: '', contract_end: '', contract_notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (isEdit) {
      authFetch(`${API}/api/vendors/${id}`)
        .then(r => r.json())
        .then(v => setForm({
          name: v.name || '',
          scopes: Array.isArray(v.scope) ? v.scope : (v.scope ? [v.scope] : []),
          phone: v.phone || '', email: v.email || '',
          primary_contact: v.primary_contact || '',
          website: v.website || '', notes: v.notes || '',
          contract_start: v.contract_start ? v.contract_start.split('T')[0] : '',
          contract_end: v.contract_end ? v.contract_end.split('T')[0] : '',
          contract_notes: v.contract_notes || ''
        }))
        .catch(() => setError('Failed to load vendor.'));
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const scanImage = async (file) => {
    if (!file) return;
    setScanning(true); setScanResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API}/api/scan-vendor-contact`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.fields) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setForm(prev => {
        const newScopes = [...prev.scopes];
        if (f.scope && !newScopes.includes(f.scope)) newScopes.push(f.scope);
        return { ...prev, name: f.name || prev.name, primary_contact: f.primary_contact || prev.primary_contact, phone: f.phone || prev.phone, email: f.email || prev.email, website: f.website || prev.website, scopes: newScopes };
      });
      setScanResult({ success: true });
    } catch (err) { setScanResult({ success: false, error: err.message }); }
    setScanning(false);
  };

  const handleFileInput = (e) => scanImage(e.target.files[0]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files[0]; if (file && file.type.startsWith('image/')) scanImage(file); };
  const handlePaste = (e) => { const items = e.clipboardData?.items; if (!items) return; for (const item of items) { if (item.type.startsWith('image/')) { scanImage(item.getAsFile()); break; } } };

  const submit = async () => {
    if (!form.name.trim()) { setError('Vendor name is required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `${API}/api/vendors/${id}` : `${API}/api/vendors`;
      const method = isEdit ? 'PUT' : 'POST';
      const payload = { ...form, scope: form.scopes };
      const res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Save failed'); }
      const saved = await res.json();
      navigate(`/vendors/${saved.id || id}`);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div onPaste={handlePaste}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Harleysville Facility</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
      </div>

      <div ref={dropZoneRef} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
        style={{ background: dragging ? '#1e3a5f' : NAVY, border: dragging ? `2px dashed ${BLUE}` : '2px solid transparent', borderRadius: 12, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, transition: 'all 0.15s' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📇 Scan Contact Info</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Drop a screenshot, paste from clipboard (Ctrl+V), or take a photo of a business card or email signature to auto-fill fields.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={scanInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <button onClick={() => scanInputRef.current.click()} disabled={scanning}
            style={{ background: scanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer' }}>
            {scanning ? '🔍 Scanning...' : '📁 Upload Image'}
          </button>
          <input type="file" accept="image/*" capture="environment" onChange={handleFileInput} style={{ display: 'none' }} id="camera-capture" />
          <label htmlFor="camera-capture" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>📷 Camera</label>
        </div>
      </div>

      {scanResult && (
        <div style={{ background: scanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          {scanResult.success ? <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>✅ Contact info scanned — fields auto-filled. Review before saving.</div>
            : <div style={{ color: '#dc2626', fontSize: 14 }}>❌ Scan failed: {scanResult.error}. Try a clearer image.</div>}
        </div>
      )}

      <Section title="Company Information">
        <Field label="Vendor / Company Name" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Carrier Commercial HVAC" />
        </Field>
        <Field label="Primary Contact" hint="Name and title">
          <input style={inputStyle} value={form.primary_contact} onChange={e => set('primary_contact', e.target.value)} placeholder="e.g. Mike Torres — Service Manager" />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. (215) 555-0100" />
        </Field>
        <Field label="Email">
          <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. service@carrier.com" />
        </Field>
        <Field label="Website / Portal">
          <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. https://carrier.com/service" />
        </Field>
      </Section>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 8, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>Service Scopes</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Add all service areas this vendor covers. Pick from the list or type a custom scope.</p>
        <ScopeSelector scopes={form.scopes} onChange={(scopes) => set('scopes', scopes)} />
      </div>

      <Section title="Service Agreement">
        <Field label="Contract Start Date"><input type="date" style={inputStyle} value={form.contract_start} onChange={e => set('contract_start', e.target.value)} /></Field>
        <Field label="Contract End Date"><input type="date" style={inputStyle} value={form.contract_end} onChange={e => set('contract_end', e.target.value)} /></Field>
      </Section>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Contract Notes</h3>
        <textarea value={form.contract_notes} onChange={e => set('contract_notes', e.target.value)} placeholder="Coverage terms, SLA details, equipment covered..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Internal Notes</h3>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Preferred contact method, response time expectations, known issues..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={submit} disabled={saving}
          style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : isEdit ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </div>
  );
}
