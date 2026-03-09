import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const SCOPE_COLORS = {
  'Building Maintenance': '#3AACDC', 'Roof': '#8b5cf6', 'HVAC': '#f59e0b',
  'PIT': '#ef4444', 'Machinery': '#f97316', 'Electrical': '#eab308',
  'Plumbing': '#06b6d4', 'Fire & Life Safety': '#dc2626', 'Pest Control': '#84cc16',
  'Landscaping': '#22c55e', 'Janitorial': '#64748b', 'IT / Technology': '#6366f1', 'General': '#94a3b8',
};

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [assets, setAssets] = useState([]);
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/vendors/${id}`).then(r => r.json()),
      authFetch(`${API}/api/assets`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/workorders`).then(r => r.json()).catch(() => []),
    ]).then(([v, a, w]) => {
      setVendor(v);
      setAssets(Array.isArray(a) ? a.filter(asset => String(asset.vendor_id) === String(id)) : []);
      setWorkorders(Array.isArray(w) ? w.filter(wo => String(wo.vendor_id) === String(id)) : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const deleteVendor = async () => {
    if (!window.confirm('Delete this vendor? This will not delete linked assets or work orders.')) return;
    await authFetch(`${API}/api/vendors/${id}`, { method: 'DELETE' });
    navigate('/vendors');
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading vendor...</div>;
  if (!vendor || vendor.error) return <div style={{ padding: 40, color: '#ef4444', textAlign: 'center' }}>Vendor not found.</div>;

  const scopeColor = SCOPE_COLORS[vendor.scope] || '#94a3b8';
  const contractEnd = vendor.contract_end ? new Date(vendor.contract_end) : null;
  const contractExpired = contractEnd && contractEnd < new Date();
  const contractExpiringSoon = contractEnd && !contractExpired && (contractEnd - new Date()) < 60 * 24 * 60 * 60 * 1000;
  const openWOs = workorders.filter(w => w.status !== 'Closed');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ background: scopeColor + '20', color: scopeColor, fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20 }}>{vendor.scope}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: 0 }}>{vendor.name}</h1>
          {vendor.primary_contact && <div style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>👤 {vendor.primary_contact}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate(`/vendors/${id}/edit`)}
            style={{ background: NAVY, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Edit</button>
          <button onClick={deleteVendor}
            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact card */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {[
                ['Primary Contact', vendor.primary_contact],
                ['Phone', vendor.phone ? <a href={`tel:${vendor.phone}`} style={{ color: BLUE, textDecoration: 'none' }}>{vendor.phone}</a> : null],
                ['Email', vendor.email ? <a href={`mailto:${vendor.email}`} style={{ color: BLUE, textDecoration: 'none' }}>{vendor.email}</a> : null],
                ['Website / Portal', vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: BLUE, textDecoration: 'none', wordBreak: 'break-all' }}>{vendor.website}</a> : null],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 14, color: val ? '#1e293b' : '#cbd5e1' }}>{val || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Contract card */}
          {(vendor.contract_start || vendor.contract_end || vendor.contract_notes) && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${contractExpired ? '#ef4444' : contractExpiringSoon ? '#f59e0b' : '#22c55e'}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16 }}>
                📋 Service Agreement
                {contractExpired && <span style={{ marginLeft: 8, color: '#ef4444', fontSize: 12 }}>⚠️ EXPIRED</span>}
                {contractExpiringSoon && <span style={{ marginLeft: 8, color: '#f59e0b', fontSize: 12 }}>⏳ Expiring soon</span>}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, marginBottom: vendor.contract_notes ? 16 : 0 }}>
                {[
                  ['Start Date', vendor.contract_start ? new Date(vendor.contract_start).toLocaleDateString() : null],
                  ['End Date', contractEnd ? <span style={{ color: contractExpired ? '#ef4444' : contractExpiringSoon ? '#f59e0b' : 'inherit', fontWeight: (contractExpired || contractExpiringSoon) ? 700 : 400 }}>{contractEnd.toLocaleDateString()}</span> : null],
                ].map(([label, val]) => (
                  <div key={label} style={{ padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, color: '#1e293b' }}>{val || '—'}</div>
                  </div>
                ))}
              </div>
              {vendor.contract_notes && (
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{vendor.contract_notes}</p>
              )}
            </div>
          )}

          {/* Internal notes */}
          {vendor.notes && (
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Internal Notes</h3>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{vendor.notes}</p>
            </div>
          )}

          {/* Linked Assets */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>Linked Assets</h3>
              <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{assets.length}</span>
            </div>
            {assets.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No assets linked to this vendor.</div>
            ) : assets.map(a => (
              <div key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{a.asset_id || ''} · {a.category}</div>
                </div>
                <span style={{ fontSize: 11, color: '#64748b' }}>{a.location}</span>
              </div>
            ))}
          </div>

          {/* Linked Work Orders */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, margin: 0 }}>Work Orders</h3>
              <span style={{ background: openWOs.length > 0 ? '#fef2f2' : '#f1f5f9', color: openWOs.length > 0 ? '#ef4444' : '#94a3b8', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>{openWOs.length} open</span>
            </div>
            {workorders.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>No work orders assigned to this vendor.</div>
            ) : workorders.slice(0, 6).map(w => (
              <div key={w.id} onClick={() => navigate(`/workorders/${w.id}`)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{w.title}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{w.wo_number} · Managed by {w.assigned_to || 'Unassigned'}</div>
                </div>
                <span style={{ fontSize: 11, color: w.status === 'Closed' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{w.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Summary</h3>
            {[
              ['Scope', vendor.scope || '—'],
              ['Linked Assets', assets.length],
              ['Total Work Orders', workorders.length],
              ['Open Work Orders', openWOs.length],
              ['Added', vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : '—'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ background: NAVY, borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Quick Actions</div>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} style={{ background: '#ffffff20', color: '#fff', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                📞 Call {vendor.primary_contact || 'Vendor'}
              </a>
            )}
            {vendor.email && (
              <a href={`mailto:${vendor.email}`} style={{ background: '#ffffff20', color: '#fff', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                ✉️ Email Vendor
              </a>
            )}
            {vendor.website && (
              <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ background: BLUE, color: '#fff', borderRadius: 8, padding: '10px 14px', textDecoration: 'none', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                🌐 Open Portal
              </a>
            )}
          </div>

          <button onClick={() => navigate('/vendors')}
            style={{ background: '#f1f5f9', border: 'none', color: '#475569', borderRadius: 8, padding: '12px', cursor: 'pointer', fontWeight: 600, width: '100%' }}>
            ← Back to Vendors
          </button>
        </div>
      </div>
    </div>
  );
}
