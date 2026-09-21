import React from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * Reusable ProtectedRoute guard component
 * Guarantees that private application views cannot render unless the user has an active, verified session
 */
export const ProtectedRoute = ({ children, onRedirectToLogin }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#F8FAFC',
          color: '#475569',
          fontFamily: 'Inter, sans-serif',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3.5px solid #E2E8F0',
            borderTopColor: '#FF6A00',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#334155' }}>
          Verifying BuildOps AI Workspace...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (onRedirectToLogin) {
      onRedirectToLogin();
    }
    return null;
  }

  return children;
};

export default ProtectedRoute;
