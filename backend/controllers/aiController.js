import mongoose from 'mongoose';
import { analyzeProject as analyzeProjectService, chatWithProject } from '../services/projectAnalysisService.js';
import Project from '../models/Project.js';
import { analyzeProjectWithAI } from '../services/aiService.js';
import { detectProjectRisks, detectPortfolioRisks } from '../services/riskAnalysisService.js';
import { generateProjectBriefing } from '../services/projectBriefingService.js';
import { generateProjectReport } from '../services/projectReportService.js';

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
        message: 'projectId is required in request body.',
        error: 'projectId is required in request body.',
      });
    }

    const result = await analyzeProjectService(projectId);

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
 * Safely resolves registered Mongoose models or dynamically imports them from models folder.
 *
 * @param {string} modelName - Model name ('Project', 'Task', 'Material').
 * @returns {Promise<mongoose.Model|null>}
 */
const resolveModel = async (modelName) => {
  try {
    if (mongoose.models[modelName]) return mongoose.models[modelName];
    if (mongoose.modelNames().includes(modelName)) return mongoose.model(modelName);
  } catch {
    // Continue to check file paths
  }

  const paths = [
    `../models/${modelName}.js`,
    `../models/${modelName.toLowerCase()}.js`,
  ];

  for (const p of paths) {
    try {
      const module = await import(p);
      const m = module.default || module[modelName] || mongoose.models[modelName];
      if (m) return m;
    } catch {
      // Path not found, try next
    }
  }

  return null;
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

    // 1. Validate missing project ID
    if (!projectId || !projectId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Project ID parameter is required.',
      });
    }

    const cleanProjectId = projectId.trim();

    // 2. Resolve Mongoose models
    const Project = await resolveModel('Project');
    const Task = await resolveModel('Task');
    const Material = await resolveModel('Material');

    let project = null;
    let tasks = [];
    let materials = [];

    // 3. Query Database if Project model exists
    if (Project) {
      try {
        if (mongoose.Types.ObjectId.isValid(cleanProjectId)) {
          project = await Project.findById(cleanProjectId).lean();
        }
        if (!project) {
          project = await Project.findOne({
            $or: [{ id: cleanProjectId }, { name: cleanProjectId }],
          }).lean();
        }

        if (project) {
          // Fetch associated tasks
          if (Task) {
            tasks = await Task.find({
              $or: [
                { projectId: project._id },
                { projectId: project.id },
                { project: project.name },
                { project: cleanProjectId },
              ],
            }).lean();
          }

          // Fetch associated materials
          if (Material) {
            materials = await Material.find({
              $or: [
                { projectId: project._id },
                { projectId: project.id },
                { project: project.name },
                { project: cleanProjectId },
              ],
            }).lean();
          }
        }
      } catch (dbError) {
        console.error(`[AI Controller] Database error while querying project: ${dbError.message}`);
        return res.status(500).json({
          success: false,
          message: `Database error occurred while retrieving project data: ${dbError.message}`,
        });
      }
    }

    // 4. Handle project not found in MongoDB
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with ID: "${cleanProjectId}".`,
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

      // Missing or invalid API key configuration
      if (aiError.message.includes('GEMINI_API_KEY')) {
        return res.status(500).json({
          success: false,
          message: 'AI Service configuration error: GEMINI_API_KEY is not configured on the server.',
        });
      }

      // Upstream Gemini API call or parsing failure
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
    const { projectData } = req.body;

    if (!projectData || (typeof projectData === 'object' && Object.keys(projectData).length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: "projectData" is required in request body.',
      });
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
 * @desc   Ask project-aware questions grounded in actual MongoDB project telemetry
 * @route  POST /api/ai/chat
 * @access Public
 */
export const handleProjectChat = async (req, res, next) => {
  try {
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

    try {
      const chatResult = await chatWithProject(
        validProjectId,
        cleanMessage,
        images,
        documents,
        conversationHistory
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

      // Client validation errors (unsupported format, image too large, >3 images, 404 project not found)
      if (chatError.statusCode === 400 || chatError.statusCode === 404) {
        return res.status(chatError.statusCode).json({
          success: false,
          error: chatError.message,
        });
      }

      // Safe user-friendly failure response without leaking internal details or API keys
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

/**
 * @desc   Detect and analyze operational risks using real MongoDB project data (Task 9)
 * @route  GET /api/ai/project-risk/:projectId
 * @access Public
 */
export const handleGetProjectRisk = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId parameter is required.',
      });
    }

    if (projectId === 'all') {
      const portfolioAnalysis = await detectPortfolioRisks();
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

    const projectAnalysis = await detectProjectRisks(projectId);
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
 * @desc   Generate an on-demand AI Project Briefing using real MongoDB data (Task 11)
 * @route  GET /api/ai/project-briefing/:projectId
 * @access Public
 */
export const handleGetProjectBriefing = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId parameter is required.',
      });
    }

    if (projectId !== 'all' && !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid project ID format: ${projectId}`,
      });
    }

    const briefingResult = await generateProjectBriefing(projectId);
    return res.status(200).json({
      success: true,
      data: briefingResult,
      answer: briefingResult.answer,
      sources: briefingResult.sources,
      confidence: briefingResult.confidence,
      briefingData: briefingResult.briefingData,
      projectId: briefingResult.projectId,
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
 * @desc   Generate an AI-powered construction project report using real MongoDB data (Task 12)
 * @route  POST /api/ai/generate-report
 * @access Public
 */
export const handleGenerateReport = async (req, res, next) => {
  try {
    const { projectId, reportType, conversationId, message } = req.body;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'projectId is required in request body.',
      });
    }

    if (projectId !== 'all' && !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid project ID format: ${projectId}`,
      });
    }

    const reportResult = await generateProjectReport(projectId, reportType);

    // If conversationId is provided, persist the exchange to MongoDB conversation history (Task 6)
    if (conversationId && mongoose.Types.ObjectId.isValid(conversationId)) {
      try {
        const Conversation = (await import('../models/Conversation.js')).default;
        const conv = await Conversation.findById(conversationId);
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
