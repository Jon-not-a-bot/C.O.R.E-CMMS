import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

// Harleysville PA coordinates
const LAT = 40.2776;
const LON = -75.3849;

const WX_CODES = {
  0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',
  45:'Fog',48:'Icy Fog',51:'Light Drizzle',53:'Drizzle',55:'Heavy Drizzle',
  61:'Light Rain',63:'Rain',65:'Heavy Rain',71:'Light Snow',73:'Snow',75:'Heavy Snow',
  77:'Snow Grains',80:'Light Showers',81:'Showers',82:'Heavy Showers',
  85:'Snow Showers',86:'Heavy Snow Showers',95:'Thunderstorm',96:'Thunderstorm w/ Hail',99:'Thunderstorm w/ Heavy Hail'
};

const WX_ICONS = {
  0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',
  51:'🌦️',53:'🌦️',55:'🌧️',61:'🌦️',63:'🌧️',65:'🌧️',
  71:'🌨️',73:'❄️',75:'❄️',77:'❄️',80:'🌦️',81:'🌧️',82:'⛈️',
  85:'🌨️',86:'🌨️',95:'⛈️',96:'⛈️',99:'⛈️'
};

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
}

function useWeather() {
  const [wx, setWx] = useState(null);
  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York&forecast_days=7`)
      .then(r => r.json())
      .then(data => setWx(data))
      .catch(console.error);
  }, []);
  return wx;
}

function WindDir(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export default function Dashboard() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const time = useClock();
  const wx = useWeather();

  useEffect(() => {
    fetch(`${API}/api/assets`)
      .then(r => r.json())
      .then(data => { setAssets(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total = assets.length;
  const critA = assets.filter(a => a.criticality === 'A').length;
  const overduePM = assets.filter(a => a.next_pm_date && new Date(a.next_pm_date) < new Date()).length;
  const vendorManaged = assets.filter(a => a.management_type === 'Vendor').length;

  const categories = {};
  assets.forEach(a => { categories[a.category] = (categories[a.category] || 0) + 1; });

  const pmSoon = assets
    .filter(a => a.next_pm_date)
    .sort((a, b) => new Date(a.next_pm_date) - new Date(b.next_pm_date))
    .slice(0, 5);

  const kpis = [
    { label: 'Total Assets', value: total, color: BLUE },
    { label: 'A-Tier Critical', value: critA, color: '#ef4444' },
    { label: 'PM Overdue', value: overduePM, color: '#f59e0b' },
    { label: 'Vendor Managed', value: vendorManaged, color: '#8b5cf6' },
  ];

  const cur = wx?.current;
  const daily = wx?.daily;

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading C.O.R.E. data...</div>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>Harleysville Facility — Asset Overview</p>
      </div>

      {/* Clock + Weather Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>

        {/* Clock */}
        <div style={{ background: NAVY, borderRadius: 10, padding: 24, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: 2, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Harleysville, PA</div>
        </div>

        {/* Current Weather */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          {!cur ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading weather...</div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Current Conditions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 56 }}>{WX_ICONS[cur.weather_code] || '🌡️'}</div>
                <div>
                  <div style={{ fontSize: 42, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{Math.round(cur.temperature_2m)}°F</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>Feels like {Math.round(cur.apparent_temperature)}°F</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginTop: 2 }}>{WX_CODES[cur.weather_code] || 'Unknown'}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 13, color: '#64748b', lineHeight: 1.8 }}>
                  <div>💧 {cur.relative_humidity_2m}% humidity</div>
                  <div>💨 {Math.round(cur.wind_speed_10m)} mph {WindDir(cur.wind_direction_10m)}</div>
                </div>
              </div>

              {/* 7-Day Forecast */}
              {daily && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  {daily.time.map((date, i) => {
                    const d = new Date(date + 'T12:00:00');
                    return (
                      <div key={date} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{i === 0 ? 'Today' : DAYS[d.getDay()]}</div>
                        <div style={{ fontSize: 20, margin: '4px 0' }}>{WX_ICONS[daily.weather_code[i]] || '🌡️'}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: NAVY }}>{Math.round(daily.temperature_2m_max[i])}°</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{Math.round(daily.temperature_2m_min[i])}°</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 36, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Assets by Category */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Assets by Category</h2>
          {Object.keys(categories).length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No assets yet. <span style={{ color: BLUE, cursor: 'pointer' }} onClick={() => navigate('/assets/new')}>Add your first asset →</span></div>
          ) : (
            Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{ flex: 1, fontSize: 14, color: '#334155' }}>{cat}</div>
                <div style={{ width: `${Math.round((count / total) * 120)}px`, height: 8, background: BLUE, borderRadius: 4, minWidth: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, width: 24, textAlign: 'right' }}>{count}</div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming PMs */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: NAVY, fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Upcoming PMs</h2>
          {pmSoon.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 14 }}>No PM schedules set yet.</div>
          ) : (
            pmSoon.map(a => {
              const due = new Date(a.next_pm_date);
              const daysOut = Math.ceil((due - new Date()) / 86400000);
              const overdue = daysOut < 0;
              return (
                <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{a.category}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: overdue ? '#ef4444' : daysOut <= 7 ? '#f59e0b' : '#22c55e', background: overdue ? '#fef2f2' : daysOut <= 7 ? '#fffbeb' : '#f0fdf4', padding: '3px 8px', borderRadius: 20 }}>
                    {overdue ? `${Math.abs(daysOut)}d overdue` : daysOut === 0 ? 'Due today' : `${daysOut}d`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
