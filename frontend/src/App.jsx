import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LangProvider } from './context/LangContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import TrackingHome from './pages/TrackingHome';
import TrackingPage from './pages/TrackingPage';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './pages/AdminLayout';
import AdminDashboard from './pages/AdminDashboard';
import AdminShipments from './pages/AdminShipments';
import AdminShipmentDetail from './pages/AdminShipmentDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🚢</div>
        <p style={{ color: 'var(--text-muted)' }}>جاري التحميل...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: 'Cairo, sans-serif', borderRadius: '10px', fontSize: '0.9rem' },
              duration: 3000,
            }}
          />
          <Routes>
            {/* Customer */}
            <Route path="/" element={<TrackingHome />} />
            <Route path="/track/:trackingNumber" element={<TrackingPage />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <ProtectedRoute><AdminLayout /></ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="shipments" element={<AdminShipments />} />
              <Route path="shipments/:id" element={<AdminShipmentDetail />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
