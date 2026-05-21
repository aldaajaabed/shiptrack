import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useLang } from '../context/LangContext';
import { STATUS_ORDER, STATUS_ICONS, isStatusDone, isStatusActive, formatDate, formatDatetime } from '../utils/status';

function Lightbox({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="lightbox" onClick={onClose}>
      <button onClick={onClose} style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <img src={images[idx]?.image_path} alt={images[idx]?.caption} />
        {images[idx]?.caption && <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{images[idx].caption}</p>}
        {images.length > 1 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>‹</button>
            <span style={{ color: 'rgba(255,255,255,0.6)', padding: '8px 12px', fontSize: '0.85rem' }}>{idx + 1} / {images.length}</span>
            <button onClick={() => setIdx(i => (i + 1) % images.length)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>›</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackingPage() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLang();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightbox, setLightbox] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get(`/track/${trackingNumber}`)
      .then(r => setShipment(r.data))
      .catch(() => setError('not_found'))
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsapp = import.meta.env.VITE_WHATSAPP || '962791234567';

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /></div>
        <p style={{ color: 'var(--text-muted)' }}>{t('loading')}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Top bar */}
      <header style={{ background: 'white', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
          <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: '1.5rem' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /></span>
            <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text-primary)' }}>ShipTrack</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} className="btn btn-ghost btn-sm">
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
              style={{ background: '#25d366', color: 'white', padding: '8px 14px', borderRadius: '8px', fontWeight: '600', fontSize: '0.82rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
              💬 {t('contactUs')}
            </a>
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '32px 20px', maxWidth: '780px' }}>
        {error === 'not_found' ? (
          <div className="card fade-in" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
            <h2 style={{ marginBottom: '8px' }}>{t('notFound')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('notFoundDesc')}</p>
            <button className="btn btn-primary" onClick={() => navigate('/')}>{lang === 'ar' ? 'العودة للرئيسية' : 'Go Back'}</button>
          </div>
        ) : shipment ? (
          <div className="fade-in">
            {/* Shipment Info Card */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header">
                <div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{t('shipmentInfo')}</h2>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem', color: 'var(--primary)', fontWeight: '700' }}>#{shipment.tracking_number}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary btn-sm" onClick={copyLink}>
                    {copied ? `✓ ${t('linkCopied')}` : `🔗 ${t('copyLink')}`}
                  </button>
                  {shipment.qr_code_path && (
                    <a href={shipment.qr_code_path} download className="btn btn-ghost btn-sm">📥 QR</a>
                  )}
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { label: t('customerName'), value: shipment.customer_name, icon: '👤' },
                    { label: t('phone'), value: shipment.phone, icon: '📞' },
                    { label: t('route'), value: lang === 'ar' ? 'الصين 🇨🇳 → الأردن 🇯🇴' : 'China 🇨🇳 → Jordan 🇯🇴', icon: '🗺️' },
                    { label: t('departurePort'), value: lang === 'ar' ? 'ميناء نينغبو، الصين' : 'Ningbo Port, China', icon: '⚓' },
                    { label: t('departureDate'), value: formatDate(shipment.departure_date), icon: '📅' },
                    { label: t('estimatedArrival'), value: formatDate(shipment.estimated_arrival), icon: '🎯' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '2px' }}>{item.label}</div>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🕐</span> {t('lastUpdate')}: {formatDatetime(shipment.updated_at)}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div className="card-header"><h2 style={{ fontSize: '1.1rem' }}>📍 {t('shipmentTimeline')}</h2></div>
              <div className="card-body">
                <div className="timeline">
                  {STATUS_ORDER.map((status, i) => {
                    const done = isStatusDone(status, shipment.current_status);
                    const active = isStatusActive(status, shipment.current_status);
                    const historyEntry = shipment.history?.filter(h => h.status === status).pop();
                    return (
                      <div key={status} className="timeline-item">
                        <div className="timeline-dot-col">
                          <div className={`timeline-dot ${done ? 'done' : active ? 'active' : ''}`}>
                            {STATUS_ICONS[status]}
                          </div>
                          {i < STATUS_ORDER.length - 1 && <div className={`timeline-line ${done && !active ? 'done' : ''}`} />}
                        </div>
                        <div className="timeline-content">
                          <div className={`timeline-title ${!done ? 'pending' : ''}`}>{t(`statuses.${status}`)}</div>
                          {historyEntry ? (
                            <div className="timeline-meta">{formatDatetime(historyEntry.timestamp)}</div>
                          ) : (
                            <div className="timeline-meta">{lang === 'ar' ? 'في الانتظار' : 'Pending'}</div>
                          )}
                          {historyEntry?.note && <div className="timeline-note">{historyEntry.note}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Images */}
            {shipment.images?.length > 0 && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-header"><h2 style={{ fontSize: '1.1rem' }}>🖼️ {t('shipmentImages')}</h2></div>
                <div className="card-body">
                  <div className="gallery-grid">
                    {shipment.images.map((img, idx) => (
                      <div key={img.id} className="gallery-item" onClick={() => setLightbox(idx)}>
                        <img src={img.image_path} alt={img.caption} loading="lazy" />
                        {img.caption && <div className="caption">{img.caption}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {shipment.notes && (
              <div className="card" style={{ marginBottom: '20px' }}>
                <div className="card-body">
                  <h3 style={{ fontSize: '1rem', marginBottom: '10px' }}>📝 {t('notes')}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.8' }}>{shipment.notes}</p>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* WhatsApp FAB */}
      <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="whatsapp-fab" title="WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>

      {lightbox !== null && (
        <Lightbox images={shipment.images} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
