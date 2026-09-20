import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon, highlightColor }) => {
  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-title">{title}</span>
        {icon && (
          <div
            className="metric-icon-bubble"
            style={highlightColor ? { color: highlightColor, borderColor: highlightColor } : {}}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="metric-value-row">
        <span
          className="metric-value"
          style={highlightColor ? { color: highlightColor } : {}}
        >
          {value}
        </span>
      </div>
      {subtitle && <div className="metric-card-footer">{subtitle}</div>}
    </div>
  );
};
