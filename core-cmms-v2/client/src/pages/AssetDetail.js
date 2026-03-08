import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';
const CONDITION_COLORS = { Excellent: '#22c55e', Good: '#3AACDC', Fair: '#f59e0b', Poor: '#f97316', Critical: '#ef4444' };

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [asset, setAsset] = useState(null);
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/assets/${id}`).then(r => r.json()),
      authFetch(`${API}/api/workorders`).then(r => r.json()).catch(() => [])
    ]).then(([a, wos]) => {
      setAsset(a);
      const linked = Array.isArray(wos) ? wos.filter(w => String(w.asset_id) === String(id)) : [];
      setWorkorders(linked);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const deleteAsset = async () => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    await authFetch(`${API}/api/assets/${id}`, { method: 'DELETE' });
    navigate('/assets');
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading asset...</div>;
  if (!asset || asset.error) return <div style={{ padding: 40, color: '#ef4444', textAlign: 'center' }}>Asset not found.</div>;

  const photos = asset.photos ? (typeof asset.photos === 'string' ? JSON.parse(asset.photos) : asset.photos) : [];
  const pmDate = asset.next_pm_date ? new Date(asset.next_pm_date) : null;
  const pmOverdue = pmDate && pmDate < new Date();
  const openWOs = workorders.filter(w => w.status !== 'Closed');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4, fontFamily: 'monospace' }}>{asset.asset_id || 'No ID'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>{asset.name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ background: (CONDITION_COLORS[asset.condition] || '#94a3b8') + '20', color: CONDITION_COLORS[asset.condition] || '#94a3b8', fontWeight: 700, fontSize: 12, padding: '3px 12px', borderRadius: 20 }}>{asset.condition}</span>
            {asset.criticality && <span style={{ background: asset.criticality === 'A' ? '#fef2f2' : '#f1f5f9', color: asset.criticality === 'A' ? '#ef4444' : '#64748b', fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>Criticality {asset.criticality}</span>}
            {asset.category && <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 12, padding: '3px 10px', borderRadius: 20 }}>{asset.category}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/workorders/new`)} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>+ Work Order</button>
          <button onClick={() => navigate(`/assets/${id}/edit`)} style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Edit</button>
          <button onClick={deleteAsset} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Details card */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Asset Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                ['Location', asset.location],
                ['Manufacturer', asset.manufacturer],
                ['Model', asset.model],
                ['Serial Number', asset.serial_number],
                ['Year', asset.year],
                ['Purchase Date', asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : null],
                ['Purchase Cost', asset.purchase_cost ? `$${Number(asset.purchase_cost).toLocaleString()}` : null],
                ['Warranty Expiry', asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : null],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: val ? '#1e293b' : '#cbd5e1' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Notes</h3>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0 }}>{asset.notes}</p>
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Photos</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: 140, height: 105, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '1px solid #e2e8f0' }}
                    onClick={() => window.open(url, '_blank')} />
                ))}
              </div>
            </div>
          )}

          {/* Linked Work Orders */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>Work Orders</h3>
              <span style={{ background: openWOs.length > 0 ? '#fef2f2' : '#f0fdf4', color: openWOs.length > 0 ? '#ef4444' : '#16a34a', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{openWOs.length} open</span>
            </div>
            {workorders.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No work orders linked to this asset.</div>
            ) : workorders.slice(0, 5).map(w => (
              <div key={w.id} onClick={() => navigate(`/workorders/${w.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{w.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.wo_number} · {w.status}</div>
                </div>
                <span style={{ fontSize: 11, color: w.status === 'Closed' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* PM Status */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${pmOverdue ? '#ef4444' : pmDate ? '#22c55e' : '#e2e8f0'}` }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Preventive Maintenance</h3>
            {[
              ['PM Frequency', asset.pm_frequency],
              ['Last PM', asset.last_pm_date ? new Date(asset.last_pm_date).toLocaleDateString() : null],
              ['Next PM Due', pmDate ? <span style={{ color: pmOverdue ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{pmDate.toLocaleDateString()}{pmOverdue ? ' ⚠️ OVERDUE' : ' ✅'}</span> : null],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#334155' }}>{val || '—'}</span>
              </div>
            ))}
          </div>

          {/* Quick stats */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>History</h3>
            {[
              ['Total Work Orders', workorders.length],
              ['Open Work Orders', openWOs.length],
              ['Closed Work Orders', workorders.filter(w => w.status === 'Closed').length],
              ['Added to System', asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{val}</span>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/assets')} style={{ background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: 8, padding: '12px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            ← Back to Assets
          </button>
        </div>
      </div>
    </div>
  );
}
