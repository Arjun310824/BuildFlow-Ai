import React from 'react';

export const StatCard = ({ label, value, subtext, icon, trend, trendType = 'neutral' }) => {
  return (
    <div className="stat-card">
      <div className="stat-label">
        <span>{label}</span>
        {icon && <span style={{ color: 'var(--text-muted)' }}>{icon}</span>}
      </div>
      <div className="stat-value">{value}</div>
      {(subtext || trend) && (
        <div className="stat-subtext">
          {trend && (
            <span
              style={{
                color:
                  trendType === 'positive'
                    ? 'var(--color-success)'
                    : trendType === 'negative'
                    ? 'var(--color-danger)'
                    : 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {trend}
            </span>
          )}
          {subtext && <span>{subtext}</span>}
        </div>
      )}
    </div>
  );
};

// Backwards compatibility alias
export const MetricCard = StatCard;
