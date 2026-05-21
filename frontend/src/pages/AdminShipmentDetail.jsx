import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { STATUS_ORDER, STATUS_ICONS, isStatusDone, formatDate, formatDatetime } from '../utils/status';
import toast from 'react-hot-toast';

export default function AdminShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [files, setFiles] = useState([]);

  const STATUS_LABELS = {
    departed_ningbo: lang === 'ar' ? 'غادر ميناء نينغبو' : 'Departed Ningbo Port',
    at_sea: lang === 'ar' ? 'في عرض البحر' : 'At Sea',
    arrived_aqaba: lang === 'ar' ? 'وصل ميناء العقبة' : 'Arrived Aqaba Port',
    customs_clearance: lang === 'ar' ? 'التخليص الجمركي' : 'Customs Clearance',
    ready_for_delivery: lang === 'ar' ? 'جاهز للتسليم' : 'Ready for Delivery',
    delivered: lang === 'ar' ? 'تم التسليم' : 'Delivered',
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/shipments/${id}`);
      setShipment(data);
      setStatusForm({ status: data.current_status, note: '' });
    } catch {
      toast.error(t('error'));
      navigate('/admin/shipments');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setUpdatingStatus(true);
    try {
      await api.patch(`/shipments/${id}/status`, statusForm);
      toast.success(t('statusUpdated'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 5 * 1024 * 1024,
    onDrop: accepted => setFiles(f => [...f, ...accepted]),
  });

  const handleUpload = async () => {
    if (!files.length) return;
    setUploadingImages(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('images', f));
      await api.post(`/images/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('✓ ' + t('uploadImages'));
      setFiles([]);
      load();
    } catch {
      toast.error(t('error'));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imgId) => {
    try {
      await api.delete(`/images/${imgId}`);
      load();
    } catch {
      toast.error(t('error'));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /></div>
        {t('loading')}
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/shipments')}>
          {lang === 'ar' ? '→ العودة' : '← Back'}
        </button>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: '2px' }}>
            📦 {shipment.customer_name}
          </h1>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.9rem' }}>#{shipment.tracking_number}</span>
        </div>
        <a href={`/track/${shipment.tracking_number}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm" style={{ marginRight: 'auto' }}>
          🔗 {lang === 'ar' ? 'عرض صفحة التتبع' : 'View Tracking Page'}
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Shipment info */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1rem' }}>📋 {t('shipmentInfo')}</h2></div>
          <div className="card-body">
            {[
              { label: t('customerName'), value: shipment.customer_name },
              { label: t('phone'), value: shipment.phone },
              { label: t('departureDate'), value: formatDate(shipment.departure_date) },
              { label: t('estimatedArrival'), value: formatDate(shipment.estimated_arrival) },
              { label: t('lastUpdate'), value: formatDatetime(shipment.updated_at) },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.label}</span>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.value}</span>
              </div>
            ))}
            {shipment.qr_code_path && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <img src={shipment.qr_code_path} alt="QR Code" style={{ width: 120, height: 120, borderRadius: 8 }} />
                <div style={{ marginTop: '8px' }}>
                  <a href={shipment.qr_code_path} download className="btn btn-secondary btn-sm">📥 {t('downloadQR')}</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Update status */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1rem' }}>📍 {t('updateStatus')}</h2></div>
          <div className="card-body">
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label className="form-label">{t('selectStatus')}</label>
                <select className="form-control" value={statusForm.status}
                  onChange={e => setStatusForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUS_ORDER.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{t('addNote')}</label>
                <textarea className="form-control" value={statusForm.note}
                  onChange={e => setStatusForm(f => ({ ...f, note: e.target.value }))}
                  placeholder={lang === 'ar' ? 'ملاحظة اختيارية...' : 'Optional note...'} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={updatingStatus}>
                {updatingStatus ? '...' : t('updateStatus')}
              </button>
            </form>
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1rem' }}>🗂️ {lang === 'ar' ? 'سجل الحالات' : 'Status History'}</h2></div>
          <div className="card-body">
            <div className="timeline">
              {STATUS_ORDER.map((status, i) => {
                const done = isStatusDone(status, shipment.current_status);
                const entry = shipment.history?.filter(h => h.status === status).pop();
                return (
                  <div key={status} className="timeline-item">
                    <div className="timeline-dot-col">
                      <div className={`timeline-dot ${done ? 'done' : ''}`}>{STATUS_ICONS[status]}</div>
                      {i < STATUS_ORDER.length - 1 && <div className={`timeline-line ${done ? 'done' : ''}`} />}
                    </div>
                    <div className="timeline-content">
                      <div className={`timeline-title ${!done ? 'pending' : ''}`}>{STATUS_LABELS[status]}</div>
                      {entry ? (
                        <div className="timeline-meta">{formatDatetime(entry.timestamp)}</div>
                      ) : (
                        <div className="timeline-meta" style={{ color: 'var(--text-muted)' }}>
                          {lang === 'ar' ? 'لم يصل بعد' : 'Not reached yet'}
                        </div>
                      )}
                      {entry?.note && <div className="timeline-note">{entry.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <div className="card-header"><h2 style={{ fontSize: '1rem' }}>🖼️ {t('images')}</h2></div>
          <div className="card-body">
            {/* Dropzone */}
            <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: '16px' }}>
              <input {...getInputProps()} />
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📤</div>
              <p style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('dragDropImages')}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '4px' }}>{t('supportedFormats')}</p>
            </div>

            {/* Preview files */}
            {files.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div className="gallery-grid" style={{ marginBottom: '10px' }}>
                  {files.map((f, i) => (
                    <div key={i} className="gallery-item">
                      <img src={URL.createObjectURL(f)} alt="" />
                      <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', width: 22, height: 22, borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem' }}>✕</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleUpload} disabled={uploadingImages} style={{ width: '100%' }}>
                  {uploadingImages ? '...' : `📤 ${t('uploadImages')} (${files.length})`}
                </button>
              </div>
            )}

            {/* Existing images */}
            {shipment.images?.length > 0 ? (
              <div className="gallery-grid">
                {shipment.images.map(img => (
                  <div key={img.id} className="gallery-item">
                    <img src={img.image_path} alt={img.caption} />
                    <button onClick={() => handleDeleteImage(img.id)}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.85)', border: 'none', color: 'white', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', fontSize: '0.85rem' }}>🗑</button>
                    {img.caption && <div className="caption">{img.caption}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem', marginTop: '8px' }}>
                {lang === 'ar' ? 'لا توجد صور' : 'No images yet'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
