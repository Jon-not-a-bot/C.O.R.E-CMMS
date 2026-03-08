import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ background:NAVY, borderRadius:16, padding:36, marginBottom:4 }}>
          <div style={{ textAlign:'center', marginBottom:32 }}>
            <div style={{ fontSize:32, fontWeight:900, letterSpacing:3, color:'#fff' }}>C.O.R.E.</div>
            <div style={{ color:'#94a3b8', fontSize:14, marginTop:4 }}>Computerized Maintenance Management</div>
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:15, outline:'none', boxSizing:'border-box' }}
                placeholder="your@email.com" />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:8, color:'#fff', fontSize:15, outline:'none', boxSizing:'border-box' }}
                placeholder="••••••••" />
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:8, padding:'10px 14px', color:'#fca5a5', fontSize:13 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ background:BLUE, color:'#fff', border:'none', borderRadius:8, padding:'14px', fontSize:15, fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, marginTop:8 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <div style={{ textAlign:'center', color:'#94a3b8', fontSize:12, marginTop:12 }}>
          Harleysville Facility · Secured Access
        </div>
      </div>
    </div>
  );
}
