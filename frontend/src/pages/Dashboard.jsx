import React from 'react';
import { StatCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconProjects,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconTrendingUp,
  IconArrowUpRight,
} from '../components/common/Icons';

export const Dashboard = ({
  projects = [],
  tasks = [],
  materials = [],
  siteUpdates = [],
  onNavigate,
  onSelectProject,
}) => {
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
          <h1>Good morning, Alex</h1>
          <p>Here's what's happening across your projects.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('reports')}>
            View Reports
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('add-project')}>
            + Add Project
          </button>
        </div>
      </div>

      {/* Top Statistics Cards */}
      <div className="stats-grid-4">
        <StatCard
          label="Total Projects"
          value={totalProjects}
          subtext="+2 added this quarter"
          icon={<IconProjects size={18} />}
          trendType="neutral"
        />
        <StatCard
          label="Active Projects"
          value={activeProjects}
          subtext="Currently under construction"
          icon={<IconTrendingUp size={18} />}
          trendType="positive"
        />
        <StatCard
          label="Completed"
          value={completedProjects}
          subtext="Delivered on schedule"
          icon={<IconCheck size={18} />}
          trendType="positive"
        />
        <StatCard
          label="Delayed"
          value={delayedProjects}
          subtext="Critical schedule variance"
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
              <div className="card-title">Project Progress</div>
              <div className="card-subtitle">Scheduled vs Actual completion across core assets</div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Updated 2h ago</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
            {activeProjectList.map((prj) => (
              <div key={prj.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{prj.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{prj.progress}% Completed</span>
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
              <div className="card-title">Project Health</div>
              <div className="card-subtitle">Portfolio operational condition</div>
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
                <span style={{ fontWeight: 600, color: 'var(--color-success-text)' }}>On Track</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-success-text)' }}>
                {onTrackCount} Projects
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
                <span style={{ fontWeight: 600, color: 'var(--color-warning-text)' }}>At Risk</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning-text)' }}>
                {atRiskCount} Projects
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
                <span style={{ fontWeight: 600, color: 'var(--color-danger-text)' }}>Delayed</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-danger-text)' }}>
                {delayedCount} Projects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Table */}
      <div style={{ marginBottom: '28px' }}>
        <div className="card-header" style={{ marginBottom: '14px' }}>
          <div>
            <div className="card-title">Active Projects</div>
            <div className="card-subtitle">Key metrics and milestone status across primary sites</div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('projects')}
          >
            View All Projects
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Location</th>
                <th>Manager</th>
                <th style={{ width: '180px' }}>Progress</th>
                <th>Status</th>
                <th>Deadline</th>
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
              <span style={{ color: 'var(--color-warning)' }}>⚠️</span> Attention Required
            </div>
            <div className="card-subtitle">Urgent trade dependencies and inventory alerts</div>
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
                3 Tasks overdue
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Foundation slab pour, fire line hydrostatic tests, and drywall framing are past target completion.
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              Resolve Tasks →
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
                Cement stock is low
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Residential Tower A has 80 bags remaining against 500 bags required. Projected stockout in 36 hours.
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              Order Inventory →
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
                Project Tower A is behind schedule
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Schedule variance is at -13% due to weather delays and trade handoffs. Gemini AI recommends rebalancing.
            </p>
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
              View Project Details →
            </span>
          </div>
        </div>
      </div>

      {/* Recent Site Updates */}
      <div>
        <div className="card-header" style={{ marginBottom: '12px' }}>
          <div>
            <div className="card-title">Recent Site Updates</div>
            <div className="card-subtitle">Daily progress logs and field inspection notes from superintendents</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('site-updates')}>
            View All Updates
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
                <span>Workers on site: <strong>{upd.workers}</strong></span>
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
