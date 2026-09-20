import mongoose from 'mongoose';
import { materialService } from '../services/materialService.js';
import Project from '../models/Project.js';

/**
 * Controller handling HTTP requests for Material endpoints
 */
export const materialController = {
  /**
   * @route   GET /api/materials
   * @desc    Retrieve all materials (supports ?projectId=... filter)
   * @access  Public
   */
  async getMaterials(req, res, next) {
    try {
      const { projectId, category, status, search } = req.query;

      // Validate projectId format if passed as query parameter
      if (projectId && !mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid projectId query parameter: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
        });
      }

      const materials = await materialService.getAllMaterials({ projectId, category, status, search });

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
   * @desc    Retrieve a single material by its ID
   * @access  Public
   */
  async getMaterialById(req, res, next) {
    try {
      const { id } = req.params;
      const material = await materialService.getMaterialById(id);

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
   * @desc    Create a new material record
   * @access  Public
   */
  async createMaterial(req, res, next) {
    try {
      const { projectId, name, category, requiredQuantity, availableQuantity, usedQuantity, unit } = req.body;

      // Requirement 4: Verify that projectId exists in the Project collection
      const projectExists = await Project.findById(projectId);
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: `Project with ID "${projectId}" not found`,
        });
      }

      const materialData = {
        projectId,
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
   * @desc    Update an existing material record (recalculates status)
   * @access  Public
   */
  async updateMaterial(req, res, next) {
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

      const updatedMaterial = await materialService.updateMaterial(id, updatePayload);

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
   * @desc    Delete a material by ID
   * @access  Public
   */
  async deleteMaterial(req, res, next) {
    try {
      const { id } = req.params;
      const deletedMaterial = await materialService.deleteMaterial(id);

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
