import express from 'express';
import { financialController } from '../controllers/financialController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

// Account-level Financial Security settings
router.get('/status', protect, financialController.getFinancialStatus);
router.post('/setup-password', protect, financialController.setupFinancialPassword);
router.post('/change-password', protect, financialController.changeFinancialPassword);

// Direct transaction routes (/api/financials/:transactionId)
router.put('/:transactionId', protect, financialController.directUpdateTransaction);
router.delete('/:transactionId', protect, financialController.directDeleteTransaction);

export default router;
