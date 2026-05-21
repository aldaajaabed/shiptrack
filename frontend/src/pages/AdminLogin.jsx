import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1a56db 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}> <img 
    src="/images/logo.png" 
    alt="ShipTrack Logo" 
    style={{ 
      height: '200px', 
      width: 'auto', 
      filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))'
    }} 
  /></div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: '800' }}>ShipTrack</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginTop: '4px' }}>{t('adminLogin')}</p>
        </div>

        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">{t('email')}</label>
                <input
                  type="email" className="form-control" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  placeholder="admin@shiptrack.jo"
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('password')}</label>
                <input
                  type="password" className="form-control" value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
                {loading ? '...' : t('login')}
              </button>
            </form>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>← صفحة التتبع</a>
        </div>
      </div>
    </div>
  );
}
