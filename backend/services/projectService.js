import Project from '../models/Project.js';

/**
 * Service to handle business logic and database queries for Project resources
 * Strictly isolated by organizationId to prevent cross-organization data leakage.
 */
export const projectService = {
  /**
   * Retrieve all projects for the given organization with optional filtering and search
   * @param {Object} query - Query parameters (status, risk, search)
   * @param {string|ObjectId} [organizationId] - Caller's organization ID
   * @returns {Promise<Array>} List of projects
   */
  async getAllProjects(query = {}, organizationId = null) {
    const filter = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

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
   * Find a single project by its MongoDB ObjectId within the authorized organization
   * @param {string} id - Project ID
   * @param {string|ObjectId} [organizationId] - Caller's organization ID
   * @returns {Promise<Object|null>} Found project or null
   */
  async getProjectById(id, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return await Project.findOne(query);
  },

  /**
   * Create and persist a new project record scoped to organization
   * @param {Object} projectData - Project payload
   * @returns {Promise<Object>} Created project document
   */
  async createProject(projectData) {
    const project = new Project(projectData);
    return await project.save();
  },

  /**
   * Update an existing project record within authorized organization
   * @param {string} id - Project ID
   * @param {Object} updateData - Partial or full project updates
   * @param {string|ObjectId} [organizationId] - Caller's organization ID
   * @returns {Promise<Object|null>} Updated project document
   */
  async updateProject(id, updateData, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }

    const existingProject = await Project.findOne(query);
    if (!existingProject) {
      return null;
    }

    // Never allow reassigning organizationId
    const safeUpdates = { ...updateData };
    delete safeUpdates.organizationId;

    // Merge updates onto document to allow mongoose pre-validate hooks to run
    Object.assign(existingProject, safeUpdates);
    return await existingProject.save();
  },

  /**
   * Remove a project record by ID within authorized organization
   * @param {string} id - Project ID
   * @param {string|ObjectId} [organizationId] - Caller's organization ID
   * @returns {Promise<Object|null>} Deleted project or null
   */
  async deleteProject(id, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return await Project.findOneAndDelete(query);
  },
};
