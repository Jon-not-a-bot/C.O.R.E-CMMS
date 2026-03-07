import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const NAV = '#1B2D4F';
const BLUE = '#3AACDC';

const CATEGORIES = ['PIT Fleet', 'Dock Equipment', 'HVAC & Heating', 'Electrical', 'Life Safety', 'Building Envelope', 'Utilities'];
const LOCATIONS = ['Production Floor', 'Dock Area', 'Office', 'Roof', 'Exterior', 'Mechanical Room', 'Break Room', 'Parking Lot', 'Throughout'];
const PM_FREQS = ['Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed', 'Per OEM'];

const Field = ({ label, required, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
      {label}{required && <span style={{ color: '#ef4444' }}> *</span>}
    </label>
    {children}
  </div>
);

const inputStyle = { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' };

export default function AssetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const scanInputRef = useRef();

  const [form, setForm] = useState({
    asset_id: '', name: '', category: 'PIT Fleet', subcategory: '', location: 'Production Floor',
    criticality: 'B', manufacturer: '', model: '', serial_number: '', install_date: '',
    condition: 'Good', pm_frequency: 'Monthly', last_pm_date: '', next_pm_date: '',
    assigned_tech: '', management_type: 'In-House', vendor_name: '', warranty_expiry: '', notes: ''
  });
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/assets/${id}`).then(res => {
        const a = res.data;
        setForm({
          asset_id: a.asset_id || '', name: a.name || '', category: a.category || 'PIT Fleet',
          subcategory: a.subcategory || '', location: a.location || '', criticality: a.criticality || 'B',
          manufacturer: a.manufacturer || '', model: a.model || '', serial_number: a.serial_number || '',
          install_date: a.install_date ? a.install_date.split('T')[0] : '', condition: a.condition || 'Good',
          pm_frequency: a.pm_frequency || 'Monthly',
          last_pm_date: a.last_pm_date ? a.last_pm_date.split('T')[0] : '',
          next_pm_date: a.next_pm_date ? a.next_pm_date.split('T')[0] : '',
          assigned_tech: a.assigned_tech || '', management_type: a.management_type || 'In-House',
          vendor_name: a.vendor_name || '', warranty_expiry: a.warranty_expiry ? a.warranty_expiry.split('T')[0] : '',
          notes: a.notes || ''
        });
      });
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const API = process.env.REACT_APP_API_URL || '';
      const res = await fetch(`${API}/api/scan-nameplate`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.fields) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setForm(prev => ({
        ...prev,
        manufacturer: f.manufacturer || prev.manufacturer,
        model: f.model || prev.model,
        serial_number: f.serial_number || prev.serial_number,
        install_date: f.install_date || prev.install_date,
        name: f.name || prev.name,
        notes: f.notes ? (prev.notes ? prev.notes + '\n' + f.notes : f.notes) : prev.notes,
      }));
      setScanResult({ success: true, fields: f });
    } catch (err) {
      setScanResult({ success: false, error: err.message });
    }
    setScanning(false);
  };

  const submit = async () => {
    if (!form.name.trim()) { setError('Asset name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      photos.forEach(p => data.append('photos', p));
      if (isEdit) {
        await axios.put(`/api/assets/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await axios.post('/api/assets', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      navigate('/assets');
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed');
    }
    setSaving(false);
  };

  const Section = ({ title, children }) => (
    <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: NAV, marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAV }}>{isEdit ? 'Edit Asset' : 'Add New Asset'}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Fill in asset details for the C.O.R.E. registry</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>

      <div style={{ background: NAV, borderRadius: 12, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>📷 Scan ID Plate</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Take a photo of the equipment nameplate — Claude will auto-fill manufacturer, model, serial number, and specs.</div>
        </div>
        <div>
          <input ref={scanInputRef} type="file" accept="image/*" capture="environment" onChange={handleScan} style={{ display: 'none' }} />
          <button onClick={() => scanInputRef.current.click()} disabled={scanning}
            style={{ background: scanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', minWidth: 140 }}>
            {scanning ? '🔍 Scanning...' : '📷 Scan Plate'}
          </button>
        </div>
      </div>

      {scanResult && (
        <div style={{ background: scanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          {scanResult.success ? (
            <div>
              <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>✅ Nameplate scanned — fields auto-filled below</div>
              <div style={{ fontSize: 12, color: '#475569' }}>
                {Object.entries(scanResult.fields).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} style={{ marginRight: 16 }}><strong>{k.replace('_', ' ')}:</strong> {String(v)}</span>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Review the filled fields and correct anything that looks off before saving.</div>
            </div>
          ) : (
            <div style={{ color: '#dc2626', fontSize: 14 }}>Scan failed: {scanResult.error}. Try a clearer photo with good lighting.</div>
          )}
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAV, marginBottom: 16 }}>Asset Criticality Tier</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {[
            { val: 'A', label: 'A — Critical', desc: 'Life safety, production stoppage, compliance', color: '#ef4444' },
            { val: 'B', label: 'B — Important', desc: 'Significant impact if down, workaround exists', color: '#f59e0b' },
            { val: 'C', label: 'C — Standard', desc: 'Minimal impact, easily managed', color: '#22c55e' },
          ].map(t => (
            <div key={t.val} onClick={() => set('criticality', t.val)} style={{
              border: `2px solid ${form.criticality === t.val ? t.color : '#e2e8f0'}`,
              borderRadius: 10, padding: 16, cursor: 'pointer',
              background: form.criticality === t.val ? t.color + '10' : '#fff',
              transition: 'all 0.15s'
            }}>
              <div style={{ fontWeight: 700, color: t.color, fontSize: 15 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Asset Identification">
        <Field label="Asset ID"><input style={inputStyle} value={form.asset_id} onChange={e => set('asset_id', e.target.value)} placeholder="e.g. FLT-001" /></Field>
        <Field label="Asset Name" required><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Sit-Down Forklift #1" /></Field>
        <Field label="Category">
          <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Subcategory"><input style={inputStyle} value={form.subcategory} onChange={e => set('subcategory', e.target.value)} placeholder="e.g. Propane Forklift" /></Field>
        <Field label="Location">
          <select style={inputStyle} value={form.location} onChange={e => set('location', e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Equipment Details">
        <Field label="Manufacturer"><input style={inputStyle} value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Toyota" /></Field>
        <Field label="Model"><input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. 8FGU25" /></Field>
        <Field label="Serial Number"><input style={inputStyle} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} /></Field>
        <Field label="Install Date"><input type="date" style={inputStyle} value={form.install_date} onChange={e => set('install_date', e.target.value)} /></Field>
        <Field label="Warranty Expiry"><input type="date" style={inputStyle} value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} /></Field>
        <Field label="Current Condition">
          <select style={inputStyle} value={form.condition} onChange={e => set('condition', e.target.value)}>
            {['New', 'Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
