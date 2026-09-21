import mongoose from 'mongoose';
import { analyzeProject as analyzeProjectService, chatWithProject } from '../services/projectAnalysisService.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';
import Conversation from '../models/Conversation.js';
import { analyzeProjectWithAI } from '../services/aiService.js';
import { detectProjectRisks, detectPortfolioRisks } from '../services/riskAnalysisService.js';
import { generateProjectBriefing } from '../services/projectBriefingService.js';
import { generateProjectReport } from '../services/projectReportService.js';

/**
 * @desc   Analyze a specific construction project using real MongoDB data and Gemini AI
 * @route  POST /api/ai/analyze-project
 * @access Private (JWT protected)
 */
export const handleAnalyzeProject = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId is required in request body.',
        error: 'projectId is required in request body.',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid project ID format: ${projectId}`,
      });
    }

    // Verify project belongs to caller's organization
    const projectExists = await Project.findOne({ _id: projectId, organizationId });
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        error: `Project with ID "${projectId}" not found or access denied.`,
      });
    }

    const result = await analyzeProjectService(projectId, organizationId);

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
 * Controller to fetch project, tasks, and materials data and return Gemini AI analysis.
 * Endpoint: GET /api/ai/project/:projectId
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next handler
 */
export const getProjectAnalysis = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;

    // 1. Validate missing project ID
    if (!projectId || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Project ID parameter is required.',
      });
    }

    const cleanProjectId = projectId.trim();

    let project = null;
    let tasks = [];
    let materials = [];

    // Query Database with organization scope
    try {
      if (mongoose.Types.ObjectId.isValid(cleanProjectId)) {
        project = await Project.findOne({ _id: cleanProjectId, organizationId }).lean();
      }
      if (!project) {
        project = await Project.findOne({
          name: cleanProjectId,
          organizationId,
        }).lean();
      }

      if (project) {
        tasks = await Task.find({
          projectId: project._id,
          organizationId,
        }).lean();

        materials = await Material.find({
          projectId: project._id,
          organizationId,
        }).lean();
      }
    } catch (dbError) {
      console.error(`[AI Controller] Database error while querying project: ${dbError.message}`);
      return res.status(500).json({
        success: false,
        message: `Database error occurred while retrieving project data: ${dbError.message}`,
      });
    }

    // 4. Handle project not found in caller's organization
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with ID: "${cleanProjectId}" or access denied.`,
      });
    }

    // 5. Invoke AI Service layer
    try {
      const aiAnalysis = await analyzeProjectWithAI(project, tasks, materials);

      return res.status(200).json({
        success: true,
        data: aiAnalysis,
      });
    } catch (aiError) {
      console.error(`[AI Controller] AI Service failure: ${aiError.message}`);

      if (aiError.message.includes('GEMINI_API_KEY')) {
        return res.status(500).json({
          success: false,
          message: 'AI Service configuration error: GEMINI_API_KEY is not configured on the server.',
        });
      }

      return res.status(502).json({
        success: false,
        message: `Gemini AI analysis failed: ${aiError.message}`,
      });
    }
  } catch (unexpectedError) {
    next(unexpectedError);
  }
};

/**
 * Controller to handle POST project analysis requests.
 */
export const analyzeProject = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { projectData } = req.body;

    if (!projectData || (typeof projectData === 'object' && Object.keys(projectData).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: "projectData" is required in request body.',
      });
    }

    // If an ID is provided, verify ownership
    const targetId = projectData._id || projectData.id;
    if (targetId && mongoose.Types.ObjectId.isValid(targetId)) {
      const exists = await Project.findOne({ _id: targetId, organizationId });
      if (!exists) {
        return res.status(404).json({
          success: false,
          message: `Project not found or access denied.`,
        });
      }
    }

    const result = await analyzeProjectWithAI(projectData);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   Ask project-aware questions grounded in caller's organization MongoDB project telemetry
 * @route  POST /api/ai/chat
 * @access Private (JWT protected)
 */
