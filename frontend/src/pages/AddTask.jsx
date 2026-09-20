import React, { useState } from 'react';

export const AddTask = ({ projects = [], onAddTask, onNavigate }) => {
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
      alert('Task name is required.');
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
          <h1>Add Task</h1>
          <p>Assign new site tasks, milestones, and contractor work orders.</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('tasks')}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group full-width">
              <label className="form-label">Task Name *</label>
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
              <label className="form-label">Project *</label>
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
              <label className="form-label">Assigned To</label>
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
              <label className="form-label">Priority</label>
              <select
                name="priority"
                className="form-control"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Initial Progress (%)</label>
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
              <label className="form-label">Start Date</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                name="dueDate"
                className="form-control"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Description & Work Specs</label>
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
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
