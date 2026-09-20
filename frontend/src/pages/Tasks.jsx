import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { IconSearch, IconPlus } from '../components/common/Icons';

export const Tasks = ({
  tasks = [],
  projects = [],
  onNavigate,
  onUpdateTaskStatus,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Extract unique assignees
  const assignees = ['All', ...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))];

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = projectFilter === 'All' || t.project === projectFilter;
    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'All' || t.assignedTo === assigneeFilter;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesAssignee;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('tasks.title')}</h1>
          <p>{t('tasks.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('add-task')}>
            <IconPlus size={16} />
            <span>{t('tasks.addTask')}</span>
          </button>
        </div>
      </div>

      {/* Filters: Project, Status, Priority, Assignee */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('tasks.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Project Filter */}
          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allStatuses')}</option>
            <option value="Pending">{t('status.pending')}</option>
            <option value="In Progress">{t('status.inProgress')}</option>
            <option value="Completed">{t('status.completed')}</option>
            <option value="Delayed">{t('status.delayed')}</option>
          </select>

          {/* Priority Filter */}
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allPriorities')}</option>
            <option value="Critical">{t('status.critical')}</option>
            <option value="High">{t('status.high')}</option>
            <option value="Medium">{t('status.medium')}</option>
            <option value="Low">{t('status.low')}</option>
          </select>

          {/* Assignee Filter */}
          <select
            className="filter-select"
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allAssignees')}</option>
            {assignees.filter((a) => a !== 'All').map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredTasks.length, total: tasks.length })}
        </div>
      </div>

      {/* Tasks Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('tasks.taskName')}</th>
              <th>{t('navigation.projects')}</th>
              <th>{t('tasks.assignee')}</th>
              <th>{t('common.priority')}</th>
              <th>{t('tasks.dueDate')}</th>
              <th style={{ width: '160px' }}>{t('common.progress')}</th>
              <th>{t('common.status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {t('tasks.noTasks')}
                </td>
              </tr>
            ) : (
              filteredTasks.map((tsk) => (
                <tr key={tsk.id}>
                  <td>
                    <div className="table-cell-title">{tsk.name}</div>
                    <div className="table-cell-sub">{tsk.id} • {tsk.description}</div>
                  </td>
                  <td>{tsk.project}</td>
                  <td>{tsk.assignedTo}</td>
                  <td>
                    <PriorityBadge priority={tsk.priority} />
                  </td>
                  <td>{tsk.dueDate}</td>
                  <td>
                    <ProgressBar progress={tsk.progress} />
                  </td>
                  <td>
                    <StatusBadge status={tsk.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
