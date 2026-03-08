import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CATEGORIES = ['PIT Fleet', 'Dock Equipment', 'HVAC & Heating', 'Electrical', 'Life Safety', 'Building Envelope', 'Utilities', 'General'];
const LOCATIONS = ['Production Floor', 'Dock Area', 'Office', 'Roof', 'Exterior', 'Mechanical Room', 'Break Room', 'Parking Lot', 'Throughout'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
const CRITICALITIES = ['A', 'B', 'C'];
const PM_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'];

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

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '', asset_id: '', category: 'General', location: 'Production Floor',
    condition: 'Good', criticality: 'B', manufacturer: '', model: '',
    serial_number: '', year: '', purchase_date: '', purchase_cost: '',
    warranty_expiry: '', pm_frequency: 'Monthly', last_pm_date: '',
    next_pm_date: '', notes: ''
  });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      authFetch(`${API}/api/assets/${id}`)
        .then(r => r.json())
        .then(a => {
          setForm({
            name: a.name || '',
            asset_id: a.asset_id || '',
            category: a.category || 'General',
            location: a.location || 'Production Floor',
            condition: a.condition || 'Good',
            criticality: a.criticality || 'B',
            manufacturer: a.manufacturer || '',
            model: a.model || '',
            serial_number: a.serial_number || '',
            year: a.year || '',
            purchase_date: a.purchase_date ? a.purchase_date.split('T')[0] : '',
            purchase_cost: a.purchase_cost || '',
            warranty_expiry: a.warranty_expiry ? a.warranty_expiry.split('T')[0] : '',
            pm_frequency: a.pm_frequency || 'Monthly',
            last_pm_date: a.last_pm_date ? a.last_pm_date.split('T')[0] : '',
            next_pm_date: a.next_pm_date ? a.next_pm_date.split('T')[0] : '',
            notes: a.notes || ''
          });
        })
        .catch(() => setError('Failed to load asset.'));
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) { setError('Asset name is required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `${API}/api/assets/${id}` : `${API}/api/assets`;
      const method = isEdit ? 'PUT' : 'POST';

      let res;
      if (isEdit) {
        res = await authFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        });
      } else {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== '') data.append(k, v); });
        photos.forEach(p => data.append('photos', p));
        res = await authFetch(url, { method, body: data });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      const saved = await res.json();
      navigate(`/assets/${saved.id || id}`);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{isEdit ? 'Edit Asset' : 'New Asset'}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Harleysville Facility</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
      </div>

      {/* Criticality selector */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Criticality Rating</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { v: 'A', c: '#ef4444', d: 'Critical — failure stops operations or creates safety risk' },
            { v: 'B', c: '#f59e0b', d: 'Important — failure impacts productivity significantly' },
            { v: 'C', c: '#22c55e', d: 'Standard — failure has minimal operational impact' }
          ].map(opt => (
            <div key={opt.v} onClick={() => set('criticality', opt.v)}
              style={{ border: `2px solid ${form.criticality === opt.v ? opt.c : '#e2e8f0'}`, borderRadius: 10, padding: 14, cursor: 'pointer', background: form.criticality === opt.v ? opt.c + '15' : '#fff' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: opt.c }}>Tier {opt.v}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{opt.d}</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Basic Information">
        <Field label="Asset Name" required>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Forklift #3 — Crown RC 5500" />
        </Field>
        <Field label="Asset ID / Tag" hint="Your internal asset number or barcode">
          <input style={inputStyle} value={form.asset_id} onChange={e => set('asset_id', e.target.value)} placeholder="e.g. PIT-003" />
        </Field>
        <Field label="Category">
          <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Location">
          <select style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
        <Field label="Condition">
          <select style={inputStyle} value={form.condition} onChange={e => set('condition', e.target.value)}>
            {CONDITIONS.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Equipment Details">
        <Field label="Manufacturer">
          <input style={inputStyle} value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Crown, Assa Abloy, Carrier" />
        </Field>
        <Field label="Model">
          <input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. RC 5500-40" />
        </Field>
        <Field label="Serial Number">
          <input style={inputStyle} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="Manufacturer serial" />
        </Field>
        <Field label="Year">
          <input style={inputStyle} value={form.year} onChange={e => set('year', e.target.value)} placeholder="e.g. 2019" type="number" min="1950" max="2030" />
        </Field>
        <Field label="Purchase Date">
          <input type="date" style={inputStyle} value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
        </Field>
        <Field label="Purchase Cost ($)">
          <input style={inputStyle} value={form.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} placeholder="e.g. 24500" type="number" min="0" />
        </Field>
        <Field label="Warranty Expiry">
          <input type="date" style={inputStyle} value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} />
        </Field>
      </Section>

      <Section title="Preventive Maintenance">
        <Field label="PM Frequency">
          <select style={inputStyle} value={form.pm_frequency} onChange={e => set('pm_frequency', e.target.value)}>
            {PM_FREQUENCIES.map(f => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Last PM Date">
          <input type="date" style={inputStyle} value={form.last_pm_date} onChange={e => set('last_pm_date', e.target.value)} />
        </Field>
        <Field label="Next PM Due">
          <input type="date" style={inputStyle} value={form.next_pm_date} onChange={e => set('next_pm_date', e.target.value)} />
        </Field>
      </Section>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Notes</h3>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any additional notes — known issues, special instructions, vendor contacts..."
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
      </div>

      {/* Photos (new assets only) */}
      {!isEdit && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Photos</h3>
          <input type="file" accept="image/*" multiple capture="environment"
            onChange={e => setPhotos([...e.target.files])}
            style={{ fontSize: 14, color: '#64748b' }} />
          {photos.length > 0 && <div style={{ marginTop: 8, fontSize: 13, color: '#64748b' }}>{photos.length} photo{photos.length > 1 ? 's' : ''} selected</div>}
        </div>
      )}

      {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={submit} disabled={saving}
          style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : isEdit ? 'Update Asset' : 'Create Asset'}
        </button>
      </div>
    </div>
  );
}
