import { Router } from 'express';
import {
  handleAnalyzeProject,
  handleProjectChat,
  handleGetAiProjects,
  getProjectAnalysis,
  analyzeProject,
} from '../controllers/aiController.js';

const router = Router();

// Real MongoDB Data Analytics Endpoints
router.post('/analyze-project', handleAnalyzeProject);
router.post('/chat', handleProjectChat);
router.get('/projects', handleGetAiProjects);

// Project AI Insights Endpoints
router.get('/project/:projectId', getProjectAnalysis);
router.get('/api/ai/project/:projectId', getProjectAnalysis);
router.post('/analyze', analyzeProject);

export default router;
