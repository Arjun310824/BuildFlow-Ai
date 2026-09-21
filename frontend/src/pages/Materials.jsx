import React, { useState, useEffect, useCallback } from 'react';
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
  IconEdit,
  IconTrash,
  IconRefresh,
} from '../components/common/Icons';
import {
  getMaterialsApi,
  createMaterialApi,
  updateMaterialApi,
  deleteMaterialApi,
} from '../services/api';

/**
 * Materials: Material Intelligence & Inventory Health Management.
 * Concept: Real Material Telemetry → Inventory Health → Project Impact → CRUD operations.
 */
export const Materials = ({
  materials: initialMaterialsProp = [],
  projects = [],
  onAddMaterial,
  onReorder,
  onNavigate,
}) => {
  const { t } = useTranslation();

  // Internal reactive state populated from MongoDB backend
  const [materials, setMaterials] = useState(initialMaterialsProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  const firstProject = projects[0] || {};

  // New material modal state
  const [modalData, setModalData] = useState({
    material: '',
    projectId: firstProject._id || firstProject.id || '',
    category: 'Concrete & Masonry',
    required: '',
    available: '',
    unit: 'Bags',
  });

  // Fetch materials directly from MongoDB backend
  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMaterialsApi();
      if (res && res.success && Array.isArray(res.data)) {
        setMaterials(res.data);
      } else {
        setMaterials([]);
      }
    } catch (err) {
      console.error('Error fetching materials from MongoDB:', err);
      setError(err.message || 'Failed to load materials from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  // Sync default project if projects loaded asynchronously
  useEffect(() => {
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
    (m) => m.status === 'Low Stock' || m.status?.toUpperCase() === 'LOW STOCK'
  ).length;
  const outOfStockCount = materials.filter(
    (m) => m.status === 'Out of Stock' || m.status?.toUpperCase() === 'OUT OF STOCK'
  ).length;

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matName = m.name || m.material || '';
    const matId = (m._id || m.id || '').toString();
    const matCat = m.category || '';
    const matProject = getMaterialProjectName(m);
    const matProjectId = (m.projectId?._id || m.projectId || '').toString();

    const matchesSearch =
      matName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matCat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      m.status === statusFilter ||
      (statusFilter === 'Available' && (m.status === 'Available' || m.status === 'In Stock')) ||
      (statusFilter === 'Low Stock' && (m.status === 'Low Stock' || m.status === 'LOW STOCK')) ||
      (statusFilter === 'Out of Stock' && (m.status === 'Out of Stock' || m.status === 'OUT OF STOCK'));

    const matchesProject =
      projectFilter === 'All' ||
      matProject === projectFilter ||
      matProjectId === projectFilter;

    return matchesSearch && matchesStatus && matchesProject;
  });

  // Action: Create Material
  const handleCreateMaterial = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!modalData.material.trim()) {
      setModalError('Material name is required.');
      return;
    }

    if (!modalData.projectId) {
      setModalError('Please select a valid project.');
      return;
    }

    const reqQty = parseFloat(modalData.required);
    const availQty = parseFloat(modalData.available);

    if (isNaN(reqQty) || reqQty < 0) {
      setModalError('Required quantity must be a non-negative number.');
      return;
    }

    if (isNaN(availQty) || availQty < 0) {
      setModalError('Available quantity must be a non-negative number.');
      return;
    }

    if (!modalData.unit.trim()) {
      setModalError('Unit of measurement is required.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        projectId: modalData.projectId,
        name: modalData.material.trim(),
        category: modalData.category || 'General',
        requiredQuantity: reqQty,
        availableQuantity: availQty,
        usedQuantity: 0,
        unit: modalData.unit.trim(),
      };

      const res = await createMaterialApi(payload);
      if (res && res.success && res.data) {
        setIsAddModalOpen(false);
        setModalData({
          material: '',
          projectId: projects[0]?._id || projects[0]?.id || '',
          category: 'Concrete & Masonry',
          required: '',
          available: '',
          unit: 'Bags',
        });
        await fetchMaterials();
        if (onAddMaterial) {
          onAddMaterial(res.data);
        }
      }
    } catch (err) {
      console.error('Error creating material:', err);
      setModalError(err.message || 'Failed to create material in database.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Open Edit Material Modal
  const handleOpenEdit = (mat) => {
    setModalError(null);
    setEditingMaterial({
      _id: mat._id || mat.id,
      name: mat.name || mat.material || '',
      category: mat.category || 'General',
      requiredQuantity: typeof mat.requiredQuantity === 'number' ? mat.requiredQuantity : (parseFloat(mat.required) || 0),
      availableQuantity: typeof mat.availableQuantity === 'number' ? mat.availableQuantity : (parseFloat(mat.available) || 0),
      usedQuantity: typeof mat.usedQuantity === 'number' ? mat.usedQuantity : (parseFloat(mat.used) || 0),
      unit: mat.unit || 'units',
    });
  };

  // Action: Save Edit Material
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    setModalError(null);

    const reqQty = Number(editingMaterial.requiredQuantity);
    const availQty = Number(editingMaterial.availableQuantity);
    const usedQty = Number(editingMaterial.usedQuantity);

    if (isNaN(reqQty) || reqQty < 0) {
      setModalError('Required quantity must be a non-negative number.');
      return;
    }
    if (isNaN(availQty) || availQty < 0) {
      setModalError('Available quantity must be a non-negative number.');
      return;
    }

    try {
      setActionLoading(true);
      const updatePayload = {
        name: editingMaterial.name.trim(),
        category: editingMaterial.category,
        requiredQuantity: reqQty,
        availableQuantity: availQty,
        usedQuantity: isNaN(usedQty) ? 0 : usedQty,
        unit: editingMaterial.unit.trim(),
      };

      await updateMaterialApi(editingMaterial._id, updatePayload);
      setEditingMaterial(null);
      await fetchMaterials();
    } catch (err) {
      console.error('Error updating material:', err);
      setModalError(err.message || 'Failed to update material.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Confirm Delete Material
  const handleConfirmDelete = async () => {
    if (!deletingMaterial) return;
    setModalError(null);

    try {
      setActionLoading(true);
      await deleteMaterialApi(deletingMaterial._id || deletingMaterial.id);
      setDeletingMaterial(null);
      await fetchMaterials();
    } catch (err) {
      console.error('Error deleting material:', err);
      setModalError(err.message || 'Failed to delete material.');
    } finally {
      setActionLoading(false);
    }
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
            className="btn btn-secondary btn-icon-only"
            onClick={fetchMaterials}
            title="Refresh from MongoDB"
            disabled={loading}
          >
            <IconRefresh size={16} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setViewMode((prev) => (prev === 'cards' ? 'table' : 'cards'))}
          >
            {viewMode === 'cards' ? 'Table View' : 'Inventory Health Cards'}
          </button>
          <button className="btn btn-primary" onClick={() => { setModalError(null); setIsAddModalOpen(true); }}>
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
          <div className="stat-subtext">Below 20% safety reserve</div>
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
            {materials.length > 0 ? Math.max(10, Math.round(100 - (lowStockCount * 15 + outOfStockCount * 30))) : 100}%
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
            <option value="Available">Available</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
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

      {/* Error Message */}
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '8px', color: '#B91C1C', fontSize: '0.86rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid #E2E8F0', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '10px' }} />
          <p>Loading material inventory from MongoDB...</p>
        </div>
      )}

      {/* Mode 1: Inventory Health Cards View */}
      {!loading && viewMode === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredMaterials.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 24px' }}>
              <IconMaterials size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                No materials found for this project.
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                Log new construction materials linked to live MongoDB project tracking.
              </p>
            </div>
          ) : (
            filteredMaterials.map((mat) => {
              const reqQty = Number(mat.requiredQuantity) || 0;
              const availQty = Number(mat.availableQuantity) || 0;
              const usedQty = Number(mat.usedQuantity) || 0;
              const unitStr = mat.unit || 'units';

              const healthPct = reqQty > 0 ? Math.min(100, Math.round((availQty / reqQty) * 100)) : 0;
              const isWarning = ['LOW STOCK', 'OUT OF STOCK', 'Low Stock', 'Out of Stock'].includes(mat.status) || healthPct < 25;

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

                  {/* AI Impact Assessment */}
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

                  {/* Card Footer Actions */}
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenEdit(mat)}
                        title="Edit Material"
                      >
                        <IconEdit size={14} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        onClick={() => setDeletingMaterial(mat)}
                        title="Delete Material"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>

                    {isWarning && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#F59E0B', borderColor: 'rgba(245, 158, 11, 0.4)' }}
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
      )}

      {/* Mode 2: Table View */}
      {!loading && viewMode === 'table' && (
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
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No materials found for this project.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((mat) => {
                  const reqQty = Number(mat.requiredQuantity) || 0;
                  const availQty = Number(mat.availableQuantity) || 0;
                  const usedQty = Number(mat.usedQuantity) || 0;
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
                      <td>{usedQty.toLocaleString()} {mat.unit || ''}</td>
                      <td style={{ width: '140px' }}>
                        <ProgressBar progress={healthPct} height={6} />
                      </td>
                      <td>
                        <StatusBadge status={mat.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm btn-icon-only"
                            onClick={() => handleOpenEdit(mat)}
                            title="Edit"
                          >
                            <IconEdit size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm btn-icon-only"
                            style={{ color: '#EF4444' }}
                            onClick={() => setDeletingMaterial(mat)}
                            title="Delete"
                          >
                            <IconTrash size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Log Material Modal */}
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

            {modalError && (
              <div style={{ margin: '0 24px 16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.84rem' }}>
                ⚠️ {modalError}
              </div>
            )}

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
                  <label className="form-label">{t('materials.category', 'Category')}</label>
                  <select
                    className="form-select"
                    value={modalData.category}
                    onChange={(e) => setModalData({ ...modalData, category: e.target.value })}
                  >
                    <option value="Concrete & Masonry">Concrete & Masonry</option>
                    <option value="Metals & Rebar">Metals & Rebar</option>
                    <option value="Earthwork & Aggregates">Earthwork & Aggregates</option>
                    <option value="Electrical & MEP">Electrical & MEP</option>
                    <option value="Finishes & Drywall">Finishes & Drywall</option>
                    <option value="General Supplies">General Supplies</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('materials.requiredQty', 'Required Quantity')} <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    required
                    placeholder="e.g. 5000"
                    value={modalData.required}
                    onChange={(e) => setModalData({ ...modalData, required: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('materials.availableQty', 'Available Quantity')} <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    required
                    placeholder="e.g. 3200"
                    value={modalData.available}
                    onChange={(e) => setModalData({ ...modalData, available: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {t('materials.unit', 'Unit of Measurement')} <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Bags, Tons, m³, Bundles"
                    value={modalData.unit}
                    onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={actionLoading}
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Logging Material...' : t('materials.addMaterial', 'Log Material')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Material Modal */}
      {editingMaterial && (
        <div className="modal-backdrop" onClick={() => setEditingMaterial(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Edit Material</h2>
                <p className="modal-subtitle">Update inventory quantities and telemetry in MongoDB</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setEditingMaterial(null)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ margin: '0 24px 16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.84rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Material Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editingMaterial.name}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={editingMaterial.category}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, category: e.target.value })}
                  >
                    <option value="Concrete & Masonry">Concrete & Masonry</option>
                    <option value="Metals & Rebar">Metals & Rebar</option>
                    <option value="Earthwork & Aggregates">Earthwork & Aggregates</option>
                    <option value="Electrical & MEP">Electrical & MEP</option>
                    <option value="Finishes & Drywall">Finishes & Drywall</option>
                    <option value="General Supplies">General Supplies</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editingMaterial.unit}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, unit: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Required Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    required
                    value={editingMaterial.requiredQuantity}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, requiredQuantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    required
                    value={editingMaterial.availableQuantity}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, availableQuantity: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Used Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className="form-input"
                    value={editingMaterial.usedQuantity}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, usedQuantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingMaterial(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMaterial && (
        <div className="modal-backdrop" onClick={() => setDeletingMaterial(null)}>
          <div className="modal-dialog" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title" style={{ color: '#EF4444' }}>Delete Material Record</h2>
                <p className="modal-subtitle">Confirm removal of inventory tracking item</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setDeletingMaterial(null)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ margin: '0 24px 16px', padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#B91C1C', fontSize: '0.84rem' }}>
                ⚠️ {modalError}
              </div>
            )}

            <div style={{ padding: '0 24px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Are you sure you want to delete <strong>{deletingMaterial.name || deletingMaterial.material}</strong> from MongoDB? This action cannot be undone.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingMaterial(null)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#DC2626', borderColor: '#DC2626' }}
                onClick={handleConfirmDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
