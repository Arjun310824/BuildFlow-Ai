import { Router } from 'express';
import {
  handleAnalyzeProject,
  handleProjectChat,
  handleGetAiProjects,
  getProjectAnalysis,
  analyzeProject,
  handleGetProjectRisk,
  handleGetProjectBriefing,
  handleGenerateReport,
} from '../controllers/aiController.js';
import {
  getConversations,
  getConversationById,
  createConversation,
  sendMessageToConversation,
  deleteConversation,
} from '../controllers/conversationController.js';

const router = Router();

// Persistent Conversation Endpoints (Task 6 & Task 7)
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationById);
router.post('/conversations/:id/messages', sendMessageToConversation);
router.delete('/conversations/:id', deleteConversation);

// Real MongoDB Data Analytics Endpoints
router.post('/analyze-project', handleAnalyzeProject);
router.post('/chat', handleProjectChat);
router.get('/projects', handleGetAiProjects);

// Deterministic AI Risk Detection Endpoint (Task 9)
router.get('/project-risk/:projectId', handleGetProjectRisk);

// On-Demand AI Project Briefing Endpoint (Task 11)
router.get('/project-briefing/:projectId', handleGetProjectBriefing);

// AI-Powered Project Report Generation Endpoint (Task 12)
router.post('/generate-report', handleGenerateReport);

// Project AI Insights Endpoints
router.get('/project/:projectId', getProjectAnalysis);
router.post('/analyze', analyzeProject);

export default router;
