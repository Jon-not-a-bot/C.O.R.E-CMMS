import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CATEGORIES = ['PIT Fleet','Dock Equipment','HVAC & Heating','Electrical','Life Safety','Building Envelope','Utilities','General'];
const LOCATIONS = ['Production Floor','Dock Area','Office','Roof','Exterior','Mechanical Room','Break Room','Parking Lot','Throughout'];
const CATEGORY_TECH = {'PIT Fleet':'PIT Tech','Dock Equipment':'Dock Tech','HVAC & Heating':'HVAC Tech','Electrical':'Electrical Tech','Life Safety':'Safety Tech','Building Envelope':'Facilities Tech','Utilities':'Facilities Tech','General':'Facilities Tech'};

const inputStyle = { padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', background:'#fff', width:'100%', boxSizing:'border-box' };

// ── Defined OUTSIDE the component so they never remount ──
const Field = ({ label, required, hint, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
    <label style={{ fontSize:13, fontWeight:600, color:'#374151' }}>{label}{required && <span style={{ color:'#ef4444' }}> *</span>}</label>
    {children}
    {hint && <div style={{ fontSize:11, color:'#94a3b8' }}>{hint}</div>}
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
    <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:20, paddingBottom:12, borderBottom:'2px solid #f1f5f9' }}>{title}</h3>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>{children}</div>
  </div>
);

