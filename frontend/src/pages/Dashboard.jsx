import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconProjects,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
} from '../components/common/Icons';

export const Dashboard = ({
  projects = [],
  tasks = [],
  materials = [],
  siteUpdates = [],
  onNavigate,
  onSelectProject,
}) => {
  const { t } = useTranslation();

  // Compute Top Statistics Cards
  const totalProjects = projects.length || 8;
  const activeProjects = projects.filter((p) => ['On Track', 'At Risk', 'In Progress'].includes(p.status)).length || 5;
  const completedProjects = projects.filter((p) => p.status === 'Completed').length || 3;
  const delayedProjects = projects.filter((p) => p.status === 'Delayed').length || 2;

  // Project Health Breakdown
  const onTrackCount = projects.filter((p) => p.status === 'On Track' || p.status === 'Completed').length;
  const atRiskCount = projects.filter((p) => p.status === 'At Risk').length;
  const delayedCount = projects.filter((p) => p.status === 'Delayed').length;

  const activeProjectList = projects.slice(0, 4);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('dashboard.greeting')}</h1>
          <p>{t('dashboard.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('reports')}>
            {t('dashboard.viewReports')}
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('add-project')}>
            {t('dashboard.addProject')}
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="stats-grid-4">
        <StatCard
          label={t('dashboard.totalProjects')}
          value={totalProjects}
          subtext={t('dashboard.totalProjectsSub')}
          icon={<IconProjects size={18} />}
          trendType="neutral"
        />
        <StatCard
          label={t('dashboard.activeProjects')}
          value={activeProjects}
          subtext={t('dashboard.activeProjectsSub')}
          icon={<IconTrendingUp size={18} />}
          trendType="positive"
        />
        <StatCard
          label={t('dashboard.completed')}
          value={completedProjects}
          subtext={t('dashboard.completedSub')}
          icon={<IconCheck size={18} />}
          trendType="positive"
        />
        <StatCard
          label={t('dashboard.delayed')}
          value={delayedProjects}
          subtext={t('dashboard.delayedSub')}
          icon={<IconAlertTriangle size={18} />}
          trendType="negative"
        />
      </div>

      {/* Progress & Health Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Left: Project Progress Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dashboard.projectProgress')}</div>
              <div className="card-subtitle">{t('dashboard.projectProgressSub')}</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t('dashboard.updatedAgo')}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {activeProjectList.map((prj) => (
              <div key={prj.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{prj.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{prj.progress}% {t('status.completed')}</span>
                </div>
                <ProgressBar progress={prj.progress} showLabel={false} height={8} />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Project Health */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">{t('dashboard.projectHealth')}</div>
              <div className="card-subtitle">{t('dashboard.projectHealthSub')}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-success)', fontSize: '10px' }}>●</span>
                <span style={{ fontWeight: 600, color: 'var(--color-success-text)' }}>{t('status.onTrack')}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-success-text)' }}>
                {onTrackCount} {t('navigation.projects')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-warning)', fontSize: '10px' }}>●</span>
                <span style={{ fontWeight: 600, color: 'var(--color-warning-text)' }}>{t('status.atRisk')}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning-text)' }}>
                {atRiskCount} {t('navigation.projects')}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--color-danger)', fontSize: '10px' }}>●</span>
                <span style={{ fontWeight: 600, color: 'var(--color-danger-text)' }}>{t('status.delayed')}</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger-text)' }}>
                {delayedCount} {t('navigation.projects')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Table */}
      <div style={{ marginBottom: '28px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="card-title">{t('dashboard.activeProjectsTitle')}</div>
            <div className="card-subtitle">{t('dashboard.activeProjectsSubTitle')}</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('projects')}
          >
            {t('dashboard.viewAllProjects')}
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('navigation.projects')}</th>
                <th>{t('common.location')}</th>
                <th>{t('common.manager')}</th>
                <th style={{ width: '180px' }}>{t('common.progress')}</th>
                <th>{t('common.status')}</th>
                <th>{t('common.due')}</th>
              </tr>
            </thead>
            <tbody>
              {activeProjectList.map((prj) => (
                <tr
                  key={prj.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    onSelectProject && onSelectProject(prj.id);
                    onNavigate('project-details');
                  }}
                >
                  <td>
                    <div className="table-cell-title">{prj.name}</div>
                    <div className="table-cell-sub">{prj.code} • {prj.category}</div>
                  </td>
                  <td>{prj.location}</td>
                  <td>{prj.manager}</td>
                  <td>
                    <ProgressBar progress={prj.progress} />
                  </td>
                  <td>
                    <StatusBadge status={prj.status} />
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{prj.expectedCompletion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Attention Required Cards */}
      <div style={{ marginBottom: '28px' }}>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--color-warning)' }}>⚠️</span> {t('dashboard.attentionRequired')}
            </div>
            <div className="card-subtitle">{t('dashboard.attentionRequiredSub')}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {/* Card 1 */}
          <div
            className="card"
            style={{
              borderLeft: '4px solid var(--color-danger)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('tasks')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '0.9rem' }}>
                {t('dashboard.tasksOverdue')}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('dashboard.tasksOverdueDesc')}
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              {t('dashboard.resolveTasks')}
            </span>
          </div>

          {/* Card 2 */}
          <div
            className="card"
            style={{
              borderLeft: '4px solid var(--color-warning)',
              cursor: 'pointer',
            }}
            onClick={() => onNavigate('materials')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontWeight: 700, color: 'var(--color-warning-text)', fontSize: '0.9rem' }}>
                {t('dashboard.cementStockLow')}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('dashboard.cementStockLowDesc')}
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              {t('dashboard.orderInventory')}
            </span>
          </div>

          {/* Card 3 */}
          <div
            className="card"
            style={{
              borderLeft: '4px solid var(--color-danger)',
              cursor: 'pointer',
            }}
            onClick={() => {
              onSelectProject && onSelectProject('PRJ-101');
              onNavigate('project-details');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <span style={{ fontWeight: 700, color: 'var(--color-danger-text)', fontSize: '0.9rem' }}>
                {t('dashboard.towerABehind')}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              {t('dashboard.towerABehindDesc')}
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              {t('dashboard.viewProjectDetails')}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Site Updates */}
      <div>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <div className="card-title">{t('dashboard.recentSiteUpdates')}</div>
            <div className="card-subtitle">{t('dashboard.recentSiteUpdatesSub')}</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('site-updates')}>
            {t('dashboard.viewAllUpdates')}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {siteUpdates.slice(0, 2).map((upd) => (
            <div key={upd.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
                  {upd.project}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {upd.date} • {upd.time}
                </span>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '12px' }}>
                {upd.workCompleted}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                }}
              >
                <span>{t('dashboard.workersOnSite')} <strong>{upd.workers}</strong></span>
                {upd.issues && (
                  <span style={{ color: 'var(--color-warning-text)', fontWeight: 500 }}>
                    ⚠️ {upd.issues}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
