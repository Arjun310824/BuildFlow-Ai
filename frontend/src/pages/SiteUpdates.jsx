import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconPlus,
  IconCalendar,
  IconUser,
  IconAlertTriangle,
  IconX,
  IconSearch,
} from '../components/common/Icons';

export const SiteUpdates = ({
  siteUpdates = [],
  projects = [],
  onAddUpdate,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newUpdate, setNewUpdate] = useState({
    project: projects[0]?.name || 'Residential Tower A',
    projectId: projects[0]?.id || 'PRJ-101',
    date: '20 Sep 2026',
    time: '17:00',
    workCompleted: '',
    progress: 80,
    workers: 30,
    supervisor: 'Alex Morgan',
    issues: '',
    weather: 'Clear / 24°C',
  });

  const filteredUpdates = siteUpdates.filter((u) => {
    const matchesSearch =
      u.workCompleted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'All' || u.project === selectedProject;

    return matchesSearch && matchesProject;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUpdate.workCompleted.trim()) return;

    const prj = projects.find((p) => p.name === newUpdate.project);

    onAddUpdate({
      id: `UPD-${Date.now().toString().slice(-4)}`,
      ...newUpdate,
      projectId: prj ? prj.id : 'PRJ-101',
      workers: Number(newUpdate.workers) || 20,
      progress: Number(newUpdate.progress) || 50,
      tags: ['Daily Log', 'Field Inspection'],
    });

    setIsAddModalOpen(false);
    setNewUpdate({
      project: projects[0]?.name || 'Residential Tower A',
      projectId: projects[0]?.id || 'PRJ-101',
      date: '20 Sep 2026',
      time: '17:00',
      workCompleted: '',
      progress: 80,
      workers: 30,
      supervisor: 'Alex Morgan',
      issues: '',
      weather: 'Clear / 24°C',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('siteUpdates.title')}</h1>
          <p>{t('siteUpdates.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('siteUpdates.addDailyUpdate')}</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('siteUpdates.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="All">{t('tasks.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredUpdates.length, total: siteUpdates.length })}
        </div>
      </div>

      {/* Updates Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredUpdates.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            {t('common.noData')}
          </div>
        ) : (
          filteredUpdates.map((upd) => (
            <div key={upd.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '3px' }}>
                    {upd.project}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {upd.date} • {upd.time}
                  </span>
                </div>
                <span className="badge badge-info">{upd.weather}</span>
              </div>

              <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '12px' }}>
                {upd.workCompleted}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  {t('dashboard.workersOnSite')} <strong>{upd.workers}</strong> | {t('siteUpdates.supervisor')}: <strong>{upd.supervisor}</strong>
                </div>
                {upd.issues && (
                  <div style={{ color: 'var(--color-warning-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconAlertTriangle size={14} color="var(--color-warning)" />
                    <span>{upd.issues}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('siteUpdates.formTitle')}</h2>
                <p className="modal-subtitle">{t('siteUpdates.formSubtitle')}</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">{t('navigation.projects')} *</label>
                  <select
                    className="form-input"
                    value={newUpdate.project}
                    onChange={(e) => setNewUpdate({ ...newUpdate, project: e.target.value })}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('siteUpdates.weather')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUpdate.weather}
                    onChange={(e) => setNewUpdate({ ...newUpdate, weather: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('siteUpdates.workforce')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newUpdate.workers}
                    onChange={(e) => setNewUpdate({ ...newUpdate, workers: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('siteUpdates.supervisor')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newUpdate.supervisor}
                    onChange={(e) => setNewUpdate({ ...newUpdate, supervisor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('common.progress')} (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    value={newUpdate.progress}
                    onChange={(e) => setNewUpdate({ ...newUpdate, progress: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t('siteUpdates.workCompleted')} *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Describe specific structural or finishing tasks executed during shift..."
                    value={newUpdate.workCompleted}
                    onChange={(e) => setNewUpdate({ ...newUpdate, workCompleted: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t('siteUpdates.issues')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Concrete pump breakdown delayed pour by 2 hours"
                    value={newUpdate.issues}
                    onChange={(e) => setNewUpdate({ ...newUpdate, issues: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('common.submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
