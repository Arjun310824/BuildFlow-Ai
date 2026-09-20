import React, { useState } from 'react';
import { TypeBadge, StatusBadge } from '../components/common/Badge';
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

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newDoc.name.trim()) return;

    onUploadDocument({
      id: `DOC-${Date.now().toString().slice(-4)}`,
      name: newDoc.name.endsWith('.pdf') || newDoc.name.endsWith('.dwg') ? newDoc.name : `${newDoc.name}.pdf`,
      type: newDoc.type,
      project: newDoc.project,
      projectId: newDoc.projectId,
      uploadedBy: 'Alex Morgan',
      date: '2026-09-20',
      size: newDoc.size || '3.5 MB',
      status: 'Approved',
    });

    setIsUploadModalOpen(false);
    setNewDoc({
      name: '',
      type: 'Contract',
      project: projects[0]?.name || 'Residential Tower A',
      projectId: projects[0]?.id || 'PRJ-101',
      size: '2.4 MB',
    });
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-titles">
          <h1>Documents</h1>
          <p>Centralized digital blueprint repository, contractor submittals, QA certifications, and billing records.</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={() => setIsUploadModalOpen(true)}>
            <IconPlus size={16} />
            <span>Upload Document</span>
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
              placeholder="Search documents by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Document Types' : t}
              </option>
            ))}
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
          Showing <strong>{filteredDocs.length}</strong> of {documents.length} files
        </div>
      </div>

      {/* Document Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Type</th>
              <th>Project</th>
              <th>Uploaded By</th>
              <th>Date</th>
              <th>Size</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No documents found matching the filter criteria.
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
                        title="Preview Document"
                      >
                        <IconEye size={14} />
                        <span>Preview</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onDownloadFeedback && onDownloadFeedback(doc.name)}
                        title="Download Document"
                      >
                        <IconDownload size={14} />
                      </button>
                      <button
                        className="btn btn-danger-subtle btn-sm"
                        onClick={() => onDeleteDocument && onDeleteDocument(doc.id)}
                        title="Delete Document"
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div className="modal-title">Document Inspection</div>
              <button className="modal-close-btn" onClick={() => setPreviewDoc(null)}>
                <IconX />
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '24px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '18px',
                }}
              >
                <span style={{ fontSize: '3rem' }}>📑</span>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {previewDoc.name}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <TypeBadge type={previewDoc.type} />
                  <span className="badge badge-healthy">Digitally Verified</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Associated Project:</span>
                  <strong>{previewDoc.project}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Uploaded By:</span>
                  <strong>{previewDoc.uploadedBy}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Submission Date:</span>
                  <strong>{previewDoc.date}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>File Size:</span>
                  <strong>{previewDoc.size}</strong>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreviewDoc(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onDownloadFeedback && onDownloadFeedback(previewDoc.name);
                    setPreviewDoc(null);
                  }}
                >
                  <IconDownload size={16} />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <div className="modal-title">Upload Project Document</div>
              <button className="modal-close-btn" onClick={() => setIsUploadModalOpen(false)}>
                <IconX />
              </button>
            </div>
            <form onSubmit={handleUpload} className="modal-body">
              <div className="form-group">
                <label className="form-label">Document Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Tower_A_Structural_Rebar_Inspection.pdf"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Document Category</label>
                  <select
                    className="form-control"
                    value={newDoc.type}
                    onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                  >
                    <option value="Contract">Contract</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Drawing">Drawing / Blueprint</option>
                    <option value="Report">Report</option>
                    <option value="Certificate">Certificate / Sign-Off</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Associated Project</label>
                  <select
                    className="form-control"
                    value={newDoc.project}
                    onChange={(e) => {
                      const prj = projects.find((p) => p.name === e.target.value);
                      setNewDoc({ ...newDoc, project: e.target.value, projectId: prj ? prj.id : '' });
                    }}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Drop Zone Simulation */}
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>📁</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  Drag and drop files here, or click to browse
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Supports PDF, DWG, DXF, XLSX, PNG up to 50MB
                </span>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
