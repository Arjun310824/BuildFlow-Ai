import { Router } from 'express';
import { getProjectAnalysis, analyzeProject } from '../controllers/aiController.js';

const router = Router();

/**
 * @route   GET /api/ai/project/:projectId (or /project/:projectId when mounted on /api/ai)
 * @desc    Fetch project, task, and material data and return structured Gemini AI insights
 * @access  Public
 */
router.get('/project/:projectId', getProjectAnalysis);
router.get('/api/ai/project/:projectId', getProjectAnalysis);

/**
 * @route   POST /api/ai/analyze (or /analyze when mounted on /api/ai)
 * @desc    Direct payload AI project analysis
 * @access  Public
 */
router.post('/analyze', analyzeProject);

export default router;