export const handleProjectChat = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { projectId, message, images = [], documents = [], conversationHistory = [] } = req.body;

    const validProjectId = projectId && projectId !== 'all' ? projectId : null;
    const hasImages = Array.isArray(images) && images.length > 0;
    const hasDocs = Array.isArray(documents) && documents.length > 0;
    const cleanMessage = (message || '').trim();

    if (!cleanMessage && !hasImages && !hasDocs) {
      return res.status(400).json({
        success: false,
        error: 'Message string, document, or image attachment is required.',
      });
    }

    // If target project is specified, verify ownership
    if (validProjectId) {
      if (!mongoose.Types.ObjectId.isValid(validProjectId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid project ID format: ${validProjectId}`,
        });
      }
      const projExists = await Project.findOne({ _id: validProjectId, organizationId });
      if (!projExists) {
        return res.status(404).json({
          success: false,
          error: `Project with ID "${validProjectId}" not found or access denied.`,
        });
      }
    }

    try {
      const chatResult = await chatWithProject(
        validProjectId,
        cleanMessage,
        images,
        documents,
        conversationHistory,
        organizationId
      );

      const answer = typeof chatResult === 'object' ? chatResult.answer : chatResult;
      const sources = typeof chatResult === 'object' ? (chatResult.sources || []) : [];
      const confidence = typeof chatResult === 'object' ? (chatResult.confidence || 'High') : 'High';

      return res.status(200).json({
        success: true,
        answer,
        sources,
        confidence,
        projectId: validProjectId || 'all',
      });
    } catch (chatError) {
      console.error(`[AI Chat Error] ${chatError.message}`);

      if (chatError.statusCode === 400 || chatError.statusCode === 404) {
        return res.status(chatError.statusCode).json({
          success: false,
          error: chatError.message,
        });
      }

      return res.status(502).json({
        success: false,
        error: "BuildOps AI couldn't process this request right now. Please try again.",
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc   List projects available in MongoDB for AI analysis selection scoped to caller's organization
 * @route  GET /api/ai/projects
 * @access Private (JWT protected)
 */
export const handleGetAiProjects = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    const projects = await Project.find(
      { organizationId },
      'name client location progress status risk startDate endDate'
    )
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

/**
 * @desc   Detect and analyze operational risks using authorized MongoDB project data
 * @route  GET /api/ai/project-risk/:projectId
 * @access Private (JWT protected)
 */
export const handleGetProjectRisk = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId parameter is required.',
      });
    }

    if (projectId === 'all') {
      const portfolioAnalysis = await detectPortfolioRisks(new Date(), organizationId);
      return res.status(200).json({
        success: true,
        data: portfolioAnalysis,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid project ID format: ${projectId}`,
      });
    }

    // Verify project belongs to caller's organization
    const projectExists = await Project.findOne({ _id: projectId, organizationId });
    if (!projectExists) {
      return res.status(404).json({
        success: false,
        error: `Project with ID ${projectId} not found or access denied.`,
      });
    }

    const projectAnalysis = await detectProjectRisks(projectId, new Date(), organizationId);
    return res.status(200).json({
      success: true,
      data: projectAnalysis,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc   Generate an on-demand AI Project Briefing using authorized MongoDB data
 * @route  GET /api/ai/project-briefing/:projectId
 * @access Private (JWT protected)
 */
export const handleGetProjectBriefing = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const organizationId = req.user?.organizationId;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId parameter is required.',
      });
    }

    if (projectId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid project ID format: ${projectId}`,
        });
      }

      const projectExists = await Project.findOne({ _id: projectId, organizationId });
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          error: `Project with ID ${projectId} not found or access denied.`,
        });
      }
    }

    const briefingResult = await generateProjectBriefing(projectId, organizationId);
    return res.status(200).json({
      success: true,
      data: briefingResult,
      ...briefingResult,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * @desc   Generate an AI-powered construction project report using authorized MongoDB data
 * @route  POST /api/ai/generate-report
 * @access Private (JWT protected)
 */
export const handleGenerateReport = async (req, res, next) => {
  try {
    const organizationId = req.user?.organizationId;
    const { projectId, reportType, conversationId, message } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required in request body.',
      });
    }

    if (projectId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({
          success: false,
          error: `Invalid project ID format: ${projectId}`,
        });
      }

      const projectExists = await Project.findOne({ _id: projectId, organizationId });
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          error: `Project with ID ${projectId} not found or access denied.`,
        });
      }
    }

    const reportResult = await generateProjectReport(projectId, reportType, organizationId);

    // If conversationId is provided, persist the exchange to MongoDB conversation history
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      try {
        const conv = await Conversation.findOne({ _id: conversationId, organizationId });
        if (conv) {
          const userPrompt = message || `Generate ${reportResult.reportType}`;
          conv.messages.push({
            role: 'user',
            content: userPrompt,
            createdAt: new Date(),
          });
          conv.messages.push({
            role: 'assistant',
            content: reportResult.answer,
            sources: reportResult.sources,
            confidence: reportResult.confidence,
            createdAt: new Date(),
          });
          conv.lastMessageSnippet = reportResult.answer.slice(0, 120);
          await conv.save();
        }
      } catch (convErr) {
        console.warn(`[AI Controller] Failed to persist report in conversation ${conversationId}:`, convErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      report: reportResult,
      answer: reportResult.answer,
      sources: reportResult.sources,
      confidence: reportResult.confidence,
      reportData: reportResult.reportData,
      reportType: reportResult.reportType,
      projectId: reportResult.projectId,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export default getProjectAnalysis;
