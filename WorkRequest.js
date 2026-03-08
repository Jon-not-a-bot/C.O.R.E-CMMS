import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const LOCATIONS = ['Production Floor','Dock Area','Office','Roof','Exterior','Mechanical Room','Break Room','Parking Lot','Other'];
const URGENCY_MAP = { 'Safety hazard / Emergency': 'Emergency', 'Affecting production': 'High', 'Important but not urgent': 'Medium', 'Low priority / When available': 'Low' };

export default function WorkRequest() {
  const [form, setForm] = useState({ requester_name:'', location:'Production Floor', description:'', urgency:'Important but not urgent' });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [woNumber, setWoNumber] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.requester_name.trim() || !form.description.trim()) { setError('Please fill in your name and describe the issue.'); return; }
    setSubmitting(true); setError('');
    try {
      const data = new FormData();
      data.append('title', form.description.slice(0, 80));
      data.append('description', form.description);
      data.append('priority', URGENCY_MAP[form.urgency] || 'Medium');
      data.append('location', form.location);
      data.append('requester_name', form.requester_name);
      data.append('source', 'Request');
      data.append('category', 'General');
      photos.forEach(p => data.append('photos', p));
      const res = await fetch(`${API}/api/workorders`, { method:'POST', body:data });
      if (!res.ok) throw new Error('Submission failed');
      const wo = await res.json();
      setWoNumber(wo.wo_number);
      setSubmitted(true);
    } catch (err) { setError('Something went wrong. Please try again or contact facilities directly.'); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'#fff', borderRadius:16, padding:40, maxWidth:480, width:'100%', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
        <h1 style={{ color:NAVY, fontSize:24, fontWeight:800, marginBottom:8 }}>Request Submitted!</h1>
        <div style={{ background:'#f0f9ff', border:`1px solid ${BLUE}30`, borderRadius:10, padding:16, marginBottom:20 }}>
          <div style={{ fontSize:12, color:'#94a3b8', marginBottom:4 }}>YOUR WORK ORDER NUMBER</div>
          <div style={{ fontSize:28, fontWeight:800, color:BLUE, fontFamily:'monospace' }}>{woNumber}</div>
        </div>
        <p style={{ color:'#64748b', fontSize:14, lineHeight:1.7, marginBottom:24 }}>
          Your request has been received and assigned to the facilities team. Save your work order number for follow-up.
        </p>
        <button onClick={() => { setSubmitted(false); setForm({ requester_name:'', location:'Production Floor', description:'', urgency:'Important but not urgent' }); setPhotos([]); }}
          style={{ background:NAVY, color:'#fff', border:'none', borderRadius:8, padding:'12px 28px', cursor:'pointer', fontWeight:700, fontSize:15 }}>
          Submit Another Request
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', padding:'24px 16px' }}>
      <div style={{ maxWidth:560, margin:'0 auto' }}>
        <div style={{ background:NAVY, borderRadius:16, padding:28, marginBottom:24, textAlign:'center' }}>
          <div style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:2, marginBottom:4 }}>C.O.R.E.</div>
          <div style={{ color:'#94a3b8', fontSize:14 }}>Facility Maintenance Request</div>
        </div>

        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:NAVY, marginBottom:20 }}>Report an Issue</h2>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Your Name <span style={{ color:'#ef4444' }}>*</span></label>
              <input value={form.requester_name} onChange={e => set('requester_name', e.target.value)} placeholder="First and last name"
                style={{ padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, width:'100%', boxSizing:'border-box', outline:'none' }} />
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Location</label>
              <select value={form.location} onChange={e => set('location', e.target.value)}
                style={{ padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, width:'100%', background:'#fff', outline:'none' }}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>How Urgent? <span style={{ color:'#ef4444' }}>*</span></label>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {Object.keys(URGENCY_MAP).map(u => {
                  const color = u.includes('Safety') ? '#ef4444' : u.includes('production') ? '#f59e0b' : u.includes('Important') ? BLUE : '#22c55e';
                  return (
                    <div key={u} onClick={() => set('urgency', u)}
                      style={{ border:`2px solid ${form.urgency===u?color:'#e2e8f0'}`, borderRadius:10, padding:'12px 16px', cursor:'pointer', background:form.urgency===u?color+'12':'#fff', display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', background:form.urgency===u?color:'#e2e8f0', flexShrink:0 }} />
                      <span style={{ fontSize:14, fontWeight:form.urgency===u?600:400, color:form.urgency===u?color:'#334155' }}>{u}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Describe the Issue <span style={{ color:'#ef4444' }}>*</span></label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="What's the problem? Where exactly? When did it start? What have you already tried?"
                style={{ padding:'10px 14px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, width:'100%', boxSizing:'border-box', minHeight:120, resize:'vertical', outline:'none', fontFamily:'inherit' }} />
            </div>

            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Photo (optional)</label>
              <input type="file" accept="image/*" multiple capture="environment" onChange={e => setPhotos([...e.target.files])}
                style={{ fontSize:14, color:'#64748b' }} />
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:4 }}>Take a photo of the issue if helpful</div>
            </div>
          </div>
        </div>

        {error && <div style={{ background:'#fee2e2', color:'#dc2626', padding:'12px 16px', borderRadius:8, marginBottom:16, fontSize:14 }}>{error}</div>}

        <button onClick={submit} disabled={submitting}
          style={{ width:'100%', background:NAVY, color:'#fff', border:'none', borderRadius:10, padding:'16px', fontSize:16, fontWeight:700, cursor:submitting?'not-allowed':'pointer', opacity:submitting?0.7:1 }}>
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>

        <p style={{ textAlign:'center', fontSize:12, color:'#94a3b8', marginTop:16 }}>
          For emergencies, contact facilities directly. This form is for non-emergency requests only.
        </p>
      </div>
    </div>
  );
}
