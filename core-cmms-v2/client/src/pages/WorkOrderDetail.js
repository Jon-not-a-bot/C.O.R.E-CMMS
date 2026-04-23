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
  const [creatingWO, setCreatingWO] = useState(null); // item id being processed
  const [createdWOs, setCreatedWOs] = useState({}); // itemId -> wo number
  const navigate = useNavigate();

  const checklist = wo.checklist || [];
  const passed = checklist.filter(i => i.status === 'pass').length;
  const failed = checklist.filter(i => i.status === 'fail').length;
  const pending = checklist.filter(i => !i.status || i.status === 'pending').length;
  const pct = checklist.length ? Math.round(((passed + failed) / checklist.length) * 100) : 0;
  const allDone = pending === 0;

  const setItemStatus = async (itemId, status) => {
    const item = checklist.find(i => i.id === itemId);
    if (!item) return;

    // If already this status, toggle back to pending
    const newStatus = item.status === status ? 'pending' : status;
    const updated = checklist.map(i => i.id === itemId ? { ...i, status: newStatus, completed: newStatus === 'pass' } : i);
    const allResolved = updated.every(i => i.status === 'pass' || i.status === 'fail');

    setSaving(true);
    try {
      const res = await authFetch(`${API}/api/workorders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wo, checklist: updated, checklist_completed: allResolved })
      });
      const data = await res.json();
      onUpdate(data);

      // Auto-create repair WO if failed
      if (newStatus === 'fail') {
        setCreatingWO(itemId);
        try {
          const assetName = wo.asset_name || 'Asset';
          const woRes = await authFetch(`${API}/api/workorders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `${assetName} — ${item.text}`,
              type: 'Repair',
              priority: 'High',
              status: 'Open',
              category: wo.category || 'General',
              location: wo.location || '',
              asset_id: wo.asset_id || '',
              assigned_to: wo.assigned_to || '',
              description: `Auto-generated from failed PM checklist item on WO ${wo.wo_number}.\n\nFailed item: ${item.text}\nAsset: ${assetName}`,
              source: 'PM Checklist',
            })
          });
          const newWO = await woRes.json();
          if (newWO.wo_number) {
            setCreatedWOs(prev => ({ ...prev, [itemId]: newWO.wo_number }));
          }
        } catch (e) { console.error('Failed to create repair WO:', e); }
        setCreatingWO(null);
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  return (
    <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, margin:0 }}>PM Checklist</h3>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {passed > 0 && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✓ {passed} passed</span>}
          {failed > 0 && <span style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>✗ {failed} failed</span>}
          {pending > 0 && <span style={{ fontSize:12, color:'#94a3b8' }}>{pending} pending</span>}
          {allDone && failed === 0 && <span style={{ background:'#f0fdf4', color:'#16a34a', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>✓ All Passed</span>}
          {allDone && failed > 0 && <span style={{ background:'#fef2f2', color:'#ef4444', fontSize:11, fontWeight:700, padding:'2px 10px', borderRadius:20 }}>⚠ {failed} Failed</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:'#f1f5f9', borderRadius:99, height:8, marginBottom:16, overflow:'hidden', display:'flex' }}>
        <div style={{ width:`${Math.round((passed/checklist.length)*100)}%`, height:'100%', background:'#22c55e', transition:'width 0.3s' }} />
        <div style={{ width:`${Math.round((failed/checklist.length)*100)}%`, height:'100%', background:'#ef4444', transition:'width 0.3s' }} />
      </div>

      {/* Items */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {checklist.map((item, idx) => {
          const status = item.status || 'pending';
          const isCreating = creatingWO === item.id;
          const createdWO = createdWOs[item.id];
          return (
            <div key={item.id || idx}>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:8,
                background: status === 'pass' ? '#f0fdf4' : status === 'fail' ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${status === 'pass' ? '#bbf7d0' : status === 'fail' ? '#fecaca' : '#e2e8f0'}` }}>

                {/* Item text */}
                <span style={{ fontSize:13, color: status === 'pass' ? '#16a34a' : status === 'fail' ? '#dc2626' : '#334155', fontWeight: status !== 'pending' ? 600 : 400, flex:1,
                  textDecoration: status === 'pass' ? 'line-through' : 'none' }}>
                  {item.text}
                  {item.required && status === 'pending' && <span style={{ fontSize:10, color:'#ef4444', fontWeight:700, background:'#fef2f2', padding:'1px 6px', borderRadius:10, marginLeft:8 }}>Required</span>}
                </span>

                {/* Pass / Fail buttons */}
                <div style={{ display:'flex', gap:6 }}>
                  <button onClick={() => !saving && setItemStatus(item.id, 'pass')} disabled={saving || isCreating}
                    style={{ padding:'5px 14px', borderRadius:6, border:`2px solid ${status === 'pass' ? '#22c55e' : '#e2e8f0'}`,
                      background: status === 'pass' ? '#22c55e' : '#fff', color: status === 'pass' ? '#fff' : '#64748b',
                      fontWeight:700, fontSize:12, cursor: saving ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
                    ✓ Pass
                  </button>
                  <button onClick={() => !saving && setItemStatus(item.id, 'fail')} disabled={saving || isCreating}
                    style={{ padding:'5px 14px', borderRadius:6, border:`2px solid ${status === 'fail' ? '#ef4444' : '#e2e8f0'}`,
                      background: status === 'fail' ? '#ef4444' : '#fff', color: status === 'fail' ? '#fff' : '#64748b',
                      fontWeight:700, fontSize:12, cursor: saving ? 'not-allowed' : 'pointer', transition:'all 0.15s' }}>
                    ✗ Fail
                  </button>
                </div>
              </div>

              {/* Auto-created WO notification */}
              {isCreating && (
                <div style={{ marginTop:4, padding:'6px 14px', background:'#fffbeb', borderRadius:6, fontSize:12, color:'#d97706' }}>
                  Creating repair work order...
                </div>
              )}
              {createdWO && (
                <div style={{ marginTop:4, padding:'6px 14px', background:'#fef2f2', borderRadius:6, fontSize:12, color:'#dc2626', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span>⚠ Repair WO created: <strong>{createdWO}</strong></span>
                  <span style={{ color:BLUE, cursor:'pointer', fontWeight:600 }} onClick={() => navigate('/workorders')}>View →</span>
                </div>
              )}
            </div>
          );
        })}
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
  const passed = checklist.filter(i => i.status === 'pass').length;
  const failed = checklist.filter(i => i.status === 'fail').length;
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
            {wo.source === 'PM Checklist' && <span style={{ background:'#fef2f2', color:'#dc2626', fontSize:12, padding:'3px 10px', borderRadius:20 }}>⚠ PM Checklist Failure</span>}
            {vendor && <span style={{ background:'#eff6ff', color:'#1d4ed8', fontSize:12, padding:'3px 10px', borderRadius:20 }}>🏢 Vendor Assigned</span>}
            {checklist.length > 0 && (
              <span style={{ background: failed > 0 ? '#fef2f2' : passed === checklist.length ? '#f0fdf4' : '#f0f9ff',
                color: failed > 0 ? '#dc2626' : passed === checklist.length ? '#16a34a' : BLUE, fontSize:12, padding:'3px 10px', borderRadius:20 }}>
                {failed > 0 ? `⚠ ${failed} Failed` : passed === checklist.length ? '✓ All Passed' : `📋 ${passed}/${checklist.length}`}
              </span>
            )}
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
              style={{ flex:1, padding:'10px 4px', borderRadius:8, border:`2px solid ${wo.status===s?(STATUS_COLORS[s]||NAVY):'#e2e8f0'}`,
                background:wo.status===s?(STATUS_COLORS[s]||NAVY)+'15':'#fff', color:wo.status===s?(STATUS_COLORS[s]||NAVY):'#64748b',
                fontWeight:wo.status===s?700:500, fontSize:13, cursor:wo.status===s?'default':'pointer', transition:'all 0.15s' }}>
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
