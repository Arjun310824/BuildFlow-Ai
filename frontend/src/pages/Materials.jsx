import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import {
  IconSearch,
  IconPlus,
  IconMaterials,
  IconAlertTriangle,
  IconX,
  IconSparkles,
} from '../components/common/Icons';

/**
 * Materials: Material Intelligence & Inventory Health Management.
 * Concept: Material Data → Inventory Health → Project Impact → Recommended Action.
 */
export const Materials = ({
  materials = [],
  projects = [],
  onAddMaterial,
  onReorder,
  onNavigate,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const firstProject = projects[0] || {};

  // New material modal state
  const [modalData, setModalData] = useState({
    material: '',
    projectId: firstProject._id || firstProject.id || '',
    category: 'Concrete & Masonry',
    required: '',
    available: '',
    unit: 'Bags',
    supplier: 'Apex Ready-Mix & Materials',
  });

  // Sync default project if projects loaded asynchronously
  React.useEffect(() => {
    if (projects.length > 0 && !modalData.projectId) {
      setModalData((prev) => ({
        ...prev,
        projectId: projects[0]._id || projects[0].id,
      }));
    }
  }, [projects, modalData.projectId]);

  // Helper to extract project name safely
  const getMaterialProjectName = (mat) => {
    if (mat.projectId && typeof mat.projectId === 'object' && mat.projectId.name) {
      return mat.projectId.name;
    }
    if (mat.project) {
      return mat.project;
    }
    const matched = projects.find(
      (p) => (p._id || p.id) === (mat.projectId?._id || mat.projectId)
    );
    return matched ? matched.name : 'General Project';
  };

  const lowStockCount = materials.filter(
    (m) => m.status?.toUpperCase() === 'LOW STOCK' || m.status === 'Low Stock'
  ).length;
  const outOfStockCount = materials.filter(
    (m) => m.status?.toUpperCase() === 'OUT OF STOCK' || m.status === 'Out of Stock'
  ).length;

  const filteredMaterials = materials.filter((m) => {
    const matName = m.name || m.material || '';
    const matId = (m._id || m.id || '').toString();
    const matSupplier = m.supplier || m.category || '';
    const matProject = getMaterialProjectName(m);
    const matProjectId = (m.projectId?._id || m.projectId || '').toString();

    const matchesSearch =
      matName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matSupplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      m.status === statusFilter ||
      (statusFilter === 'In Stock' && (m.status === 'Available' || m.status === 'In Stock')) ||
      (statusFilter === 'LOW STOCK' && (m.status === 'Low Stock' || m.status === 'LOW STOCK')) ||
      (statusFilter === 'OUT OF STOCK' && (m.status === 'Out of Stock' || m.status === 'OUT OF STOCK'));

    const matchesProject =
      projectFilter === 'All' ||
      matProject === projectFilter ||
      matProjectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  const handleCreateMaterial = (e) => {
    e.preventDefault();
    if (!modalData.material.trim()) return;

    const reqQty = parseFloat(modalData.required) || 100;
    const availQty = parseFloat(modalData.available) || 0;
    const selectedPrj =
      projects.find((p) => (p._id || p.id) === modalData.projectId) ||
      projects[0] ||
      {};
    const targetProjectId = modalData.projectId || selectedPrj._id || selectedPrj.id || '';

    const newMat = {
      name: modalData.material.trim(),
      material: modalData.material.trim(),
      projectId: targetProjectId,
      project: selectedPrj.name || 'General Project',
      category: modalData.category || 'General',
      requiredQuantity: reqQty,
      availableQuantity: availQty,
      usedQuantity: 0,
      unit: modalData.unit.trim() || 'units',
      supplier: modalData.supplier.trim() || 'Apex Materials',
      required: `${reqQty} ${modalData.unit.trim() || 'units'}`,
      available: `${availQty} ${modalData.unit.trim() || 'units'}`,
      used: `0 ${modalData.unit.trim() || 'units'}`,
    };

    onAddMaterial(newMat);
    setIsAddModalOpen(false);
    setModalData({
      material: '',
      projectId: projects[0]?._id || projects[0]?.id || '',
      category: 'Concrete & Masonry',
      required: '',
      available: '',
      unit: 'Bags',
      supplier: 'Apex Ready-Mix & Materials',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              SUPPLY CHAIN & MATERIAL INTELLIGENCE
            </span>
          </div>
          <h1>{t('materials.title', 'Material Intelligence')}</h1>
          <p>Inventory health telemetry, AI consumption impact analysis, and procurement forecasting</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode((prev) => (prev === 'cards' ? 'table' : 'cards'))}
          >
            {viewMode === 'cards' ? 'Table View' : 'Inventory Health Cards'}
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('materials.addMaterial', 'Log Material')}</span>
          </button>
        </div>
      </div>

      {/* Top Inventory Health Pulse Cards */}
      <div className="stats-grid-4">
        <div className="stat-card">
          <div className="stat-label">
            <span>Total Catalogued</span>
            <IconMaterials size={18} color="var(--accent-cyan)" />
          </div>
          <div className="stat-value">{materials.length}</div>
          <div className="stat-subtext">Active procurement SKUs</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Low Stock Alert</span>
            <IconAlertTriangle size={18} color="#F59E0B" />
          </div>
          <div className="stat-value" style={{ color: lowStockCount > 0 ? '#FBBF24' : '#FFFFFF' }}>
            {lowStockCount}
          </div>
          <div className="stat-subtext">Below 25% safety reserve</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Critical Stockout</span>
            <IconAlertTriangle size={18} color="#EF4444" />
          </div>
          <div className="stat-value" style={{ color: outOfStockCount > 0 ? '#F87171' : '#FFFFFF' }}>
            {outOfStockCount}
          </div>
          <div className="stat-subtext">Immediate delivery required</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <span>Inventory Health</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>AI RATED</span>
          </div>
          <div className="stat-value" style={{ color: 'var(--accent-cyan)' }}>
            {materials.length > 0 ? Math.max(20, Math.round(100 - (lowStockCount + outOfStockCount * 2) * 15)) : 85}%
          </div>
          <div className="stat-subtext">Portfolio buffer index</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('materials.searchPlaceholder', 'Search materials, categories...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">{t('materials.allStatuses', 'All Statuses')}</option>
            <option value="Available">Available / In Stock</option>
            <option value="LOW STOCK">{t('status.lowStock', 'Low Stock')}</option>
            <option value="OUT OF STOCK">{t('status.outOfStock', 'Out of Stock')}</option>
          </select>

          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allProjects', 'All Projects')}</option>
            {projects.map((p) => (
              <option key={p._id || p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredMaterials.length, total: materials.length })}
        </div>
      </div>

      {/* Mode 1: Inventory Health Cards View (Signature Feature) */}
      {viewMode === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredMaterials.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>No material inventory records found.</p>
            </div>
          ) : (
            filteredMaterials.map((mat) => {
              const reqQty = typeof mat.requiredQuantity === 'number' ? mat.requiredQuantity : (parseFloat(mat.required) || 100);
              const availQty = typeof mat.availableQuantity === 'number' ? mat.availableQuantity : (parseFloat(mat.available) || 0);
              const usedQty = typeof mat.usedQuantity === 'number' ? mat.usedQuantity : (parseFloat(mat.used) || 0);
              const unitStr = mat.unit || 'units';

              const healthPct = reqQty > 0 ? Math.min(100, Math.round((availQty / reqQty) * 100)) : 0;
              const isWarning = ['LOW STOCK', 'OUT OF STOCK', 'Low Stock', 'Out of Stock'].includes(mat.status) || healthPct < 30;

              return (
                <div
                  key={mat._id || mat.id}
                  className="card card-hoverable"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    borderColor: isWarning ? 'rgba(245, 158, 11, 0.3)' : 'var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>
                        {mat.name || mat.material}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {mat.category || 'General'} • {getMaterialProjectName(mat)}
                      </span>
                    </div>
                    <StatusBadge status={mat.status} />
                  </div>

                  {/* Quantity Matrix */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      padding: '12px',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Required
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'var(--font-mono)' }}>
                        {reqQty.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unitStr}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Available
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: isWarning ? '#FBBF24' : '#34D399', fontFamily: 'var(--font-mono)' }}>
                        {availQty.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unitStr}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Used
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                        {usedQty.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{unitStr}</div>
                    </div>
                  </div>

                  {/* Inventory Health Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Inventory Health</span>
                      <span style={{ fontWeight: 700, color: isWarning ? '#FBBF24' : '#34D399', fontFamily: 'var(--font-mono)' }}>
                        {healthPct}%
                      </span>
                    </div>
                    <ProgressBar
                      progress={healthPct}
                      showLabel={false}
                      height={6}
                    />
                  </div>

                  {/* AI Impact Banner */}
                  {isWarning ? (
                    <div
                      style={{
                        padding: '10px 12px',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FBBF24', fontWeight: 700, marginBottom: '2px' }}>
                        <IconSparkles size={14} />
                        <span>AI IMPACT ASSESSMENT</span>
                      </div>
                      <p style={{ color: '#E2E8F0', fontSize: '0.78rem', margin: 0 }}>
                        Current stockpile variance may affect upcoming structural milestone schedule.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.76rem',
                        color: '#34D399',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>✓ Buffer meets safety threshold for next shift cycle.</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                      marginTop: 'auto',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Supplier: <strong>{mat.supplier || 'Apex Materials'}</strong>
                    </span>

                    {isWarning && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        onClick={() => onReorder && onReorder(mat)}
                      >
                        Reorder Stock &rarr;
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Mode 2: Table View */
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('materials.materialName', 'Material & Category')}</th>
                <th>{t('navigation.projects', 'Project')}</th>
                <th>Required</th>
                <th>Available</th>
                <th>Used</th>
                <th>Inventory Health</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((mat) => {
                const reqQty = typeof mat.requiredQuantity === 'number' ? mat.requiredQuantity : (parseFloat(mat.required) || 100);
                const availQty = typeof mat.availableQuantity === 'number' ? mat.availableQuantity : (parseFloat(mat.available) || 0);
                const healthPct = reqQty > 0 ? Math.min(100, Math.round((availQty / reqQty) * 100)) : 0;

                return (
                  <tr key={mat._id || mat.id}>
                    <td>
                      <div className="table-cell-title">{mat.name || mat.material}</div>
                      <div className="table-cell-sub">{mat.category || 'General'}</div>
                    </td>
                    <td>{getMaterialProjectName(mat)}</td>
                    <td>{reqQty.toLocaleString()} {mat.unit || ''}</td>
                    <td style={{ fontWeight: 600 }}>{availQty.toLocaleString()} {mat.unit || ''}</td>
                    <td>{(typeof mat.usedQuantity === 'number' ? mat.usedQuantity : 0).toLocaleString()} {mat.unit || ''}</td>
                    <td style={{ width: '140px' }}>
                      <ProgressBar progress={healthPct} height={6} />
                    </td>
                    <td>
                      <StatusBadge status={mat.status} />
                    </td>
                    <td>
                      {['LOW STOCK', 'OUT OF STOCK', 'Low Stock', 'Out of Stock'].includes(mat.status) ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#EF4444', borderColor: '#EF4444' }}
                          onClick={() => onReorder && onReorder(mat)}
                        >
                          Reorder
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('materials.formTitle', 'Log Material Inventory')}</h2>
                <p className="modal-subtitle">Add construction supplies linked to live project tracking</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateMaterial} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    {t('materials.materialName', 'Material Name')} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Structural Grade 500 Rebar, Portland Cement"
                    value={modalData.material}
                    onChange={(e) => setModalData({ ...modalData, material: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('materials.selectProject', 'Project')} <span className="req-star">*</span>
                  </label>
                  <select
                    className="form-select"
                    value={modalData.projectId}
                    onChange={(e) => setModalData({ ...modalData, projectId: e.target.value })}
                  >
                    {projects.map((p) => (
                      <option key={p._id || p.id} value={p._id || p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={modalData.category}
                    onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                  >
                    <option value="Concrete & Masonry">Concrete & Masonry</option>
                    <option value="Metals & Rebar">Metals & Rebar</option>
                    <option value="Finishes & Glazing">Finishes & Glazing</option>
                    <option value="MEP & Piping">MEP & Piping</option>
                    <option value="Electrical">Electrical</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Required Quantity <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="e.g. 1800"
                    value={modalData.required}
                    onChange={(e) => setModalData({ ...modalData, required: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available In Stock</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 420"
                    value={modalData.available}
                    onChange={(e) => setModalData({ ...modalData, available: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bags, Tons, Sq.m, Spools"
                    value={modalData.unit}
                    onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Vendor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Apex Ready-Mix & Materials"
                    value={modalData.supplier}
                    onChange={(e) => setModalData({ ...modalData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
