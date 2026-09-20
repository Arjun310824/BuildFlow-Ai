import React, { useState } from 'react';
import { StatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconBuilding,
  IconCalendar,
  IconUser,
} from '../components/common/Icons';

export const Projects = ({
  projects = [],
  onNavigate,
  onSelectProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Extract unique locations
  const locations = ['All', ...new Set(projects.map((p) => p.location.split(',')[0].trim()))];

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesLocation = locationFilter === 'All' || p.location.includes(locationFilter);

    return matchesSearch && matchesStatus && matchesLocation;
  });

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Projects</h1>
          <p>Manage and monitor all construction projects.</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
          >
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('add-project')}
          >
            <IconPlus size={16} />
            <span>Add Project</span>
          </button>
        </div>
      </div>

      {/* Controls: Search, Status filter, Location filter */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search Projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="On Track">On Track</option>
            <option value="At Risk">At Risk</option>
            <option value="Delayed">Delayed</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            className="filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="All">All Locations</option>
            {locations.filter((l) => l !== 'All').map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredProjects.length}</strong> of {projects.length} projects
        </div>
      </div>

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Location</th>
                <th>Start Date</th>
                <th>Expected Completion</th>
                <th style={{ width: '180px' }}>Progress</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No projects found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((prj) => (
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
                      <div className="table-cell-sub">
                        {prj.code} • {prj.client}
                      </div>
                    </td>
                    <td>{prj.location}</td>
                    <td>{prj.startDate}</td>
                    <td>{prj.expectedCompletion}</td>
                    <td>
                      <ProgressBar progress={prj.progress} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{prj.budget}</span>
                    </td>
                    <td>
                      <StatusBadge status={prj.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredProjects.map((prj) => (
            <div
              key={prj.id}
              className="card card-hoverable"
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
              onClick={() => {
                onSelectProject && onSelectProject(prj.id);
                onNavigate('project-details');
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    {prj.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {prj.code} • {prj.category}
                  </div>
                </div>
                <StatusBadge status={prj.status} />
              </div>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.4',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {prj.description}
              </p>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontWeight: 600 }}>{prj.progress}%</span>
                </div>
                <ProgressBar progress={prj.progress} showLabel={false} height={6} />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-light)',
                  fontSize: '0.78rem',
                  marginTop: 'auto',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Budget</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{prj.budget}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Completion</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{prj.expectedCompletion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
