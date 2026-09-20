import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import {
  validateObjectId,
  validateCreateProject,
  validateUpdateProject,
} from '../middleware/validate.js';

const router = Router();

// Routes for /api/projects
router
  .route('/')
  .get(projectController.getProjects)
  .post(validateCreateProject, projectController.createProject);

// Routes for /api/projects/:id
router
  .route('/:id')
  .get(validateObjectId, projectController.getProjectById)
  .put(validateObjectId, validateUpdateProject, projectController.updateProject)
  .delete(validateObjectId, projectController.deleteProject);

export default router;
