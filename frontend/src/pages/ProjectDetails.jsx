import React, { useState } from 'react';
import { StatusBadge, PriorityBadge, TypeBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconCalendar,
  IconUser,
  IconBuilding,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconDownload,
  IconEye,
  IconPlus,
} from '../components/common/Icons';

export const ProjectDetails = ({
  project,
  allProjects = [],
  tasks = [],
  materials = [],
  siteUpdates = [],
  documents = [],
  onNavigate,
  onSelectProject,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fallback to Residential Tower A if none specified
  const currentProject =
    project ||
    allProjects.find((p) => p.id === 'PRJ-101') ||
    allProjects[0] || {
      id: 'PRJ-101',
      name: 'Residential Tower A',
      code: 'RTA-01',
      location: 'Downtown Metro, Sector 4',
      manager: 'Alex Morgan',
      startDate: '2026-01-15',
      expectedCompletion: '2026-11-30',
      budget: '$18,400,000',
      spent: '$12,500,000',
      progress: 68,
      status: 'At Risk',
      healthScore: 68,
      description: '42-story luxury residential high-rise with 3-tier underground parking.',
    };

  // Filter entities linked to this project
  const projectTasks = tasks.filter(
    (t) => t.projectId === currentProject.id || t.project === currentProject.name
  );
  const projectMaterials = materials.filter(
    (m) => m.projectId === currentProject.id || m.project === currentProject.name
  );
  const projectUpdates = siteUpdates.filter(
    (u) => u.projectId === currentProject.id || u.project === currentProject.name
  );
  const projectDocs = documents.filter(
    (d) => d.projectId === currentProject.id || d.project === currentProject.name
  );

  // Health Score styling
  const healthScore = currentProject.healthScore || 68;
  const isHealthRisk = healthScore < 75;

  return (
    <div className="page-container">
      {/* Project Switcher Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Project:</span>
          <select
            className="filter-select"
            value={currentProject.id}
            onChange={(e) => onSelectProject && onSelectProject(e.target.value)}
          >
            {allProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate('insights')}
        >
          View Gemini AI Insights →
        </button>
      </div>

      {/* Main Project Header Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentProject.name}
              </h1>
              <StatusBadge status={currentProject.status} />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              {currentProject.description}
            </p>
          </div>

          {/* Visual Project Health Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 18px',
              borderRadius: 'var(--radius-lg)',
              background: isHealthRisk ? 'var(--color-warning-bg)' : 'var(--color-success-bg)',
              border: `1px solid ${isHealthRisk ? 'var(--color-warning-border)' : 'var(--color-success-border)'}`,
            }}
          >
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                PROJECT HEALTH
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: isHealthRisk ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                }}
              >
                {isHealthRisk ? 'AT RISK' : 'OPTIMAL'}
              </div>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#ffffff',
                border: `3px solid ${isHealthRisk ? 'var(--color-warning)' : 'var(--color-success)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--text-main)',
              }}
            >
              {healthScore}
            </div>
          </div>
        </div>

        {/* Metadata Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Location</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.location}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Project Manager</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.manager}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Timeline</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.startDate} → {currentProject.expectedCompletion}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Budget</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.budget}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Progress</span>
            <div style={{ marginTop: '2px' }}>
              <ProgressBar progress={currentProject.progress} height={6} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-pills-bar">
        {['overview', 'tasks', 'materials', 'site updates', 'documents', 'reports'].map((tab) => (
          <button
            key={tab}
            className={`tab-pill-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* Project Progress */}
            <div className="card">
              <div className="stat-label">Project Progress</div>
              <div className="stat-value">{currentProject.progress}%</div>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar progress={currentProject.progress} showLabel={false} height={6} />
              </div>
              <div className="stat-subtext">Phase 2: Superstructure</div>
            </div>

            {/* Task Completion */}
            <div className="card">
              <div className="stat-label">Task Completion</div>
              <div className="stat-value">
                {projectTasks.filter((t) => t.status === 'Completed').length} / {projectTasks.length || 4}
              </div>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar
                  progress={
                    projectTasks.length > 0
                      ? Math.round(
                          (projectTasks.filter((t) => t.status === 'Completed').length / projectTasks.length) * 100
                        )
                      : 40
                  }
                  showLabel={false}
                  height={6}
                />
              </div>
              <div className="stat-subtext" style={{ color: 'var(--color-danger)' }}>
                {projectTasks.filter((t) => t.status === 'Delayed').length} delayed tasks
              </div>
            </div>

            {/* Material Status */}
            <div className="card">
              <div className="stat-label">Material Status</div>
              <div className="stat-value">
                {projectMaterials.filter((m) => m.status === 'In Stock').length} / {projectMaterials.length || 3}
              </div>
              <div style={{ marginTop: '10px' }}>
                <span className="badge badge-delayed">Cement Low Stock</span>
              </div>
              <div className="stat-subtext">80 / 500 bags available</div>
            </div>

            {/* Budget Status */}
            <div className="card">
              <div className="stat-label">Budget Status</div>
              <div className="stat-value">{currentProject.spent || '$12.5M'}</div>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar progress={68} showLabel={false} height={6} />
              </div>
              <div className="stat-subtext">68% of {currentProject.budget} allocated</div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Recent Activity</div>
                <div className="card-subtitle">Chronological field updates and inspection filings</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {projectUpdates.length > 0 ? (
                projectUpdates.map((upd) => (
                  <div
                    key={upd.id}
                    style={{
                      padding: '12px 14px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '1rem', marginTop: '2px' }}>📍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{upd.supervisor} (Site Lead)</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{upd.date}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {upd.workCompleted}
                      </p>
                      {upd.issues && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-danger-text)', fontWeight: 500 }}>
                          Issue: {upd.issues}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', padding: '12px' }}>
                  No recent activities recorded for this project yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Progress</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div className="table-cell-title">{t.name}</div>
                    <div className="table-cell-sub">{t.id}</div>
                  </td>
                  <td>{t.assignedTo}</td>
                  <td><PriorityBadge priority={t.priority} /></td>
                  <td>{t.dueDate}</td>
                  <td style={{ width: '150px' }}><ProgressBar progress={t.progress} /></td>
                  <td><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Materials */}
      {activeTab === 'materials' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Required</th>
                <th>Available</th>
                <th>Used</th>
                <th>Supplier</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectMaterials.map((m) => (
                <tr key={m.id}>
                  <td className="table-cell-title">{m.material}</td>
                  <td>{m.required}</td>
                  <td style={{ fontWeight: 600 }}>{m.available}</td>
                  <td>{m.used}</td>
                  <td>{m.supplier}</td>
                  <td><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Site Updates */}
      {activeTab === 'site updates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projectUpdates.map((u) => (
            <div key={u.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{u.date} • {u.time}</span>
                <span className="badge badge-info">{u.weather}</span>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                {u.workCompleted}
              </p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Workers on site: <strong>{u.workers}</strong> | Supervisor: <strong>{u.supervisor}</strong>
              </div>
              {u.issues && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger-text)', fontSize: '0.8rem' }}>
                  ⚠️ {u.issues}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Size</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projectDocs.map((d) => (
                <tr key={d.id}>
                  <td className="table-cell-title">{d.name}</td>
                  <td><TypeBadge type={d.type} /></td>
                  <td>{d.uploadedBy}</td>
                  <td>{d.date}</td>
                  <td>{d.size}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Reports */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: '8px' }}>Project Analytics Summary</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '16px' }}>
            Consolidated weekly performance and safety logs for {currentProject.name}.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary btn-sm">Export Project PDF</button>
            <button className="btn btn-secondary btn-sm">Download Work Logs CSV</button>
          </div>
        </div>
      )}
    </div>
  );
};
