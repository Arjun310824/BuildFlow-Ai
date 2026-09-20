import Project from '../models/Project.js';

/**
 * Service to handle business logic and database queries for Project resources
 */
export const projectService = {
  /**
   * Retrieve all projects with optional filtering and search
   * @param {Object} query - Query parameters (status, risk, search)
   * @returns {Promise<Array>} List of projects
   */
  async getAllProjects(query = {}) {
    const filter = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.risk && query.risk !== 'ALL') {
      filter.risk = query.risk;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { client: searchRegex },
        { location: searchRegex },
        { manager: searchRegex },
      ];
    }

    return await Project.find(filter).sort({ createdAt: -1 });
  },

  /**
   * Find a single project by its MongoDB ObjectId
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} Found project or null
   */
  async getProjectById(id) {
    return await Project.findById(id);
  },

  /**
   * Create and persist a new project record
   * @param {Object} projectData - Project payload
   * @returns {Promise<Object>} Created project document
   */
  async createProject(projectData) {
    const project = new Project(projectData);
    return await project.save();
  },

  /**
   * Update an existing project record
   * @param {string} id - Project ID
   * @param {Object} updateData - Partial or full project updates
   * @returns {Promise<Object|null>} Updated project document
   */
  async updateProject(id, updateData) {
    const existingProject = await Project.findById(id);
    if (!existingProject) {
      return null;
    }

    // Merge updates onto document to allow mongoose pre-validate hooks to run
    Object.assign(existingProject, updateData);
    return await existingProject.save();
  },

  /**
   * Remove a project record by ID
   * @param {string} id - Project ID
   * @returns {Promise<Object|null>} Deleted project or null
   */
  async deleteProject(id) {
    return await Project.findByIdAndDelete(id);
  },
};
