import React, { useState, useMemo } from 'react';
import { initialProjectsData } from '../mock/projectsData';
import { StatusBadge, RiskBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { AddProjectModal } from '../components/projects/AddProjectModal';
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconMapPin,
  IconUser,
  IconCalendar,
  IconGrid,
  IconList,
  IconBuilding,
} from '../components/common/Icons';

export const Projects = () => {
  const [projects, setProjects] = useState(initialProjectsData);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle adding new project to state
  const handleAddProject = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Filtered & Searched Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        searchQuery === '' ||
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.projectManager.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        project.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesRisk =
        riskFilter === 'ALL' ||
        project.riskLevel.toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [projects, searchQuery, statusFilter, riskFilter]);

  // Quick summary counts
  const counts = useMemo(() => {
    return {
      total: projects.length,
      inProgress: projects.filter((p) => p.status === 'In Progress').length,
      planning: projects.filter((p) => p.status === 'Planning').length,
      onHold: projects.filter((p) => p.status === 'On Hold').length,
      completed: projects.filter((p) => p.status === 'Completed').length,
    };
  }, [projects]);

  return (
    <div className="projects-page">
      {/* Page Header Banner */}
      <div className="dashboard-header-banner">
        <div>
          <h1 className="dashboard-heading">Construction Projects</h1>
          <p className="dashboard-subheading">
            Manage site blueprints, timelines, contractor allocations, and operational risk factors.
          </p>
        </div>

        <div className="dashboard-actions">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <IconGrid size={16} />
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
              aria-label="Table View"
            >
              <IconList size={16} />
            </button>
          </div>

          <button
            id="btn-add-project"
            className="btn btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            <IconPlus size={16} />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="projects-toolbar">
        {/* Search */}
        <div className="toolbar-search-box">
          <IconSearch size={16} color="var(--text-secondary)" />
          <input
            id="projects-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project, client, site location, or manager..."
            className="toolbar-search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="toolbar-filters">
          <div className="filter-select-wrapper">
            <IconFilter size={14} color="var(--accent-cyan)" />
            <span className="filter-label">Status:</span>
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Statuses ({counts.total})</option>
              <option value="Planning">Planning ({counts.planning})</option>
              <option value="In Progress">In Progress ({counts.inProgress})</option>
              <option value="On Hold">On Hold ({counts.onHold})</option>
              <option value="Completed">Completed ({counts.completed})</option>
            </select>
          </div>

          <div className="filter-select-wrapper">
            <span className="filter-label">Risk Level:</span>
            <select
              id="filter-risk-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Risks</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>

          {(searchQuery || statusFilter !== 'ALL' || riskFilter !== 'ALL') && (
            <button
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setRiskFilter('ALL');
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Result Count Indicator */}
      <div className="projects-count-bar">
        <span>
          Showing <strong>{filteredProjects.length}</strong> of <strong>{projects.length}</strong> projects
        </span>
      </div>

      {/* Main Content: Card Grid or Table */}
      {filteredProjects.length === 0 ? (
        <div className="empty-projects-state">
          <div className="empty-state-icon">
            <IconBuilding size={32} />
          </div>
          <h3>No matching projects found</h3>
          <p>Try adjusting your search query or reset active filters.</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-title-box">
                  <span className="project-code">{project.id}</span>
                  <h3 className="project-card-title">{project.name}</h3>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="project-client-name">
                Client: <strong>{project.clientName}</strong>
              </div>

              <div className="project-card-meta">
                <div className="meta-item">
                  <IconMapPin size={14} color="var(--accent-cyan)" />
                  <span>{project.location}</span>
                </div>
                <div className="meta-item">
                  <IconUser size={14} color="var(--text-secondary)" />
                  <span>Manager: {project.projectManager}</span>
                </div>
                <div className="meta-item">
                  <IconCalendar size={14} color="var(--text-secondary)" />
                  <span>
                    {project.startDate} → {project.expectedEndDate}
                  </span>
                </div>
              </div>

              <div className="project-card-progress">
                <ProgressBar progress={project.progress} showLabel={true} />
              </div>

              <div className="project-card-footer">
                <RiskBadge riskLevel={project.riskLevel} />
                <span className="project-timeline-status">
                  {project.status === 'Completed'
                    ? 'Target Met'
                    : `Due ${project.expectedEndDate}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="panel-card">
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Location</th>
                  <th>Manager</th>
                  <th>Timeline</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-name-cell">
                        <span className="project-name-title">{project.name}</span>
                        <span className="project-name-sub">{project.id}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {project.clientName}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconMapPin size={13} color="var(--accent-cyan)" />
                        <span>{project.location}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconUser size={13} />
                        <span>{project.projectManager}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {project.startDate} <br />
                      <span style={{ color: 'var(--text-muted)' }}>to</span> {project.expectedEndDate}
                    </td>
                    <td style={{ minWidth: '130px' }}>
                      <ProgressBar progress={project.progress} showLabel={true} />
                    </td>
                    <td>
                      <StatusBadge status={project.status} />
                    </td>
                    <td>
                      <RiskBadge riskLevel={project.riskLevel} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddProject={handleAddProject}
      />
    </div>
  );
};
