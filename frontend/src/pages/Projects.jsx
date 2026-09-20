import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconSearch,
  IconPlus,
} from '../components/common/Icons';

export const Projects = ({
  projects = [],
  onNavigate,
  onSelectProject,
}) => {
  const { t } = useTranslation();
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
          <h1>{t('projects.title')}</h1>
          <p>{t('projects.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode((prev) => (prev === 'table' ? 'cards' : 'table'))}
          >
            {viewMode === 'table' ? t('projects.cardView') : t('projects.tableView')}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('add-project')}
          >
            <IconPlus size={16} />
            <span>{t('projects.addProject')}</span>
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
              placeholder={t('projects.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">{t('projects.allStatuses')}</option>
            <option value="On Track">{t('status.onTrack')}</option>
            <option value="At Risk">{t('status.atRisk')}</option>
            <option value="Delayed">{t('status.delayed')}</option>
            <option value="Completed">{t('status.completed')}</option>
          </select>

          <select
            className="filter-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="All">{t('projects.allLocations')}</option>
            {locations.filter((l) => l !== 'All').map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredProjects.length, total: projects.length })}
        </div>
      </div>

      {/* Table or Cards View */}
      {viewMode === 'table' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('projects.projectName')}</th>
                <th>{t('common.location')}</th>
                <th>{t('projects.startDate')}</th>
                <th>{t('projects.expectedEndDate')}</th>
                <th style={{ width: '180px' }}>{t('common.progress')}</th>
                <th>{t('projects.budget')}</th>
                <th>{t('common.status')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {t('projects.noProjects')}
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
                      <div className="table-cell-sub">{prj.code} • {prj.client}</div>
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
        /* Card Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredProjects.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>{t('projects.noProjects')}</p>
            </div>
          ) : (
            filteredProjects.map((prj) => (
              <div
                key={prj.id}
                className="card card-hoverable"
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px' }}
                onClick={() => {
                  onSelectProject && onSelectProject(prj.id);
                  onNavigate('project-details');
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                      {prj.name}
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{prj.code} • {prj.client}</span>
                  </div>
                  <StatusBadge status={prj.status} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div><strong>{t('common.location')}:</strong> {prj.location}</div>
                  <div><strong>{t('common.manager')}:</strong> {prj.manager}</div>
                  <div><strong>{t('projects.expectedEndDate')}:</strong> {prj.expectedCompletion}</div>
                  <div><strong>{t('projects.budget')}:</strong> {prj.budget}</div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('common.progress')}</span>
                    <span style={{ fontWeight: 600 }}>{prj.progress}%</span>
                  </div>
                  <ProgressBar progress={prj.progress} showLabel={false} height={6} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-accent)' }}>
                    {t('common.viewDetails')} →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
