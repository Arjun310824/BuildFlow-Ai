import express from 'express';
import {
  handleAnalyzeProject,
  handleProjectChat,
  handleGetAiProjects,
} from '../controllers/aiController.js';

const router = express.Router();

// POST /api/ai/analyze-project
router.post('/analyze-project', handleAnalyzeProject);

// POST /api/ai/chat
router.post('/chat', handleProjectChat);

// GET /api/ai/projects
router.get('/projects', handleGetAiProjects);

export default router;
