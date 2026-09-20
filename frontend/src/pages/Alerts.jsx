import React, { useState } from 'react';
import {
  IconAlerts,
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconBuilding,
} from '../components/common/Icons';

export const Alerts = ({
  alerts = [],
  onNavigate,
  onSelectProject,
  onDismissAlert,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Critical', 'Warning', 'Information'];

  const filteredAlerts = alerts.filter((alt) => {
    if (selectedCategory === 'All') return true;
    return alt.type.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getAlertBorder = (type) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return '4px solid var(--color-danger)';
      case 'warning':
        return '4px solid var(--color-warning)';
      case 'information':
      default:
        return '4px solid var(--color-info)';
    }
  };

  const getAlertBadgeClass = (type) => {
    switch (type.toLowerCase()) {
      case 'critical':
        return 'badge-delayed';
      case 'warning':
        return 'badge-at-risk';
      case 'information':
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Alerts & Notifications</h1>
          <p>Real-time field incident alerts, inventory threshold notifications, and compliance warnings.</p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="tab-pills-bar">
        {categories.map((cat) => {
          const count =
            cat === 'All'
              ? alerts.length
              : alerts.filter((a) => a.type.toLowerCase() === cat.toLowerCase()).length;

          return (
            <button
              key={cat}
              className={`tab-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No alerts found in this category. All systems normal.
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="card card-hoverable"
              style={{
                borderLeft: getAlertBorder(alert.type),
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '20px',
                padding: '20px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span className={`badge ${getAlertBadgeClass(alert.type)}`}>
                    {alert.type}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)' }}>
                    {alert.title}
                  </span>
                </div>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '12px' }}>
                  {alert.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconBuilding size={14} />
                    <strong>{alert.project}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconClock size={14} />
                    {alert.time}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{
                    color: alert.type === 'Critical' ? 'var(--color-danger)' : 'var(--color-accent)',
                    borderColor: 'var(--border-color)',
                  }}
                  onClick={() => {
                    if (alert.projectId && onSelectProject) {
                      onSelectProject(alert.projectId);
                    }
                    if (alert.targetTab && onNavigate) {
                      onNavigate(alert.targetTab);
                    }
                  }}
                >
                  {alert.actionText} →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
