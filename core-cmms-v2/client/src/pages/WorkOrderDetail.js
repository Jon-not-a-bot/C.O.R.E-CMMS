import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const PRIORITY_COLORS = { Emergency:'#ef4444', High:'#f59e0b', Medium:'#3AACDC', Low:'#22c55e' };
const STATUS_COLORS = { Open:'#ef4444', 'In Progress':'#f59e0b', 'On Hold':'#8b5cf6', Closed:'#22c55e' };

function ChecklistSection({ wo, onUpdate, authFetch, id }) {
  const [saving, setSaving] = useState(false);
  const checklist = wo.checklist || [];
  const completed = checklist.filter(i => i.completed).length;
  const pct = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;

  const toggleItem = async (itemId) => {
    const updated = checklist.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
    const allDone = updated.every(i => i.completed);
    setSaving(true);
    try {
      const res = await authFetch(`${API}/api/workorders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wo, checklist: updated, checklist_completed: allDone })
      });
      const data = await res.json();
      onUpdate(data);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, margin:0 }}>PM Checklist</h3>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:12, color:'#64748b' }}>{completed}/{checklist.length} complete</span>
          {wo.checklist_completed && (
            <span style={{ background:'#f0fdf4', color:'#16a34a', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>✓ Done</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:'#f1f5f9', borderRadius:99, height:8, marginBottom:16, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background: pct === 100 ? '#22c55e' : BLUE, borderRadius:99, transition:'width 0.3s' }} />
      </div>

      {/* Items */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {checklist.map((item, idx) => (
          <div key={item.id || idx} onClick={() => !saving && toggleItem(item.id)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:8, background: item.completed ? '#f0fdf4' : '#f8fafc', border:`1px solid ${item.completed ? '#bbf7d0' : '#e2e8f0'}`, cursor: saving ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
            <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${item.completed ? '#22c55e' : '#cbd5e1'}`, background: item.completed ? '#22c55e' : '#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {item.completed && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
            </div>
            <span style={{ fontSize:13, color: item.completed ? '#16a34a' : '#334155', fontWeight: item.completed ? 600 : 400, textDecoration: item.completed ? 'line-through' : 'none', flex:1 }}>
              {item.text}
            </span>
            {item.required && !item.completed && (
              <span style={{ fontSize:10, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'2px 6px', borderRadius:10 }}>Required</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [wo, setWo] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    authFetch(`${API}/api/workorders/${id}`)
      .then(r => r.json())
      .then(async data => {
        setWo(data);
        if (data.vendor_id) {
          try {
            const vRes = await authFetch(`${API}/api/vendors/${data.vendor_id}`);
            const vData = await vRes.json();
            if (!vData.error) setVendor(vData);
          } catch (e) {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await authFetch(`${API}/api/workorders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wo, status })
      });
      const updated = await res.json();
      setWo(updated);
    } catch (e) { console.error(e); }
    setUpdatingStatus(false);
  };

  const deleteWO = async () => {
    if (!window.confirm('Delete this work order?')) return;
    await authFetch(`${API}/api/workorders/${id}`, { method: 'DELETE' });
    navigate('/workorders');
  };

  if (loading) return <div style={{ padding:40, color:'#64748b', textAlign:'center' }}>Loading...</div>;
  if (!wo) return <div style={{ padding:40, color:'#ef4444', textAlign:'center' }}>Work order not found.</div>;

  const due = wo.due_date ? new Date(wo.due_date) : null;
  const overdue = due && due < new Date() && wo.status !== 'Closed';
  const photos = wo.photos ? (typeof wo.photos === 'string' ? JSON.parse(wo.photos) : wo.photos) : [];
  const checklist = wo.checklist ? (typeof wo.checklist === 'string' ? JSON.parse(wo.checklist) : wo.checklist) : [];
  const STATUSES = ['Open', 'In Progress', 'On Hold', 'Closed'];

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:4 }}>{wo.wo_number}</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:NAVY, margin:0 }}>{wo.title}</h1>
          <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
            <span style={{ background:(PRIORITY_COLORS[wo.priority]||'#94a3b8')+'20', color:PRIORITY_COLORS[wo.priority]||'#94a3b8', fontWeight:700, fontSize:12, padding:'3px 12px', borderRadius:20 }}>{wo.priority}</span>
            <span style={{ background:(STATUS_COLORS[wo.status]||'#94a3b8')+'20', color:STATUS_COLORS[wo.status]||'#94a3b8', fontSize:12, padding:'3px 10px', borderRadius:20 }}>{wo.status}</span>
            <span style={{ background:'#f1f5f9', color:'#64748b', fontSize:12, padding:'3px 10px', borderRadius:20 }}>{wo.type}</span>
            {wo.source === 'Request' && <span style={{ background:'#fef3c7', color:'#d97706', fontSize:12, padding:'3px 10px', borderRadius:20 }}>📬 Submitted Request</span>}
            {vendor && <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:12, padding:'3px 10px', borderRadius:20 }}>🏢 Vendor Assigned</span>}
            {checklist.length > 0 && <span style={{ background: wo.checklist_completed ? '#f0fdf4' : '#f0f9ff', color: wo.checklist_completed ? '#16a34a' : BLUE, fontSize:12, padding:'3px 10px', borderRadius:20 }}>{wo.checklist_completed ? '✓ Checklist Complete' : `📋 ${checklist.filter(i=>i.completed).length}/${checklist.length} Checklist`}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => navigate(`/workorders/${id}/edit`)} style={{ background:BLUE, color:'#fff', border:'none', borderRadius:8, padding:'9px 18px', cursor:'pointer', fontWeight:600, fontSize:13 }}>Edit</button>
          <button onClick={deleteWO} style={{ background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, padding:'9px 18px', cursor:'pointer', fontWeight:600, fontSize:13 }}>Delete</button>
        </div>
      </div>

      {/* Status Workflow */}
      <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#64748b', marginBottom:12 }}>UPDATE STATUS</div>
        <div style={{ display:'flex', gap:8 }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => updateStatus(s)} disabled={updatingStatus || wo.status === s}
              style={{ flex:1, padding:'10px 4px', borderRadius:8, border:`2px solid ${wo.status===s?(STATUS_COLORS[s]||NAVY):'#e2e8f0'}`, background:wo.status===s?(STATUS_COLORS[s]||NAVY)+'15':'#fff', color:wo.status===s?(STATUS_COLORS[s]||NAVY):'#64748b', fontWeight:wo.status===s?700:500, fontSize:13, cursor:wo.status===s?'default':'pointer', transition:'all 0.15s' }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20, marginBottom:20 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Description */}
          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:12 }}>Description</h3>
            <p style={{ fontSize:14, color:'#334155', lineHeight:1.7, margin:0 }}>{wo.description || <span style={{ color:'#94a3b8' }}>No description provided.</span>}</p>
          </div>

          {/* Checklist */}
          {checklist.length > 0 && (
            <ChecklistSection wo={{ ...wo, checklist }} onUpdate={setWo} authFetch={authFetch} id={id} />
          )}

          {/* Resolution */}
          {wo.resolution_notes && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:24 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#16a34a', marginBottom:12 }}>✅ Resolution Notes</h3>
              <p style={{ fontSize:14, color:'#334155', lineHeight:1.7, margin:0 }}>{wo.resolution_notes}</p>
            </div>
          )}

          {/* Vendor card */}
          {vendor && (
            <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:24 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#1d4ed8', marginBottom:16 }}>🏢 Assigned Vendor</h3>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:700, color:NAVY }}>{vendor.name}</div>
                  <div style={{ fontSize:13, color:'#64748b', marginTop:2 }}>{vendor.scope}</div>
                </div>
                <button onClick={() => navigate(`/vendors/${vendor.id}`)}
                  style={{ background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                  View Profile →
                </button>
              </div>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {vendor.primary_contact && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>CONTACT</div><div style={{ fontSize:13, color:'#1e293b' }}>{vendor.primary_contact}</div></div>}
                {vendor.phone && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>PHONE</div><a href={`tel:${vendor.phone}`} style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>{vendor.phone}</a></div>}
                {vendor.email && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>EMAIL</div><a href={`mailto:${vendor.email}`} style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>{vendor.email}</a></div>}
                {vendor.website && <div><div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginBottom:2 }}>PORTAL</div><a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:13, color:BLUE, textDecoration:'none' }}>Open Portal →</a></div>}
              </div>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:12 }}>Photos</h3>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width:120, height:90, objectFit:'cover', borderRadius:8, cursor:'pointer' }} onClick={() => window.open(url,'_blank')} />)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:16 }}>Details</h3>
            {[
              ['Managed By', wo.assigned_to],
              ['Vendor', vendor ? vendor.name : '—'],
              ['Category', wo.category],
              ['Location', wo.location],
              ['Requested By', wo.requester_name],
              ['Due Date', due ? <span style={{ color:overdue?'#ef4444':'inherit', fontWeight:overdue?700:400 }}>{due.toLocaleDateString()}{overdue?' ⚠️ OVERDUE':''}</span> : '—'],
              ['Linked Asset', wo.asset_name ? <span style={{ color:BLUE, cursor:'pointer' }} onClick={() => navigate(`/assets/${wo.asset_id}`)}>{wo.asset_name}</span> : '—'],
              ['Created', new Date(wo.created_at).toLocaleDateString()],
              ['Last Updated', new Date(wo.updated_at || wo.created_at).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid #f8fafc' }}>
                <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{label}</span>
                <span style={{ fontSize:13, color:'#334155' }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {vendor && (
            <div style={{ background:NAVY, borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ color:'#94a3b8', fontSize:11, fontWeight:600 }}>VENDOR ACTIONS</div>
              {vendor.phone && <a href={`tel:${vendor.phone}`} style={{ background:'#ffffff20', color:'#fff', borderRadius:8, padding:'9px 14px', textDecoration:'none', fontSize:13, fontWeight:600, textAlign:'center' }}>📞 Call Vendor</a>}
              {vendor.email && <a href={`mailto:${vendor.email}`} style={{ background:'#ffffff20', color:'#fff', borderRadius:8, padding:'9px 14px', textDecoration:'none', fontSize:13, fontWeight:600, textAlign:'center' }}>✉️ Email Vendor</a>}
              {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ background:BLUE, color:'#fff', borderRadius:8, padding:'9px 14px', textDecoration:'none', fontSize:13, fontWeight:600, textAlign:'center' }}>🌐 Open Portal</a>}
            </div>
          )}

          <button onClick={() => navigate('/workorders')} style={{ background:'#f1f5f9', border:'none', color:'#475569', borderRadius:8, padding:'12px', cursor:'pointer', fontWeight:600, width:'100%' }}>
            ← Back to Work Orders
          </button>
        </div>
      </div>
    </div>
  );
}
