import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { IconX } from '../common/Icons';

export const AddProjectModal = ({
  isOpen,
  onClose,
  onAddProject,
  onSubmitProject,
  projectToEdit = null,
}) => {
  const { t } = useTranslation();
  const isEdit = Boolean(projectToEdit);

  const getInitialState = (prj) => {
    if (!prj) {
      return {
        name: '',
        client: '',
        location: '',
        manager: '',
        startDate: '',
        endDate: '',
        status: 'Planning',
        progress: 0,
        risk: 'Low',
      };
    }

    const formatDateVal = (dateVal) => {
      if (!dateVal) return '';
      try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
      } catch (e) {
        return '';
      }
    };

    return {
      name: prj.name || '',
      client: prj.client || prj.clientName || '',
      location: prj.location || '',
      manager: prj.manager || prj.projectManager || '',
      startDate: formatDateVal(prj.startDate),
      endDate: formatDateVal(prj.endDate || prj.expectedEndDate || prj.expectedCompletion),
      status: prj.status || 'Planning',
      progress: prj.progress !== undefined && prj.progress !== null ? Number(prj.progress) : 0,
      risk: prj.risk || prj.riskLevel || 'Low',
    };
  };

  const [formData, setFormData] = useState(() => getInitialState(projectToEdit));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState(projectToEdit));
      setErrors({});
      setServerError('');
      setIsSubmitting(false);
    }
  }, [isOpen, projectToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};

    if (!formData.name.trim()) errs.name = t('projects.nameRequired') || 'Project name is required';
    if (!formData.client.trim()) errs.client = t('projects.clientRequired') || 'Client name is required';
    if (!formData.location.trim()) errs.location = t('projects.locationRequired') || 'Site location is required';
    if (!formData.manager.trim()) errs.manager = t('projects.managerRequired') || 'Project manager is required';
    if (!formData.startDate) errs.startDate = t('projects.startDateRequired') || 'Start date is required';
    if (!formData.endDate) errs.endDate = t('projects.endDateRequired') || 'Expected end date is required';

    if (formData.progress === '' || formData.progress === undefined || formData.progress === null) {
      errs.progress = t('projects.progressError') || 'Progress must be between 0 and 100%';
    } else {
      const progressNum = Number(formData.progress);
      if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
        errs.progress = t('projects.progressError') || 'Progress must be between 0 and 100%';
      }
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end < start) {
        errs.endDate = t('projects.dateOrderError') || 'Expected end date cannot be earlier than start date';
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
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name: formData.name.trim(),
      client: formData.client.trim(),
      location: formData.location.trim(),
      manager: formData.manager.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      progress: Number(formData.progress) || 0,
      status: formData.status,
      risk: formData.risk,
    };

    setIsSubmitting(true);
    setServerError('');

    try {
      const saveHandler = onSubmitProject || onAddProject;
      if (saveHandler) {
        await saveHandler(payload, isEdit, projectToEdit?._id || projectToEdit?.id);
      }
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      setServerError(err.message || 'Failed to save project. Please check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">
              {isEdit ? 'Edit Construction Project' : t('projects.formTitle')}
            </h2>
            <p className="modal-subtitle">
              {isEdit
                ? 'Update project details, milestones, and status'
                : t('projects.formSubtitle')}
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <IconX size={20} />
          </button>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div
            style={{
              margin: '16px 28px 0',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-danger, #ef4444)',
              borderRadius: '8px',
              color: 'var(--status-danger, #ef4444)',
              fontSize: '0.84rem',
            }}
          >
            <strong>Error:</strong> {serverError}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          <div className="form-grid">
            {/* Project Name */}
            <div className="form-group full-width">
              <label htmlFor="modalProjectName" className="form-label">
                {t('projects.projectName')} <span className="req-star">*</span>
              </label>
              <input
                id="modalProjectName"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Apex Logistics Distribution Hub"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            {/* Client Name */}
            <div className="form-group">
              <label htmlFor="modalClient" className="form-label">
                {t('projects.clientName')} <span className="req-star">*</span>
              </label>
              <input
                id="modalClient"
                type="text"
                name="client"
                value={formData.client}
                onChange={handleChange}
                placeholder="e.g. Horizon Living Group"
                className={`form-input ${errors.client ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>

            {/* Project Manager */}
            <div className="form-group">
              <label htmlFor="modalManager" className="form-label">
                {t('projects.projectManager')} <span className="req-star">*</span>
              </label>
              <input
                id="modalManager"
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                placeholder="e.g. Sarah Jenkins"
                className={`form-input ${errors.manager ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.manager && <span className="error-message">{errors.manager}</span>}
            </div>

            {/* Site Location */}
            <div className="form-group full-width">
              <label htmlFor="modalLocation" className="form-label">
                {t('projects.siteLocation')} <span className="req-star">*</span>
              </label>
              <input
                id="modalLocation"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. North Bay District, Sector 4"
                className={`form-input ${errors.location ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.location && <span className="error-message">{errors.location}</span>}
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label htmlFor="modalStartDate" className="form-label">
                {t('projects.startDate')} <span className="req-star">*</span>
              </label>
              <input
                id="modalStartDate"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.startDate && <span className="error-message">{errors.startDate}</span>}
            </div>

            {/* Expected End Date */}
            <div className="form-group">
              <label htmlFor="modalEndDate" className="form-label">
                {t('projects.expectedEndDate')} <span className="req-star">*</span>
              </label>
              <input
                id="modalEndDate"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.endDate && <span className="error-message">{errors.endDate}</span>}
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="modalStatus" className="form-label">
                {t('common.status')} <span className="req-star">*</span>
              </label>
              <select
                id="modalStatus"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="Planning">{t('status.planning') || 'Planning'}</option>
                <option value="In Progress">{t('status.inProgress') || 'In Progress'}</option>
                <option value="On Hold">{t('status.onHold') || 'On Hold'}</option>
                <option value="Completed">{t('status.completed') || 'Completed'}</option>
              </select>
            </div>

            {/* Risk Level */}
            <div className="form-group">
              <label htmlFor="modalRisk" className="form-label">
                {t('projects.riskLevel')} <span className="req-star">*</span>
              </label>
              <select
                id="modalRisk"
                name="risk"
                value={formData.risk}
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="Low">{t('status.low') || 'Low'} {t('projects.riskLevel') || 'Risk'}</option>
                <option value="Medium">{t('status.medium') || 'Medium'} {t('projects.riskLevel') || 'Risk'}</option>
                <option value="High">{t('status.high') || 'High'} {t('projects.riskLevel') || 'Risk'}</option>
              </select>
            </div>

            {/* Progress % */}
            <div className="form-group full-width">
              <label htmlFor="modalProgress" className="form-label">
                {t('projects.progressLabel') || 'Progress'} <strong>{formData.progress || 0}%</strong>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <input
                  id="modalProgress"
                  type="range"
                  name="progress"
                  min="0"
                  max="100"
                  value={formData.progress || 0}
                  onChange={handleChange}
                  className="form-range"
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
              {errors.progress && <span className="error-message">{errors.progress}</span>}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Saving...'
                : isEdit
                ? 'Save Changes'
                : t('projects.createProjectBtn') || 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddProjectModal;
