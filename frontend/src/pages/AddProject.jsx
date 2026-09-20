import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const AddProject = ({ onAddProject, onNavigate }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location: '',
    client: '',
    manager: 'Alex Morgan',
    startDate: '',
    expectedCompletion: '',
    budget: '',
    description: '',
    category: 'Commercial High-Rise',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      alert(`${t('projects.nameRequired')} & Code`);
      return;
    }

    const newProject = {
      name: formData.name.trim(),
      client: (formData.client || 'Apex Developments').trim(),
      location: (formData.location || 'Downtown Sector, City Center').trim(),
      manager: (formData.manager || 'Alex Morgan').trim(),
      startDate: formData.startDate || '2026-10-01',
      endDate: formData.expectedCompletion || '2027-12-31',
      expectedCompletion: formData.expectedCompletion || '2027-12-31',
      progress: 0,
      status: 'Planning',
      risk: 'Low',
      category: formData.category,
      description: formData.description || 'New strategic construction development initiative.',
    };

    onAddProject(newProject);
    onNavigate('projects');
  };

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('projects.formTitle')}</h1>
          <p>{t('projects.formSubtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('projects')}
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">{t('projects.projectName')} *</label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Residential Tower A"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('projects.projectCode')} *</label>
              <input
                type="text"
                name="code"
                className="form-control"
                placeholder="e.g. RTA-01"
                value={formData.code}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.location')}</label>
              <input
                type="text"
                name="location"
                className="form-control"
                placeholder="e.g. Downtown Metro, Sector 4"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('projects.clientName')}</label>
              <input
                type="text"
                name="client"
                className="form-control"
                placeholder="e.g. Aura Living Developments"
                value={formData.client}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('projects.projectManager')}</label>
              <input
                type="text"
                name="manager"
                className="form-control"
                placeholder="e.g. Alex Morgan"
                value={formData.manager}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('materials.category')}</label>
              <select
                name="category"
                className="form-control"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Residential High-Rise">Residential High-Rise</option>
                <option value="Commercial High-Rise">Commercial High-Rise</option>
                <option value="Industrial Logistics">Industrial Logistics</option>
                <option value="Healthcare Facility">Healthcare Facility</option>
                <option value="Institutional / Civic">Institutional / Civic</option>
                <option value="Civil Infrastructure">Civil Infrastructure</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('projects.startDate')}</label>
              <input
                type="date"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('projects.expectedEndDate')}</label>
              <input
                type="date"
                name="expectedCompletion"
                className="form-control"
                value={formData.expectedCompletion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">{t('projects.budget')} ($ USD)</label>
              <input
                type="text"
                name="budget"
                className="form-control"
                placeholder="e.g. $18,400,000"
                value={formData.budget}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">{t('tasks.description')}</label>
              <textarea
                name="description"
                className="form-control"
                placeholder="Scope of works, structural highlights, target milestones..."
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
              onClick={() => onNavigate('projects')}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              {t('projects.createProjectBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
