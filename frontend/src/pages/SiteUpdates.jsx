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
  IconRefresh,
} from '../components/common/Icons';

export const CONSTRUCTION_SITE_PHOTOS = [
  {
    id: 'photo-1',
    url: '/images/site_foundation.jpg',
    category: 'Civil & Foundation',
    title: 'Basement Concrete Pour & Rebar Grid',
    caption: 'Grade C40 concrete slurry pumping with seismic reinforcement rebar inspection.',
  },
  {
    id: 'photo-2',
    url: '/images/site_facade.jpg',
    category: 'Building Envelope',
    title: 'Curtain Wall Glazing & Facade Installation',
    caption: 'High-altitude glazing unit installation with vacuum suction lifters.',
  },
  {
    id: 'photo-3',
    url: '/images/site_mep.jpg',
    category: 'MEP Infrastructure',
    title: 'HVAC Ducting & Cable Trays Inspection',
    caption: 'Superintendent verification of smoke damper clearances and cable tray routes.',
  },
  {
    id: 'photo-4',
    url: '/images/site_crane.jpg',
    category: 'Heavy Lifting',
    title: 'Tower Crane Pick & Structural Steel Erection',
    caption: 'Perimeter framing steel beam installation with tower crane assistance.',
  },
  {
    id: 'photo-5',
    url: '/images/site_excavation.jpg',
    category: 'Earthwork & Substructure',
    title: 'Deep Pit Trenching & Heavy Excavation',
    caption: 'Hydraulic excavators and haul trucks preparing soldier pile retention wall.',
  },
  {
    id: 'photo-6',
    url: '/images/site_steel.jpg',
    category: 'Superstructure',
    title: 'High-Altitude Ironworkers & Welded Joints',
    caption: 'Structural steel erectors securing moment-resisting connections with safety harnesses.',
  },
  {
    id: 'photo-7',
    url: '/images/site_drone.jpg',
    category: 'Aerial QC Survey',
    title: 'Drone Survey & Staging Yard Telemetry',
    caption: 'Orthomosaic drone scan calculating volumetric aggregate stockpiles.',
  },
  {
    id: 'photo-8',
    url: '/images/site_interior.jpg',
    category: 'Fit-Out & Architectural',
    title: 'Interior Stud Partition Framing & Glazing',
    caption: 'Engineers on-site cross-referencing drywall framing with digital BIM plans.',
  },
];

export const resolveSitePhoto = (photoInput, id = '', idx = 0) => {
  if (photoInput && typeof photoInput === 'string' && photoInput.startsWith('/images/')) {
    const matched = CONSTRUCTION_SITE_PHOTOS.find((p) => p.url === photoInput);
    if (matched) return matched;
  }
  // Deterministic random selection based on ID or index
  let seed = idx;
  if (id && typeof id === 'string') {
    seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }
  return CONSTRUCTION_SITE_PHOTOS[seed % CONSTRUCTION_SITE_PHOTOS.length];
};

