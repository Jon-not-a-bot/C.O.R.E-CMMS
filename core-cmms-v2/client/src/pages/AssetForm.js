import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CATEGORIES = ['PIT Fleet', 'Dock Equipment', 'HVAC & Heating', 'Electrical', 'Life Safety', 'Building Envelope', 'Utilities', 'General'];
const LOCATIONS = ['Production Floor', 'Dock Area', 'Dock Yard', 'Office', 'Administrative Office', 'Employee Support Office', 'Restrooms', 'Electrical Room', 'Roof', 'Exterior', 'Mechanical Room', 'Break Room', 'Parking Lot', 'Throughout'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'];
const PM_FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual', 'As Needed'];
const CONTRACT_TYPES = ['Rental', 'Lease', 'Service Agreement', 'Maintenance', 'SLA', 'Insurance', 'Other'];
const OWNERSHIP_TYPES = ['Owned', 'Rental', 'Leased'];

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
  const { authFetch, token } = useAuth();
  const isEdit = Boolean(id);
  const scanInputRef = useRef();
  const contractScanInputRef = useRef();

  const [form, setForm] = useState({
    name: '', asset_id: '', category: 'General', location: 'Production Floor',
    condition: 'Good', criticality: 'B', manufacturer: '', model: '',
    serial_number: '', year: '', purchase_date: '', purchase_cost: '',
    warranty_expiry: '', pm_frequency: 'Monthly', last_pm_date: '',
    next_pm_date: '', notes: '', ownership: 'Owned'
  });

  // Warranty state
  const [addWarranty, setAddWarranty] = useState(false);
  const [warranty, setWarranty] = useState({
    expiry: '', coverage: '', claim_contact: '', claim_phone: '', notice_period_days: 30
  });

  // Contract state
  const [addContract, setAddContract] = useState(false);
  const [contract, setContract] = useState({
    name: '', type: 'Rental', vendor_id: '', start_date: '', end_date: '',
    notice_period_days: 30, auto_renew: false, value: '', monthly_cost: '', notes: '', document_url: ''
  });
  const [contractScanning, setContractScanning] = useState(false);
  const [contractScanResult, setContractScanResult] = useState(null);

  const [vendors, setVendors] = useState([]);
  const [existingContracts, setExistingContracts] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    authFetch(`${API}/api/vendors`).then(r => r.json()).then(d => setVendors(Array.isArray(d) ? d : [])).catch(() => {});
    if (isEdit) {
      authFetch(`${API}/api/assets/${id}`)
        .then(r => r.json())
        .then(a => {
          setForm({
            name: a.name || '', asset_id: a.asset_id || '', category: a.category || 'General',
            location: a.location || 'Production Floor', condition: a.condition || 'Good',
            criticality: a.criticality || 'B', manufacturer: a.manufacturer || '',
            model: a.model || '', serial_number: a.serial_number || '', year: a.year || '',
            purchase_date: a.purchase_date ? a.purchase_date.split('T')[0] : '',
            purchase_cost: a.purchase_cost || '',
            warranty_expiry: a.warranty_expiry ? a.warranty_expiry.split('T')[0] : '',
            pm_frequency: a.pm_frequency || 'Monthly',
            last_pm_date: a.last_pm_date ? a.last_pm_date.split('T')[0] : '',
            next_pm_date: a.next_pm_date ? a.next_pm_date.split('T')[0] : '',
            notes: a.notes || '',
            ownership: a.ownership || 'Owned'
          });
        })
        .catch(() => setError('Failed to load asset.'));
      // Load existing contracts for this asset
      authFetch(`${API}/api/contracts`)
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) setExistingContracts(d.filter(c => String(c.asset_id) === String(id)));
        }).catch(() => {});
    }
  }, [id, isEdit]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setW = (k, v) => setWarranty(w => ({ ...w, [k]: v }));
  const setC = (k, v) => setContract(c => ({ ...c, [k]: v }));

  const handleScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanning(true); setScanResult(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API}/api/scan-nameplate`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
      });
      const data = await res.json();
      if (!res.ok || !data.fields) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setForm(prev => ({
        ...prev,
        manufacturer: f.manufacturer || prev.manufacturer,
        model: f.model || prev.model,
        serial_number: f.serial_number || prev.serial_number,
        name: f.name || prev.name,
        notes: f.notes ? (prev.notes ? prev.notes + '\n' + f.notes : f.notes) : prev.notes,
      }));
      setScanResult({ success: true, fields: f });
    } catch (err) { setScanResult({ success: false, error: err.message }); }
    setScanning(false);
  };

  const handleContractScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setContractScanning(true); setContractScanResult(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await authFetch(`${API}/api/scan-contract`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      const f = data.fields;
      setContract(prev => ({
        ...prev,
        name: f.name || prev.name || (form.name ? `${form.name} — ${f.type || 'Contract'}` : prev.name),
        type: f.type || prev.type,
        value: f.value || prev.value,
        start_date: f.start_date || prev.start_date,
        end_date: f.end_date || prev.end_date,
        notice_period_days: f.notice_period_days || prev.notice_period_days,
        auto_renew: f.auto_renew !== undefined ? f.auto_renew : prev.auto_renew,
        notes: f.notes ? (prev.notes ? prev.notes + '\n\n' + f.notes : f.notes) : prev.notes,
        document_url: data.document_url || prev.document_url,
      }));
      setContractScanResult({ success: true, vendor_name: f.vendor_name });
      // Auto-enable the contract section if not already on
      setAddContract(true);
    } catch (err) { setContractScanResult({ success: false, error: err.message }); }
    setContractScanning(false);
  };

  const submit = async () => {
    if (!form.name.trim()) { setError('Asset name is required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `${API}/api/assets/${id}` : `${API}/api/assets`;
      const method = isEdit ? 'PUT' : 'POST';
      let res;
      if (isEdit) {
        res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== '') data.append(k, v); });
        photos.forEach(p => data.append('photos', p));
        res = await authFetch(url, { method, body: data });
      }
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Save failed'); }
      const saved = await res.json();
      const assetId = saved.id || id;

      // Create warranty contract if filled out
      if (addWarranty && warranty.expiry) {
        const warrantyPayload = {
          name: `${form.name} — Manufacturer Warranty`,
          asset_id: assetId,
          type: 'Warranty',
          status: 'Active',
          end_date: warranty.expiry,
          notice_period_days: warranty.notice_period_days || 30,
          notes: [
            warranty.coverage ? `Coverage: ${warranty.coverage}` : '',
            warranty.claim_contact ? `Claim contact: ${warranty.claim_contact}` : '',
            warranty.claim_phone ? `Phone: ${warranty.claim_phone}` : '',
          ].filter(Boolean).join('\n'),
        };
        await authFetch(`${API}/api/contracts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(warrantyPayload)
        });
      }

      // Create contract if filled out
      if (addContract && contract.name.trim()) {
        const contractPayload = {
          ...contract,
          name: contract.name || [form.manufacturer, form.model, form.serial_number].filter(Boolean).join(' · ') || form.name,
          asset_id: assetId,
          vendor_id: contract.vendor_id || null,
          start_date: contract.start_date || null,
          end_date: contract.end_date || null,
          notes: contract.monthly_cost
            ? `Monthly cost: $${parseFloat(contract.monthly_cost).toLocaleString()}${contract.notes ? '\n' + contract.notes : ''}`
            : contract.notes,
        };
        await authFetch(`${API}/api/contracts`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contractPayload)
        });
      }

      navigate(`/assets/${assetId}`);
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  // Notice date preview
  const warrantyNotice = warranty.expiry && warranty.notice_period_days
    ? new Date(new Date(warranty.expiry) - warranty.notice_period_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const contractNotice = contract.end_date && contract.notice_period_days
    ? new Date(new Date(contract.end_date) - contract.notice_period_days * 86400000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>{isEdit ? 'Edit Asset' : 'New Asset'}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Harleysville Facility</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
      </div>

      {/* Scan Banner */}
      <div style={{ background: NAVY, borderRadius: 12, padding: 24, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Scan ID Plate</div>
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Take a photo of the equipment nameplate to auto-fill manufacturer, model, and serial number.</div>
        </div>
        <div>
          <input ref={scanInputRef} type="file" accept="image/*" capture="environment" onChange={handleScan} style={{ display: 'none' }} />
          <button onClick={() => scanInputRef.current.click()} disabled={scanning}
            style={{ background: scanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: scanning ? 'not-allowed' : 'pointer', minWidth: 140 }}>
            {scanning ? 'Scanning...' : 'Scan Plate'}
          </button>
        </div>
      </div>

      {scanResult && (
        <div style={{ background: scanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${scanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '14px 18px', marginBottom: 20 }}>
          {scanResult.success
            ? <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 14 }}>Nameplate scanned — fields auto-filled. Review before saving.</div>
            : <div style={{ color: '#dc2626', fontSize: 14 }}>Scan failed: {scanResult.error}. Try a clearer photo with good lighting.</div>}
        </div>
      )}

      {/* Criticality */}
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
        <Field label="Ownership">
          <select style={inputStyle} value={form.ownership} onChange={e => set('ownership', e.target.value)}>
            {OWNERSHIP_TYPES.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
      </Section>

      <Section title="Equipment Details">
        <Field label="Manufacturer">
          <input style={inputStyle} value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} placeholder="e.g. Crown, Carrier" />
        </Field>
        <Field label="Model">
          <input style={inputStyle} value={form.model} onChange={e => set('model', e.target.value)} placeholder="e.g. RC 5500-40" />
        </Field>
        <Field label="Serial Number">
          <input style={inputStyle} value={form.serial_number} onChange={e => set('serial_number', e.target.value)} />
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
        <Field label="Warranty Expiry" hint="Simple date only — use the Warranty section below for full details">
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

      {/* Existing contracts on edit */}
      {isEdit && existingContracts.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Attached Contracts & Warranties</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {existingContracts.map(c => {
              const end = c.end_date ? new Date(c.end_date + 'T12:00:00') : null;
              const now = new Date();
              const daysLeft = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
              const color = !end ? '#94a3b8' : end < now ? '#ef4444' : daysLeft <= 90 ? '#f59e0b' : '#22c55e';
              return (
                <div key={c.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', borderLeft: `4px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {c.type}{c.vendor_name ? ` · ${c.vendor_name}` : ''}
                      {end && ` · Expires ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      {daysLeft !== null && daysLeft > 0 && ` (${daysLeft}d)`}
                      {daysLeft !== null && daysLeft <= 0 && ' — Expired'}
                    </div>
                  </div>
                  <span style={{ background: color + '20', color, fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                    {!end ? 'No expiry' : end < now ? 'Expired' : daysLeft <= 90 ? 'Expiring soon' : 'Active'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Warranty Section */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addWarranty ? 20 : 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>Manufacturer Warranty</h3>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Creates a warranty contract record linked to this asset</div>
          </div>
          <div onClick={() => setAddWarranty(a => !a)}
            style={{ width: 44, height: 24, borderRadius: 12, background: addWarranty ? BLUE : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: addWarranty ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        {addWarranty && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingTop: 4, borderTop: '2px solid #f1f5f9' }}>
            <Field label="Warranty Expiry Date" required>
              <input type="date" style={inputStyle} value={warranty.expiry} onChange={e => setW('expiry', e.target.value)} />
            </Field>
            <Field label="Notice Period (days)" hint="How early to flag for renewal decision">
              <input type="number" style={inputStyle} value={warranty.notice_period_days} onChange={e => setW('notice_period_days', parseInt(e.target.value))} min={0} />
            </Field>
            <Field label="Coverage Notes">
              <input style={inputStyle} value={warranty.coverage} onChange={e => setW('coverage', e.target.value)} placeholder="e.g. Parts and labor, 3 years" />
            </Field>
            <Field label="Claim Contact">
              <input style={inputStyle} value={warranty.claim_contact} onChange={e => setW('claim_contact', e.target.value)} placeholder="Name or department" />
            </Field>
            <Field label="Claim Phone">
              <input style={inputStyle} value={warranty.claim_phone} onChange={e => setW('claim_phone', e.target.value)} placeholder="1-800-xxx-xxxx" />
            </Field>
            {warrantyNotice && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: BLUE, width: '100%' }}>
                  📋 Notice deadline: <strong>{warrantyNotice}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Contract Section */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addContract ? 20 : 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: 0 }}>Contract / Rental Agreement</h3>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>Rental, lease, service agreement, or any other contract tied to this asset</div>
          </div>
          <div onClick={() => setAddContract(a => !a)}
            style={{ width: 44, height: 24, borderRadius: 12, background: addContract ? BLUE : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff', position: 'absolute', top: 3, left: addContract ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        {addContract && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, paddingTop: 4, borderTop: '2px solid #f1f5f9' }}>
            {/* Contract scan banner */}
            <div style={{ gridColumn: '1 / -1', background: NAVY, borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>📄 Upload Contract Document</div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>PDF or photo — AI auto-fills fields from the document</div>
              </div>
              <div>
                <input ref={contractScanInputRef} type="file" accept="image/*,.pdf" onChange={handleContractScan} style={{ display: 'none' }} />
                <button onClick={() => contractScanInputRef.current.click()} disabled={contractScanning}
                  style={{ background: contractScanning ? '#64748b' : BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: contractScanning ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                  {contractScanning ? 'Scanning...' : 'Upload & Scan'}
                </button>
              </div>
            </div>
            {contractScanResult && (
              <div style={{ gridColumn: '1 / -1', background: contractScanResult.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${contractScanResult.success ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                {contractScanResult.success
                  ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Contract scanned — fields auto-filled.{contractScanResult.vendor_name ? ` Detected vendor: ${contractScanResult.vendor_name}` : ''}</span>
                  : <span style={{ color: '#dc2626' }}>Scan failed: {contractScanResult.error}</span>}
              </div>
            )}
            {contract.document_url && (
              <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>📎 Document attached</span>
                <a href={contract.document_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: BLUE, fontWeight: 600, textDecoration: 'none' }}>View →</a>
              </div>
            )}
            <Field label="Contract Name" required hint="Auto-generated from make/model/serial — edit if needed">
              <input style={inputStyle}
                value={contract.name}
                onChange={e => setC('name', e.target.value)}
                placeholder={[form.manufacturer, form.model, form.serial_number].filter(Boolean).join(' · ') || 'e.g. Hyster H80FT · U005B08756Y'} />
              {!contract.name && (form.manufacturer || form.model || form.serial_number) && (
                <button type="button" onClick={() => setC('name', [form.manufacturer, form.model, form.serial_number].filter(Boolean).join(' · '))}
                  style={{ background: '#f0f9ff', color: BLUE, border: `1px solid ${BLUE}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 4, alignSelf: 'flex-start' }}>
                  Use {[form.manufacturer, form.model, form.serial_number].filter(Boolean).join(' · ')}
                </button>
              )}
            </Field>
            <Field label="Contract Type">
              <select style={inputStyle} value={contract.type} onChange={e => setC('type', e.target.value)}>
                {CONTRACT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Vendor">
              <select style={inputStyle} value={contract.vendor_id} onChange={e => setC('vendor_id', e.target.value)}>
                <option value="">— No vendor —</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Monthly Cost ($)" hint="Auto-calculates annual value">
              <input type="number" style={inputStyle} value={contract.monthly_cost}
                onChange={e => { setC('monthly_cost', e.target.value); setC('value', (parseFloat(e.target.value) * 12).toFixed(2)); }}
                placeholder="0.00" />
            </Field>
            <Field label="Annual Value ($)" hint="Auto-filled from monthly cost">
              <input type="number" style={inputStyle} value={contract.value} onChange={e => setC('value', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Start Date">
              <input type="date" style={inputStyle} value={contract.start_date} onChange={e => setC('start_date', e.target.value)} />
            </Field>
            <Field label="Expiration Date">
              <input type="date" style={inputStyle} value={contract.end_date} onChange={e => setC('end_date', e.target.value)} />
            </Field>
            <Field label="Notice Period (days)">
              <input type="number" style={inputStyle} value={contract.notice_period_days} onChange={e => setC('notice_period_days', parseInt(e.target.value))} min={0} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, alignSelf: 'end', paddingBottom: 6 }}>
              <input type="checkbox" id="auto_renew" checked={contract.auto_renew} onChange={e => setC('auto_renew', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="auto_renew" style={{ fontSize: 14, color: '#374151' }}>Auto-renews</label>
            </div>
            {contractNotice && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: BLUE, width: '100%' }}>
                  📋 Notice deadline: <strong>{contractNotice}</strong>
                </div>
              </div>
            )}
            <Field label="Notes" hint="Key terms, renewal conditions, etc.">
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }} value={contract.notes} onChange={e => setC('notes', e.target.value)} placeholder="Key terms, conditions..." />
            </Field>
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Notes</h3>
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
          placeholder="Any additional notes — known issues, special instructions, vendor contacts..."
          style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
      </div>

      {!isEdit && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Photos</h3>
          <input type="file" accept="image/*" multiple capture="environment"
            onChange={e => setPhotos([...e.target.files])} style={{ fontSize: 14, color: '#64748b' }} />
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
