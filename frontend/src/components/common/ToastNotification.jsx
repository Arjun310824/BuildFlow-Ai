import React from 'react';
import { IconCheck, IconAlertTriangle, IconX } from './Icons';

export const ToastNotification = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-item ${toast.type || 'info'}`}>
          {toast.type === 'success' && <IconCheck size={16} color="var(--color-success)" />}
          {toast.type === 'warning' && <IconAlertTriangle size={16} color="var(--color-warning)" />}
          {toast.type === 'info' && <span style={{ color: 'var(--color-accent)' }}>●</span>}
          <span>{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ marginLeft: 'auto', opacity: 0.7, color: '#ffffff' }}
            aria-label="Dismiss toast"
          >
            <IconX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