export const SiteUpdates = ({
  siteUpdates = [],
  projects = [],
  onAddUpdate,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Default initial update with a random photo
  const getRandomPhoto = () => {
    const randIdx = Math.floor(Math.random() * CONSTRUCTION_SITE_PHOTOS.length);
    return CONSTRUCTION_SITE_PHOTOS[randIdx];
  };

  const [newUpdate, setNewUpdate] = useState(() => {
    const defaultPhoto = getRandomPhoto();
    return {
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
      image: defaultPhoto.url,
      photoCategory: defaultPhoto.category,
      photoTitle: defaultPhoto.title,
    };
  });

  const filteredUpdates = siteUpdates.filter((u) => {
    const matchesSearch =
      u.workCompleted.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = selectedProject === 'All' || u.project === selectedProject;

    return matchesSearch && matchesProject;
  });

  const handlePickRandomPhoto = () => {
    const random = getRandomPhoto();
    setNewUpdate((prev) => ({
      ...prev,
      image: random.url,
      photoCategory: random.category,
      photoTitle: random.title,
    }));
  };

  const handleSelectSpecificPhoto = (photo) => {
    setNewUpdate((prev) => ({
      ...prev,
      image: photo.url,
      photoCategory: photo.category,
      photoTitle: photo.title,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newUpdate.workCompleted.trim()) return;

    const prj = projects.find((p) => p.name === newUpdate.project);

    onAddUpdate({
      id: `UPD-${Date.now().toString().slice(-4)}`,
      ...newUpdate,
      projectId: prj ? (prj._id || prj.id) : (projects[0]?._id || projects[0]?.id),
      workers: Number(newUpdate.workers) || 20,
      progress: Number(newUpdate.progress) || 50,
      tags: ['Daily Log', 'Field Inspection'],
    });

    setIsAddModalOpen(false);
    const nextRandom = getRandomPhoto();
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
      image: nextRandom.url,
      photoCategory: nextRandom.category,
      photoTitle: nextRandom.title,
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0 }}>{t('siteUpdates.title', 'Site Updates')}</h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--accent-cyan)',
                background: 'rgba(0, 217, 255, 0.12)',
                border: '1px solid rgba(0, 217, 255, 0.25)',
                padding: '3px 9px',
                borderRadius: '12px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              8 Visual Telemetry Feeds Active
            </span>
          </div>
          <p>{t('siteUpdates.subtitle', 'Chronological daily construction logs, superintendent shift reports, and live site photographic telemetry.')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('siteUpdates.addDailyUpdate', 'Add Daily Update')}</span>
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
              placeholder={t('siteUpdates.searchPlaceholder', 'Search site log notes...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="All">{t('siteUpdates.allProjects', 'All Projects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredUpdates.length}</strong> {t('siteUpdates.showingReports', 'site reports')}
        </div>
      </div>

      {/* Timeline Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
        {filteredUpdates.map((update, idx) => {
          const photoObj = resolveSitePhoto(update.image, update.id, idx);

          return (
            <div
              key={update.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '170px 1fr 180px',
                gap: '24px',
                alignItems: 'center',
                position: 'relative',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
              }}
            >
              {/* Timeline Meta Column */}
              <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '16px' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                  {update.date}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {update.time || '16:30'}
                </div>
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--accent-cyan)',
                    background: 'rgba(0, 217, 255, 0.08)',
                    border: '1px solid rgba(0, 217, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {update.weather || 'Clear / 22°C'}
                </span>
              </div>

              {/* Core Content Column */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#FFFFFF' }}>
                    {update.project}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--color-success)',
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {t('siteUpdates.shiftCompleted', 'Shift Completed')}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                  {update.workCompleted}
                </p>

                {/* Progress & Workers Strip */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <div style={{ width: '160px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{t('siteUpdates.milestoneProgress', 'Milestone Progress')}</span>
                      <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{update.progress}%</span>
                    </div>
                    <ProgressBar progress={update.progress} height={6} showLabel={false} />
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      {t('siteUpdates.workersOnSite', 'Workers on Site')}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#FFFFFF' }}>
                      👷 {update.workers} {t('siteUpdates.activePersonnel', 'Active Personnel')}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                      {t('siteUpdates.supervisor', 'Supervisor')}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#FFFFFF' }}>
                      {update.supervisor || 'Alex Morgan'}
                    </span>
                  </div>
                </div>

                {/* Issues Alert Box */}
                {update.issues && (
                  <div
                    style={{
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.82rem',
                      color: 'var(--color-warning)',
                    }}
                  >
                    <IconAlertTriangle size={15} color="var(--color-warning)" />
                    <span>
                      <strong>{t('siteUpdates.issueLogged', 'Issue Logged:')}</strong> {update.issues}
                    </span>
                  </div>
                )}
              </div>

              {/* Authentic Construction Site Photo Column */}
              <div style={{ width: '180px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '180px',
                    height: '118px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(0, 217, 255, 0.28)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#0B1220',
                    boxShadow: '0 6px 18px rgba(0, 0, 0, 0.45)',
                    transition: 'all var(--transition-fast)',
                  }}
                  onClick={() =>
                    setPreviewImage({
                      title: `${update.project} — Site Telemetry Photo`,
                      caption: update.workCompleted,
                      date: update.date,
                      time: update.time || '16:30',
                      image: photoObj.url,
                      category: photoObj.category,
                      photoTitle: photoObj.title,
                      supervisor: update.supervisor,
                      weather: update.weather,
                      workers: update.workers,
                      progress: update.progress,
                      project: update.project,
                    })
                  }
                  title="Click to view high-resolution photographic telemetry"
                >
                  <img
                    src={photoObj.url}
                    alt={photoObj.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      transition: 'transform 0.35s ease',
                    }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/site_foundation.jpg';
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />

                  {/* Top Category Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background: 'rgba(11, 18, 32, 0.85)',
                      backdropFilter: 'blur(6px)',
                      border: '1px solid rgba(0, 217, 255, 0.3)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      letterSpacing: '0.02em',
                      pointerEvents: 'none',
                    }}
                  >
                    {photoObj.category}
                  </div>

                  {/* Dark Vignette Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, transparent 45%, rgba(11, 18, 32, 0.92) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Bottom Action Strip */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '5px',
                      left: '8px',
                      right: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                      pointerEvents: 'none',
                    }}
                  >
                    <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      📸 <span>Site Photo</span>
                    </span>
                    <span
                      style={{
                        background: 'rgba(0, 217, 255, 0.25)',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        color: '#FFFFFF',
                        fontSize: '0.62rem',
                      }}
                    >
                      🔍 View
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* High-Definition Photographic Telemetry Inspection Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '860px', padding: 0, overflow: 'hidden' }}
          >
            {/* Modal Header Bar */}
            <div
              className="modal-header"
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-color)',
                background: 'var(--bg-surface-elevated)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3px' }}>
                  <div className="modal-title" style={{ margin: 0, fontSize: '1.12rem' }}>
                    {previewImage.title}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--accent-cyan)',
                      background: 'rgba(0, 217, 255, 0.12)',
                      border: '1px solid rgba(0, 217, 255, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {previewImage.category || 'Visual Telemetry'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {previewImage.date} • {previewImage.time} • Field Verified by {previewImage.supervisor || 'Alex Morgan'}
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setPreviewImage(null)}
                aria-label="Close preview"
              >
                <IconX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '24px' }}>
              {/* Photo Display Frame */}
              <div
                style={{
                  width: '100%',
                  height: '420px',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 217, 255, 0.3)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.65)',
                  marginBottom: '18px',
                  background: '#0B1220',
                  position: 'relative',
                }}
              >
                <img
                  src={previewImage.image}
                  alt={previewImage.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/site_foundation.jpg';
                  }}
                />

                {/* HUD Overlay Badges */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(11, 18, 32, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(0, 217, 255, 0.35)',
                      color: '#00D9FF',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    ● 4K TELEMETRY FEED
                  </span>
                  <span
                    style={{
                      background: 'rgba(11, 18, 32, 0.85)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid var(--border-color)',
                      color: '#FFFFFF',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    {previewImage.weather || 'Normal Conditions'}
                  </span>
                </div>
              </div>

              {/* Inspector Telemetry Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '12px',
                  marginBottom: '16px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Project
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {previewImage.project}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Workforce on Site
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                    👷 {previewImage.workers || 32} Personnel
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Milestone Progress
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {previewImage.progress || 80}% Complete
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Field Supervisor
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                    {previewImage.supervisor || 'Alex Morgan'}
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent-cyan)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    letterSpacing: '0.03em',
                  }}
                >
                  Superintendent Shift Verification Log
                </div>
                <p style={{ fontSize: '0.9rem', color: '#FFFFFF', lineHeight: '1.5', margin: 0 }}>
                  {previewImage.caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Daily Update Modal with Visual Construction Image Selector */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '680px' }}
          >
            <div className="modal-header">
              <div>
                <div className="modal-title">{t('siteUpdates.recordProgress', 'Record Daily Site Progress')}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Log on-site activities, manpower, weather conditions, and photographic telemetry.
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                <IconX />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body" style={{ padding: '20px 24px' }}>
              <div className="form-group">
                <label className="form-label">{t('siteUpdates.project', 'Project')} *</label>
                <select
                  className="form-control"
                  value={newUpdate.project}
                  onChange={(e) => setNewUpdate({ ...newUpdate, project: e.target.value })}
                >
                  {projects.map((p) => (
                    <option key={p._id || p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Random Construction Site Image Selector */}
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid rgba(0, 217, 255, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFFFFF' }}>
                      📸 Construction Site Photographic Telemetry
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Assign an authentic field photo to this daily progress report.
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePickRandomPhoto}
                    style={{
                      borderColor: 'rgba(0, 217, 255, 0.4)',
                      color: 'var(--accent-cyan)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.78rem',
                    }}
                  >
                    <IconRefresh size={14} />
                    <span>🎲 Pick Random Image</span>
                  </button>
                </div>

                {/* Selected Preview Card */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px 1fr',
                    gap: '14px',
                    alignItems: 'center',
                    background: '#0B1220',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '130px',
                      height: '84px',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid rgba(0, 217, 255, 0.3)',
                    }}
                  >
                    <img
                      src={newUpdate.image}
                      alt="Selected site preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/images/site_foundation.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {newUpdate.photoCategory || 'Site Telemetry'}
                    </span>
                    <div style={{ fontSize: '0.86rem', fontWeight: 600, color: '#FFFFFF', marginTop: '2px' }}>
                      {newUpdate.photoTitle || 'Site Progress Capture'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {newUpdate.image}
                    </div>
                  </div>
                </div>

                {/* Thumbnails Row */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Or select directly from available construction feeds:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(8, 1fr)',
                    gap: '6px',
                  }}
                >
                  {CONSTRUCTION_SITE_PHOTOS.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => handleSelectSpecificPhoto(photo)}
                      title={`${photo.category}: ${photo.title}`}
                      style={{
                        height: '46px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border:
                          newUpdate.image === photo.url
                            ? '2px solid var(--accent-cyan)'
                            : '1px solid var(--border-color)',
                        opacity: newUpdate.image === photo.url ? 1 : 0.65,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('siteUpdates.workSummary', 'Work Completed Summary')} *</label>
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
                  <label className="form-label">{t('siteUpdates.workersOnSite', 'Workers on Site')}</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="32"
                    value={newUpdate.workers}
                    onChange={(e) => setNewUpdate({ ...newUpdate, workers: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('siteUpdates.milestoneProgress', 'Milestone Progress')} (%)</label>
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

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">{t('siteUpdates.supervisor', 'Supervisor')}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUpdate.supervisor}
                    onChange={(e) => setNewUpdate({ ...newUpdate, supervisor: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Weather Conditions</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newUpdate.weather}
                    onChange={(e) => setNewUpdate({ ...newUpdate, weather: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">{t('siteUpdates.delaysIssues', 'Delays or Issues Encountered (Optional)')}</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Heavy rain caused a 4-hour delay in morning shift."
                  value={newUpdate.issues}
                  onChange={(e) => setNewUpdate({ ...newUpdate, issues: e.target.value })}
                />
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('siteUpdates.submitLog', 'Submit Site Log')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
