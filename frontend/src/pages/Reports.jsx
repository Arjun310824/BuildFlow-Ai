import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconReports,
  IconDownload,
  IconTrendingUp,
  IconClock,
  IconCheck,
  IconAlertTriangle,
} from '../components/common/Icons';

export const Reports = ({
  projects = [],
  tasks = [],
  materials = [],
  onExportReport,
}) => {
  const { t } = useTranslation();
  const [selectedTimeframe, setSelectedTimeframe] = useState('quarterly');

  const timeframeOptions = [
    { id: 'month', label: t('reports.thisMonth') },
    { id: 'quarterly', label: t('reports.quarterly') },
    { id: 'ytd', label: t('reports.yearToDate') },
    { id: 'custom', label: t('reports.custom') },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('reports.title')}</h1>
          <p>{t('reports.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => onExportReport('PDF')}
          >
            <IconDownload size={15} />
            <span>{t('reports.exportPdf')}</span>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onExportReport('CSV')}
          >
            <IconDownload size={15} />
            <span>{t('reports.exportCsv')}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onExportReport('Generated')}
          >
            <span>{t('reports.generateReport')}</span>
          </button>
        </div>
      </div>

      {/* Timeframe Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            {t('reports.reportingPeriod')}
          </span>
          {timeframeOptions.map((period) => (
            <button
              key={period.id}
              className={`btn btn-sm ${selectedTimeframe === period.id ? 'btn-dark' : 'btn-secondary'}`}
              onClick={() => setSelectedTimeframe(period.id)}
            >
              {period.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {t('common.updatedAgo')}
        </div>
      </div>

      {/* Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {/* Section 1: Project Progress Velocity */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('reports.progressVelocity')}</div>
              <div className="card-subtitle">{t('reports.progressVelocitySub')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {projects.slice(0, 4).map((p) => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{p.name}</span>
                  <span style={{ color: p.status === 'Delayed' ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {p.progress}% ({p.status})
                  </span>
                </div>
                <ProgressBar
                  progress={p.progress}
                  variant={p.status === 'Delayed' ? 'danger' : p.status === 'At Risk' ? 'warning' : 'success'}
                  showLabel={false}
                  height={8}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Quick Automated Exports */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('reports.title')}</div>
              <div className="card-subtitle">{t('reports.subtitle')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            {[
              { name: t('reports.dailyReport'), desc: 'Automated labor headcount, daily shift logs, and site telemetry', format: 'PDF' },
              { name: t('reports.safetyAudit'), desc: 'Weekly OSHA safety violation logs and inspection scorecards', format: 'PDF' },
              { name: t('reports.budgetVariance'), desc: 'Committed baseline budget vs contractor draw requests', format: 'Excel' },
              { name: t('reports.materialReport'), desc: 'Rebar, concrete, and structural steel consumption runs', format: 'CSV' },
            ].map((rep, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {rep.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {rep.desc}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onExportReport(rep.format)}
                  style={{ flexShrink: 0, marginLeft: '12px' }}
                >
                  <IconDownload size={13} />
                  <span>{t('common.download')}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
