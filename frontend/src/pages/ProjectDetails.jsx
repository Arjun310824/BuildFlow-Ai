import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge, PriorityBadge, TypeBadge, RiskBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { DigitalConstructionSite } from '../components/common/DigitalConstructionSite';
import { TaskTimeline } from '../components/common/TaskTimeline';
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Fallback to first available project if none specified
  const currentProject =
    project ||
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

  const currentProjectId = (currentProject._id || currentProject.id || '').toString();
  const currentProjectName = currentProject.name || '';

  // Filter entities linked to this project
  const projectTasks = tasks.filter((t) => {
    const tskProjId = (t.projectId?._id || t.projectId || '').toString();
    const tskProjName = t.projectId?.name || t.project || '';
    return (
      (currentProjectId && tskProjId === currentProjectId) ||
      (currentProjectName && tskProjName === currentProjectName)
    );
  });

  const projectMaterials = materials.filter((m) => {
    const matProjId = (m.projectId?._id || m.projectId || '').toString();
    const matProjName = m.projectId?.name || m.project || '';
    return (
      (currentProjectId && matProjId === currentProjectId) ||
      (currentProjectName && matProjName === currentProjectName)
    );
  });

  const projectUpdates = siteUpdates.filter((u) => {
    const updProjId = (u.projectId?._id || u.projectId || '').toString();
    const updProjName = u.project || '';
    return (
      (currentProjectId && updProjId === currentProjectId) ||
      (currentProjectName && updProjName === currentProjectName)
    );
  });

  const projectDocs = documents.filter((d) => {
    const docProjId = (d.projectId?._id || d.projectId || '').toString();
    const docProjName = d.project || '';
    return (
      (currentProjectId && docProjId === currentProjectId) ||
      (currentProjectName && docProjName === currentProjectName)
    );
  });

  // Health Score styling
  const healthScore = currentProject.healthScore || 68;
  const isHealthRisk = healthScore < 75;

  const tabs = [
    { id: 'overview', label: 'Overview & Digital Twin' },
    { id: 'schedule', label: 'Timeline & Schedule' },
    { id: 'tasks', label: t('navigation.tasks') },
    { id: 'materials', label: t('navigation.materials') },
    { id: 'site updates', label: t('navigation.siteUpdates') },
    { id: 'documents', label: t('navigation.documents') },
    { id: 'reports', label: t('navigation.reports') },
  ];

  return (
    <div className="page-container">
      {/* Project Switcher Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>{t('navigation.projects')}:</span>
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
          {t('projectDetails.viewAiInsights')}
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
              <RiskBadge riskLevel={currentProject.risk || 'Low'} />
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
                {t('projectDetails.projectHealth')}
              </div>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: isHealthRisk ? 'var(--color-warning-text)' : 'var(--color-success-text)',
                }}
              >
                {isHealthRisk ? t('aiInsights.highRisk') : t('status.optimal')}
              </div>
            </div>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#121B2D',
                border: `3px solid ${isHealthRisk ? 'var(--color-warning)' : 'var(--color-success)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#FFFFFF',
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('common.location')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.location}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('projects.projectManager')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.manager}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('common.timeline')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.startDate} → {currentProject.expectedCompletion}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('projects.budget')}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.88rem' }}>
              {currentProject.budget}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{t('common.progress')}</span>
            <div style={{ marginTop: '2px' }}>
              <ProgressBar progress={currentProject.progress} height={6} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-pills-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-pill-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview with Digital Construction Site Signature Component */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Digital Twin Architectural Breakdown */}
          <DigitalConstructionSite
            project={currentProject}
            tasks={projectTasks}
            materials={projectMaterials}
            onNavigate={(mod) => {
              if (mod === 'tasks') setActiveTab('tasks');
              else if (onNavigate) onNavigate(mod);
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* Project Progress */}
            <div className="card">
              <div className="stat-label">{t('dashboard.projectProgress')}</div>
              <div className="stat-value">{currentProject.progress}%</div>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar progress={currentProject.progress} showLabel={false} height={6} />
              </div>
              <div className="stat-subtext">{currentProject.category || 'Superstructure'}</div>
            </div>

            {/* Task Completion */}
            <div className="card">
              <div className="stat-label">{t('tasks.title')}</div>
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
                {projectTasks.filter((t) => t.status === 'Delayed').length} {t('status.delayed')}
              </div>
            </div>

            {/* Material Status */}
            <div className="card">
              <div className="stat-label">{t('materials.title')}</div>
              <div className="stat-value">
                {projectMaterials.filter((m) => m.status === 'In Stock').length} / {projectMaterials.length || 3}
              </div>
              <div style={{ marginTop: '10px' }}>
                <span className="badge badge-delayed">{t('status.lowStock')}</span>
              </div>
              <div className="stat-subtext">80 / 500 units</div>
            </div>

            {/* Budget Status */}
            <div className="card">
              <div className="stat-label">{t('projects.budget')}</div>
              <div className="stat-value">{currentProject.spent || '$12.5M'}</div>
              <div style={{ marginTop: '10px' }}>
                <ProgressBar progress={68} showLabel={false} height={6} />
              </div>
              <div className="stat-subtext">68% of {currentProject.budget}</div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">{t('dashboard.recentSiteUpdates')}</div>
                <div className="card-subtitle">{t('dashboard.recentSiteUpdatesSub')}</div>
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
                        <span style={{ fontWeight: 600, fontSize: '0.86rem' }}>{upd.supervisor}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{upd.date}</span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                        {upd.workCompleted}
                      </p>
                      {upd.issues && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-danger-text)', fontWeight: 500 }}>
                          ⚠️ {upd.issues}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem', padding: '12px' }}>
                  {t('common.noData')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Schedule Timeline */}
      {activeTab === 'schedule' && (
        <div>
          <div className="card-header" style={{ marginBottom: '14px' }}>
            <div>
              <div className="card-title">PROJECT TIMELINE & GANTT VIEW</div>
              <div className="card-subtitle">Phased milestone tracking for {currentProject.name}</div>
            </div>
          </div>
          <TaskTimeline
            tasks={projectTasks}
            onTaskClick={() => setActiveTab('tasks')}
          />
        </div>
      )}

      {/* Tab 2: Tasks */}
      {activeTab === 'tasks' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tasks.taskName')}</th>
                <th>{t('tasks.assignee')}</th>
                <th>{t('common.priority')}</th>
                <th>{t('tasks.dueDate')}</th>
                <th>{t('common.progress')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {projectTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {t('tasks.noTasks')}
                  </td>
                </tr>
              ) : (
                projectTasks.map((t) => {
                  const tId = t._id || t.id;
                  const tTitle = t.title || t.name;
                  const tDueDate = t.dueDate
                    ? (typeof t.dueDate === 'string' && t.dueDate.includes('T') ? t.dueDate.slice(0, 10) : t.dueDate)
                    : '—';

                  return (
                    <tr key={tId}>
                      <td>
                        <div className="table-cell-title">{tTitle}</div>
                        <div className="table-cell-sub">{tId}</div>
                      </td>
                      <td>{t.assignedTo || 'Unassigned'}</td>
                      <td><PriorityBadge priority={t.priority || 'Medium'} /></td>
                      <td>{tDueDate}</td>
                      <td style={{ width: '150px' }}><ProgressBar progress={Number(t.progress) || 0} /></td>
                      <td><StatusBadge status={t.status || 'Not Started'} /></td>
                    </tr>
                  );
                })
              )}
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
                <th>{t('materials.materialName')}</th>
                <th>{t('materials.requiredQty')}</th>
                <th>{t('materials.availableQty')}</th>
                <th>{t('materials.usedQty')}</th>
                <th>{t('suppliers.supplierName')}</th>
                <th>{t('materials.stockStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {projectMaterials.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    {t('materials.noMaterials')}
                  </td>
                </tr>
              ) : (
                projectMaterials.map((m) => {
                  const mId = m._id || m.id;
                  const mName = m.name || m.material;
                  const reqQty =
                    typeof m.requiredQuantity === 'number'
                      ? `${m.requiredQuantity.toLocaleString()} ${m.unit || ''}`
                      : (m.required || '—');
                  const availQty =
                    typeof m.availableQuantity === 'number'
                      ? `${m.availableQuantity.toLocaleString()} ${m.unit || ''}`
                      : (m.available || '—');
                  const usedQty =
                    typeof m.usedQuantity === 'number'
                      ? `${m.usedQuantity.toLocaleString()} ${m.unit || ''}`
                      : (m.used || '—');

                  return (
                    <tr key={mId}>
                      <td className="table-cell-title">{mName}</td>
                      <td>{reqQty}</td>
                      <td style={{ fontWeight: 600 }}>{availQty}</td>
                      <td>{usedQty}</td>
                      <td>{m.supplier || m.category || 'Standard Vendor'}</td>
                      <td><StatusBadge status={m.status} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Site Updates */}
      {activeTab === 'site updates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {projectUpdates.map((u, idx) => {
            const photoList = [
              '/images/site_foundation.jpg',
              '/images/site_facade.jpg',
              '/images/site_mep.jpg',
              '/images/site_crane.jpg',
              '/images/site_excavation.jpg',
              '/images/site_steel.jpg',
              '/images/site_drone.jpg',
              '/images/site_interior.jpg',
            ];
            const photoUrl = u.image || photoList[idx % photoList.length];

            return (
              <div
                key={u.id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 160px',
                  gap: '20px',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#FFFFFF' }}>
                      {u.date} • {u.time || '16:30'}
                    </span>
                    <span className="badge badge-info">{u.weather || 'Normal'}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '10px' }}>
                    {u.workCompleted}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {t('dashboard.workersOnSite')}: <strong style={{ color: '#FFFFFF' }}>{u.workers} Active</strong> | {t('siteUpdates.supervisor')}: <strong style={{ color: '#FFFFFF' }}>{u.supervisor}</strong>
                  </div>
                  {u.issues && (
                    <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger)', fontSize: '0.8rem' }}>
                      ⚠️ {u.issues}
                    </div>
                  )}
                </div>

                {/* Construction Site Photo */}
                <div
                  style={{
                    width: '160px',
                    height: '105px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid rgba(0, 217, 255, 0.28)',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={photoUrl}
                    alt="Site field photo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/site_foundation.jpg';
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '6px',
                      right: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      background: 'rgba(11, 18, 32, 0.8)',
                      padding: '2px 5px',
                      borderRadius: '3px',
                    }}
                  >
                    <span style={{ color: 'var(--accent-cyan)' }}>📸 Photo</span>
                    <span>HD</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === 'documents' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('documents.fileName')}</th>
                <th>{t('documents.category')}</th>
                <th>{t('documents.uploadedBy')}</th>
                <th>{t('documents.uploadDate')}</th>
                <th>{t('documents.fileSize')}</th>
                <th>{t('common.status')}</th>
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
          <div className="card-title" style={{ marginBottom: '8px' }}>{t('reports.title')}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '16px' }}>
            {t('reports.subtitle')}
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary btn-sm">{t('reports.exportPdf')}</button>
            <button className="btn btn-secondary btn-sm">{t('reports.exportCsv')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
