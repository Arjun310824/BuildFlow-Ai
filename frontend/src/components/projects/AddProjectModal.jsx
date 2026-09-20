import React, { useState } from 'react';
import { IconX } from '../common/Icons';

export const AddProjectModal = ({ isOpen, onClose, onAddProject }) => {
  const initialFormState = {
    name: '',
    clientName: '',
    location: '',
    projectManager: '',
    startDate: '',
    expectedEndDate: '',
    status: 'Planning',
    progress: 0,
    riskLevel: 'Low',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) errs.name = 'Project name is required';
    if (!formData.clientName.trim()) errs.clientName = 'Client name is required';
    if (!formData.location.trim()) errs.location = 'Site location is required';
    if (!formData.projectManager.trim()) errs.projectManager = 'Project manager is required';
    if (!formData.startDate) errs.startDate = 'Start date is required';
    if (!formData.expectedEndDate) errs.expectedEndDate = 'Expected end date is required';

    if (formData.progress === '' || formData.progress === undefined || formData.progress === null) {
      errs.progress = 'Progress is required (0 - 100%)';
    } else {
      const progressNum = Number(formData.progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        errs.progress = 'Progress must be between 0 and 100%';
      }
    }

    if (formData.startDate && formData.expectedEndDate) {
      if (new Date(formData.expectedEndDate) < new Date(formData.startDate)) {
        errs.expectedEndDate = 'Expected end date cannot be earlier than start date';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'progress' ? (value === '' ? '' : Number(value)) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newProject = {
      id: `PRJ-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      name: formData.name.trim(),
      clientName: formData.clientName.trim(),
      location: formData.location.trim(),
      projectManager: formData.projectManager.trim(),
      startDate: formData.startDate,
      expectedEndDate: formData.expectedEndDate,
      progress: Number(formData.progress),
      status: formData.status,
      riskLevel: formData.riskLevel,
    };

    onAddProject(newProject);
    setFormData(initialFormState);
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Construction Project</h2>
            <p className="modal-subtitle">Initialize a new project site record in BuildFlow AI</p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <IconX size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="form-grid">
            {/* Project Name */}
            <div className="form-group full-width">
              <label htmlFor="projectName" className="form-label">
                Project Name <span className="req-star">*</span>
              </label>
              <input
                id="projectName"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Apex Logistics Distribution Hub"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Client Name */}
            <div className="form-group">
              <label htmlFor="clientName" className="form-label">
                Client / Owner Name <span className="req-star">*</span>
              </label>
              <input
                id="clientName"
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g. Horizon Living Group"
                className={`form-input ${errors.clientName ? 'input-error' : ''}`}
              />
              {errors.clientName && <span className="error-message">{errors.clientName}</span>}
            </div>

            {/* Project Manager */}
            <div className="form-group">
              <label htmlFor="projectManager" className="form-label">
                Project Manager <span className="req-star">*</span>
              </label>
              <input
                id="projectManager"
                type="text"
                name="projectManager"
                value={formData.projectManager}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                className={`form-input ${errors.projectManager ? 'input-error' : ''}`}
              />
              {errors.projectManager && <span className="error-message">{errors.projectManager}</span>}
            </div>

            {/* Location */}
            <div className="form-group full-width">
              <label htmlFor="location" className="form-label">
                Site Location <span className="req-star">*</span>
              </label>
              <input
                id="location"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. North Bay District, Sector 4"
                className={`form-input ${errors.location ? 'input-error' : ''}`}
              />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start Date <span className="req-star">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`form-input ${errors.startDate ? 'input-error' : ''}`}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            {/* Expected End Date */}
            <div className="form-group">
              <label htmlFor="expectedEndDate" className="form-label">
                Expected End Date <span className="req-star">*</span>
              </label>
              <input
                id="expectedEndDate"
                type="date"
                name="expectedEndDate"
                value={formData.expectedEndDate}
                onChange={handleChange}
                className={`form-input ${errors.expectedEndDate ? 'input-error' : ''}`}
              />
              {errors.expectedEndDate && (
                <span className="error-message">{errors.expectedEndDate}</span>
              )}
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Project Status <span className="req-star">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Planning">Planning</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Risk Level */}
            <div className="form-group">
              <label htmlFor="riskLevel" className="form-label">
                Risk Level <span className="req-star">*</span>
              </label>
              <select
                id="riskLevel"
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            {/* Progress % */}
            <div className="form-group full-width">
              <label htmlFor="progress" className="form-label">
                Initial Progress (%): <strong>{formData.progress || 0}%</strong>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input
                  id="progress"
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress || 0}
                  onChange={handleChange}
                  className="form-range"
                />
                <input
                  type="number"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={handleChange}
                  className={`form-input ${errors.progress ? 'input-error' : ''}`}
                  style={{ width: '80px', textAlign: 'center' }}
                />
              </div>
              {errors.progress && <span className="error-message">{errors.progress}</span>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
