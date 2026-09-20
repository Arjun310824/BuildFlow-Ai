import mongoose from 'mongoose';
import { analyzeProject as analyzeProjectService, chatWithProject } from '../services/projectAnalysisService.js';
import Project from '../models/Project.js';
import { analyzeProjectWithAI } from '../services/aiService.js';

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

// Realistic fallback construction datasets for local dev/testing before DB seeding
const FALLBACK_PROJECTS = [
  {
    id: 'PRJ-101',
    name: 'Skyline Commercial Tower B',
    location: 'Downtown Metro, Block 4',
    type: 'Commercial High-Rise',
    manager: 'David Chen',
    progress: 68,
    status: 'On Track',
    budget: '$18.4M',
    spent: '$12.5M',
    deadline: 'Nov 2026',
  },
  {
    id: 'PRJ-102',
    name: 'Riverfront Residential Phase II',
    location: 'North Bay District',
    type: 'Residential Complex',
    manager: 'Sarah Jenkins',
    progress: 42,
    status: 'At Risk',
    budget: '$9.2M',
    spent: '$4.8M',
    deadline: 'Jan 2027',
  },
  {
    id: 'PRJ-103',
    name: 'Apex Logistics Distribution Hub',
    location: 'Western Industrial Park',
    type: 'Industrial Facility',
    manager: 'Marcus Vance',
    progress: 89,
    status: 'On Track',
    budget: '$14.0M',
    spent: '$12.1M',
    deadline: 'May 2026',
  },
  {
    id: 'PRJ-104',
    name: 'Metro Hospital Expansion Wing',
    location: 'Central Medical District',
    type: 'Healthcare Infrastructure',
    manager: 'Elena Ramos',
    progress: 31,
    status: 'Delayed',
    budget: '$22.5M',
    spent: '$9.1M',
    deadline: 'Aug 2027',
  },
];

const FALLBACK_TASKS = [
  {
    id: 'TSK-401',
    title: 'Foundation Slab Pouring - Sector 3',
    project: 'Riverfront Residential Phase II',
    assignee: 'Robert K. (Structural Lead)',
    priority: 'High',
    status: 'Delayed',
    dueDate: 'Sep 18, 2026',
  },
  {
    id: 'TSK-402',
    title: 'HVAC Ductwork Installation Lvl 8-12',
    project: 'Skyline Commercial Tower B',
    assignee: 'Apex MEP Contractors',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: 'Sep 24, 2026',
  },
  {
    id: 'TSK-403',
    title: 'Curtain Wall Glazing Inspection',
    project: 'Apex Logistics Distribution Hub',
    assignee: 'QA/QC Inspection Team',
    priority: 'High',
    status: 'Completed',
    dueDate: 'Sep 19, 2026',
  },
  {
    id: 'TSK-404',
    title: 'Fire Suppression Pipeline Pressure Test',
    project: 'Metro Hospital Expansion Wing',
    assignee: 'Safety Works Inc.',
    priority: 'Critical',
    status: 'Delayed',
    dueDate: 'Sep 15, 2026',
  },
  {
    id: 'TSK-405',
    title: 'Steel Rebar Procurement Audit',
    project: 'Skyline Commercial Tower B',
    assignee: 'Supply Chain Team',
    priority: 'Low',
    status: 'In Progress',
    dueDate: 'Sep 28, 2026',
  },
];

const FALLBACK_MATERIALS = [
  {
    id: 'MAT-01',
    material: 'Grade 60 Structural Steel Rebar',
    project: 'Riverfront Residential Phase II',
    currentStock: '14.2 Tons',
    requiredStock: '45.0 Tons',
    status: 'Critical Low',
  },
  {
    id: 'MAT-02',
    material: 'Ready-Mix Concrete M40',
    project: 'Skyline Commercial Tower B',
    currentStock: '60 m³',
    requiredStock: '180 m³',
    status: 'Restock Needed',
  },
  {
    id: 'MAT-03',
    material: 'Tempered Glass Panels (Double Glazed)',
    project: 'Apex Logistics Distribution Hub',
    currentStock: '48 Units',
    requiredStock: '120 Units',
    status: 'Delayed Shipment',
  },
];

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
    `../src/models/${modelName}.js`,
    `../src/models/${modelName.toLowerCase()}.js`,
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

    // 4. Fallback check for dev/testing when DB is unseeded or models are pending
    if (!project) {
      const matchedMock = FALLBACK_PROJECTS.find(
        (p) =>
          p.id.toLowerCase() === cleanProjectId.toLowerCase() ||
          p.name.toLowerCase() === cleanProjectId.toLowerCase()
      );

      if (matchedMock) {
        project = matchedMock;
        tasks = FALLBACK_TASKS.filter(
          (t) =>
            t.project?.toLowerCase() === project.name.toLowerCase() ||
            t.project?.toLowerCase() === project.id.toLowerCase()
        );
        materials = FALLBACK_MATERIALS.filter(
          (m) =>
            m.project?.toLowerCase() === project.name.toLowerCase() ||
            m.project?.toLowerCase() === project.id.toLowerCase()
        );
      }
    }

    // 5. Handle project not found
    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with ID: "${cleanProjectId}".`,
      });
    }

    // 6. Invoke AI Service layer
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

export default getProjectAnalysis;
