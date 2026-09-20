import { analyzeProject, chatWithProject } from '../services/projectAnalysisService.js';
import Project from '../models/Project.js';

/**
 * @desc   Analyze a specific construction project using real MongoDB data and Gemini AI
 * @route  POST /api/ai/analyze-project
 * @access Public
 */
export const handleAnalyzeProject = async (req, res, next) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required in request body.',
      });
    }

    const result = await analyzeProject(projectId);

    return res.status(200).json({
      success: true,
      data: result.analysis,
      projectMeta: result.projectMeta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Ask project-aware questions grounded in actual MongoDB project telemetry
 * @route  POST /api/ai/chat
 * @access Public
 */
export const handleProjectChat = async (req, res, next) => {
  try {
    const { projectId, message } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'message string is required.',
      });
    }

    const answer = await chatWithProject(projectId, message);

    return res.status(200).json({
      success: true,
      answer,
      projectId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   List projects available in MongoDB for AI analysis selection
 * @route  GET /api/ai/projects
 * @access Public
 */
export const handleGetAiProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({}, 'name client location progress status risk startDate endDate')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};
