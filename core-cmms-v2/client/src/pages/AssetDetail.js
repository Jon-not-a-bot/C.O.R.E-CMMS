import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const NAV = '#1B2D4F';
const BLUE = '#3AACDC';
const CRIT_COLORS = { A: '#ef4444', B: '#f59e0b', C: '#22c55e' };

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/assets/${id}`).then(res => { setAsset(res.data); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this asset? This cannot be undone.')) return;
    await axios.delete(`/api/assets/${id}`);
    navigate('/assets');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Loading...</div>;
  if (!asset) return <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>Asset not found</div>;

  const Row = ({ label, value }) => value ? (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{ width: 180, fontSize: 13, color: '#64748b', fontWeight: 500, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{value}</div>
    </div>
  ) : null;

  const photos = Array.isArray(asset.photos) ? asset.photos : (asset.photos ? JSON.parse(asset.photos) : []);
  const pmOverdue = asset.next_pm_date && new Date(asset.next_pm_date) < new Date();
  const pmSoon = asset.next_pm_date && !pmOverdue && new Date(asset.next_pm_date) <= new Date(Date.now() + 30 * 86400000);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button onClick={() => navigate('/assets')} style={{ background: 'transparent', border: 'none', color: BLUE, cursor: 'pointer', fontSize: 13, marginBottom: 8, padding: 0 }}>
            ← Back to Registry
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAV }}>{asset.name}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            {asset.asset_id && <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>{asset.asset_id}</span>}
            <span style={{ background: CRIT_COLORS[asset.criticality] + '20', color: CRIT_COLORS[asset.criticality], padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 700 }}>
              Tier {asset.criticality}
            </span>
            <span style={{ background: asset.status === 'Active' ? '#dcfce7' : '#fee2e2', color: asset.status === 'Active' ? '#16a34a' : '#dc2626', padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>
              {asset.status}
            </span>
            {pmOverdue && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>⚠ PM Overdue</span>}
            {pmSoon && <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '3px 12px', borderRadius: 99, fontSize: 13, fontWeight: 600 }}>PM Due Soon</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate(`/assets/${id}/edit`)} style={{ background: NAV, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
            Edit
          </button>
          <button onClick={handleDelete} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>Identification</h3>
            <Row label="Category" value={asset.category} />
            <Row label="Subcategory" value={asset.subcategory} />
            <Row label="Location" value={asset.location} />
            <Row label="Condition" value={asset.condition} />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>Equipment Details</h3>
            <Row label="Manufacturer" value={asset.manufacturer} />
            <Row label="Model" value={asset.model} />
            <Row label="Serial Number" value={asset.serial_number} />
            <Row label="Install Date" value={asset.install_date ? new Date(asset.install_date).toLocaleDateString() : null} />
            <Row label="Warranty Expiry" value={asset.warranty_expiry ? new Date(asset.warranty_expiry).toLocaleDateString() : null} />
          </div>
        </div>

        {/* Right column */}
        <div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>PM Schedule</h3>
            <Row label="Frequency" value={asset.pm_frequency} />
            <Row label="Last PM" value={asset.last_pm_date ? new Date(asset.last_pm_date).toLocaleDateString() : null} />
            <Row label="Next PM Due" value={asset.next_pm_date ? new Date(asset.next_pm_date).toLocaleDateString() : null} />
            <Row label="Assigned Tech" value={asset.assigned_tech} />
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>Management</h3>
            <Row label="Management Type" value={asset.management_type} />
            <Row label="Vendor / Contractor" value={asset.vendor_name} />
          </div>
        </div>
      </div>

      {/* Notes */}
      {asset.notes && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>Notes</h3>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{asset.notes}</p>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: NAV, marginBottom: 12 }}>Photos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {photos.map((p, i) => (
              <img key={i} src={p} alt={`Asset ${i + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
