import Task from '../models/Task.js';

/**
 * Service to handle business logic and database queries for Task resources
 */
export const taskService = {
  /**
   * Retrieve all tasks with optional filtering by projectId, status, priority, and search
   * @param {Object} query - Query parameters (projectId, status, priority, search)
   * @returns {Promise<Array>} List of tasks
   */
  async getAllTasks(query = {}) {
    const filter = {};

    // Filter by project if provided (GET /api/tasks?projectId=...)
    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.priority && query.priority !== 'ALL') {
      filter.priority = query.priority;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { assignedTo: searchRegex },
      ];
    }

    return await Task.find(filter)
      .populate('projectId', 'name client location manager status')
      .sort({ createdAt: -1 });
  },

  /**
   * Find a single task by its MongoDB ObjectId
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Found task or null
   */
  async getTaskById(id) {
    return await Task.findById(id).populate('projectId', 'name client location manager status');
  },

  /**
   * Create and persist a new task record
   * @param {Object} taskData - Task payload
   * @returns {Promise<Object>} Created task document
   */
  async createTask(taskData) {
    const task = new Task(taskData);
    const savedTask = await task.save();
    return await savedTask.populate('projectId', 'name client location manager status');
  },

  /**
   * Update an existing task record
   * @param {string} id - Task ID
   * @param {Object} updateData - Partial or full task updates
   * @returns {Promise<Object|null>} Updated task document
   */
  async updateTask(id, updateData) {
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return null;
    }

    // Merge updates onto document to allow mongoose pre-validate hooks to run
    Object.assign(existingTask, updateData);
    const updatedTask = await existingTask.save();
    return await updatedTask.populate('projectId', 'name client location manager status');
  },

  /**
   * Remove a task record by ID
   * @param {string} id - Task ID
   * @returns {Promise<Object|null>} Deleted task or null
   */
  async deleteTask(id) {
    return await Task.findByIdAndDelete(id);
  },
};
