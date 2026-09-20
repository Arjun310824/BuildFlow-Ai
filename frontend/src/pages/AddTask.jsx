import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createTask, getProjects } from '../services/api';

export const AddTask = ({ projects = [], onAddTask, onNavigate }) => {
  const { t } = useTranslation();
  const [availableProjects, setAvailableProjects] = useState(projects);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    projectId: projects[0]?._id || projects[0]?.id || '',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    status: 'Not Started',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    progress: 0,
  });

  // Ensure projects are loaded from backend if none passed or missing MongoDB _id
  useEffect(() => {
    const ensureProjects = async () => {
      if (projects.length > 0 && projects[0]?._id) {
        setAvailableProjects(projects);
        if (!formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: projects[0]._id }));
        }
      } else {
        try {
          const res = await getProjects();
          if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            setAvailableProjects(res.data);
            setFormData((prev) => ({
              ...prev,
              projectId: prev.projectId || res.data[0]._id,
            }));
          }
        } catch (err) {
          console.error('Failed to load projects in AddTask:', err);
        }
      }
    };
    ensureProjects();
  }, [projects]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setErrorMessage(null); // Clear errors on user input

    if (name === 'progress') {
      const num = Number(value);
      setFormData((prev) => {
        let updatedStatus = prev.status;
        if (num === 100) {
          updatedStatus = 'Completed';
        } else if (num > 0 && prev.status === 'Not Started') {
          updatedStatus = 'In Progress';
        }
        return { ...prev, progress: value, status: updatedStatus };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (!formData.title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    if (!formData.projectId) {
      setErrorMessage('Please select a valid project.');
      return;
    }

    // Verify projectId is a valid 24-character hexadecimal MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(formData.projectId)) {
      setErrorMessage(`Invalid Project ID: "${formData.projectId}". Must be a valid 24-character MongoDB ObjectId.`);
      return;
    }

    const progressNum = Number(formData.progress) || 0;
    if (progressNum < 0 || progressNum > 100) {
      setErrorMessage('Task progress must be between 0% and 100%.');
      return;
    }

    if (formData.startDate && formData.dueDate) {
      const start = new Date(formData.startDate);
      const due = new Date(formData.dueDate);
      if (due < start) {
        setErrorMessage('Due date cannot be earlier than start date.');
        return;
      }
    }

    const payload = {
      projectId: formData.projectId,
      title: formData.title.trim(),
      description: formData.description ? formData.description.trim() : '',
      assignedTo: formData.assignedTo ? formData.assignedTo.trim() : '',
      priority: formData.priority || 'Medium',
      status: formData.status || 'Not Started',
      startDate: formData.startDate || undefined,
      dueDate: formData.dueDate,
      progress: progressNum,
    };

    try {
      setIsSubmitting(true);
      const res = await createTask(payload);

      if (res && res.success && res.data) {
        if (onAddTask) {
          onAddTask(res.data);
        }
        onNavigate('tasks');
      } else {
        setErrorMessage(res.message || 'Failed to create task.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      let message = 'Failed to create task in MongoDB.';
      if (err.errors && Array.isArray(err.errors)) {
        message = err.errors.join(' • ');
      } else if (err.message) {
        message = err.message;
      }
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('tasks.formTitle')}</h1>
          <p>{t('tasks.formSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('tasks')}
            disabled={isSubmitting}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger-text)',
            marginBottom: '20px',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group full-width">
              <label className="form-label">{t('tasks.taskTitle')} *</label>
              <input
                type="text"
                name="title"
                className="form-control"
                placeholder="e.g. Electrical Conduit Rough-In Lvl 12"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('navigation.projects')} *</label>
              <select
                name="projectId"
                className="form-control"
                value={formData.projectId}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              >
                {availableProjects.length === 0 ? (
                  <option value="">Loading projects...</option>
                ) : (
                  availableProjects.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.assignee')}</label>
              <input
                type="text"
                name="assignedTo"
                className="form-control"
                placeholder="e.g. Apex MEP Contractors / Robert K."
                value={formData.assignedTo}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.priority')}</label>
              <select
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
                disabled={isSubmitting}
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
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
                disabled={isSubmitting}
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
                name="progress"
                className="form-control"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.startDate')}</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.dueDate')} *</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">{t('tasks.description')}</label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Detail technical requirements, signoff authorities, inspection gates..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('tasks')}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : t('tasks.createTaskBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
