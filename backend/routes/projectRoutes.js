import { Router } from 'express';
import { projectController } from '../controllers/projectController.js';
import { financialController } from '../controllers/financialController.js';
import { protectFinancialAccess } from '../middleware/financialAuth.js';
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

// Project Financial Security sub-routes (/api/projects/:projectId/financials)
router.post('/:projectId/financials/unlock', financialController.unlockFinancials);
router.post('/:projectId/financials/lock', financialController.lockFinancials);

router.get('/:projectId/financials', protectFinancialAccess, financialController.getProjectFinancials);
router.get('/:projectId/financials/summary', protectFinancialAccess, financialController.getProjectFinancialSummary);
router.get('/:projectId/financials/expenses', protectFinancialAccess, financialController.getExpensesOnly);
router.get('/:projectId/financials/revenue', protectFinancialAccess, financialController.getRevenueOnly);

router.post('/:projectId/financials/transactions', protectFinancialAccess, financialController.createTransaction);
router.post('/:projectId/financials/expense', protectFinancialAccess, financialController.createExpense);
router.post('/:projectId/financials/revenue', protectFinancialAccess, financialController.createRevenue);

router.put('/:projectId/financials/transactions/:txId', protectFinancialAccess, financialController.updateTransaction);
router.delete('/:projectId/financials/transactions/:txId', protectFinancialAccess, financialController.deleteTransaction);

router.get('/:projectId/financials/report-pdf', protectFinancialAccess, financialController.getFinancialPdfReport);

// Routes for /api/projects/:id
router
  .route('/:id')
  .get(validateObjectId, projectController.getProjectById)
  .put(validateObjectId, validateUpdateProject, projectController.updateProject)
  .delete(validateObjectId, projectController.deleteProject);

export default router;
