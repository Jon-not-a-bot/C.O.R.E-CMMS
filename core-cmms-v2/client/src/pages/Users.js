import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'technician' });
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const { authFetch, user: currentUser } = useAuth();

  const load = () => {
    authFetch(`${API}/api/users`)
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password) { setError('Name, email, and password are required.'); return; }
    setSaving(true); setError('');
    const res = await authFetch(`${API}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'technician' });
      load();
    } else {
      const d = await res.json();
      setError(d.error || 'Failed to create user.');
    }
    setSaving(false);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    setActionLoading(id + '-delete');
    await authFetch(`${API}/api/users/${id}`, { method: 'DELETE' });
    setActionLoading(null);
    load();
  };

  const handleRoleChange = async (id, newRole, name) => {
    const action = newRole === 'admin' ? 'promote' : 'demote';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${name} to ${newRole}?`)) return;
    setActionLoading(id + '-role');
    await authFetch(`${API}/api/users/${id}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole })
    });
    setActionLoading(null);
    load();
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading users...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, margin: 0 }}>Users</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>{users.length} users · {users.filter(u => u.role === 'admin').length} admin · {users.filter(u => u.role === 'technician').length} technician</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: NAVY, margin: '0 0 16px' }}>New User</h2>
          {error && <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 7, marginBottom: 12, fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Full name"
                style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@company.com"
                style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Temporary password"
                style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                style={{ padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 14, width: '100%', background: '#fff', outline: 'none' }}>
                <option value="technician">Technician</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      )}

      {/* User cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {users.map(u => {
          const isMe = u.id === currentUser?.id;
          const isAdmin = u.role === 'admin';
          return (
            <div key={u.id} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: isAdmin ? '#dbeafe' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: isAdmin ? '#1d4ed8' : '#16a34a', flexShrink: 0 }}>
                {u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{u.name}</span>
                  {isMe && <span style={{ fontSize: 11, color: BLUE, fontWeight: 500 }}>you</span>}
                  <span style={{ background: isAdmin ? '#dbeafe' : '#f0fdf4', color: isAdmin ? '#1d4ed8' : '#16a34a', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize' }}>{u.role}</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{u.email}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                  Last login: {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </div>
              </div>

              {/* Actions — not shown for self */}
              {!isMe && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {/* Promote / Demote */}
                  {isAdmin ? (
                    <button
                      onClick={() => handleRoleChange(u.id, 'technician', u.name)}
                      disabled={actionLoading === u.id + '-role'}
                      style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actionLoading === u.id + '-role' ? 0.6 : 1 }}>
                      {actionLoading === u.id + '-role' ? '...' : '↓ Demote'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(u.id, 'admin', u.name)}
                      disabled={actionLoading === u.id + '-role'}
                      style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actionLoading === u.id + '-role' ? 0.6 : 1 }}>
                      {actionLoading === u.id + '-role' ? '...' : '↑ Promote'}
                    </button>
                  )}
                  {/* Remove */}
                  <button
                    onClick={() => handleDelete(u.id, u.name)}
                    disabled={actionLoading === u.id + '-delete'}
                    style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: actionLoading === u.id + '-delete' ? 0.6 : 1 }}>
                    {actionLoading === u.id + '-delete' ? '...' : 'Remove'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
