import mongoose from 'mongoose';
import { taskService } from '../services/taskService.js';
import Project from '../models/Project.js';

/**
 * Controller handling HTTP requests for Task endpoints
 */
export const taskController = {
  /**
   * @route   GET /api/tasks
   * @desc    Retrieve all tasks (supports ?projectId=... filter)
   * @access  Public
   */
  async getTasks(req, res, next) {
    try {
      const { projectId, status, priority, search } = req.query;

      // Validate projectId format if passed as query parameter
      if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid projectId query parameter: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
        });
      }

      const tasks = await taskService.getAllTasks({ projectId, status, priority, search });

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
   * @desc    Retrieve a single task by its ID
   * @access  Public
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const task = await taskService.getTaskById(id);

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
   * @desc    Create a new construction task
   * @access  Public
   */
  async createTask(req, res, next) {
    try {
      const { projectId, title, description, assignedTo, startDate, dueDate, status, progress, priority } = req.body;

      // Requirement 5: Verify that the projectId exists in the Project collection
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: `Project with ID "${projectId}" not found`,
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
   * @desc    Update an existing task
   * @access  Public
   */
  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const updatePayload = { ...req.body };

      // If projectId is being changed, verify new project exists
      if (updatePayload.projectId) {
        const projectExists = await Project.findById(updatePayload.projectId);
        if (!projectExists) {
          return res.status(404).json({
            success: false,
            message: `Project with ID "${updatePayload.projectId}" not found`,
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

      const updatedTask = await taskService.updateTask(id, updatePayload);

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
   * @desc    Delete a task by ID
   * @access  Public
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const deletedTask = await taskService.deleteTask(id);

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
