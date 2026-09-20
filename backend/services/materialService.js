import Material, { computeMaterialStatus } from '../models/Material.js';

/**
 * Service to handle business logic and database queries for Material resources
 */
export const materialService = {
  /**
   * Retrieve all materials with optional filtering by projectId, category, status, and search
   * @param {Object} query - Query parameters (projectId, category, status, search)
   * @returns {Promise<Array>} List of materials
   */
  async getAllMaterials(query = {}) {
    const filter = {};

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
   * Find a single material by its MongoDB ObjectId
   * @param {string} id - Material ID
   * @returns {Promise<Object|null>} Found material or null
   */
  async getMaterialById(id) {
    return await Material.findById(id).populate('projectId', 'name client location manager status');
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
   * Update an existing material record and recalculate status
   * @param {string} id - Material ID
   * @param {Object} updateData - Partial or full material updates
   * @returns {Promise<Object|null>} Updated material document
   */
  async updateMaterial(id, updateData) {
    const existingMaterial = await Material.findById(id);
    if (!existingMaterial) {
      return null;
    }

    // Merge updates onto document
    Object.assign(existingMaterial, updateData);

    // Explicitly recalculate status based on current/updated quantities
    existingMaterial.status = computeMaterialStatus(
      existingMaterial.availableQuantity,
      existingMaterial.requiredQuantity
    );

    const updatedMaterial = await existingMaterial.save();
    return await updatedMaterial.populate('projectId', 'name client location manager status');
  },

  /**
   * Remove a material record by ID
   * @param {string} id - Material ID
   * @returns {Promise<Object|null>} Deleted material or null
   */
  async deleteMaterial(id) {
    return await Material.findByIdAndDelete(id);
  },
};
