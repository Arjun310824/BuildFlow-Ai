import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StatCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/Badge';
import {
  IconSearch,
  IconPlus,
  IconMaterials,
  IconAlertTriangle,
  IconX,
} from '../components/common/Icons';

export const Materials = ({
  materials = [],
  projects = [],
  onAddMaterial,
  onReorder,
}) => {
  const { t } = useTranslation();
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

  const lowStockCount = materials.filter((m) => m.status?.toUpperCase() === 'LOW STOCK').length;
  const outOfStockCount = materials.filter((m) => m.status?.toUpperCase() === 'OUT OF STOCK').length;

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
      status: Number(modalData.available) === 0 ? 'Out of Stock' : 'In Stock',
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
          <h1>{t('materials.title')}</h1>
          <p>{t('materials.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('materials.addMaterial')}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid-4">
        <StatCard
          label={t('materials.totalMaterials')}
          value={materials.length}
          subtext="Catalogued inventory items"
          icon={<IconMaterials size={18} />}
        />
        <StatCard
          label={t('materials.lowStock')}
          value={lowStockCount}
          subtext="Stockpile below 25% quota"
          icon={<IconAlertTriangle size={18} color="var(--color-warning)" />}
          trendType="negative"
        />
        <StatCard
          label={t('materials.outOfStock')}
          value={outOfStockCount}
          subtext="Immediate restock critical"
          icon={<IconAlertTriangle size={18} color="var(--color-danger)" />}
          trendType="negative"
        />
        <StatCard
          label={t('materials.totalInventoryValue')}
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
              placeholder={t('materials.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">{t('materials.allStatuses')}</option>
            <option value="In Stock">{t('status.inStock')}</option>
            <option value="LOW STOCK">{t('status.lowStock')}</option>
            <option value="OUT OF STOCK">{t('status.outOfStock')}</option>
          </select>

          <select
            className="filter-select"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="All">{t('tasks.allProjects')}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredMaterials.length, total: materials.length })}
        </div>
      </div>

      {/* Materials Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('materials.materialName')}</th>
              <th>{t('navigation.projects')}</th>
              <th>{t('materials.requiredQty')}</th>
              <th>{t('materials.availableQty')}</th>
              <th>{t('materials.usedQty')}</th>
              <th>{t('suppliers.supplierName')}</th>
              <th>{t('materials.stockStatus')}</th>
              <th>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {t('materials.noMaterials')}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((mat) => (
                <tr key={mat.id}>
                  <td>
                    <div className="table-cell-title">{mat.material}</div>
                    <div className="table-cell-sub">{mat.id}</div>
                  </td>
                  <td>{mat.project}</td>
                  <td>{mat.required}</td>
                  <td style={{ fontWeight: 600 }}>{mat.available}</td>
                  <td>{mat.used}</td>
                  <td>{mat.supplier}</td>
                  <td>
                    <StatusBadge status={mat.status} />
                  </td>
                  <td>
                    {['LOW STOCK', 'OUT OF STOCK', 'Low Stock', 'Out of Stock'].includes(mat.status) ? (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        onClick={() => onReorder && onReorder(mat)}
                      >
                        {t('materials.reorderBtn')}
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('materials.formTitle')}</h2>
                <p className="modal-subtitle">{t('materials.formSubtitle')}</p>
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
                  <label className="form-label">{t('materials.materialName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Portland Cement Grade 53"
                    value={modalData.material}
                    onChange={(e) => setModalData({ ...modalData, material: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('navigation.projects')}</label>
                  <select
                    className="form-input"
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

                <div className="form-group">
                  <label className="form-label">{t('suppliers.supplierName')}</label>
                  <input
                    type="text"
                    className="form-input"
                    value={modalData.supplier}
                    onChange={(e) => setModalData({ ...modalData, supplier: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('materials.requiredQty')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 500 Bags"
                    value={modalData.required}
                    onChange={(e) => setModalData({ ...modalData, required: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('materials.availableQty')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 80 Bags"
                    value={modalData.available}
                    onChange={(e) => setModalData({ ...modalData, available: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('materials.createMaterialBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
