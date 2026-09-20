import React from 'react';

export const ModulePlaceholder = ({ title, description, icon }) => {
  return (
    <div className="view-placeholder">
      <div className="placeholder-icon">
        {icon}
      </div>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        {title} Module
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6, fontSize: '0.925rem' }}>
        {description}
      </p>
      <div style={{ marginTop: '20px' }}>
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '6px 14px',
            borderRadius: '9999px',
            background: 'rgba(0, 217, 255, 0.1)',
            color: '#00D9FF',
            border: '1px solid rgba(0, 217, 255, 0.25)',
          }}
        >
          Phase 2 Foundation Ready • Feature Implementation Next
        </span>
      </div>
    </div>
  );
};
