import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TypeBadge, StatusBadge } from '../components/common/Badge';
import { downloadVaultDocument } from '../utils/fileDownloader';
import {
  IconSearch,
  IconPlus,
  IconDocuments,
  IconEye,
  IconDownload,
  IconTrash,
  IconX,
} from '../components/common/Icons';

export const Documents = ({
  documents = [],
  projects = [],
  onUploadDocument,
  onDeleteDocument,
  onDownloadFeedback,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [newDoc, setNewDoc] = useState({
    name: '',
    type: 'Contract',
    project: projects[0]?.name || 'Residential Tower A',
    projectId: projects[0]?.id || 'PRJ-101',
    size: '2.4 MB',
  });

  const types = ['All', 'Contract', 'Invoice', 'Drawing', 'Report', 'Certificate', 'Other'];

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'All' || doc.type === typeFilter;
    const matchesProject = projectFilter === 'All' || doc.project === projectFilter;

    return matchesSearch && matchesType && matchesProject;
  });

  const handleDownload = (doc) => {
    downloadVaultDocument(doc);
    if (onDownloadFeedback) {
      onDownloadFeedback(doc);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newDoc.name.trim()) return;

    const prj = projects.find((p) => p.name === newDoc.project) || projects[0];
    const targetProjectId = prj ? (prj._id || prj.id) : null;

    onUploadDocument({
      id: `DOC-${Date.now().toString().slice(-4)}`,
      name: newDoc.name.endsWith('.pdf') || newDoc.name.endsWith('.dwg') ? newDoc.name : `${newDoc.name}.pdf`,
      type: newDoc.type,
      project: prj ? prj.name : (newDoc.project || 'Project Document'),
      projectId: targetProjectId,
      uploadedBy: 'Project Manager',
      date: new Date().toISOString().slice(0, 10),
      size: newDoc.size || '3.5 MB',
      status: 'Approved',
    });

    setIsUploadModalOpen(false);
    setNewDoc({
      name: '',
      type: 'Contract',
      project: projects[0]?.name || '',
      projectId: projects[0]?._id || projects[0]?.id || '',
      size: '2.4 MB',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>{t('documents.title')}</h1>
          <p>{t('documents.subtitle')}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
            <IconPlus size={16} />
            <span>{t('documents.uploadDoc')}</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group-left">
          <div className="filter-input-search">
            <IconSearch size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder={t('documents.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map((tp) => (
              <option key={tp} value={tp}>
                {tp === 'All' ? t('documents.allCategories') : tp}
              </option>
            ))}
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
          {t('common.showingOf', { count: filteredDocs.length, total: documents.length })}
        </div>
      </div>

      {/* Document Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('documents.fileName')}</th>
              <th>{t('documents.category')}</th>
              <th>{t('navigation.projects')}</th>
              <th>{t('documents.uploadedBy')}</th>
              <th>{t('documents.uploadDate')}</th>
              <th>{t('documents.fileSize')}</th>
              <th style={{ textAlign: 'right' }}>{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  {t('common.noData')}
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="table-cell-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'var(--color-accent)' }}>📄</span>
                      <span>{doc.name}</span>
                    </div>
                    <div className="table-cell-sub">{doc.id}</div>
                  </td>
                  <td>
                    <TypeBadge type={doc.type} />
                  </td>
                  <td>
                    <span style={{ fontWeight: 500 }}>{doc.project}</span>
                  </td>
                  <td>{doc.uploadedBy}</td>
                  <td>{doc.date}</td>
                  <td>
                    <span style={{ color: 'var(--text-muted)' }}>{doc.size}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setPreviewDoc(doc)}
                        title={t('common.viewDetails')}
                      >
                        <IconEye size={14} />
                        <span>{t('common.viewDetails')}</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownload(doc)}
                        title={t('common.download')}
                      >
                        <IconDownload size={14} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => onDeleteDocument && onDeleteDocument(doc.id)}
                        title={t('common.delete')}
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{t('documents.formTitle')}</h2>
                <p className="modal-subtitle">{t('documents.formSubtitle')}</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsUploadModalOpen(false)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="modal-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">{t('documents.fileName')} *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Structural Rebar Layout Rev-4"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('documents.category')}</label>
                  <select
                    className="form-input"
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                  >
                    {types.filter((tp) => tp !== 'All').map((tp) => (
                      <option key={tp} value={tp}>
                        {tp}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('navigation.projects')}</label>
                  <select
                    className="form-input"
                    value={newDoc.project}
                    onChange={(e) => setNewDoc({ ...newDoc, project: e.target.value })}
                  >
                    {projects.map((p) => (
                      <option key={p._id || p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn btn-primary">
                  {t('documents.uploadDoc')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="modal-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">{previewDoc.name}</h2>
                <p className="modal-subtitle">{previewDoc.project} • {previewDoc.size}</p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setPreviewDoc(null)}
                aria-label="Close modal"
              >
                <IconX size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', margin: '16px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📄</div>
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
                {previewDoc.name}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {t('documents.uploadedBy')} {previewDoc.uploadedBy} • {previewDoc.date}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewDoc(null)}>
                {t('common.close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  handleDownload(previewDoc);
                  setPreviewDoc(null);
                }}
              >
                {t('common.download')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
