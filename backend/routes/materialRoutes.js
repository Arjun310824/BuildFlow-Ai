import { Router } from 'express';
import { materialController } from '../controllers/materialController.js';
import {
  validateMaterialId,
  validateCreateMaterial,
  validateUpdateMaterial,
} from '../middleware/validate.js';

const router = Router();

// Routes for /api/materials
router
  .route('/')
  .get(materialController.getMaterials)
  .post(validateCreateMaterial, materialController.createMaterial);

// Routes for /api/materials/:id
router
  .route('/:id')
  .get(validateMaterialId, materialController.getMaterialById)
  .put(validateMaterialId, validateUpdateMaterial, materialController.updateMaterial)
  .delete(validateMaterialId, materialController.deleteMaterial);

export default router;
