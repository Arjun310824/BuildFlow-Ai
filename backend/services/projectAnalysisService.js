import { getProjectContext, getChatContext } from './projectDataService.js';
import { generateProjectAnalysis, generateProjectChatResponse } from './aiService.js';

/**
 * Validates and normalizes structured analysis to guarantee contract integrity
 * @param {Object} rawAnalysis
 * @param {Object} context
 * @returns {Object} Normalized analysis
 */
export const validateAndNormalizeAnalysis = (rawAnalysis, context) => {
  const allowedHealth = ['Healthy', 'Attention Required', 'At Risk', 'Critical'];

  let status = rawAnalysis?.overallHealth?.status;
  if (!allowedHealth.includes(status)) {
    // If invalid or missing, infer safely from context
    if (context.calculatedMetrics.highPriorityDelayedCount > 0 || context.calculatedMetrics.outOfStockCount > 0) {
      status = 'At Risk';
    } else if (context.calculatedMetrics.lowStockCount > 0 || context.calculatedMetrics.delayedTasksCount > 0) {
      status = 'Attention Required';
    } else {
      status = 'Healthy';
    }
  }

  const overallHealth = {
    status,
    reason: rawAnalysis?.overallHealth?.reason || `Project ${context.project.name} is at ${context.project.progress}% progress with ${context.calculatedMetrics.delayedTasksCount} delayed tasks and ${context.calculatedMetrics.lowStockCount} low-stock materials.`,
  };

  const summary = rawAnalysis?.summary || `Analysis for ${context.project.name} (${context.project.status}, ${context.project.progress}% completed).`;

  const risks = Array.isArray(rawAnalysis?.risks)
    ? rawAnalysis.risks.map((r) => ({
        type: r.type || 'Project Risk',
        severity: ['Low', 'Medium', 'High', 'Critical'].includes(r.severity) ? r.severity : 'Medium',
        evidence: r.evidence || 'Identified from project metrics.',
        recommendation: r.recommendation || 'Monitor project schedule and inventory levels closely.',
      }))
    : [];

  const delays = Array.isArray(rawAnalysis?.delays)
    ? rawAnalysis.delays.map((d) => ({
        task: d.task || 'Unspecified Task',
        status: d.status || 'Delayed',
        progress: typeof d.progress === 'number' ? d.progress : 0,
        reason: d.reason || 'Task is marked delayed or past due date.',
        recommendation: d.recommendation || 'Reassign resources to recover float.',
      }))
    : [];

  const materialAlerts = Array.isArray(rawAnalysis?.materialAlerts)
    ? rawAnalysis.materialAlerts.map((m) => ({
        material: m.material || 'Material Item',
        available: typeof m.available === 'number' ? m.available : 0,
        required: typeof m.required === 'number' ? m.required : 0,
        unit: m.unit || 'units',
        status: m.status || 'Low Stock',
        recommendation: m.recommendation || 'Initiate procurement reorder.',
      }))
    : [];

  const recommendations = Array.isArray(rawAnalysis?.recommendations)
    ? rawAnalysis.recommendations.map((rec) => ({
        priority: ['High', 'Medium', 'Low'].includes(rec.priority) ? rec.priority : 'Medium',
        action: rec.action || 'Review active work orders.',
        reason: rec.reason || 'Ensure critical path is maintained.',
      }))
    : [];

  return {
    summary,
    overallHealth,
    risks,
    delays,
    materialAlerts,
    recommendations,
  };
};

/**
 * End-to-end Project Analysis pipeline
 * @param {string} projectId
 * @returns {Promise<Object>}
 */
export const analyzeProject = async (projectId, organizationId = null) => {
  // 1. Fetch live MongoDB project data & calculated metrics scoped to organization
  const context = await getProjectContext(projectId, organizationId);

  // 2. Call Gemini AI Engine with strictly grounded context
  const rawAiResult = await generateProjectAnalysis(context);

  // 3. Validate & normalize AI output against schema
  const validatedData = validateAndNormalizeAnalysis(rawAiResult, context);

  return {
    analysis: validatedData,
    projectMeta: {
      id: context.project.id,
      name: context.project.name,
      progress: context.project.progress,
      status: context.project.status,
      metrics: context.calculatedMetrics,
      analyzedAt: new Date().toISOString(),
    },
  };
};

/**
 * Project-Aware Chat interaction pipeline with multimodal image, PDF document, and conversation history support
 * @param {string} projectId
 * @param {string} message
 * @param {Array} [images=[]]
 * @param {Array} [documents=[]]
 * @param {Array} [conversationHistory=[]]
 * @param {string|ObjectId} [organizationId=null]
 * @returns {Promise<{ answer: string, sources: Array<{ type: string, label: string }>, confidence: string }>}
 */
export const chatWithProject = async (
  projectId,
  message,
  images = [],
  documents = [],
  conversationHistory = [],
  organizationId = null
) => {
  const hasImages = Array.isArray(images) && images.length > 0;
  const hasDocs = Array.isArray(documents) && documents.length > 0;
  const cleanMessage = (message || '').trim();

  if (!cleanMessage && !hasImages && !hasDocs) {
    const error = new Error('Chat message, document, or image attachment is required.');
    error.statusCode = 400;
    throw error;
  }

  // Fetch real project data + portfolio summary scoped to organization (validates project existence)
  const context = await getChatContext(projectId, organizationId);

  // Query Gemini with context + user message + images + documents + conversation history
  return await generateProjectChatResponse(context, cleanMessage, images, documents, conversationHistory);
};

