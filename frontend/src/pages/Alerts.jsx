import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { id: 'All', label: t('alerts.filterAll') },
    { id: 'Critical', label: t('alerts.filterCritical') },
    { id: 'Warning', label: t('alerts.filterWarning') },
    { id: 'Information', label: t('alerts.filterInfo') },
  ];

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
          <h1>{t('alerts.title')}</h1>
          <p>{t('alerts.subtitle')}</p>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="tab-pills-bar">
        {categories.map((cat) => {
          const count =
            cat.id === 'All'
              ? alerts.length
              : alerts.filter((a) => a.type.toLowerCase() === cat.id.toLowerCase()).length;

          return (
            <button
              key={cat.id}
              className={`tab-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Alert Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredAlerts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {t('alerts.noAlerts')}
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
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {alert.time}
                  </span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {alert.title}
                </h3>

                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '8px' }}>
                  {alert.message}
                </p>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconBuilding size={14} />
                  <span>{alert.project}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    if (onSelectProject) onSelectProject('PRJ-101');
                    onNavigate('project-details');
                  }}
                >
                  {t('common.viewDetails')}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--color-success)' }}
                  onClick={() => onDismissAlert && onDismissAlert(alert.id)}
                >
                  <IconCheck size={14} />
                  <span>{t('common.close')}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
