import { Router } from 'express';
import aiRoutes from './aiRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BuildFlow AI API is running',
    timestamp: new Date().toISOString(),
  });
});

// AI & Analytics module routes
router.use('/ai', aiRoutes);

export default router;
