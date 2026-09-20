import React, { useState } from 'react';

export const AddProject = ({ onAddProject, onNavigate }) => {
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
      alert('Please fill in required fields: Project Name and Project Code');
      return;
    }

    const newProject = {
      id: `PRJ-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      code: formData.code,
      location: formData.location || 'Downtown Sector, City Center',
      client: formData.client || 'Apex Developments',
      manager: formData.manager || 'Alex Morgan',
      startDate: formData.startDate || '2026-10-01',
      expectedCompletion: formData.expectedCompletion || '2027-12-31',
      budget: formData.budget.startsWith('$') ? formData.budget : `$${formData.budget || '10,000,000'}`,
      budgetNum: Number(formData.budget.replace(/[^0-9.-]+/g, '')) || 10000000,
      spent: '$0',
      spentNum: 0,
      progress: 0,
      status: 'On Track',
      healthScore: 95,
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
          <h1>Add Project</h1>
          <p>Create a new construction project and set baseline parameters.</p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onNavigate('projects')}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
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
              <label className="form-label">Project Code *</label>
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
              <label className="form-label">Location</label>
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
              <label className="form-label">Client</label>
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
              <label className="form-label">Project Manager</label>
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
              <label className="form-label">Asset Category</label>
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
              <label className="form-label">Expected Completion</label>
              <input
                type="date"
                name="expectedCompletion"
                className="form-control"
                value={formData.expectedCompletion}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Budget ($ USD)</label>
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
              <label className="form-label">Description</label>
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
