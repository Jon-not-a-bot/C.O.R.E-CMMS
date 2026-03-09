import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const SCOPES = [
  'Building Maintenance', 'Roof', 'HVAC', 'PIT', 'Machinery',
  'Electrical', 'Plumbing', 'Fire & Life Safety', 'Pest Control',
  'Landscaping', 'Janitorial', 'IT / Technology', 'General'
];

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

export default function VendorForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    scope: 'General',
    phone: '',
    email: '',
    primary_contact: '',
    website: '',
    notes: '',
    contract_start: '',
    contract_end: '',
    contract_notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      authFetch(`${API}/api/vendors/${id}`)
        .then(r => r.json())
        .then(v => setForm({
          name: v.name || '',
          scope: v.scope || 'General',
          phone: v.phone || '',
          email: v.email || '',
          primary_contact: v.primary_contact || '',
          website: v.website || '',
          notes: v.notes || '',
          contract_start: v.contract_start ? v.contract_start.split('T')[0] : '',
          contract_end: v.contract_end ? v.contract_end.split('T')[0] : '',
          contract_notes: v.contract_notes || '',
        }))
        .catch(() => setError('Failed to load vendor.'));
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Save failed'); }
      const saved = await res.json();
      navigate(`/vendors/${saved.id || id}`);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>MCG Harleysville Vendor Directory</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
      </div>

      {/* Company Info */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>Company Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Field label="Company Name" required>
            <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Crown Equipment Corp" />
          </Field>
          <Field label="Scope of Work" required>
            <select style={inputStyle} value={form.scope} onChange={e => set('scope', e.target.value)}>
              {SCOPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Primary Contact Name">
            <input style={inputStyle} value={form.primary_contact} onChange={e => set('primary_contact', e.target.value)} placeholder="e.g. Mike Johnson" />
          </Field>
          <Field label="Phone">
            <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="e.g. (215) 555-0100" type="tel" />
          </Field>
          <Field label="Email">
            <input style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="e.g. service@crown.com" type="email" />
          </Field>
          <Field label="Website / Portal URL" hint="Service portal, work order submission site, etc.">
            <input style={inputStyle} value={form.website} onChange={e => set('website', e.target.value)} placeholder="e.g. https://crown.com/service" />
          </Field>
        </div>
      </div>

      {/* Contract Info */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>Service Agreement <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8' }}>(optional)</span></h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          <Field label="Contract Start Date">
            <input type="date" style={inputStyle} value={form.contract_start} onChange={e => set('contract_start', e.target.value)} />
          </Field>
          <Field label="Contract End Date">
            <input type="date" style={inputStyle} value={form.contract_end} onChange={e => set('contract_end', e.target.value)} />
          </Field>
          <div style={{ gridColumn: '1 / -1' }}>
            <Field label="Contract / Agreement Notes" hint="Coverage details, response time SLA, what's included, etc.">
              <textarea value={form.contract_notes} onChange={e => set('contract_notes', e.target.value)}
                placeholder="e.g. Full service contract — covers all PM and repair labor. 4-hour emergency response. Parts billed separately."
                style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
            </Field>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Internal Notes</h3>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any internal notes — preferred contact method, billing info, past issues, etc."
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={submit} disabled={saving}
          style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : isEdit ? 'Update Vendor' : 'Add Vendor'}
        </button>
      </div>
    </div>
  );
}
