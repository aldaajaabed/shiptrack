import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function TrackingHome() {
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    const num = trackingNumber.trim().toUpperCase();
    if (num) navigate(`/track/${num}`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1a56db 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', backdropFilter: 'blur(8px)' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /> </div>
          <div>
            <div style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', lineHeight: 1.2 }}>ShipTrack</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>China → Jordan</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: '600', fontSize: '0.85rem', backdropFilter: 'blur(8px)' }}
          >
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
          <a
            href={`https://wa.me/${import.meta.env.VITE_WHATSAPP || '962778832104'}`}
            target="_blank" rel="noopener noreferrer"
            style={{ background: '#25d366', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>💬</span> {t('contactUs')}
          </a>
        </div>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 10px' }}>
        <div style={{ textAlign: 'center', maxWidth: '580px', width: '100%' }}>
          {/* Ship icon */}
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
  <img 
    src="/images/logo.png" 
    alt="ShipTrack Logo" 
    style={{ 
      height: '200px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }} 
  />
</div>

          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900', marginBottom: '12px', lineHeight: 1.2 }}>
            {t('trackYourShipment')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1.05rem', marginBottom: '40px' }}>
            {lang === 'ar' ? 'تتبع شحنتك من الصين إلى الأردن في الوقت الفعلي' : 'Track your LCL sea freight from China to Jordan in real time'}
          </p>

          {/* Search box */}
          <form onSubmit={handleTrack}>
            <div style={{
              background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px',
              padding: '8px', display: 'flex', gap: '8px',
            }}>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value.toUpperCase())}
                placeholder={t('enterTrackingNumber')}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'white', fontFamily: 'Cairo, sans-serif', fontSize: '1rem',
                  padding: '12px 16px', letterSpacing: '0.05em',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--primary)', color: 'white', border: 'none',
                  borderRadius: '10px', padding: '12px 28px', fontFamily: 'Cairo, sans-serif',
                  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
                onMouseOver={e => e.target.style.background = 'var(--primary-dark)'}
                onMouseOut={e => e.target.style.background = 'var(--primary)'}
              >
                {t('trackNow')}
              </button>
            </div>
          </form>

          {/* Features */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', flexWrap: 'wrap' }}>
            {[
              { icon: '📍', label: lang === 'ar' ? 'تتبع لحظي' : 'Live Tracking' },
              { icon: '📱', label: lang === 'ar' ? 'رمز QR' : 'QR Code' },
              { icon: '🖼️', label: lang === 'ar' ? 'صور الشحنة' : 'Cargo Photos' },
            ].map(f => (
              <div key={f.label} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '6px' }}>{f.icon}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: '600' }}>{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Admin link */}
      <footer style={{ padding: '16px', textAlign: 'center' }}>
        <a href="/admin/login" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textDecoration: 'none' }}>
          {lang === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
        </a>
      </footer>

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/${import.meta.env.VITE_WHATSAPP || '962778832104'}`}
        target="_blank" rel="noopener noreferrer"
        className="whatsapp-fab"
        title="WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
}
