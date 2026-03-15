import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const LAT = 40.2776;
const LON = -75.3849;

const WX_CODES = {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Fog',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',77:'Snow Grains',80:'Light Showers',81:'Showers',82:'Heavy Showers',85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm w/ Hail',99:'Thunderstorm w/ Heavy Hail'};
const WX_ICONS = {0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌦️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',71:'🌨️',73:'❄️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',85:'🌨️',86:'🌨️',95:'⛈️',96:'⛈️',99:'⛈️'};
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const PRIORITY_COLORS = { Emergency:'#ef4444', High:'#f59e0b', Medium:'#3AACDC', Low:'#22c55e' };

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return time;
}

function useWeather() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=7`)
      .then(r => r.json()).then(setWx).catch(() => {});
  }, []);
  return wx;
}

function WindDir(deg) { return ['N','NE','E','SE','S','SW','W','NW'][Math.round(deg/45)%8]; }

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [wos, setWos] = useState([]);
  const [pmTemplates, setPmTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const time = useClock();
  const wx = useWeather();
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/assets`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/workorders`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/pm-templates`).then(r => r.json()).catch(() => []),
    ]).then(([a, w, p]) => {
      setAssets(Array.isArray(a) ? a : []);
      setWos(Array.isArray(w) ? w : []);
      setPmTemplates(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, []);

  const copyRequestLink = () => {
    const url = window.location.origin + '/request';
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const now = new Date();
  const total = assets.length;
  const critA = assets.filter(a => a.criticality === 'A').length;
  const offlineAssets = assets.filter(a => a.condition === 'Critical' || a.condition === 'Poor');
  const overduePM = assets.filter(a => a.next_pm_date && new Date(a.next_pm_date) < now).length;

  const totalPossibleUptime = total * 100;
  const downtimePoints = offlineAssets.reduce((acc, a) => acc + (a.condition === 'Critical' ? 100 : 40), 0);
  const uptimePct = total > 0 ? Math.max(0, Math.round(((totalPossibleUptime - downtimePoints) / totalPossibleUptime) * 100)) : 100;

  const openWOs = wos.filter(w => w.status !== 'Closed');
  const newWOs = wos.filter(w => (now - new Date(w.created_at)) < 12 * 60 * 60 * 1000 && w.status !== 'Closed');
  const staleWOs = wos.filter(w => (now - new Date(w.created_at)) > 5 * 24 * 60 * 60 * 1000 && w.status !== 'Closed');
  const emergencyWOs = openWOs.filter(w => w.priority === 'Emergency');

  // PM compliance
  const activePMs = pmTemplates.filter(t => t.active);
  const overduePMs = activePMs.filter(t => t.next_due_date && new Date(t.next_due_date) < now);
  const pmCompliancePct = activePMs.length > 0 ? Math.round(((activePMs.length - overduePMs.length) / activePMs.length) * 100) : 100;

  const categories = {};
  assets.forEach(a => { categories[a.category] = (categories[a.category] || 0) + 1; });

  const cur = wx?.current;
  const daily = wx?.daily;

  if (loading) return <div style={{ padding:40, color:'#64748b', textAlign:'center' }}>Loading C.O.R.E. data...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom:16 }}>
        <h1 style={{ color:NAVY, fontSize:22, fontWeight:700, margin:0 }}>Dashboard</h1>
        <p style={{ color:'#64748b', margin:'4px 0 0', fontSize:13 }}>Harleysville Facility — Live Overview</p>
      </div>

      {/* Clock + Weather */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap:12, marginBottom:16 }}>
        {/* Clock */}
        <div style={{ background:NAVY, borderRadius:10, padding:'14px 18px', color:'#fff', display:'flex', flexDirection: isMobile ? 'row' : 'column', justifyContent: isMobile ? 'space-between' : 'center', alignItems: isMobile ? 'center' : 'flex-start' }}>
          <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1 }}>
            {time.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})} · Harleysville, PA
          </div>
          <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:800, letterSpacing:1, fontVariantNumeric:'tabular-nums', lineHeight:1.1 }}>
            {time.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </div>
        </div>

        {/* Weather */}
        <div style={{ background:'#fff', borderRadius:10, padding:'12px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          {!cur ? <div style={{ color:'#94a3b8', fontSize:13 }}>Loading weather...</div> : (
            <div style={{ display:'flex', alignItems:'center', gap:0, height:'100%' }}>
              {/* Current conditions — always visible */}
              <div style={{ display:'flex', alignItems:'center', gap:10, flex:'0 0 auto', paddingRight: isMobile ? 0 : 18, borderRight: isMobile ? 'none' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize:30 }}>{WX_ICONS[cur.weather_code]||'🌡️'}</span>
                <div>
                  <div style={{ fontSize:24, fontWeight:800, color:NAVY, lineHeight:1 }}>{Math.round(cur.temperature_2m)}°F</div>
                  <div style={{ fontSize:11, color:'#64748b' }}>{WX_CODES[cur.weather_code]||'—'} · Feels {Math.round(cur.apparent_temperature)}°</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>💧{cur.relative_humidity_2m}% · 💨{Math.round(cur.wind_speed_10m)}mph {WindDir(cur.wind_direction_10m)}</div>
                </div>
              </div>
              {/* 7-day forecast — desktop only */}
              {!isMobile && daily && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4, flex:1, paddingLeft:16 }}>
                  {daily.time.map((date, i) => {
                    const d = new Date(date+'T12:00:00');
                    return (
                      <div key={date} style={{ textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600 }}>{i===0?'Today':DAYS[d.getDay()]}</div>
                        <div style={{ fontSize:16, margin:'2px 0' }}>{WX_ICONS[daily.weather_code[i]]||'🌡️'}</div>
                        <div style={{ fontSize:11, fontWeight:700, color:NAVY }}>{Math.round(daily.temperature_2m_max[i])}°</div>
                        <div style={{ fontSize:10, color:'#94a3b8' }}>{Math.round(daily.temperature_2m_min[i])}°</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Asset KPIs — 5 col desktop, 2x3 mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Assets', value:total, color:BLUE },
          { label:'A-Tier Critical', value:critA, color:'#ef4444' },
          { label:'Assets Offline', value:offlineAssets.length, color:offlineAssets.length>0?'#ef4444':'#22c55e' },
          { label:'Fleet Uptime', value:`${uptimePct}%`, color:uptimePct>=95?'#22c55e':uptimePct>=80?'#f59e0b':'#ef4444' },
          { label:'PM Overdue', value:overduePM, color:overduePM>0?'#f59e0b':'#22c55e' },
        ].map(k => (
          <div key={k.label} style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', borderTop:`3px solid ${k.color}` }}>
            <div style={{ fontSize: isMobile ? 24 : 28, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* WO KPIs + Request Link */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr) auto', gap:12, marginBottom:16, alignItems:'stretch' }}>
        {[
          { label:'Open Work Orders', value:openWOs.length, color:NAVY },
          { label:'New (< 12 hrs)', value:newWOs.length, color:'#22c55e' },
          { label:'Stale (> 5 days)', value:staleWOs.length, color:staleWOs.length>0?'#ef4444':'#94a3b8' },
          { label:'Emergency', value:emergencyWOs.length, color:emergencyWOs.length>0?'#ef4444':'#94a3b8' },
        ].map(k => (
          <div key={k.label} onClick={() => navigate('/workorders')} style={{ background:'#fff', borderRadius:10, padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', borderTop:`3px solid ${k.color}`, cursor:'pointer' }}>
            <div style={{ fontSize: isMobile ? 24 : 26, fontWeight:800, color:k.color, lineHeight:1 }}>{k.value}</div>
            <div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{k.label}</div>
          </div>
        ))}
        {/* Request link — full width on mobile, auto on desktop */}
        <button onClick={copyRequestLink} style={{ background:copied?'#f0fdf4':NAVY, border:`2px solid ${copied?'#22c55e':NAVY}`, borderRadius:10, padding:'14px 20px', cursor:'pointer', display:'flex', flexDirection: isMobile ? 'row' : 'column', alignItems:'center', justifyContent:'center', gap:isMobile?8:4, transition:'all 0.2s', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
          <span style={{ fontSize:20 }}>{copied?'✅':'🔗'}</span>
          <span style={{ fontSize:13, fontWeight:700, color:copied?'#16a34a':'#fff' }}>{copied?'Copied!':'Copy Request Link'}</span>
          <span style={{ fontSize:11, color:copied?'#86efac':'#94a3b8' }}>Share with staff</span>
        </button>
      </div>

      {/* PM Compliance */}
      {activePMs.length > 0 && (
        <div style={{ background:'#fff', borderRadius:10, padding:'16px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:16, cursor:'pointer' }} onClick={() => navigate('/pm-schedules')}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <h2 style={{ color:NAVY, fontSize:14, fontWeight:700, margin:0 }}>🔧 PM Compliance</h2>
              <span style={{ fontSize:12, color:'#64748b' }}>{activePMs.length} active schedule{activePMs.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              {overduePMs.length > 0 && <span style={{ background:'#fef2f2', color:'#ef4444', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{overduePMs.length} overdue</span>}
              <span style={{ fontSize:18, fontWeight:800, color: pmCompliancePct >= 90 ? '#22c55e' : pmCompliancePct >= 70 ? '#f59e0b' : '#ef4444' }}>{pmCompliancePct}%</span>
            </div>
          </div>
          <div style={{ background:'#f1f5f9', borderRadius:20, height:8, overflow:'hidden' }}>
            <div style={{ width:`${pmCompliancePct}%`, height:'100%', background: pmCompliancePct >= 90 ? '#22c55e' : pmCompliancePct >= 70 ? '#f59e0b' : '#ef4444', borderRadius:20, transition:'width 0.5s' }} />
          </div>
          {overduePMs.length > 0 && (
            <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:4 }}>
              {overduePMs.slice(0,3).map(t => (
                <div key={t.id} style={{ fontSize:12, color:'#ef4444' }}>⚠️ {t.name} — overdue since {new Date(t.next_due_date).toLocaleDateString()}</div>
              ))}
              {overduePMs.length > 3 && <div style={{ fontSize:12, color:'#94a3b8' }}>+{overduePMs.length - 3} more overdue</div>}
            </div>
          )}
        </div>
      )}

      {/* Main panels — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16, marginBottom:16 }}>

        {/* New WOs */}
        <div style={{ background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ color:NAVY, fontSize:14, fontWeight:700, margin:0 }}>🆕 New Work Orders <span style={{ color:'#94a3b8', fontWeight:400 }}>(last 12 hrs)</span></h2>
            <span style={{ background:'#f0fdf4', color:'#16a34a', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{newWOs.length}</span>
          </div>
          {newWOs.length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:13, padding:'12px 0' }}>No new work orders in the last 12 hours.</div>
          ) : newWOs.map(w => (
            <div key={w.id} onClick={() => navigate(`/workorders/${w.id}`)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f8fafc', cursor:'pointer' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:'#1e293b' }}>{w.title}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{w.location||'—'} · {w.requester_name||'Internal'}</div>
              </div>
              <span style={{ background:(PRIORITY_COLORS[w.priority]||'#94a3b8')+'20', color:PRIORITY_COLORS[w.priority]||'#94a3b8', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap', marginLeft:8 }}>{w.priority}</span>
            </div>
          ))}
        </div>

        {/* Stale WOs */}
        <div style={{ background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ color:NAVY, fontSize:14, fontWeight:700, margin:0 }}>⏳ Stale Work Orders <span style={{ color:'#94a3b8', fontWeight:400 }}>(5+ days)</span></h2>
            <span style={{ background:staleWOs.length>0?'#fef2f2':'#f1f5f9', color:staleWOs.length>0?'#ef4444':'#94a3b8', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{staleWOs.length}</span>
          </div>
          {staleWOs.length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:13, padding:'12px 0' }}>No stale work orders — team is on top of it. ✅</div>
          ) : staleWOs.map(w => {
            const daysOld = Math.floor((now - new Date(w.created_at)) / (1000*60*60*24));
            return (
              <div key={w.id} onClick={() => navigate(`/workorders/${w.id}`)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f8fafc', cursor:'pointer' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{w.title}</div>
                  <div style={{ fontSize:11, color:'#94a3b8' }}>{w.assigned_to||'Unassigned'} · {w.status}</div>
                </div>
                <span style={{ background:'#fef2f2', color:'#ef4444', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, whiteSpace:'nowrap', marginLeft:8 }}>{daysOld}d old</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom panels — stack on mobile */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:16 }}>

        {/* Offline Assets */}
        <div style={{ background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <h2 style={{ color:NAVY, fontSize:14, fontWeight:700, margin:0 }}>🔴 Assets Offline / Down</h2>
            <span style={{ background:offlineAssets.length>0?'#fef2f2':'#f0fdf4', color:offlineAssets.length>0?'#ef4444':'#16a34a', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{offlineAssets.length}</span>
          </div>
          {offlineAssets.length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:13, padding:'12px 0' }}>All assets operational. Fleet uptime: <strong style={{ color:'#22c55e' }}>{uptimePct}%</strong></div>
          ) : offlineAssets.map(a => (
            <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #f8fafc', cursor:'pointer' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>{a.category} · {a.location||'—'}</div>
              </div>
              <span style={{ background:a.condition==='Critical'?'#fef2f2':'#fffbeb', color:a.condition==='Critical'?'#ef4444':'#f59e0b', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20, marginLeft:8 }}>{a.condition}</span>
            </div>
          ))}
          {total > 0 && (
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#64748b', marginBottom:6 }}>
                <span>Fleet Uptime</span><span style={{ fontWeight:700, color:uptimePct>=95?'#22c55e':uptimePct>=80?'#f59e0b':'#ef4444' }}>{uptimePct}%</span>
              </div>
              <div style={{ background:'#f1f5f9', borderRadius:20, height:8, overflow:'hidden' }}>
                <div style={{ width:`${uptimePct}%`, height:'100%', background:uptimePct>=95?'#22c55e':uptimePct>=80?'#f59e0b':'#ef4444', borderRadius:20, transition:'width 0.5s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Assets by Category */}
        <div style={{ background:'#fff', borderRadius:10, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color:NAVY, fontSize:14, fontWeight:700, margin:'0 0 14px' }}>Assets by Category</h2>
          {Object.keys(categories).length === 0 ? (
            <div style={{ color:'#94a3b8', fontSize:13 }}>No assets yet. <span style={{ color:BLUE, cursor:'pointer' }} onClick={() => navigate('/assets/new')}>Add your first →</span></div>
          ) : Object.entries(categories).sort((a,b) => b[1]-a[1]).map(([cat, count]) => (
            <div key={cat} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ flex:1, fontSize:13, color:'#334155' }}>{cat}</div>
              <div style={{ width:`${Math.round((count/total)*100)}px`, height:7, background:BLUE, borderRadius:4, minWidth:6 }} />
              <div style={{ fontSize:13, fontWeight:600, color:NAVY, width:20, textAlign:'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
