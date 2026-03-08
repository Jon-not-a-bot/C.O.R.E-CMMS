import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

export default function Users() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'technician' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => fetch(`${API}/api/auth/users`, { headers:{ Authorization:`Bearer ${token}` } })
    .then(r => r.json()).then(setUsers).catch(() => {});

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) { setError('All fields required'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/api/auth/users`, {
        method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(`User ${data.name} created successfully`);
      setForm({ name:'', email:'', password:'', role:'technician' });
      load();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const toggleActive = async (u) => {
    await fetch(`${API}/api/auth/users/${u.id}`, {
      method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
      body: JSON.stringify({ ...u, active: !u.active })
    });
    load();
  };

  const inputStyle = { padding:'9px 12px', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, outline:'none', width:'100%', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ color:NAVY, fontSize:22, fontWeight:700, margin:0 }}>User Management</h1>
        <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Admin only — manage who can access C.O.R.E.</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
        {/* Create User */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:20 }}>Add New User</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div><label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Full Name</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Smith" /></div>
            <div><label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Email</label>
              <input type="email" style={inputStyle} value={form.email} onChange={e => set('email', e.target.value)} placeholder="john@company.com" /></div>
            <div><label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Temporary Password</label>
              <input type="text" style={inputStyle} value={form.password} onChange={e => set('password', e.target.value)} placeholder="They can change it later" /></div>
            <div><label style={{ fontSize:12, fontWeight:600, color:'#64748b', display:'block', marginBottom:5 }}>Role</label>
              <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="technician">Technician</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {error && <div style={{ color:'#ef4444', fontSize:13 }}>{error}</div>}
            {success && <div style={{ color:'#22c55e', fontSize:13 }}>{success}</div>}
            <button onClick={createUser} disabled={saving} style={{ background:NAVY, color:'#fff', border:'none', borderRadius:8, padding:'12px', fontWeight:700, fontSize:14, cursor:'pointer', opacity:saving?0.7:1 }}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>

        {/* User List */}
        <div style={{ background:'#fff', borderRadius:12, padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:NAVY, marginBottom:20 }}>Current Users ({users.length})</h2>
          {users.map(u => (
            <div key={u.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:600, color: u.active?'#1e293b':'#94a3b8' }}>{u.name} {u.id === user?.id && <span style={{ fontSize:11, color:BLUE }}>(you)</span>}</div>
                <div style={{ fontSize:12, color:'#94a3b8' }}>{u.email} · {u.role}</div>
                <div style={{ fontSize:11, color:'#cbd5e1' }}>{u.last_login ? `Last login: ${new Date(u.last_login).toLocaleDateString()}` : 'Never logged in'}</div>
              </div>
              {u.id !== user?.id && (
                <button onClick={() => toggleActive(u)} style={{ background:u.active?'#fee2e2':'#f0fdf4', color:u.active?'#ef4444':'#22c55e', border:'none', borderRadius:6, padding:'5px 12px', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  {u.active ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
