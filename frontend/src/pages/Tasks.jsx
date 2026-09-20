import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge, PriorityBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { TaskTimeline } from '../components/common/TaskTimeline';
import { DataDrawer } from '../components/common/DataDrawer';
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconEdit,
  IconTrash,
  IconX,
  IconClock,
  IconUser,
  IconCheck,
} from '../components/common/Icons';
import { getTasks, updateTask, deleteTask } from '../services/api';

export const Tasks = ({
  tasks: initialTasksProp,
  projects = [],
  onNavigate,
  onUpdateTaskStatus,
}) => {
  const { t } = useTranslation();

  // Tasks state directly from backend MongoDB with fallback to initial props
  const [tasks, setTasks] = useState(initialTasksProp && initialTasksProp.length > 0 ? initialTasksProp : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // View state: 'table' | 'timeline' (default to 'table' so users see everything clearly)
  const [viewMode, setViewMode] = useState('table');
  const [selectedTaskForDrawer, setSelectedTaskForDrawer] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [assigneeFilter, setAssigneeFilter] = useState('All');

  // Edit and Delete modal states
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Fetch tasks directly from MongoDB backend
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTasks();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setTasks(res.data);
      } else if (initialTasksProp && initialTasksProp.length > 0) {
        setTasks(initialTasksProp);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error('Error fetching tasks from MongoDB:', err);
      if (initialTasksProp && initialTasksProp.length > 0) {
        setTasks(initialTasksProp);
      } else {
        setError(err.message || 'Failed to load tasks from server.');
      }
    } finally {
      setLoading(false);
    }
  }, [initialTasksProp]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Helper to extract project name safely
  const getTaskProjectName = (tsk) => {
    if (tsk.projectId && typeof tsk.projectId === 'object' && tsk.projectId.name) {
      return tsk.projectId.name;
    }
    if (tsk.project) {
      return tsk.project;
    }
    const matched = projects.find(
      (p) => (p._id || p.id) === (tsk.projectId?._id || tsk.projectId)
    );
    return matched ? matched.name : 'General Project';
  };

  // Helper to format due date
  const formatDueDate = (dateVal) => {
    if (!dateVal) return '—';
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
      return dateVal.slice(0, 10);
    }
    return dateVal;
  };

  // Extract unique assignees from loaded tasks
  const assignees = ['All', ...new Set(tasks.map((t) => t.assignedTo).filter(Boolean))];

  // Client-side filtering
  const filteredTasks = tasks.filter((t) => {
    const taskName = t.title || t.name || '';
    const taskId = (t._id || t.id || '').toString();
    const taskProject = getTaskProjectName(t);
    const taskProjectId = (t.projectId?._id || t.projectId || '').toString();

    const matchesSearch =
      taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProject =
      projectFilter === 'All' ||
      taskProject === projectFilter ||
      taskProjectId === projectFilter;

    const matchesStatus =
      statusFilter === 'All' ||
      t.status === statusFilter ||
      (statusFilter === 'Pending' && t.status === 'Not Started');

    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'All' || t.assignedTo === assigneeFilter;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Action: Open Edit Modal
  const handleOpenEdit = (task) => {
    setActionError(null);
    setEditingTask({
      _id: task._id || task.id,
      title: task.title || task.name || '',
      assignedTo: task.assignedTo || '',
      priority: task.priority || 'Medium',
      status: task.status || 'Not Started',
      progress: task.progress !== undefined ? task.progress : 0,
      dueDate: task.dueDate ? formatDueDate(task.dueDate) : '',
      description: task.description || '',
    });
  };

  // Action: Submit Edit Task
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    setActionError(null);

    if (!editingTask.title.trim()) {
      setActionError('Task title is required.');
      return;
    }

    const progressNum = Number(editingTask.progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      setActionError('Progress must be between 0% and 100%.');
      return;
    }

    try {
      setActionLoading(true);
      const updatePayload = {
        title: editingTask.title.trim(),
        assignedTo: editingTask.assignedTo.trim(),
        priority: editingTask.priority,
        status: editingTask.status,
        progress: progressNum,
        dueDate: editingTask.dueDate,
        description: editingTask.description.trim(),
      };

      await updateTask(editingTask._id, updatePayload);
      setEditingTask(null);

      // Refresh task list from real backend
      await fetchTasks();

      if (onUpdateTaskStatus) {
        onUpdateTaskStatus(editingTask._id, editingTask.status);
      }
    } catch (err) {
      console.error('Update task error:', err);
      let msg = 'Failed to update task.';
      if (err.errors && Array.isArray(err.errors)) {
        msg = err.errors.join(' • ');
      } else if (err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Confirm Delete Task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setActionError(null);

    try {
      setActionLoading(true);
      await deleteTask(deletingTask._id || deletingTask.id);
      setDeletingTask(null);

      // Refresh task list from real backend
      await fetchTasks();
    } catch (err) {
      console.error('Delete task error:', err);
      let msg = 'Failed to delete task.';
      if (err.errors && Array.isArray(err.errors)) {
        msg = err.errors.join(' • ');
      } else if (err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setProjectFilter('All');
    setStatusFilter('All');
    setPriorityFilter('All');
    setAssigneeFilter('All');
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('tasks.title')}</h1>
          <p>{t('tasks.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <div style={{ display: 'inline-flex', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', gap: '4px' }}>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setViewMode('table')}
            >
              📋 Table View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ border: 'none', padding: '6px 12px', fontSize: '0.82rem' }}
              onClick={() => setViewMode('timeline')}
            >
              📊 Timeline Gantt
            </button>
          </div>
          <button
            className="btn btn-secondary"
            onClick={fetchTasks}
            disabled={loading}
            title="Refresh tasks from database"
          >
            <IconRefresh size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('add-task')}>
            <IconPlus size={16} />
            <span>{t('tasks.addTask')}</span>
          </button>
        </div>
      </div>

      {/* Error state banner */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger-text)',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.88rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchTasks}>
            Retry
          </button>
        </div>
      )}

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
              <option key={p._id || p.id} value={p.name}>
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
            <option value="Not Started">{t('status.notStarted')}</option>
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

      {/* View Switch: Timeline Gantt vs Table */}
      {viewMode === 'timeline' ? (
        <TaskTimeline
          tasks={filteredTasks}
          onTaskClick={(tsk) => setSelectedTaskForDrawer(tsk)}
        />
      ) : (
        /* Tasks Table */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('tasks.taskName')}</th>
                <th>{t('navigation.projects')}</th>
                <th>{t('tasks.assignee')}</th>
                <th>{t('common.priority')}</th>
                <th>{t('tasks.dueDate')}</th>
                <th style={{ width: '150px' }}>{t('common.progress')}</th>
                <th>{t('common.status')}</th>
                <th style={{ width: '130px', textAlign: 'center' }}>{t('common.actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div style={{ fontSize: '1.2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                      <span>Loading tasks from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    {tasks.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>No tasks found in database.</p>
                        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('add-task')}>
                          <IconPlus size={14} /> Add First Task
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <p style={{ margin: 0 }}>No tasks match the active filters.</p>
                        <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((tsk) => {
                  const taskId = tsk._id || tsk.id;
                  const taskTitle = tsk.title || tsk.name;
                  const projectName = getTaskProjectName(tsk);
                  const displayDueDate = formatDueDate(tsk.dueDate);

                  return (
                    <tr
                      key={taskId}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedTaskForDrawer(tsk)}
                    >
                      <td>
                        <div className="table-cell-title">{taskTitle}</div>
                        <div className="table-cell-sub">{taskId} {tsk.description ? `• ${tsk.description}` : ''}</div>
                      </td>
                      <td>{projectName}</td>
                      <td>{tsk.assignedTo || 'Unassigned'}</td>
                      <td>
                        <PriorityBadge priority={tsk.priority || 'Medium'} />
                      </td>
                      <td>{displayDueDate}</td>
                      <td>
                        <ProgressBar progress={Number(tsk.progress) || 0} />
                      </td>
                      <td>
                        <StatusBadge status={tsk.status || 'Not Started'} />
                      </td>
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(tsk)}
                            title="Edit Task"
                            aria-label="Edit Task"
                            style={{ padding: '6px 8px' }}
                          >
                            <IconEdit size={14} color="var(--accent-cyan)" />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDeletingTask(tsk)}
                            title="Delete Task"
                            aria-label="Delete Task"
                            style={{ padding: '6px 8px', color: 'var(--color-danger)' }}
                          >
                            <IconTrash size={14} />
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
      )}

      {/* Task Contextual Data Drawer */}
      {selectedTaskForDrawer && (
        <DataDrawer
          isOpen={!!selectedTaskForDrawer}
          onClose={() => setSelectedTaskForDrawer(null)}
          title={selectedTaskForDrawer.title || selectedTaskForDrawer.name}
          subtitle={`Task ID: ${selectedTaskForDrawer._id || selectedTaskForDrawer.id}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Project & Assignee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Project</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {getTaskProjectName(selectedTaskForDrawer)}
                </span>
              </div>
              <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Assignee</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {selectedTaskForDrawer.assignedTo || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Priority & Status */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Priority Level</span>
                <PriorityBadge priority={selectedTaskForDrawer.priority} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Current Status</span>
                <StatusBadge status={selectedTaskForDrawer.status} />
              </div>
            </div>

            {/* Progress Bar & Quick Status Transitions */}
            <div style={{ padding: '14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Completion Progress</span>
                <span style={{ fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                  {selectedTaskForDrawer.progress || 0}%
                </span>
              </div>
              <ProgressBar progress={selectedTaskForDrawer.progress || 0} height={8} />

              <div style={{ marginTop: '14px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Quick Status Update
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {['In Progress', 'Completed', 'Delayed', 'Not Started'].map((st) => (
                    <button
                      key={st}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.74rem',
                        borderColor: selectedTaskForDrawer.status === st ? 'var(--color-accent)' : 'var(--border-color)',
                        color: selectedTaskForDrawer.status === st ? 'var(--color-accent)' : 'var(--text-main)',
                        fontWeight: selectedTaskForDrawer.status === st ? 700 : 500,
                      }}
                      onClick={async () => {
                        const tId = selectedTaskForDrawer._id || selectedTaskForDrawer.id;
                        if (onUpdateTaskStatus) {
                          await onUpdateTaskStatus(tId, st);
                        }
                        setSelectedTaskForDrawer((prev) => ({ ...prev, status: st }));
                        fetchTasks();
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            {selectedTaskForDrawer.description && (
              <div style={{ padding: '12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Description</span>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-main)', lineHeight: '1.45' }}>
                  {selectedTaskForDrawer.description}
                </p>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => {
                  const tsk = selectedTaskForDrawer;
                  setSelectedTaskForDrawer(null);
                  handleOpenEdit(tsk);
                }}
              >
                <IconEdit size={14} /> Full Edit
              </button>
              <button
                className="btn btn-secondary"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
                onClick={() => {
                  const tsk = selectedTaskForDrawer;
                  setSelectedTaskForDrawer(null);
                  setDeletingTask(tsk);
                }}
              >
                <IconTrash size={14} />
              </button>
            </div>
          </div>
        </DataDrawer>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setEditingTask(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Task</h2>
                <p className="modal-subtitle">ID: {editingTask._id}</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEditingTask(null)}
                disabled={actionLoading}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  margin: '0 24px 16px 24px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  fontSize: '0.85rem',
                }}
              >
                ⚠️ {actionError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">{t('tasks.taskTitle')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTask.title}
                    onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('tasks.assignee')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingTask.assignedTo}
                    onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('common.priority')}</label>
                  <select
                    className="form-input"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    disabled={actionLoading}
                  >
                    <option value="Low">{t('status.low')}</option>
                    <option value="Medium">{t('status.medium')}</option>
                    <option value="High">{t('status.high')}</option>
                    <option value="Critical">{t('status.critical')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('common.status')}</label>
                  <select
                    className="form-input"
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    disabled={actionLoading}
                  >
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">{t('status.inProgress')}</option>
                    <option value="Completed">{t('status.completed')}</option>
                    <option value="Delayed">{t('status.delayed')}</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('tasks.progress')} (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    value={editingTask.progress}
                    onChange={(e) => setEditingTask({ ...editingTask, progress: e.target.value })}
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('tasks.dueDate')} *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    required
                    disabled={actionLoading}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">{t('tasks.description')}</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={editingTask.description}
                    onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                    disabled={actionLoading}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingTask(null)}
                  disabled={actionLoading}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTask && (
        <div className="modal-backdrop" onClick={() => !actionLoading && setDeletingTask(null)}>
          <div className="modal-dialog" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ color: 'var(--color-danger)' }}>Delete Task</h2>
                <p className="modal-subtitle">Confirm permanent deletion</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setDeletingTask(null)}
                disabled={actionLoading}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            {actionError && (
              <div
                style={{
                  margin: '0 24px 16px 24px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-danger-bg)',
                  border: '1px solid var(--color-danger-border)',
                  color: 'var(--color-danger-text)',
                  fontSize: '0.85rem',
                }}
              >
                ⚠️ {actionError}
              </div>
            )}

            <div style={{ padding: '0 24px 20px 24px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
              Are you sure you want to permanently delete task{' '}
              <strong>"{deletingTask.title || deletingTask.name}"</strong>?
              <br />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                This record will be removed from MongoDB immediately.
              </span>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingTask(null)}
                disabled={actionLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
