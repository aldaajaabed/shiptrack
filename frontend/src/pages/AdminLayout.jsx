import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { path: '/admin', label: t('dashboard'), icon: '📊', exact: true },
    { path: '/admin/shipments', label: t('shipments'), icon: '📦' },
  ];

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-layout">
      {/* Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /></span>
            <div>
              <div style={{ color: 'white', fontWeight: '800', fontSize: '1rem' }}>ShipTrack</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem' }}>Admin Panel</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-label">{lang === 'ar' ? 'القائمة الرئيسية' : 'Main Menu'}</div>
          {navItems.map(item => (
            <button
              key={item.path}
              className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setSidebarOpen(false); }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.78rem', marginBottom: '10px', padding: '0 14px' }}>
            {user?.name}
          </div>
          <button className="nav-link" onClick={handleLogout} style={{ color: '#f87171' }}>
            <span>🚪</span> <span>{t('logout')}</span>
          </button>
        </div>
      </nav>

      {/* Main */}
      <div className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', display: 'flex', padding: '4px' }}
            className="hide-desktop"
          >☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.2rem' }}><img 
    src="/images/logo1.png" 
    alt="ShipTrack Logo"
    style={{ 
      height: '30px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }}  /></span>
            <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Yiwu Jinhu Tracking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="btn btn-ghost btn-sm"
            >
              {lang === 'ar' ? 'EN' : 'عر'}
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '0.85rem' }}>
              {user?.name?.[0]}
            </div>
          </div>
        </div>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
