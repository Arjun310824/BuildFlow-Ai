import React, { useState } from 'react';
import { StatusBadge } from '../components/common/Badge';
import {
  IconSearch,
  IconPlus,
  IconSuppliers,
  IconX,
} from '../components/common/Icons';

export const Suppliers = ({
  suppliers = [],
  onAddSupplier,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    materials: '',
    contact: '',
    email: '',
    projects: '',
    deliveryStatus: 'On Time (95%)',
    rating: 4.5,
  });

  const filteredSuppliers = suppliers.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.materials.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.projects.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newSupplier.name.trim()) return;

    onAddSupplier({
      id: `SUP-${Date.now().toString().slice(-4)}`,
      ...newSupplier,
      rating: Number(newSupplier.rating) || 4.5,
      status: 'Active',
    });

    setIsAddModalOpen(false);
    setNewSupplier({
      name: '',
      materials: '',
      contact: '',
      email: '',
      projects: '',
      deliveryStatus: 'On Time (95%)',
      rating: 4.5,
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Suppliers</h1>
          <p>Manage verified material vendors, trade subcontractors, and logistical delivery SLAs.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search Supplier, Material, Project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Total Suppliers: <strong>{filteredSuppliers.length}</strong>
        </div>
      </div>

      {/* Supplier Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Materials</th>
              <th>Contact</th>
              <th>Active Projects</th>
              <th>Delivery Status</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.map((sup) => {
              const isDelayed = sup.deliveryStatus.toLowerCase().includes('delayed');

              return (
                <tr key={sup.id}>
                  <td>
                    <div className="table-cell-title">{sup.name}</div>
                    <div className="table-cell-sub">{sup.email}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                      {sup.materials}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {sup.contact}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                      {sup.projects}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${isDelayed ? 'badge-delayed' : 'badge-on-track'}`}
                    >
                      {sup.deliveryStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <span style={{ color: 'var(--color-warning)' }}>★</span>
                      <span>{sup.rating.toFixed(1)}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 400 }}>
                        / 5.0
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Register New Vendor / Supplier</div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <IconX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Supplier Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Vulcan Steel Industries"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supplied Materials</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Grade 60 Rebar, Structural W-Beams"
                  value={newSupplier.materials}
                  onChange={(e) => setNewSupplier({ ...newSupplier, materials: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Contact Person & Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Brenda Wu • (555) 345-6789"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="orders@supplier.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Projects</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Residential Tower A, Warehouse Project"
                  value={newSupplier.projects}
                  onChange={(e) => setNewSupplier({ ...newSupplier, projects: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
