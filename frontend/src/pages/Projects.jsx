import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconTrash,
  IconRefresh,
  IconAlertTriangle,
  IconX,
} from '../components/common/Icons';
import { AddProjectModal } from '../components/projects/AddProjectModal';
import {
  getProjectsApi,
  createProjectApi,
  updateProjectApi,
  deleteProjectApi,
} from '../services/api';

export const Projects = ({
  projects: initialProjectsProp = [],
  onNavigate,
  onSelectProject,
  onProjectsUpdated,
}) => {
  const { t } = useTranslation();

  // State Management
  const [projectsList, setProjectsList] = useState(initialProjectsProp);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects from MongoDB via backend API
  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setActionError(null);

    try {
      const response = await getProjectsApi();
      if (response && response.success && Array.isArray(response.data)) {
        setProjectsList(response.data);
        if (onProjectsUpdated) {
          onProjectsUpdated(response.data);
        }
      } else {
        throw new Error('Invalid project response format from server');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Unable to connect to projects API');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [onProjectsUpdated]);

  // Initial mount fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toISOString().slice(0, 10);
    } catch {
      return String(dateStr);
    }
  };

  // Extract unique site locations for dropdown filter
  const locations = [
    'All',
    ...new Set(
      projectsList
        .filter((p) => p.location && typeof p.location === 'string')
        .map((p) => p.location.split(',')[0].trim())
    ),
  ];

  // Filtering
  const filteredProjects = projectsList.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.client && p.client.toLowerCase().includes(term)) ||
      (p.location && p.location.toLowerCase().includes(term)) ||
      (p.manager && p.manager.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesRisk = riskFilter === 'All' || p.risk === riskFilter;
    const matchesLocation =
      locationFilter === 'All' ||
      (p.location && p.location.toLowerCase().includes(locationFilter.toLowerCase()));

    return matchesSearch && matchesStatus && matchesRisk && matchesLocation;
  });

  // Action Handlers
  const handleOpenAddModal = () => {
    setEditingProject(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e, prj) => {
    e.stopPropagation();
    setEditingProject(prj);
    setIsModalOpen(true);
  };

  const handleSaveProject = async (payload, isEdit, id) => {
    if (isEdit) {
      await updateProjectApi(id, payload);
    } else {
      await createProjectApi(payload);
    }
    // Refresh data from MongoDB
    await fetchProjects(true);
  };

  const handleOpenDeleteConfirm = (e, prj) => {
    e.stopPropagation();
    setDeleteConfirmProject(prj);
    setActionError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProject) return;
    const targetId = deleteConfirmProject._id || deleteConfirmProject.id;
    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteProjectApi(targetId);
      setDeleteConfirmProject(null);
      await fetchProjects(true);
    } catch (err) {
      console.error('Delete failed:', err);
      setActionError(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('projects.title') || 'Project Management'}</h1>
          <p>{t('projects.subtitle') || 'Monitor real-time progress, schedules, and risk metrics'}</p>
        </div>
        <div className="page-header-actions">
          {/* Refresh Button */}
          <button
            className="btn btn-secondary"
            onClick={() => fetchProjects(true)}
            disabled={isRefreshing || loading}
            title="Refresh from MongoDB"
            aria-label="Refresh project list"
          >
            <IconRefresh
              size={16}
              className={isRefreshing ? 'spin-animation' : ''}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* View Toggle */}
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
          >
            {viewMode === 'table'
              ? t('projects.cardView') || 'Card View'
              : t('projects.tableView') || 'Table View'}
          </button>

          {/* Add Project Button */}
          <button
            className="btn btn-primary"
            onClick={handleOpenAddModal}
          >
            <IconPlus size={16} />
            <span>{t('projects.addProject') || 'Add Project'}</span>
          </button>
        </div>
      </div>

      {/* Action Error Banner (e.g. Delete/Edit failures) */}
      {actionError && (
        <div
          style={{
            margin: '0 0 16px',
            padding: '12px 18px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--status-danger, #ef4444)',
            borderRadius: 'var(--radius-md, 8px)',
            color: 'var(--status-danger, #ef4444)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.875rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlertTriangle size={18} />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <IconX size={16} />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="filter-bar">
        <div className="filter-group-left" style={{ flexWrap: 'wrap', gap: '10px' }}>
          {/* Search Input */}
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('projects.searchPlaceholder') || 'Search by name, client, site...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
          >
            <option value="All">{t('projects.allStatuses') || 'All Statuses'}</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>

          {/* Risk Filter */}
          <select
            className="filter-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            aria-label="Filter by Risk Level"
          >
            <option value="All">All Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          {/* Location Filter */}
          <select
            className="filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            aria-label="Filter by Site Location"
          >
            <option value="All">{t('projects.allLocations') || 'All Locations'}</option>
            {locations.filter((l) => l !== 'All').map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {loading
            ? 'Loading database records...'
            : t('common.showingOf', { count: filteredProjects.length, total: projectsList.length }) ||
              `Showing ${filteredProjects.length} of ${projectsList.length} projects`}
        </div>
      </div>

      {/* Loading State */}
      {loading && projectsList.length === 0 ? (
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 20px',
            textAlign: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(0, 240, 255, 0.2)',
              borderTopColor: 'var(--accent-cyan, #00f0ff)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .spin-animation {
              animation: spin 0.8s linear infinite;
            }
          `}</style>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '0.95rem' }}>
            Loading projects from MongoDB database...
          </p>
        </div>
      ) : error && projectsList.length === 0 ? (
        /* Error State */
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 20px',
            textAlign: 'center',
            gap: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <IconAlertTriangle size={36} color="var(--status-danger, #ef4444)" />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Failed to Load Projects
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', fontSize: '0.88rem' }}>
            {error}
          </p>
          <button className="btn btn-primary" onClick={() => fetchProjects(false)}>
            <IconRefresh size={16} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('projects.projectName') || 'Project & Client'}</th>
                <th>{t('common.location') || 'Location'}</th>
                <th>{t('common.manager') || 'Manager'}</th>
                <th>{t('projects.startDate') || 'Start Date'}</th>
                <th>{t('projects.expectedEndDate') || 'Expected End'}</th>
                <th style={{ width: '160px' }}>{t('common.progress') || 'Progress'}</th>
                <th>{t('common.status') || 'Status'}</th>
                <th>{t('projects.riskLevel') || 'Risk'}</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}
                  >
                    {searchTerm || statusFilter !== 'All' || riskFilter !== 'All'
                      ? 'No projects match your filter criteria.'
                      : t('projects.noProjects') || 'No construction projects registered in MongoDB.'}
                  </td>
                </tr>
              ) : (
                filteredProjects.map((prj) => {
                  const prjId = prj._id || prj.id;
                  return (
                    <tr
                      key={prjId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        onSelectProject && onSelectProject(prjId);
                        onNavigate && onNavigate('project-details');
                      }}
                    >
                      <td>
                        <div className="table-cell-title">{prj.name}</div>
                        <div className="table-cell-sub">{prj.client}</div>
                      </td>
                      <td>{prj.location}</td>
                      <td>{prj.manager}</td>
                      <td>{formatDate(prj.startDate)}</td>
                      <td>{formatDate(prj.endDate || prj.expectedCompletion)}</td>
                      <td>
                        <ProgressBar progress={prj.progress || 0} />
                      </td>
                      <td>
                        <StatusBadge status={prj.status} />
                      </td>
                      <td>
                        <RiskBadge riskLevel={prj.risk} />
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', minWidth: 'auto' }}
                            onClick={(e) => handleOpenEditModal(e, prj)}
                            title="Edit project"
                            aria-label={`Edit ${prj.name}`}
                          >
                            <IconEdit size={14} color="var(--accent-cyan, #00f0ff)" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '6px',
                              minWidth: 'auto',
                              borderColor: 'rgba(239, 68, 68, 0.4)',
                            }}
                            onClick={(e) => handleOpenDeleteConfirm(e, prj)}
                            title="Delete project"
                            aria-label={`Delete ${prj.name}`}
                          >
                            <IconTrash size={14} color="var(--status-danger, #ef4444)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Card Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}
        >
          {filteredProjects.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>
                {searchTerm || statusFilter !== 'All' || riskFilter !== 'All'
                  ? 'No projects match your filter criteria.'
                  : t('projects.noProjects') || 'No construction projects registered in MongoDB.'}
              </p>
            </div>
          ) : (
            filteredProjects.map((prj) => {
              const prjId = prj._id || prj.id;
              // Calculate remaining days to deadline
              let deadlineDays = '45 days';
              const endDateVal = prj.endDate || prj.expectedCompletion;
              if (endDateVal) {
                const diffTime = new Date(endDateVal) - new Date();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                deadlineDays = diffDays > 0 ? `${diffDays} days` : 'Overdue';
              }

              // Compute health score
              const healthScore = prj.risk === 'High' ? 48 : (prj.risk === 'Medium' ? 68 : 88);

              return (
                <div
                  key={prjId}
                  className="card card-hoverable"
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    position: 'relative',
                    padding: '22px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                  }}
                  onClick={() => {
                    onSelectProject && onSelectProject(prjId);
                    onNavigate && onNavigate('project-details');
                  }}
                >
                  {/* Construction Site Visual Feed */}
                  {(() => {
                    const projectPhotos = [
                      '/images/site_crane.jpg',
                      '/images/site_facade.jpg',
                      '/images/site_steel.jpg',
                      '/images/site_foundation.jpg',
                      '/images/site_drone.jpg',
                      '/images/site_excavation.jpg',
                      '/images/site_interior.jpg',
                      '/images/site_mep.jpg',
                    ];
                    const photoSrc = projectPhotos[filteredProjects.indexOf(prj) % projectPhotos.length];
                    return (
                      <div
                        style={{
                          height: '110px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          position: 'relative',
                          border: '1px solid rgba(0, 217, 255, 0.22)',
                        }}
                      >
                        <img
                          src={photoSrc}
                          alt={prj.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/site_foundation.jpg';
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(180deg, transparent 35%, rgba(11, 18, 32, 0.85) 100%)',
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: 'var(--accent-cyan)',
                            background: 'rgba(11, 18, 32, 0.8)',
                            backdropFilter: 'blur(4px)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            border: '1px solid rgba(0, 217, 255, 0.25)',
                          }}
                        >
                          <span>● LIVE SITE FEED</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          marginBottom: '3px',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {prj.name}
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                        📍 {prj.location || 'Construction Site'}
                      </span>
                    </div>
                    <StatusBadge status={prj.status} />
                  </div>

                  {/* Progress Indicator */}
                  <div style={{ marginTop: '2px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        marginBottom: '6px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {prj.progress || 0}%
                      </span>
                    </div>
                    <ProgressBar progress={prj.progress || 0} showLabel={false} height={7} />
                  </div>

                  {/* Key Operational Dimensions: Health, Risk, Deadline */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Health
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: healthScore > 75 ? '#34D399' : (healthScore > 50 ? '#FBBF24' : '#F87171'), fontFamily: 'var(--font-mono)' }}>
                        {healthScore}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>
                        Risk
                      </div>
                      <RiskBadge riskLevel={prj.risk} />
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Deadline
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, color: deadlineDays === 'Overdue' ? '#F87171' : '#FFFFFF', marginTop: '2px' }}>
                        {deadlineDays}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                      marginTop: 'auto',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 8px', fontSize: '0.76rem' }}
                        onClick={(e) => handleOpenEditModal(e, prj)}
                        title="Edit Project"
                      >
                        <IconEdit size={13} color="var(--accent-cyan)" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '5px 8px',
                          fontSize: '0.76rem',
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                        }}
                        onClick={(e) => handleOpenDeleteConfirm(e, prj)}
                        title="Delete Project"
                      >
                        <IconTrash size={13} color="#EF4444" />
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => {
                        onSelectProject && onSelectProject(prjId);
                        onNavigate && onNavigate('project-details');
                      }}
                    >
                      <span>Open 360°</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitProject={handleSaveProject}
        projectToEdit={editingProject}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmProject && (
        <div
          className="modal-backdrop"
          onClick={() => !isDeleting && setDeleteConfirmProject(null)}
        >
          <div
            className="modal-dialog"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.15rem' }}>
                Delete Construction Project
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => !isDeleting && setDeleteConfirmProject(null)}
                disabled={isDeleting}
                type="button"
              >
                <IconX size={20} />
              </button>
            </div>

            <div className="modal-form" style={{ padding: '20px 24px' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Are you sure you want to delete{' '}
                <strong style={{ color: 'var(--text-primary)' }}>
                  {deleteConfirmProject.name}
                </strong>
                ? This will permanently remove the record from MongoDB.
              </p>

              {actionError && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '6px',
                    color: 'var(--status-danger, #ef4444)',
                    fontSize: '0.8rem',
                  }}
                >
                  {actionError}
                </div>
              )}

              <div
                className="modal-actions"
                style={{ marginTop: '20px', paddingTop: '16px', borderTop: 'none' }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setDeleteConfirmProject(null)}
                  disabled={isDeleting}
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    backgroundColor: 'var(--status-danger, #ef4444)',
                    borderColor: 'var(--status-danger, #ef4444)',
                  }}
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Projects;
