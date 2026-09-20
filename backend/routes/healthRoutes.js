import { Router } from 'express';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    System health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BuildFlow AI backend is running',
  });
});

export default router;
