import React from 'react';
import { mockDashboardData } from '../mock/dashboardData';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconBuilding,
  IconTasks,
  IconAlertTriangle,
  IconMaterials,
  IconTrendingUp,
  IconClock,
} from '../components/common/Icons';

export const Dashboard = () => {
  const { metrics, riskOverview, recentProjects, recentTasks, materialAlerts } = mockDashboardData;

  return (
    <div className="dashboard-page">
      {/* Top Banner */}
      <div className="dashboard-header-banner">
        <div>
          <h1 className="dashboard-heading">Construction Project Dashboard</h1>
          <p className="dashboard-subheading">
            Live operational metrics, project milestones, and risk indicators across active sites.
          </p>
        </div>

        <div className="dashboard-actions">
          <button className="btn btn-outline">Export Summary</button>
          <button className="btn btn-primary">+ New Project</button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <section className="metrics-grid">
        <MetricCard
          title="Total Projects"
          value={metrics.totalProjects}
          subtitle="All recorded client sites"
          icon={<IconBuilding />}
        />
        <MetricCard
          title="Active Projects"
          value={metrics.activeProjects}
          subtitle="Under active construction"
          icon={<IconTrendingUp />}
          highlightColor="#00D9FF"
        />
        <MetricCard
          title="Delayed Tasks"
          value={metrics.delayedTasks}
          subtitle="Behind schedule (Action needed)"
          icon={<IconClock />}
          highlightColor="#EF4444"
        />
        <MetricCard
          title="Material Alerts"
          value={metrics.materialAlerts}
          subtitle="Shortages & procurement delays"
          icon={<IconMaterials />}
          highlightColor="#F59E0B"
        />
        <div className="metric-card">
          <div className="metric-card-top">
            <span className="metric-title">Overall Progress</span>
            <div className="metric-icon-bubble">
              <IconTrendingUp />
            </div>
          </div>
          <div className="metric-value-row">
            <span className="metric-value">{metrics.overallProgress}%</span>
          </div>
          <ProgressBar progress={metrics.overallProgress} showLabel={false} height={6} />
        </div>
      </section>

      {/* Middle Row: Recent Projects & Risk/Status Overview */}
      <div className="dashboard-row-grid">
        {/* Left Column: Recent Projects */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2 className="panel-title">Recent Projects</h2>
              <span className="panel-badge">{recentProjects.length} Active</span>
            </div>
          </div>
          <div className="panel-body table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Progress</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {recentProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-name-cell">
                        <span className="project-name-title">{project.name}</span>
                        <span className="project-name-sub">
                          {project.location} • {project.manager}
                        </span>
                      </div>
                    </td>
                    <td style={{ minWidth: '150px' }}>
                      <ProgressBar progress={project.progress} showLabel={true} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {project.spent}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        of {project.budget}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {project.deadline}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Project Risk & Operational Health Overview */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2 className="panel-title">Risk & Health Overview</h2>
            </div>
            <span className="panel-badge">Site Radar</span>
          </div>
          <div className="panel-body">
            <div className="risk-stat-card">
              <div className="risk-stat-label">
                <span style={{ color: 'var(--status-success)' }}>●</span>
                <span>Low Risk Projects</span>
              </div>
              <span className="risk-stat-val" style={{ color: 'var(--status-success)' }}>
                {riskOverview.lowRiskCount} Sites
              </span>
            </div>

            <div className="risk-stat-card">
              <div className="risk-stat-label">
                <span style={{ color: 'var(--status-warning)' }}>●</span>
                <span>Moderate Risk Projects</span>
              </div>
              <span className="risk-stat-val" style={{ color: 'var(--status-warning)' }}>
                {riskOverview.mediumRiskCount} Sites
              </span>
            </div>

            <div className="risk-stat-card">
              <div className="risk-stat-label">
                <span style={{ color: 'var(--status-danger)' }}>●</span>
                <span>High Risk / Delayed Projects</span>
              </div>
              <span className="risk-stat-val" style={{ color: 'var(--status-danger)' }}>
                {riskOverview.highRiskCount} Sites
              </span>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Schedule Adherence</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{riskOverview.scheduleAdherence}%</span>
              </div>
              <ProgressBar progress={riskOverview.scheduleAdherence} showLabel={false} height={5} />
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Budget Utilization</span>
                <span style={{ fontWeight: 700, color: '#38BDF8' }}>{riskOverview.budgetUtilization}%</span>
              </div>
              <ProgressBar progress={riskOverview.budgetUtilization} showLabel={false} height={5} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Tasks & Material Shortage Alerts */}
      <div className="dashboard-row-grid">
        {/* Recent Tasks List */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2 className="panel-title">Recent Critical Tasks</h2>
              <span className="panel-badge">{recentTasks.length} Tracked</span>
            </div>
          </div>
          <div className="panel-body table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.map((task) => (
                  <tr key={task.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {task.title}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {task.project}
                    </td>
                    <td style={{ fontSize: '0.825rem' }}>{task.assignee}</td>
                    <td>
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {task.dueDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Material Alerts Feed */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2 className="panel-title">Material & Inventory Alerts</h2>
            </div>
            <span className="panel-badge" style={{ color: 'var(--status-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
              {materialAlerts.length} Action Items
            </span>
          </div>
          <div className="panel-body">
            {materialAlerts.map((alert) => (
              <div key={alert.id} className="alert-item">
                <div className="alert-icon">
                  <IconAlertTriangle />
                </div>
                <div className="alert-content">
                  <div className="alert-title">{alert.material}</div>
                  <div className="alert-subtitle">
                    {alert.project} • Available: <strong style={{ color: 'var(--text-primary)' }}>{alert.currentStock}</strong> / Req: {alert.requiredStock}
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <StatusBadge status={alert.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
