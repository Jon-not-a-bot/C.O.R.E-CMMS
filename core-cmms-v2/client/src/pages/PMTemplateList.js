import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const API = process.env.REACT_APP_API_URL || '';
const NAVY = '#1B2D4F';
const BLUE = '#3AACDC';

const FREQ_COLORS = {
  'Daily': '#8b5cf6', 'Weekly': '#3AACDC', 'Bi-Weekly': '#06b6d4',
  'Monthly': '#10b981', 'Quarterly': '#f59e0b', 'Semi-Annual': '#f97316', 'Annual': '#ef4444'
};

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function PMTemplateList() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    authFetch(`${API}/api/pm-templates`)
      .then(r => r.json())
      .then(data => { setTemplates(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const active = templates.filter(t => t.active);
  const overdue = active.filter(t => t.next_due_date && new Date(t.next_due_date) < now);
  const onTrack = active.filter(t => !t.next_due_date || new Date(t.next_due_date) >= now);
  const compliancePct = active.length > 0 ? Math.round((onTrack.length / active.length) * 100) : 100;

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PM schedule?')) return;
    await authFetch(`${API}/api/pm-templates/${id}`, { method: 'DELETE' });
    setTemplates(t => t.filter(x => x.id !== id));
  };

  if (loading) return <div style={{ padding: 40, color: '#64748b', textAlign: 'center' }}>Loading PM schedules...</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: 16, flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <div>
          <h1 style={{ color: NAVY, fontSize: 22, fontWeight: 700, margin: 0 }}>PM Schedules</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: 13 }}>{active.length} active · {overdue.length} overdue</p>
        </div>
        <button onClick={() => navigate('/pm-schedules/new')}
          style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
          + New PM Schedule
        </button>
      </div>

      {/* Compliance summary */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active Schedules', value: active.length, color: BLUE },
          { label: 'PM Compliance', value: `${compliancePct}%`, color: compliancePct >= 90 ? '#22c55e' : compliancePct >= 70 ? '#f59e0b' : '#ef4444' },
          { label: 'On Track', value: onTrack.length, color: '#22c55e' },
          { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? '#ef4444' : '#94a3b8' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Compliance bar */}
      {active.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: NAVY }}>Overall PM Compliance</span>
            <span style={{ fontWeight: 700, color: compliancePct >= 90 ? '#22c55e' : compliancePct >= 70 ? '#f59e0b' : '#ef4444' }}>{compliancePct}%</span>
          </div>
          <div style={{ background: '#f1f5f9', borderRadius: 20, height: 10, overflow: 'hidden' }}>
            <div style={{ width: `${compliancePct}%`, height: '100%', background: compliancePct >= 90 ? '#22c55e' : compliancePct >= 70 ? '#f59e0b' : '#ef4444', borderRadius: 20, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}

      {/* Templates list */}
      {templates.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 10, padding: 40, textAlign: 'center', color: '#94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          No PM schedules yet. <span style={{ color: BLUE, cursor: 'pointer' }} onClick={() => navigate('/pm-schedules/new')}>Create your first →</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => {
            const nextDue = t.next_due_date ? new Date(t.next_due_date) : null;
            const isOverdue = nextDue && nextDue < now && t.active;
            const daysUntil = nextDue ? Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24)) : null;
            const checklist = Array.isArray(t.checklist) ? t.checklist : [];

            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${isOverdue ? '#ef4444' : t.active ? '#22c55e' : '#94a3b8'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{t.name}</span>
                      <span style={{ background: (FREQ_COLORS[t.frequency] || '#94a3b8') + '20', color: FREQ_COLORS[t.frequency] || '#94a3b8', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>{t.frequency}</span>
                      {!t.active && <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 11, padding: '2px 8px', borderRadius: 20 }}>Inactive</span>}
                    </div>

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                      {t.assigned_to && <span>👤 {t.assigned_to}</span>}
                      {checklist.length > 0 && <span>✅ {checklist.length} checklist items</span>}
                      {t.asset_ids && t.asset_ids.length > 0 && <span>🔧 {t.asset_ids.length} asset{t.asset_ids.length > 1 ? 's' : ''}</span>}
                      <span>📋 {t.open_wo_count || 0} open · {t.completed_wo_count || 0} completed</span>
                    </div>

                    {/* Next due */}
                    {nextDue && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? '#ef4444' : daysUntil <= 7 ? '#f59e0b' : '#22c55e' }}>
                        {isOverdue ? `⚠️ Overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''}` : daysUntil === 0 ? '📅 Due today' : `📅 Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''} (${nextDue.toLocaleDateString()})`}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => navigate(`/pm-schedules/${t.id}/edit`)}
                      style={{ background: '#f1f5f9', color: NAVY, border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
