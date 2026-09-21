import mongoose from 'mongoose';
import SiteUpdate from '../models/SiteUpdate.js';
import Project from '../models/Project.js';

export const siteUpdateController = {
  /**
   * @route   GET /api/site-updates
   * @desc    Get all site updates for caller's organization
   * @access  Private (JWT protected)
   */
  async getSiteUpdates(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const { projectId } = req.query;
      const filter = { organizationId };

      if (projectId && projectId !== 'All') {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ success: false, message: 'Invalid projectId query parameter.' });
        }
        const proj = await Project.findOne({ _id: projectId, organizationId });
        if (!proj) {
          return res.status(404).json({ success: false, message: 'Project not found or access denied.' });
        }
        filter.projectId = projectId;
      }

      const updates = await SiteUpdate.find(filter).sort({ date: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        count: updates.length,
        data: updates,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/site-updates
   * @desc    Create a new site update log scoped to caller's organization
   * @access  Private (JWT protected)
   */
  async createSiteUpdate(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(403).json({ success: false, message: 'Organization membership required.' });
      }

      const {
        projectId,
        project,
        date,
        shift,
        workers,
        milestoneProgress,
        progress,
        supervisor,
        workSummary,
        workCompleted,
        issues,
        weather,
        tags,
        image,
        photos,
      } = req.body;

      const summaryText = (workCompleted || workSummary || '').trim();

      if (!projectId || !supervisor || !summaryText) {
        return res.status(400).json({
          success: false,
          message: 'projectId, supervisor, and workSummary/workCompleted are required.',
        });
      }

      const proj = await Project.findOne({ _id: projectId, organizationId });
      if (!proj) {
        return res.status(404).json({
          success: false,
          message: 'Project not found or access denied.',
        });
      }

      const progVal = progress !== undefined ? Number(progress) : (milestoneProgress !== undefined ? Number(milestoneProgress) : 0);

      const newUpdate = await SiteUpdate.create({
        organizationId,
        projectId,
        project: project || proj.name,
        date: date ? new Date(date) : new Date(),
        shift: shift || 'Day Shift',
        workers: workers !== undefined ? Number(workers) : 0,
        milestoneProgress: progVal,
        progress: progVal,
        supervisor: supervisor.trim(),
        workSummary: summaryText,
        workCompleted: summaryText,
        issues: issues ? issues.trim() : 'None reported',
        weather: weather || 'Clear',
        tags: Array.isArray(tags) ? tags : [],
        image: image || '',
        photos: Array.isArray(photos) ? photos : [],
      });

      res.status(201).json({
        success: true,
        message: 'Site update recorded successfully.',
        data: newUpdate,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/site-updates/:id
   * @desc    Delete a site update (IDOR protected)
   * @access  Private (JWT protected)
   */
  async deleteSiteUpdate(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID format.' });
      }

      const deleted = await SiteUpdate.findOneAndDelete({ _id: id, organizationId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Site update not found or access denied.' });
      }

      res.status(200).json({
        success: true,
        message: 'Site update deleted successfully.',
        data: { id: deleted._id },
      });
    } catch (error) {
      next(error);
    }
  },
};
