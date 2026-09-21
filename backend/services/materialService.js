import Material, { computeMaterialStatus } from '../models/Material.js';

/**
 * Service to handle business logic and database queries for Material resources
 * Enforces organization-level data isolation.
 */
export const materialService = {
  /**
   * Retrieve all materials with optional filtering by projectId, category, status, and search
   * Scoped to caller's organizationId.
   * @param {Object} query - Query parameters (projectId, category, status, search)
   * @param {string|ObjectId} [organizationId] - Organization ID
   * @returns {Promise<Array>} List of materials
   */
  async getAllMaterials(query = {}, organizationId = null) {
    const filter = {};

    if (organizationId) {
      filter.organizationId = organizationId;
    }

    // Filter by project if provided (GET /api/materials?projectId=...)
    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    if (query.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { category: searchRegex },
        { unit: searchRegex },
      ];
    }

    return await Material.find(filter)
      .populate('projectId', 'name client location manager status')
      .sort({ createdAt: -1 });
  },

  /**
   * Find a single material by its MongoDB ObjectId within authorized organization
   * @param {string} id - Material ID
   * @param {string|ObjectId} [organizationId] - Organization ID
   * @returns {Promise<Object|null>} Found material or null
   */
  async getMaterialById(id, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return await Material.findOne(query).populate('projectId', 'name client location manager status');
  },

  /**
   * Create and persist a new material record
   * @param {Object} materialData - Material payload
   * @returns {Promise<Object>} Created material document
   */
  async createMaterial(materialData) {
    const material = new Material(materialData);
    const savedMaterial = await material.save();
    return await savedMaterial.populate('projectId', 'name client location manager status');
  },

  /**
   * Update an existing material record and recalculate status within authorized organization
   * @param {string} id - Material ID
   * @param {Object} updateData - Partial or full material updates
   * @param {string|ObjectId} [organizationId] - Organization ID
   * @returns {Promise<Object|null>} Updated material document
   */
  async updateMaterial(id, updateData, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }

    const existingMaterial = await Material.findOne(query);
    if (!existingMaterial) {
      return null;
    }

    const safeUpdates = { ...updateData };
    delete safeUpdates.organizationId;

    // Merge updates onto document
    Object.assign(existingMaterial, safeUpdates);

    // Explicitly recalculate status based on current/updated quantities
    existingMaterial.status = computeMaterialStatus(
      existingMaterial.availableQuantity,
      existingMaterial.requiredQuantity
    );

    const updatedMaterial = await existingMaterial.save();
    return await updatedMaterial.populate('projectId', 'name client location manager status');
  },

  /**
   * Remove a material record by ID within authorized organization
   * @param {string} id - Material ID
   * @param {string|ObjectId} [organizationId] - Organization ID
   * @returns {Promise<Object|null>} Deleted material or null
   */
  async deleteMaterial(id, organizationId = null) {
    const query = { _id: id };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return await Material.findOneAndDelete(query);
  },
};
