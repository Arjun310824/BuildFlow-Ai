import React, { useState } from 'react';
import { StatCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/Badge';
import {
  IconSearch,
  IconPlus,
  IconMaterials,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from '../components/common/Icons';

export const Materials = ({
  materials = [],
  projects = [],
  onAddMaterial,
  onReorder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New material modal state
  const [modalData, setModalData] = useState({
    material: '',
    project: projects[0]?.name || 'Residential Tower A',
    required: '',
    available: '',
    supplier: 'Apex Ready-Mix & Materials',
  });

  const lowStockCount = materials.filter((m) => m.status === 'LOW STOCK').length;
  const outOfStockCount = materials.filter((m) => m.status === 'OUT OF STOCK').length;

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesProject = projectFilter === 'All' || m.project === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreateMaterial = (e) => {
    e.preventDefault();
    if (!modalData.material.trim()) return;

    const newMat = {
      id: `MAT-${Date.now().toString().slice(-4)}`,
      material: modalData.material,
      project: modalData.project,
      required: modalData.required || '100 units',
      available: modalData.available || '100 units',
      used: '0 units',
      supplier: modalData.supplier,
      status: Number(modalData.available) === 0 ? 'OUT OF STOCK' : 'In Stock',
      unitCost: '$50 / unit',
      totalValue: '$5,000',
    };

    onAddMaterial(newMat);
    setIsAddModalOpen(false);
    setModalData({
      material: '',
      project: projects[0]?.name || 'Residential Tower A',
      required: '',
      available: '',
      supplier: 'Apex Ready-Mix & Materials',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Material Inventory</h1>
          <p>Real-time site material stockpiles, procurement thresholds, and shortage warnings.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>Add Material</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid-4">
        <StatCard
          label="Total Materials"
          value={materials.length}
          subtext="Catalogued inventory items"
          icon={<IconMaterials size={18} />}
        />
        <StatCard
          label="Low Stock"
          value={lowStockCount}
          subtext="Stockpile below 25% quota"
          icon={<IconAlertTriangle size={18} color="var(--color-warning)" />}
          trendType="negative"
        />
        <StatCard
          label="Out of Stock"
          value={outOfStockCount}
          subtext="Immediate restock critical"
          icon={<IconAlertTriangle size={18} color="var(--color-danger)" />}
          trendType="negative"
        />
        <StatCard
          label="Total Inventory Value"
          value="$330,608"
          subtext="Committed material assets"
          trendType="neutral"
        />
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search Material or Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="LOW STOCK">Low Stock</option>
            <option value="OUT OF STOCK">Out of Stock</option>
          </select>

          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <strong>{filteredMaterials.length}</strong> items
        </div>
      </div>

      {/* Materials Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Project</th>
              <th>Required</th>
              <th>Available</th>
              <th>Used</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((m) => {
              const isLow = m.status === 'LOW STOCK';
              const isOut = m.status === 'OUT OF STOCK';

              return (
                <tr key={m.id}>
                  <td>
                    <div className="table-cell-title">{m.material}</div>
                    <div className="table-cell-sub">{m.category || m.id}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{m.project}</span>
                  </td>
                  <td>{m.required}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: isOut
                            ? 'var(--color-danger)'
                            : isLow
                            ? 'var(--color-warning-text)'
                            : 'var(--text-main)',
                        }}
                      >
                        {m.available}
                      </span>
                    </div>
                  </td>
                  <td>{m.used}</td>
                  <td>{m.supplier}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    {(isLow || isOut) && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onReorder && onReorder(m)}
                      >
                        Reorder
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Add New Material Stock</div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <IconX />
              </button>
            </div>
            <form onSubmit={handleCreateMaterial} className="modal-body">
              <div className="form-group">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ready-Mix Concrete C40"
                  value={modalData.material}
                  onChange={(e) => setModalData({ ...modalData, material: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allocated Project</label>
                <select
                  className="form-control"
                  value={modalData.project}
                  onChange={(e) => setModalData({ ...modalData, project: e.target.value })}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Required Quantity</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 500 bags"
                    value={modalData.required}
                    onChange={(e) => setModalData({ ...modalData, required: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Available Stock</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 80 bags"
                    value={modalData.available}
                    onChange={(e) => setModalData({ ...modalData, available: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Primary Supplier</label>
                <input
                  type="text"
                  className="form-control"
                  value={modalData.supplier}
                  onChange={(e) => setModalData({ ...modalData, supplier: e.target.value })}
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
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
