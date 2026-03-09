import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const SCOPES = ['HVAC & Mechanical', 'Electrical', 'Plumbing', 'Fire & Life Safety', 'Dock Equipment', 'PIT / Forklift', 'Pest Control', 'Cleaning & Janitorial', 'Security', 'IT & Technology', 'Landscaping', 'General Contractor', 'Other'];

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

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, token } = useAuth();
  const isEdit = Boolean(id);
  const scanInputRef = useRef();
  const dropZoneRef = useRef();

  const [form, setForm] = useState({
    name: '', scope: '', phone: '', email: '',
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
          name: v.name || '', scope: v.scope || '', phone: v.phone || '',
          email: v.email || '', primary_contact: v.primary_contact || '',
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
    setScanning(true);
    setScanResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API}/api/scan-vendor-contact`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.fields) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setForm(prev => ({
        ...prev,
        name: f.name || prev.name,
        primary_contact: f.primary_contact || prev.primary_contact,
        phone: f.phone || prev.phone,
        email: f.email || prev.email,
        website: f.website || prev.website,
        scope: f.scope || prev.scope,
      }));
      setScanResult({ success: true });
    } catch (err) {
      setScanResult({ success: false, error: err.message });
    }
    setScanning(false);
  };

  const handleFileInput = (e) => scanImage(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) scanImage(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        scanImage(item.getAsFile());
        break;
      }
    }
  };

  const submit = async () => {
    if (!form.name.trim()) { setError('Vendor name is required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `${API}/api/vendors/${id}` : `${API}/api/vendors`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
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

      {/* Scanner Banner */}
      <div
        ref={dropZoneRef}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{
          background: dragging ? '#1e3a5f' : NAVY,
          border: dragging ? `2px dashed ${BLUE}` : '2px solid transparent',
          borderRadius: 12, padding: 24, marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16, transition: 'all 0.15s'
        }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📇 Scan Contact Info</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
            Drop a screenshot, paste from clipboard (Ctrl+V), or take a photo of a business card or email signature to auto-fill fields.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input ref={scanInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: 'none' }} />
          <button onClick={() => scanInputRef.current.click()} disabled={scanning}
            style={{ background: scanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer' }}>
            {scanning ? '🔍 Scanning...' : '📁 Upload Image'}
          </button>
          <input type="file" accept="image/*" capture="environment"
            onChange={handleFileInput}
            style={{ display: 'none' }} id="camera-capture" />
          <label htmlFor="camera-capture" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            📷 Camera
          </label>
        </div>
      </div>

      {scanResult && (
        <div style={{ background: scanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          {scanResult.success
            ? <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>✅ Contact info scanned — fields auto-filled. Review before saving.</div>
            : <div style={{ color: '#dc2626', fontSize: 14 }}>❌ Scan failed: {scanResult.error}. Try a clearer image.</div>}
        </div>
      )}

      <Section title="Company Information">
        <Field label="Vendor / Company Name" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Carrier Commercial HVAC" />
        </Field>
        <Field label="Service Scope">
          <select style={inputStyle} value={form.scope} onChange={e => set('scope', e.target.value)}>
            <option value="">— Select scope —</option>
            {SCOPES.map(s => <option key={s}>{s}</option>)}
          </select>
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

      <Section title="Service Agreement">
        <Field label="Contract Start Date">
          <input type="date" style={inputStyle} value={form.contract_start} onChange={e => set('contract_start', e.target.value)} />
        </Field>
        <Field label="Contract End Date">
          <input type="date" style={inputStyle} value={form.contract_end} onChange={e => set('contract_end', e.target.value)} />
        </Field>
      </Section>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Contract Notes</h3>
        <textarea value={form.contract_notes} onChange={e => set('contract_notes', e.target.value)}
          placeholder="Coverage terms, SLA details, equipment covered..."
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Internal Notes</h3>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Preferred contact method, response time expectations, known issues..."
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
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
