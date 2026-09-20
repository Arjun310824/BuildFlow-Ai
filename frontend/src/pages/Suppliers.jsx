import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
          <h1>{t('suppliers.title')}</h1>
          <p>{t('suppliers.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('suppliers.addSupplier')}</span>
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
              placeholder={t('suppliers.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {t('common.showingOf', { count: filteredSuppliers.length, total: suppliers.length })}
        </div>
      </div>

      {/* Supplier Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('suppliers.supplierName')}</th>
              <th>{t('suppliers.materialsSupplied')}</th>
              <th>{t('suppliers.contactPerson')}</th>
              <th>{t('suppliers.activeProjects')}</th>
              <th>{t('suppliers.deliveryStatus')}</th>
              <th>{t('suppliers.rating')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredSuppliers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="table-cell-title">{s.name}</div>
                    <div className="table-cell-sub">{s.id}</div>
                  </td>
                  <td>{s.materials}</td>
                  <td>
                    <div>{s.contact}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{s.email}</div>
                  </td>
                  <td>{s.projects}</td>
                  <td>
                    <span className="badge badge-on-track">{s.deliveryStatus}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--color-warning-text)' }}>★ {s.rating}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('suppliers.formTitle')}</h2>
                <p className="modal-subtitle">{t('suppliers.formSubtitle')}</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">{t('suppliers.supplierName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Cement & ReadyMix"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('suppliers.materialsSupplied')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Concrete, Cement Bags"
                    value={newSupplier.materials}
                    onChange={(e) => setNewSupplier({ ...newSupplier, materials: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('suppliers.contactPerson')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. David Ross"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contact: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('suppliers.email')}</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. contact@acmecement.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('suppliers.activeProjects')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Residential Tower A"
                    value={newSupplier.projects}
                    onChange={(e) => setNewSupplier({ ...newSupplier, projects: e.target.value })}
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
                  {t('suppliers.addSupplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
