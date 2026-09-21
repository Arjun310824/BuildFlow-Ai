import express from 'express';
import { businessTransactionController } from '../controllers/businessTransactionController.js';

const router = express.Router();

// Base transactions collection routes
router
  .route('/')
  .post(businessTransactionController.createTransaction.bind(businessTransactionController))
  .get(businessTransactionController.getTransactions.bind(businessTransactionController));

// Individual transaction item routes
router
  .route('/:id')
  .get(businessTransactionController.getTransactionById.bind(businessTransactionController));

// Transaction lifecycle state transition routes
router.patch(
  '/:id/view',
  businessTransactionController.markViewed.bind(businessTransactionController)
);
router.patch(
  '/:id/accept',
  businessTransactionController.acceptTransaction.bind(businessTransactionController)
);
router.patch(
  '/:id/reject',
  businessTransactionController.rejectTransaction.bind(businessTransactionController)
);
router.patch(
  '/:id/start',
  businessTransactionController.startTransaction.bind(businessTransactionController)
);
router.patch(
  '/:id/complete',
  businessTransactionController.completeTransaction.bind(businessTransactionController)
);
router.patch(
  '/:id/cancel',
  businessTransactionController.cancelTransaction.bind(businessTransactionController)
);

export default router;
