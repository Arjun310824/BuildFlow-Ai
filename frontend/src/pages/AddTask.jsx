import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const AddTask = ({ projects = [], onAddTask, onNavigate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    project: projects[0]?.name || 'Residential Tower A',
    projectId: projects[0]?.id || 'PRJ-101',
    description: '',
    assignedTo: '',
    priority: 'Medium',
    startDate: '',
    dueDate: '',
    progress: 0,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'project') {
      const selectedPrj = projects.find((p) => p.name === value);
      setFormData((prev) => ({
        ...prev,
        project: value,
        projectId: selectedPrj ? selectedPrj.id : '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(t('tasks.titleRequired'));
      return;
    }

    const newTask = {
      id: `TSK-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      project: formData.project,
      projectId: formData.projectId,
      description: formData.description || 'General construction site work order.',
      assignedTo: formData.assignedTo || 'Unassigned Subcontractor',
      priority: formData.priority,
      startDate: formData.startDate || '2026-09-21',
      dueDate: formData.dueDate || '2026-10-05',
      progress: Number(formData.progress) || 0,
      status: Number(formData.progress) === 100 ? 'Completed' : 'Pending',
    };

    onAddTask(newTask);
    onNavigate('tasks');
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
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group full-width">
              <label className="form-label">{t('tasks.taskTitle')} *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Electrical Conduit Rough-In Lvl 12"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('navigation.projects')} *</label>
              <select
                name="project"
                className="form-control"
                value={formData.project}
                onChange={handleChange}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
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
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.priority')}</label>
              <select
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">{t('status.low')}</option>
                <option value="Medium">{t('status.medium')}</option>
                <option value="High">{t('status.high')}</option>
                <option value="Critical">{t('status.critical')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.progress')}</label>
              <input
                type="number"
                name="progress"
                className="form-control"
                min="0"
                max="100"
                value={formData.progress}
                onChange={handleChange}
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
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('tasks.dueDate')}</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
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
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigate('tasks')}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('tasks.createTaskBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
