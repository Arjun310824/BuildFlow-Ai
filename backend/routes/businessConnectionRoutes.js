import express from 'express';
import { businessConnectionController } from '../controllers/businessConnectionController.js';

const router = express.Router();

router.post('/', businessConnectionController.createConnection);
router.get('/', businessConnectionController.getConnections);
router.get('/audit-logs', businessConnectionController.getAuditLogs);
router.get('/:id', businessConnectionController.getConnectionById);
router.patch('/:id/accept', businessConnectionController.acceptConnection);
router.patch('/:id/reject', businessConnectionController.rejectConnection);
router.patch('/:id/suspend', businessConnectionController.suspendConnection);
router.patch('/:id/permissions', businessConnectionController.updatePermissions);
router.delete('/:id', businessConnectionController.deleteConnection);
router.get('/:id/shared-data', businessConnectionController.getSharedData);

export default router;