export default function WorkOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title:'', description:'', type:'Repair', priority:'Medium', status:'Open',
    category:'General', location:'Production Floor', asset_id:'', due_date:'',
    assigned_to:'Facilities Tech', resolution_notes:'', vendor_id:''
  });
  const [assets, setAssets] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [users, setUsers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch(`${API}/api/assets`).then(r => r.json()).then(data => setAssets(Array.isArray(data) ? data : [])).catch(() => {});
    authFetch(`${API}/api/vendors`).then(r => r.json()).then(data => setVendors(Array.isArray(data) ? data : [])).catch(() => {});
    authFetch(`${API}/api/users`).then(r => r.json()).then(data => setUsers(Array.isArray(data) ? data : [])).catch(() => {});
    if (isEdit) {
      authFetch(`${API}/api/workorders/${id}`).then(r => r.json()).then(wo => {
        setForm({
          title: wo.title || '', description: wo.description || '', type: wo.type || 'Repair',
          priority: wo.priority || 'Medium', status: wo.status || 'Open',
          category: wo.category || 'General', location: wo.location || 'Production Floor',
          asset_id: wo.asset_id || '', due_date: wo.due_date ? wo.due_date.split('T')[0] : '',
          assigned_to: wo.assigned_to || 'Facilities Tech', resolution_notes: wo.resolution_notes || '',
          vendor_id: wo.vendor_id || ''
        });
      });
    }
  }, [id, isEdit]);

  const set = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'category') next.assigned_to = CATEGORY_TECH[v] || 'Facilities Tech';
      if (k === 'asset_id' && v) {
        const asset = assets.find(a => String(a.id) === String(v));
        if (asset) {
          next.category = asset.category;
          next.assigned_to = CATEGORY_TECH[asset.category] || 'Facilities Tech';
          next.location = asset.location || next.location;
          if (asset.vendor_id) next.vendor_id = String(asset.vendor_id);
        }
      }
      return next;
    });
  };

  const submit = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const url = isEdit ? `${API}/api/workorders/${id}` : `${API}/api/workorders`;
      const method = isEdit ? 'PUT' : 'POST';
      let res;
      if (isEdit) {
        res = await authFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      } else {
        const data = new FormData();
        Object.entries(form).forEach(([k, v]) => data.append(k, v));
        photos.forEach(p => data.append('photos', p));
        res = await authFetch(url, { method, body: data });
      }
      if (!res.ok) throw new Error('Save failed');
      navigate('/workorders');
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const selectedVendor = vendors.find(v => String(v.id) === String(form.vendor_id));

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:NAVY }}>{isEdit ? 'Edit Work Order' : 'New Work Order'}</h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:2 }}>Internal work order — for external requests use the Request Link</p>
        </div>
        <button onClick={() => navigate(-1)} style={{ background:'transparent', border:'1px solid #e2e8f0', color:'#64748b', borderRadius:8, padding:'8px 16px', cursor:'pointer' }}>Cancel</button>
      </div>

      {/* Priority */}
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:16 }}>Priority</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {[{v:'Emergency',c:'#ef4444',d:'Safety/legal risk'},{v:'High',c:'#f59e0b',d:'Production impact'},{v:'Medium',c:BLUE,d:'Normal priority'},{v:'Low',c:'#22c55e',d:'When available'}].map(p => (
            <div key={p.v} onClick={() => set('priority', p.v)} style={{ border:`2px solid ${form.priority===p.v?p.c:'#e2e8f0'}`, borderRadius:10, padding:14, cursor:'pointer', background:form.priority===p.v?p.c+'15':'#fff' }}>
              <div style={{ fontWeight:700, color:p.c }}>{p.v}</div>
              <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>{p.d}</div>
            </div>
          ))}
        </div>
      </div>

      <Section title="Work Order Details">
        <Field label="Title" required>
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Forklift #2 won't start" />
        </Field>
        <Field label="Type">
          <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            {['Repair','PM','Inspection','Installation','Safety','Cleaning','Other'].map(t => <option key={t}>{t}</option>)}
          </select>
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
        <Field label="Linked Asset">
          <select style={inputStyle} value={form.asset_id} onChange={e => set('asset_id', e.target.value)}>
            <option value="">— No asset linked —</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.asset_id || 'No ID'})</option>)}
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" style={inputStyle} value={form.due_date} onChange={e => set('due_date', e.target.value)} />
        </Field>
        <Field label="Assign To" hint="Select a team member or enter a role">
          <select style={inputStyle} value={form.assigned_to} onChange={e => set('assigned_to', e.target.value)}>
            <option value="">— Unassigned —</option>
            {users.map(u => (
              <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
            ))}
            <optgroup label="── Roles ──">
              {['PIT Tech','Dock Tech','HVAC Tech','Electrical Tech','Safety Tech','Facilities Tech'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </optgroup>
          </select>
        </Field>
        {isEdit && (
          <Field label="Status">
            <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              {['Open','In Progress','On Hold','Closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )}
      </Section>

      {/* Vendor Assignment */}
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:6, paddingBottom:12, borderBottom:'2px solid #f1f5f9' }}>
          Vendor Assignment <span style={{ fontSize:13, fontWeight:400, color:'#94a3b8' }}>(optional)</span>
        </h3>
        <p style={{ fontSize:13, color:'#94a3b8', marginBottom:16 }}>Assign a vendor to this work order. Your internal tech still manages and closes it — the vendor is logged as the service provider.</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
          <Field label="Vendor" hint="Auto-filled if the linked asset has a preferred vendor">
            <select style={inputStyle} value={form.vendor_id} onChange={e => set('vendor_id', e.target.value)}>
              <option value="">— No vendor / internal only —</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
        </div>
        {selectedVendor && (
          <div style={{ marginTop:16, background:'#f8fafc', borderRadius:10, padding:16, display:'flex', gap:24, flexWrap:'wrap' }}>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:3 }}>CONTACT</div>
              <div style={{ fontSize:13, color:'#1e293b', fontWeight:600 }}>{selectedVendor.primary_contact || selectedVendor.name}</div>
            </div>
            {selectedVendor.phone && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:3 }}>PHONE</div><a href={`tel:${selectedVendor.phone}`} style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>{selectedVendor.phone}</a></div>}
            {selectedVendor.email && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:3 }}>EMAIL</div><a href={`mailto:${selectedVendor.email}`} style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>{selectedVendor.email}</a></div>}
            {selectedVendor.website && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:3 }}>PORTAL</div><a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>Open →</a></div>}
          </div>
        )}
      </div>

      {/* Description */}
      <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:16 }}>Description</h3>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the issue in detail — symptoms, when it started, what was tried..." style={{ ...inputStyle, minHeight:120, resize:'vertical' }} />
      </div>

      {isEdit && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:16 }}>Resolution Notes</h3>
          <textarea value={form.resolution_notes} onChange={e => set('resolution_notes', e.target.value)} placeholder="What was done to resolve this? Parts used, root cause, follow-up needed..." style={{ ...inputStyle, minHeight:100, resize:'vertical' }} />
        </div>
      )}

      {!isEdit && (
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:16 }}>Photos</h3>
          <input type="file" accept="image/*" multiple capture="environment" onChange={e => setPhotos([...e.target.files])} style={{ fontSize:14, color:'#64748b' }} />
        </div>
      )}

      {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'12px 16px', borderRadius:8, marginBottom:16, fontSize:14 }}>{error}</div>}

      <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button onClick={() => navigate(-1)} style={{ background:'#f1f5f9', border:'none', color:'#475569', borderRadius:8, padding:'12px 24px', cursor:'pointer', fontWeight:600 }}>Cancel</button>
        <button onClick={submit} disabled={saving} style={{ background:NAVY, color:'#fff', border:'none', borderRadius:8, padding:'12px 28px', cursor:saving?'not-allowed':'pointer', fontWeight:700, fontSize:15, opacity:saving?0.7:1 }}>
          {saving ? 'Saving...' : isEdit ? 'Update Work Order' : 'Create Work Order'}
        </button>
      </div>
    </div>
  );
}
