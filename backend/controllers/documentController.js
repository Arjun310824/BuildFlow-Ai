import mongoose from 'mongoose';
import Document from '../models/Document.js';
import Project from '../models/Project.js';

export const documentController = {
  /**
   * @route   GET /api/documents
   * @desc    Get all documents for caller's organization
   * @access  Private (JWT protected)
   */
  async getDocuments(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const { projectId, type, search } = req.query;
      const filter = { organizationId };

      if (projectId && projectId !== 'All') {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ success: false, message: 'Invalid projectId parameter.' });
        }
        const proj = await Project.findOne({ _id: projectId, organizationId });
        if (!proj) {
          return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
        }
        filter.projectId = projectId;
      }

      if (type && type !== 'All') {
        filter.type = type;
      }

      if (search && search.trim()) {
        filter.name = new RegExp(search.trim(), 'i');
      }

      const documents = await Document.find(filter).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: documents.length,
        data: documents,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/documents
   * @desc    Create/register a document scoped to caller's organization
   * @access  Private (JWT protected)
   */
  async createDocument(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, message: 'Organization membership required.' });
      }

      const { projectId, project, name, type, size, uploadedBy, status, fileUrl } = req.body;

      if (!projectId || !name) {
        return res.status(400).json({
          success: false,
          message: 'projectId and name are required.',
        });
      }

      const proj = await Project.findOne({ _id: projectId, organizationId });
      if (!proj) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied.',
        });
      }

      const newDoc = await Document.create({
        organizationId,
        projectId,
        project: project || proj.name,
        name: name.trim(),
        type: type || 'Contract',
        size: size || '1.5 MB',
        uploadedBy: uploadedBy || req.user.name || 'Project Manager',
        status: status || 'Approved',
        fileUrl: fileUrl || '',
      });

      res.status(201).json({
        success: true,
        message: 'Document created successfully.',
        data: newDoc,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/documents/:id
   * @desc    Delete a document (IDOR protected)
   * @access  Private (JWT protected)
   */
  async deleteDocument(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const deleted = await Document.findOneAndDelete({ _id: id, organizationId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Document not found or access denied.' });
      }

      res.status(200).json({
        success: true,
        message: 'Document deleted successfully.',
        data: { id: deleted._id },
      });
    } catch (error) {
      next(error);
    }
  },
};
