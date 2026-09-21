import { projectService } from '../services/projectService.js';

/**
 * Controller handling HTTP requests for Project endpoints
 * Enforces organization isolation and IDOR protection.
 */
export const projectController = {
  /**
   * @route   GET /api/projects
   * @desc    Retrieve all construction projects for caller's organization
   * @access  Private (JWT protected)
   */
  async getProjects(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const { status, risk, search } = req.query;
      const projects = await projectService.getAllProjects(
        { status, risk, search },
        organizationId
      );

      res.status(200).json({
        success: true,
        count: projects.length,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/projects/:id
   * @desc    Retrieve a single project by ID (IDOR protected by organization)
   * @access  Private (JWT protected)
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const project = await projectService.getProjectById(id, organizationId);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: `Project with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/projects
   * @desc    Create a new construction project scoped to caller's organization
   * @access  Private (JWT protected)
   */
  async createProject(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Organization membership required to create projects.',
        });
      }

      const { name, client, location, manager, startDate, endDate, progress, status, risk } = req.body;

      const projectData = {
        name: name.trim(),
        client: client.trim(),
        location: location.trim(),
        manager: manager.trim(),
        startDate,
        endDate,
        progress: progress !== undefined && progress !== '' ? Number(progress) : 0,
        status: status || 'Planning',
        risk: risk || 'Low',
        // Server-side assignment only - ignore client payload
        organizationId,
      };

      const newProject = await projectService.createProject(projectData);

      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data: newProject,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PUT /api/projects/:id
   * @desc    Update an existing construction project (IDOR protected)
   * @access  Private (JWT protected)
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      const updatePayload = { ...req.body };

      // Trim string inputs if present
      if (updatePayload.name) updatePayload.name = updatePayload.name.trim();
      if (updatePayload.client) updatePayload.client = updatePayload.client.trim();
      if (updatePayload.location) updatePayload.location = updatePayload.location.trim();
      if (updatePayload.manager) updatePayload.manager = updatePayload.manager.trim();
      if (updatePayload.progress !== undefined && updatePayload.progress !== '') {
        updatePayload.progress = Number(updatePayload.progress);
      }

      const updatedProject = await projectService.updateProject(id, updatePayload, organizationId);

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: `Project with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Project updated successfully',
        data: updatedProject,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/projects/:id
   * @desc    Delete a construction project by ID (IDOR protected)
   * @access  Private (JWT protected)
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const deletedProject = await projectService.deleteProject(id, organizationId);

      if (!deletedProject) {
        return res.status(404).json({
          success: false,
          message: `Project with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Project deleted successfully',
        data: {
          id: deletedProject._id,
          name: deletedProject.name,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
