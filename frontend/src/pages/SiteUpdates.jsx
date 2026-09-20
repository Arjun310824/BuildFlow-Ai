import React, { useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

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
          <h1>Site Updates</h1>
          <p>Chronological daily construction logs, superintendent shift reports, and site photographic records.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>Add Daily Update</span>
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
              placeholder="Search site log notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredUpdates.length}</strong> site reports
        </div>
      </div>

      {/* Timeline Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        {filteredUpdates.map((update, idx) => (
          <div
            key={update.id}
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr auto',
              gap: '24px',
              alignItems: 'flex-start',
              position: 'relative',
            }}
          >
            {/* Timeline Meta */}
            <div style={{ borderRight: '1px solid var(--border-light)', paddingRight: '16px' }}>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {update.date}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {update.time || '16:30'}
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                {update.weather || 'Normal Conditions'}
              </span>
            </div>

            {/* Core Content */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                  {update.project}
                </span>
                <span className="badge badge-info">Shift Completed</span>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: '1.5', marginBottom: '14px' }}>
                {update.workCompleted}
              </p>

              {/* Progress & Workers Strip */}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div style={{ width: '180px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    Milestone Progress
                  </div>
                  <ProgressBar progress={update.progress} height={6} />
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Workers on Site</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    👷 {update.workers} Active Personnel
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Supervisor</span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    {update.supervisor || 'Alex Morgan'}
                  </span>
                </div>
              </div>

              {/* Issues Alert Box */}
              {update.issues && (
                <div
                  style={{
                    background: 'var(--color-warning-bg)',
                    border: '1px solid var(--color-warning-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: 'var(--color-warning-text)',
                  }}
                >
                  <IconAlertTriangle size={16} color="var(--color-warning)" />
                  <span>
                    <strong>Issue Logged:</strong> {update.issues}
                  </span>
                </div>
              )}
            </div>

            {/* Photo / Visual Inspection Thumbnail Preview */}
            <div style={{ width: '130px', flexShrink: 0 }}>
              <div
                style={{
                  width: '130px',
                  height: '95px',
                  borderRadius: 'var(--radius-md)',
                  background: '#f1f5f9',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                onClick={() =>
                  setPreviewImage({
                    title: `${update.project} Inspection Photo`,
                    caption: update.workCompleted,
                    date: update.date,
                  })
                }
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ fontSize: '1.4rem' }}>🏗️</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Site Photo
                  </span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    fontSize: '0.65rem',
                    background: 'rgba(15,23,42,0.7)',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  Click to View
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">{previewImage.title}</div>
              <button className="modal-close-btn" onClick={() => setPreviewImage(null)}>
                <IconX />
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: '280px',
                  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                  borderRadius: 'var(--radius-lg)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  gap: '12px',
                  marginBottom: '16px',
                }}
              >
                <span style={{ fontSize: '3rem' }}>🏗️</span>
                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>High-Resolution Site Survey Capture</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Verified by Field QC Drone & On-Site Supervisor</div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', textAlign: 'left' }}>
                {previewImage.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Daily Update Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Record Daily Site Progress</div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <IconX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Project *</label>
                <select
                  className="form-control"
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
                <label className="form-label">Work Completed Summary *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Concrete pour for basement level 2 completed with test cube samples taken..."
                  value={newUpdate.workCompleted}
                  onChange={(e) => setNewUpdate({ ...newUpdate, workCompleted: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Workers on Site</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="32"
                    value={newUpdate.workers}
                    onChange={(e) => setNewUpdate({ ...newUpdate, workers: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Milestone Progress (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    max="100"
                    value={newUpdate.progress}
                    onChange={(e) => setNewUpdate({ ...newUpdate, progress: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Delays or Issues Encountered (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Heavy rain caused a 4-hour delay in morning shift."
                  value={newUpdate.issues}
                  onChange={(e) => setNewUpdate({ ...newUpdate, issues: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Site Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
