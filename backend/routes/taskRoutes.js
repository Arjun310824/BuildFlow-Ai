import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import {
  validateTaskId,
  validateCreateTask,
  validateUpdateTask,
} from '../middleware/validate.js';

const router = Router();

// Routes for /api/tasks
router
  .route('/')
  .get(taskController.getTasks)
  .post(validateCreateTask, taskController.createTask);

// Routes for /api/tasks/:id
router
  .route('/:id')
  .get(validateTaskId, taskController.getTaskById)
  .put(validateTaskId, validateUpdateTask, taskController.updateTask)
  .delete(validateTaskId, taskController.deleteTask);

export default router;
