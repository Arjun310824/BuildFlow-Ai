import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
