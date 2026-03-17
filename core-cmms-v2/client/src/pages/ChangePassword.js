import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

export default function ChangePassword() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError('');
    if (!form.current_password || !form.new_password || !form.confirm_password) {
      setError('All fields are required.'); return;
    }
    if (form.new_password.length < 8) {
      setError('New password must be at least 8 characters.'); return;
    }
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match.'); return;
    }
    setSaving(true);
    const res = await authFetch(`${API}/api/auth/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to update password.');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    }
    setSaving(false);
  };

  const inputStyle = {
    padding: '11px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
    fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
  };

  if (success) return (
    <div style={{ maxWidth: 440, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2 style={{ color: NAVY, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Password updated!</h2>
      <p style={{ color: '#64748b', fontSize: 14 }}>Redirecting you to the dashboard...</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 440, margin: '48px auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate(-1)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 7, padding: '8px 14px', cursor: 'pointer', fontSize: 13, color: '#64748b' }}>← Back</button>
        <h1 style={{ color: NAVY, fontSize: 20, fontWeight: 700, margin: 0 }}>Change Password</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Signed in as <strong style={{ color: NAVY }}>{user?.name}</strong> · {user?.email}
          </div>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)}
              placeholder="Enter your current password" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)}
              placeholder="At least 8 characters" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
              placeholder="Repeat new password" style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={saving}
          style={{ width: '100%', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop: 20 }}>
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
