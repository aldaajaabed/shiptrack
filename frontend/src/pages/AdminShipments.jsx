import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { formatDate, getStatusBadgeClass } from '../utils/status';
import toast from 'react-hot-toast';

const STATUSES = [
  'departed_ningbo', 'at_sea', 'arrived_aqaba',
  'customs_clearance', 'ready_for_delivery', 'delivered'
];

function ShipmentModal({ shipment, onClose, onSaved }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState(shipment || {
    customer_name: '', phone: '', departure_date: '', estimated_arrival: '', notes: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (shipment) {
        await api.put(`/shipments/${shipment.id}`, form);
      } else {
        await api.post('/shipments', form);
      }
      toast.success(shipment ? t('save') + ' ✓' : t('shipmentCreated'));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{shipment ? t('editShipment') : t('addShipment')}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">{t('customerName')} *</label>
              <input className="form-control" value={form.customer_name}
                onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')} *</label>
              <input className="form-control" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">{t('departureDate')}</label>
                <input type="date" className="form-control" value={form.departure_date?.slice(0, 10) || ''}
                  onChange={e => setForm(f => ({ ...f, departure_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t('estimatedArrival')}</label>
                <input type="date" className="form-control" value={form.estimated_arrival?.slice(0, 10) || ''}
                  onChange={e => setForm(f => ({ ...f, estimated_arrival: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('notes')}</label>
              <textarea className="form-control" value={form.notes || ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>{t('cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminShipments() {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | shipment object
  const [deleteId, setDeleteId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      const { data } = await api.get(`/shipments?${params}`);
      setShipments(data.shipments);
      setTotal(data.total);
    } catch (err) {
      toast.error(t('error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    try {
      await api.delete(`/shipments/${deleteId}`);
      toast.success(t('shipmentDeleted'));
      setDeleteId(null);
      load();
    } catch {
      toast.error(t('error'));
    }
  };

  const STATUS_LABELS = {
    departed_ningbo: lang === 'ar' ? 'غادر نينغبو' : 'Departed Ningbo',
    at_sea: lang === 'ar' ? 'في البحر' : 'At Sea',
    arrived_aqaba: lang === 'ar' ? 'وصل العقبة' : 'Arrived Aqaba',
    customs_clearance: lang === 'ar' ? 'جمارك' : 'Customs',
    ready_for_delivery: lang === 'ar' ? 'جاهز للتسليم' : 'Ready',
    delivered: lang === 'ar' ? 'مُسلَّم' : 'Delivered',
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '2px' }}>📦 {t('shipments')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{total} {lang === 'ar' ? 'شحنة' : 'shipments'}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('create')}>
          + {t('addShipment')}
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-control"
            placeholder={t('search') + '...'}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className="form-control" style={{ width: 'auto', minWidth: '160px' }} value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}>
          <option value="">{lang === 'ar' ? 'كل الحالات' : 'All statuses'}</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>{t('trackingNumber')}</th>
                <th>{t('customerName')}</th>
                <th>{t('phone')}</th>
                <th>{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                <th>{t('departureDate')}</th>
                <th>{t('estimatedArrival')}</th>
                <th>{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                  ))}
                </tr>
              )) : shipments.length ? shipments.map(s => (
                <tr key={s.id}>
                  <td>
                    <a href={`/track/${s.tracking_number}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary)', fontSize: '0.88rem' }}>
                      #{s.tracking_number}
                    </a>
                  </td>
                  <td style={{ fontWeight: '600' }}>{s.customer_name}</td>
                  <td style={{ direction: 'ltr', textAlign: 'right' }}>{s.phone}</td>
                  <td>
                    <span className={`badge status-${s.current_status}`}>{STATUS_LABELS[s.current_status]}</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(s.departure_date)}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{formatDate(s.estimated_arrival)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/shipments/${s.id}`)}>
                        {t('edit')}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(s.id)}>
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>{t('noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {(modal === 'create' || (modal && modal !== 'create')) && (
        <ShipmentModal
          shipment={modal !== 'create' ? modal : null}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header"><h3>{t('deleteShipment')}</h3></div>
            <div className="modal-body"><p>{t('deleteConfirm')}</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>{t('cancel')}</button>
              <button className="btn btn-danger" onClick={handleDelete}>{t('delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
