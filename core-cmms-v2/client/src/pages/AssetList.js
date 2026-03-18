import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const CONDITION_COLORS = { Excellent: '#22c55e', Good: '#3AACDC', Fair: '#f59e0b', Poor: '#f97316', Critical: '#ef4444' };

function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [selected, setSelected] = useState(new Set());
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  useEffect(() => {
    Promise.all([
      authFetch(`${API}/api/assets`).then(r => r.json()).catch(() => []),
      authFetch(`${API}/api/contracts`).then(r => r.json()).catch(() => []),
    ]).then(([a, c]) => {
      setAssets(Array.isArray(a) ? a : []);
      setContracts(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  }, []);

  const categories = [...new Set(assets.map(a => a.category).filter(Boolean))].sort();

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || (a.asset_id || '').toLowerCase().includes(q) || (a.location || '').toLowerCase().includes(q);
    const matchCategory = !filterCategory || a.category === filterCategory;
    const matchCondition = !filterCondition || a.condition === filterCondition;
    return matchSearch && matchCategory && matchCondition;
  });

  const allSelected = filtered.length > 0 && filtered.every(a => selected.has(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(a => next.delete(a.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(a => next.add(a.id)); return next; });
    }
  };

  const toggleOne = (id, e) => {
    e.stopPropagation();
    setSelected(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const exportCSV = () => {
    const toExport = assets.filter(a => selected.has(a.id));
    if (toExport.length === 0) return;

    const headers = [
      'Asset ID', 'Name', 'Category', 'Location', 'Condition', 'Criticality',
      'Manufacturer', 'Model', 'Serial Number', 'Year',
      'Purchase Date', 'Purchase Cost ($)', 'Warranty Expiry',
      'PM Frequency', 'Last PM Date', 'Next PM Date',
      'Contract Name', 'Contract Type', 'Contract Vendor',
      'Contract Start', 'Contract Expiry', 'Monthly Cost ($)', 'Annual Cost ($)',
      'Notice Period (days)', 'Auto-Renew', 'Notes'
    ];

    const rows = toExport.map(a => {
      // Get most recent non-warranty contract for this asset
      const assetContracts = contracts.filter(c => String(c.asset_id) === String(a.id));
      const mainContract = assetContracts.find(c => c.type !== 'Warranty') || null;

      // Extract monthly cost from notes if present
      let monthlyCost = '';
      if (mainContract?.notes) {
        const match = mainContract.notes.match(/Monthly cost: \$([0-9,]+\.?\d*)/i);
        if (match) monthlyCost = match[1].replace(',', '');
      }

      return [
        a.asset_id, a.name, a.category, a.location, a.condition, a.criticality,
        a.manufacturer, a.model, a.serial_number, a.year,
        a.purchase_date ? new Date(a.purchase_date).toLocaleDateString() : '',
        a.purchase_cost,
        a.warranty_expiry ? new Date(a.warranty_expiry).toLocaleDateString() : '',
        a.pm_frequency,
        a.last_pm_date ? new Date(a.last_pm_date).toLocaleDateString() : '',
        a.next_pm_date ? new Date(a.next_pm_date).toLocaleDateString() : '',
        mainContract?.name || '',
        mainContract?.type || '',
        mainContract?.vendor_name || '',
        mainContract?.start_date ? new Date(mainContract.start_date).toLocaleDateString() : '',
        mainContract?.end_date ? new Date(mainContract.end_date).toLocaleDateString() : '',
        monthlyCost,
        mainContract?.value || '',
        mainContract?.notice_period_days || '',
        mainContract?.auto_renew ? 'Yes' : (mainContract ? 'No' : ''),
        a.notes
      ].map(escapeCSV);
    });

    const csv = [headers.map(escapeCSV), ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CORE_Assets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading assets...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 24, fontWeight: 700, margin: 0 }}>Assets</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 14 }}>
            {assets.length} total · {assets.filter(a => a.condition === 'Critical' || a.condition === 'Poor').length} needs attention
            {selected.size > 0 && <span style={{ color: BLUE, fontWeight: 600 }}> · {selected.size} selected</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.size > 0 && (
            <button onClick={exportCSV}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⬇ Export {selected.size} Asset{selected.size > 1 ? 's' : ''} to CSV
            </button>
          )}
          <button onClick={() => navigate('/assets/new')}
            style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            + New Asset
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assets..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterCondition} onChange={e => setFilterCondition(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', cursor: 'pointer' }}>
          <option value="">All Conditions</option>
          {['Excellent', 'Good', 'Fair', 'Poor', 'Critical'].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: NAVY }}>
              <th style={{ padding: '12px 16px', width: 40 }}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll}
                  style={{ cursor: 'pointer', width: 15, height: 15 }} />
              </th>
              {['Asset ID', 'Name', 'Category', 'Location', 'Condition', 'Criticality', 'Next PM'].map(h => (
                <th key={h} style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: 12, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
                {assets.length === 0 ? 'No assets yet. Add your first asset.' : 'No assets match your filters.'}
              </td></tr>
            ) : filtered.map((a, i) => {
              const pmDate = a.next_pm_date ? new Date(a.next_pm_date) : null;
              const pmOverdue = pmDate && pmDate < new Date();
              const isSelected = selected.has(a.id);
              return (
                <tr key={a.id} onClick={() => navigate(`/assets/${a.id}`)}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: isSelected ? '#f0f9ff' : i % 2 === 0 ? '#fff' : '#fafafa' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'; }}>
                  <td style={{ padding: '12px 16px' }} onClick={e => toggleOne(a.id, e)}>
                    <input type="checkbox" checked={isSelected} onChange={() => {}}
                      style={{ cursor: 'pointer', width: 15, height: 15 }} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{a.asset_id || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{a.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{a.category || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569' }}>{a.location || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: (CONDITION_COLORS[a.condition] || '#94a3b8') + '20', color: CONDITION_COLORS[a.condition] || '#94a3b8', fontWeight: 700, fontSize: 12, padding: '2px 10px', borderRadius: 20 }}>{a.condition || '—'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: a.criticality === 'A' ? '#ef4444' : '#64748b' }}>{a.criticality || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: pmOverdue ? '#ef4444' : '#64748b', fontWeight: pmOverdue ? 700 : 400 }}>
                    {pmDate ? pmDate.toLocaleDateString() : '—'}{pmOverdue ? ' ⚠️' : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8', textAlign: 'right' }}>
          {selected.size === 0
            ? 'Check boxes to select assets for export'
            : `${selected.size} of ${filtered.length} selected — click Export to download CSV`}
        </div>
      )}
    </div>
  );
}
