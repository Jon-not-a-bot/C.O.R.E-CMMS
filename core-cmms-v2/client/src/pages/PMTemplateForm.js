import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const FREQUENCIES = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

export default function PMTemplateForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [form, setForm] = useState({
    name: '', description: '', frequency: 'Monthly', assigned_to: '',
    vendor_id: '', start_date: '', active: true,
  });
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/assets`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/vendors`).then(r => r.json()).catch(() => []),
      isEdit ? authFetch(`${API}/api/pm-templates/${id}`).then(r => r.json()).catch(() => null) : Promise.resolve(null),
    ]).then(([a, v, t]) => {
      setAssets(Array.isArray(a) ? a : []);
      setVendors(Array.isArray(v) ? v : []);
      if (t && isEdit) {
        setForm({
          name: t.name || '', description: t.description || '',
          frequency: t.frequency || 'Monthly', assigned_to: t.assigned_to || '',
          vendor_id: t.vendor_id || '', active: t.active !== false,
          start_date: t.next_due_date ? t.next_due_date.split('T')[0] : '',
        });
        setSelectedAssets(t.asset_ids || []);
        setChecklist(Array.isArray(t.checklist) ? t.checklist : []);
      }
      setLoading(false);
    });
  }, [id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleAsset = (assetId) => {
    setSelectedAssets(prev =>
      prev.includes(assetId) ? prev.filter(x => x !== assetId) : [...prev, assetId]
    );
  };

  const addChecklistItem = () => {
    if (!newItem.trim()) return;
    setChecklist(prev => [...prev, { id: Date.now(), text: newItem.trim(), required: true }]);
    setNewItem('');
  };

  const removeChecklistItem = (itemId) => setChecklist(prev => prev.filter(x => x.id !== itemId));

  const moveItem = (index, dir) => {
    const next = [...checklist];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setChecklist(next);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return alert('PM schedule name is required.');
    if (!form.frequency) return alert('Frequency is required.');
    setSaving(true);
    const payload = {
      ...form,
      asset_ids: selectedAssets,
      checklist,
      vendor_id: form.vendor_id || null,
    };
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${API}/api/pm-templates/${id}` : `${API}/api/pm-templates`;
    await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setSaving(false);
    navigate('/pm-schedules');
  };

  const inputStyle = { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' };
  const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 };
  const sectionStyle = { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 16 };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={() => navigate('/pm-schedules')} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>← Back</button>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 700, margin: 0 }}>{isEdit ? 'Edit PM Schedule' : 'New PM Schedule'}</h1>
      </div>

      {/* Basic Info */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>Schedule Details</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>PM Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Dock Door Monthly PM" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this PM cover?" style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Frequency <span style={{ color: '#ef4444' }}>*</span></label>
              <select value={form.frequency} onChange={e => set('frequency', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
                {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEdit ? 'Next Due Date' : 'Start Date'}</label>
              <input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} style={inputStyle} />
            </div>
          </div>
          {isEdit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="active" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ width: 16, height: 16 }} />
              <label htmlFor="active" style={{ fontSize: 14, color: '#374151' }}>Schedule is active</label>
            </div>
          )}
        </div>
      </div>

      {/* Assignment */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>Assignment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Assign to Tech</label>
            <input value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)} placeholder="Tech name or team" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Or Assign to Vendor</label>
            <select value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)} style={{ ...inputStyle, background: '#fff' }}>
              <option value="">No vendor</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Selection */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>Assets</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>Select one or more assets. A separate WO will be created for each.</p>
        {assets.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 13 }}>No assets found. Add assets first.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
            {assets.map(a => (
              <div key={a.id} onClick={() => toggleAsset(a.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `2px solid ${selectedAssets.includes(a.id) ? BLUE : '#e2e8f0'}`, background: selectedAssets.includes(a.id) ? BLUE + '10' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selectedAssets.includes(a.id) ? BLUE : '#cbd5e1'}`, background: selectedAssets.includes(a.id) ? BLUE : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {selectedAssets.includes(a.id) && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{a.category}{a.location ? ` · ${a.location}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedAssets.length > 0 && (
          <div style={{ marginTop: 10, fontSize: 12, color: BLUE, fontWeight: 600 }}>
            {selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected — {selectedAssets.length} WO{selectedAssets.length > 1 ? 's' : ''} will be created per cycle
          </div>
        )}
      </div>

      {/* Checklist Builder */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: '0 0 4px' }}>Checklist Items</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 14px' }}>Items techs must complete before closing the WO.</p>

        {checklist.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {checklist.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 8, padding: '10px 14px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', width: 20, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: 14, color: '#1e293b' }}>{item.text}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveItem(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#cbd5e1' : '#64748b', fontSize: 14, padding: '2px 6px' }}>↑</button>
                  <button onClick={() => moveItem(i, 1)} disabled={i === checklist.length - 1} style={{ background: 'none', border: 'none', cursor: i === checklist.length - 1 ? 'default' : 'pointer', color: i === checklist.length - 1 ? '#cbd5e1' : '#64748b', fontSize: 14, padding: '2px 6px' }}>↓</button>
                  <button onClick={() => removeChecklistItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, padding: '2px 6px' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
            placeholder="Add checklist item... (press Enter)"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={addChecklistItem} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>Add</button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate('/pm-schedules')} style={{ background: '#fff', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '12px 32px', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create PM Schedule'}
        </button>
      </div>
    </div>
  );
}
