import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { formatDatetime } from '../utils/status';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '20' }}>
        <span>{icon}</span>
      </div>
      <div>
        <div className="stat-value">{value ?? <span className="skeleton" style={{ display: 'inline-block', width: 60, height: 32 }} />}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

const STATUS_LABELS_AR = {
  departed_ningbo: 'غادر نينغبو',
  at_sea: 'في البحر',
  arrived_aqaba: 'وصل العقبة',
  customs_clearance: 'جمارك',
  ready_for_delivery: 'جاهز للتسليم',
  delivered: 'مُسلَّم',
};

export default function AdminDashboard() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/stats').then(r => setStats(r.data)).catch(console.error);
  }, []);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>👋 {lang === 'ar' ? 'مرحباً' : 'Welcome back'}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{lang === 'ar' ? 'لوحة تحكم ShipTrack' : 'ShipTrack Admin Dashboard'}</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard icon="📦" label={t('totalShipments')} value={stats?.totals?.total} color="#1a56db" />
        <StatCard icon="🚢" label={t('activeShipments')} value={stats?.totals?.active} color="#0ea5e9" />
        <StatCard icon="✅" label={t('deliveredShipments')} value={stats?.totals?.delivered} color="#10b981" />
        <StatCard icon="⏳" label={t('pendingShipments')} value={stats?.totals?.pending} color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent shipments */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>🕐 {t('recentActivity')}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/shipments')}>
              {lang === 'ar' ? 'عرض الكل' : 'View All'}
            </button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{t('trackingNumber')}</th>
                  <th>{t('customerName')}</th>
                  <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{t('lastUpdate')}</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentShipments?.length ? stats.recentShipments.map(s => (
                  <tr key={s.tracking_number} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/shipments')}>
                    <td><span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)' }}>#{s.tracking_number}</span></td>
                    <td style={{ fontWeight: '600' }}>{s.customer_name}</td>
                    <td>
                      <span className={`badge status-${s.current_status}`}>
                        {lang === 'ar' ? STATUS_LABELS_AR[s.current_status] : s.current_status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatDatetime(s.updated_at)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>{t('noData')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
