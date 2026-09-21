import mongoose from 'mongoose';
import { taskService } from '../services/taskService.js';
import Project from '../models/Project.js';

/**
 * Controller handling HTTP requests for Task endpoints
 * Enforces organization isolation and IDOR protection.
 */
export const taskController = {
  /**
   * @route   GET /api/tasks
   * @desc    Retrieve all tasks for caller's organization (supports ?projectId=... filter)
   * @access  Private (JWT protected)
   */
  async getTasks(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const { projectId, status, priority, search } = req.query;

      // Validate projectId format if passed as query parameter
      if (projectId) {
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({
            success: false,
            message: `Invalid projectId query parameter: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
          });
        }

        // Verify project belongs to caller's organization
        const projectExists = await Project.findOne({ _id: projectId, organizationId });
        if (!projectExists) {
          return res.status(404).json({
            success: false,
            message: `Project with ID "${projectId}" not found or access denied.`,
          });
        }
      }

      const tasks = await taskService.getAllTasks(
        { projectId, status, priority, search },
        organizationId
      );

      res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/tasks/:id
   * @desc    Retrieve a single task by its ID within authorized organization
   * @access  Private (JWT protected)
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const task = await taskService.getTaskById(id, organizationId);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: task,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/tasks
   * @desc    Create a new construction task scoped to caller's organization & project
   * @access  Private (JWT protected)
   */
  async createTask(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Organization membership required.',
        });
      }

      const { projectId, title, description, assignedTo, startDate, dueDate, status, progress, priority } = req.body;

      // Verify that the projectId exists in the caller's organization
      const projectExists = await Project.findOne({ _id: projectId, organizationId });
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: `Project with ID "${projectId}" not found or access denied`,
        });
      }

      if (startDate && dueDate) {
        const start = new Date(startDate);
        const due = new Date(dueDate);
        if (due < start) {
          return res.status(400).json({
            success: false,
            message: 'Due date cannot be earlier than start date',
            errors: ['Due date cannot be earlier than start date'],
          });
        }
      }

      const taskData = {
        projectId,
        organizationId,
        title: title.trim(),
        description: description ? description.trim() : '',
        assignedTo: assignedTo ? assignedTo.trim() : '',
        startDate: startDate || undefined,
        dueDate,
        status: status || 'Not Started',
        progress: progress !== undefined && progress !== '' ? Number(progress) : 0,
        priority: priority || 'Medium',
      };

      const newTask = await taskService.createTask(taskData);

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: newTask,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PUT /api/tasks/:id
   * @desc    Update an existing task within authorized organization
   * @access  Private (JWT protected)
   */
  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      const updatePayload = { ...req.body };

      // If projectId is being changed, verify new project belongs to caller's organization
      if (updatePayload.projectId) {
        const projectExists = await Project.findOne({
          _id: updatePayload.projectId,
          organizationId,
        });
        if (!projectExists) {
          return res.status(404).json({
            success: false,
            message: `Project with ID "${updatePayload.projectId}" not found or access denied`,
          });
        }
      }

      if (updatePayload.startDate && updatePayload.dueDate) {
        const start = new Date(updatePayload.startDate);
        const due = new Date(updatePayload.dueDate);
        if (due < start) {
          return res.status(400).json({
            success: false,
            message: 'Due date cannot be earlier than start date',
            errors: ['Due date cannot be earlier than start date'],
          });
        }
      }

      if (updatePayload.title) updatePayload.title = updatePayload.title.trim();
      if (updatePayload.description) updatePayload.description = updatePayload.description.trim();
      if (updatePayload.assignedTo) updatePayload.assignedTo = updatePayload.assignedTo.trim();
      if (updatePayload.progress !== undefined && updatePayload.progress !== '') {
        updatePayload.progress = Number(updatePayload.progress);
      }

      const updatedTask = await taskService.updateTask(id, updatePayload, organizationId);

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/tasks/:id
   * @desc    Delete a task by ID within authorized organization
   * @access  Private (JWT protected)
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const deletedTask = await taskService.deleteTask(id, organizationId);

      if (!deletedTask) {
        return res.status(404).json({
          success: false,
          message: `Task with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
        data: {
          id: deletedTask._id,
          title: deletedTask.title,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
