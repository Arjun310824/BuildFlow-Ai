import mongoose from 'mongoose';
import { materialService } from '../services/materialService.js';
import Project from '../models/Project.js';

/**
 * Controller handling HTTP requests for Material endpoints
 * Enforces organization isolation and IDOR protection.
 */
export const materialController = {
  /**
   * @route   GET /api/materials
   * @desc    Retrieve all materials for caller's organization (supports ?projectId=... filter)
   * @access  Private (JWT protected)
   */
  async getMaterials(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: [],
        });
      }

      const { projectId, category, status, search } = req.query;

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

      const materials = await materialService.getAllMaterials(
        { projectId, category, status, search },
        organizationId
      );

      res.status(200).json({
        success: true,
        count: materials.length,
        data: materials,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   GET /api/materials/:id
   * @desc    Retrieve a single material by ID within authorized organization
   * @access  Private (JWT protected)
   */
  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const material = await materialService.getMaterialById(id, organizationId);

      if (!material) {
        return res.status(404).json({
          success: false,
          message: `Material with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: material,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   POST /api/materials
   * @desc    Create a new material record scoped to caller's organization & project
   * @access  Private (JWT protected)
   */
  async createMaterial(req, res, next) {
    try {
      const organizationId = req.user?.organizationId;
      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Organization membership required.',
        });
      }

      const { projectId, name, category, requiredQuantity, availableQuantity, usedQuantity, unit } = req.body;

      // Verify that projectId exists in caller's organization
      const projectExists = await Project.findOne({ _id: projectId, organizationId });
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: `Project with ID "${projectId}" not found or access denied`,
        });
      }

      const materialData = {
        projectId,
        organizationId,
        name: name.trim(),
        category: category.trim(),
        requiredQuantity: Number(requiredQuantity),
        availableQuantity: Number(availableQuantity),
        usedQuantity: usedQuantity !== undefined && usedQuantity !== '' ? Number(usedQuantity) : 0,
        unit: unit.trim(),
      };

      const newMaterial = await materialService.createMaterial(materialData);

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: newMaterial,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   PUT /api/materials/:id
   * @desc    Update an existing material record within authorized organization
   * @access  Private (JWT protected)
   */
  async updateMaterial(req, res, next) {
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

      if (updatePayload.name) updatePayload.name = updatePayload.name.trim();
      if (updatePayload.category) updatePayload.category = updatePayload.category.trim();
      if (updatePayload.unit) updatePayload.unit = updatePayload.unit.trim();
      if (updatePayload.requiredQuantity !== undefined && updatePayload.requiredQuantity !== '') {
        updatePayload.requiredQuantity = Number(updatePayload.requiredQuantity);
      }
      if (updatePayload.availableQuantity !== undefined && updatePayload.availableQuantity !== '') {
        updatePayload.availableQuantity = Number(updatePayload.availableQuantity);
      }
      if (updatePayload.usedQuantity !== undefined && updatePayload.usedQuantity !== '') {
        updatePayload.usedQuantity = Number(updatePayload.usedQuantity);
      }

      const updatedMaterial = await materialService.updateMaterial(id, updatePayload, organizationId);

      if (!updatedMaterial) {
        return res.status(404).json({
          success: false,
          message: `Material with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Material updated successfully',
        data: updatedMaterial,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * @route   DELETE /api/materials/:id
   * @desc    Delete a material by ID within authorized organization
   * @access  Private (JWT protected)
   */
  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const organizationId = req.user?.organizationId;

      const deletedMaterial = await materialService.deleteMaterial(id, organizationId);

      if (!deletedMaterial) {
        return res.status(404).json({
          success: false,
          message: `Material with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Material deleted successfully',
        data: {
          id: deletedMaterial._id,
          name: deletedMaterial.name,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
