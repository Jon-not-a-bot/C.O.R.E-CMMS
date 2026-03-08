import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const PRIORITY_COLORS = { Emergency:'#ef4444', High:'#f59e0b', Medium:'#3AACDC', Low:'#22c55e' };
const STATUS_COLORS = { Open:'#ef4444', 'In Progress':'#f59e0b', 'On Hold':'#8b5cf6', Closed:'#22c55e' };

export default function WorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/workorders/${id}`)
      .then(r => r.json())
      .then(data => { setWo(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${API}/api/workorders/${id}`, {
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
    await fetch(`${API}/api/workorders/${id}`, { method: 'DELETE' });
    navigate('/workorders');
  };

  if (loading) return <div style={{ padding:40, color:'#64748b', textAlign:'center' }}>Loading...</div>;
  if (!wo) return <div style={{ padding:40, color:'#ef4444', textAlign:'center' }}>Work order not found.</div>;

  const due = wo.due_date ? new Date(wo.due_date) : null;
  const overdue = due && due < new Date() && wo.status !== 'Closed';
  const photos = wo.photos ? (typeof wo.photos === 'string' ? JSON.parse(wo.photos) : wo.photos) : [];

  const STATUSES = ['Open', 'In Progress', 'On Hold', 'Closed'];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:4 }}>{wo.wo_number}</div>
          <h1 style={{ fontSize:22, fontWeight:800, color:NAVY, margin:0 }}>{wo.title}</h1>
          <div style={{ display:'flex', gap:8, marginTop:8 }}>
            <span style={{ background:(PRIORITY_COLORS[wo.priority]||'#94a3b8')+'20', color:PRIORITY_COLORS[wo.priority]||'#94a3b8', fontWeight:700, fontSize:12, padding:'3px 12px', borderRadius:20 }}>{wo.priority}</span>
            <span style={{ background:(STATUS_COLORS[wo.status]||'#94a3b8')+'20', color:STATUS_COLORS[wo.status]||'#94a3b8', fontSize:12, padding:'3px 10px', borderRadius:20 }}>{wo.status}</span>
            <span style={{ background:'#f1f5f9', color:'#64748b', fontSize:12, padding:'3px 10px', borderRadius:20 }}>{wo.type}</span>
            {wo.source === 'Request' && <span style={{ background:'#fef3c7', color:'#d97706', fontSize:12, padding:'3px 10px', borderRadius:20 }}>📬 Submitted Request</span>}
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
          <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:12 }}>Description</h3>
            <p style={{ fontSize:14, color:'#334155', lineHeight:1.7, margin:0 }}>{wo.description || <span style={{ color:'#94a3b8' }}>No description provided.</span>}</p>
          </div>
          {wo.resolution_notes && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:24 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#16a34a', marginBottom:12 }}>✅ Resolution Notes</h3>
              <p style={{ fontSize:14, color:'#334155', lineHeight:1.7, margin:0 }}>{wo.resolution_notes}</p>
            </div>
          )}
          {photos.length > 0 && (
            <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:12 }}>Photos</h3>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {photos.map((url, i) => <img key={i} src={url} alt="" style={{ width:120, height:90, objectFit:'cover', borderRadius:8, cursor:'pointer' }} onClick={() => window.open(url,'_blank')} />)}
              </div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:NAVY, marginBottom:16 }}>Details</h3>
            {[
              ['Assigned To', wo.assigned_to],
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

          <button onClick={() => navigate('/workorders')} style={{ background:'#f1f5f9', border:'none', color:'#475569', borderRadius:8, padding:'12px', cursor:'pointer', fontWeight:600, width:'100%' }}>
            ← Back to Work Orders
          </button>
        </div>
      </div>
    </div>
  );
}
