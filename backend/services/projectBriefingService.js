import { getChatContext, isValidObjectId } from './projectDataService.js';
import { callGemini, extractAndValidateSourcesAndConfidence, getGeminiClient } from './aiService.js';

/**
 * BuildOps AI — Project Briefing & Daily Construction Summary Service (Task 11)
 *
 * Grounded strictly in real MongoDB project, task, and material data.
 * Computes deterministic operational facts first, then leverages Gemini AI for concise synthesis.
 * Features a 100% resilient deterministic fallback if Gemini is unreachable.
 */

/**
 * Compiles strictly deterministic briefing metrics for a single project or portfolio
 * @param {string} projectId - Project ObjectId or 'all'
 * @returns {Promise<Object>}
 */
export const buildDeterministicBriefingData = async (projectId) => {
  const context = await getChatContext(projectId);

  if (context.type === 'single_project') {
    const p = context.project.project;
    const tasks = context.project.tasks || [];
    const materials = context.project.materials || [];
    const metrics = context.project.calculatedMetrics || {};
    const risks = context.risks?.risks || [];

    const now = new Date();

    // Prioritized operational attention items:
    // 1. Critical-priority delayed tasks
    // 2. High-priority delayed tasks
    // 3. Overdue tasks
    // 4. Out-of-stock materials
    // 5. Low-stock materials
    // 6. Schedule/deadline risks
    const criticalDelayed = tasks.filter((t) => t.priority === 'Critical' && t.status === 'Delayed');
    const highDelayed = tasks.filter((t) => t.priority === 'High' && t.status === 'Delayed');
    const overdue = tasks.filter((t) => t.isOverdue);
    const outOfStock = materials.filter((m) => m.status === 'Out of Stock');
    const lowStock = materials.filter((m) => m.status === 'Low Stock');

    const priorities = [];

    for (const t of criticalDelayed) {
      priorities.push({
        type: 'critical_delayed_task',
        title: `Critical Task Delayed: ${t.title}`,
        detail: `Priority: Critical | Due: ${t.dueDate || 'N/A'} | Progress: ${t.progress || 0}%`,
        recommendation: 'Review trade resources and sequencing immediately with the structural engineer.',
      });
    }

    for (const t of highDelayed) {
      if (!criticalDelayed.includes(t)) {
        priorities.push({
          type: 'high_delayed_task',
          title: `High-Priority Task Delayed: ${t.title}`,
          detail: `Priority: High | Due: ${t.dueDate || 'N/A'} | Progress: ${t.progress || 0}%`,
          recommendation: 'Confirm revised timeline with the contractor to prevent cascading milestone impacts.',
        });
      }
    }

    for (const t of overdue) {
      if (!criticalDelayed.includes(t) && !highDelayed.includes(t)) {
        priorities.push({
          type: 'overdue_task',
          title: `Overdue Activity: ${t.title}`,
          detail: `Due: ${t.dueDate} (${t.daysOverdue} days overdue) | Status: ${t.status}`,
          recommendation: 'Verify actual site completion status or reschedule float.',
        });
      }
    }

    for (const m of outOfStock) {
      priorities.push({
        type: 'out_of_stock_material',
        title: `Out of Stock: ${m.name}`,
        detail: `Required: ${m.requiredQuantity} ${m.unit} | Available: 0 ${m.unit} | Deficit: ${m.deficit} ${m.unit}`,
        recommendation: 'Issue urgent procurement requisition or coordinate supplier dispatch.',
      });
    }

    for (const m of lowStock) {
      priorities.push({
        type: 'low_stock_material',
        title: `Low Stock: ${m.name}`,
        detail: `Available: ${m.availableQuantity} ${m.unit} / ${m.requiredQuantity} ${m.unit} (${m.stockPercentage}%)`,
        recommendation: 'Verify procurement buffer before next concrete/construction phase.',
      });
    }

    if (p.isApproachingDeadline || p.isPastDeadline) {
      priorities.push({
        type: 'deadline_risk',
        title: p.isPastDeadline ? 'Project Past Target Completion Date' : 'Target Completion Approaching',
        detail: `Target Deadline: ${p.endDate || 'N/A'} (${p.daysUntilDeadline !== null ? p.daysUntilDeadline + ' days remaining' : ''}) | Progress: ${p.progress}%`,
        recommendation: 'Evaluate critical path trades to recover planned milestones.',
      });
    }

    // Schedule status determination
    let scheduleStatus = 'On schedule';
    if (metrics.delayedTasksCount > 0 || metrics.overdueTasksCount > 0 || p.isPastDeadline) {
      scheduleStatus = 'Potential schedule attention required';
    } else if (metrics.inProgressTasks > 0) {
      scheduleStatus = 'Active progress as planned';
    }

    return {
      scope: 'single_project',
      projectId: p.id,
      projectName: p.name,
      client: p.client,
      location: p.location,
      status: p.status || 'In Progress',
      progress: p.progress || 0,
      scheduleStatus,
      tasks: {
        total: metrics.totalTasks,
        completed: metrics.completedTasks,
        inProgress: metrics.inProgressTasks,
        delayed: metrics.delayedTasksCount,
        overdue: metrics.overdueTasksCount,
        notStarted: metrics.notStartedTasks,
      },
      materials: {
        total: metrics.totalMaterials,
        available: metrics.totalMaterials - metrics.lowStockCount - metrics.outOfStockCount,
        lowStock: metrics.lowStockCount,
        outOfStock: metrics.outOfStockCount,
      },
      todayPriorities: priorities,
      risks,
    };
  }

  // Portfolio (All Projects)
  const portfolio = context.portfolio || {};
  const allProjects = portfolio.allProjects || [];
  const totalProjects = portfolio.totalProjectsCount || allProjects.length;
  const avgProgress = portfolio.averageProgress || 0;

  let totalDelayedTasks = 0;
  let totalOverdueTasks = 0;
  let totalLowStock = 0;
  let totalOutOfStock = 0;

  const projectsRequiringAttention = [];

  for (const p of allProjects) {
    totalDelayedTasks += p.delayedTasksCount || 0;
    totalOverdueTasks += p.overdueTasksCount || 0;
    totalLowStock += p.shortagesCount || 0;

    // A project requires attention if it has delayed/overdue tasks, stockouts, or detected risks
    if (p.delayedTasksCount > 0 || p.overdueTasksCount > 0 || (p.topRisks && p.topRisks.length > 0)) {
      const reasons = [];
      if (p.delayedTasksCount > 0) reasons.push(`${p.delayedTasksCount} delayed task(s)`);
      if (p.overdueTasksCount > 0) reasons.push(`${p.overdueTasksCount} overdue task(s)`);
      if (p.shortagesCount > 0) reasons.push(`${p.shortagesCount} material shortage(s)`);
      if (p.topRisks && p.topRisks.length > 0) reasons.push(p.topRisks[0].title);

      projectsRequiringAttention.push({
        id: p.id,
        name: p.name,
        progress: p.progress,
        status: p.status,
        reason: reasons.join(', ') || 'Operational variance observed',
      });
    }
  }

  const operationalThemes = [];
  if (totalDelayedTasks > 0 || totalOverdueTasks > 0) {
    operationalThemes.push('Schedule pressure across active trades');
  }
  if (totalLowStock > 0 || totalOutOfStock > 0) {
    operationalThemes.push('Material availability and buffer replenishment');
  }
  if (operationalThemes.length === 0) {
    operationalThemes.push('Operations progressing as scheduled across all sites');
  }

  return {
    scope: 'portfolio',
    totalProjects,
    averageProgress: avgProgress,
    tasks: {
      delayed: totalDelayedTasks,
      overdue: totalOverdueTasks,
    },
    materials: {
      lowStock: totalLowStock,
      outOfStock: totalOutOfStock,
    },
    projectsRequiringAttention,
    operationalThemes,
  };
};

/**
 * Deterministic fallback formatter when Gemini AI is unreachable
 * @param {Object} data - Briefing data from buildDeterministicBriefingData
 * @returns {string}
 */
export const formatDeterministicBriefingFallback = (data) => {
  if (data.scope === 'single_project') {
    const hasTasks = data.tasks.total > 0;
    const hasMaterials = data.materials.total > 0;

    let text = `### PROJECT BRIEFING\n\n`;
    text += `**Project:**\n${data.projectName}\n\n`;
    text += `**Current Status:**\n${data.status}\n\n`;
    text += `**Progress:**\n${data.progress}%\n\n`;
    text += `**Schedule:**\n${data.scheduleStatus}\n\n`;

    if (hasTasks) {
      text += `**Tasks:**\n`;
      text += `- ${data.tasks.completed} completed\n`;
      text += `- ${data.tasks.inProgress} in progress\n`;
      text += `- ${data.tasks.delayed} delayed\n`;
      if (data.tasks.overdue > 0) text += `- ${data.tasks.overdue} overdue\n`;
      text += `\n`;
    } else {
      text += `**Tasks:**\nNo task records available for this project.\n\n`;
    }

    if (hasMaterials) {
      text += `**Materials:**\n`;
      text += `- ${data.materials.available} available\n`;
      text += `- ${data.materials.lowStock} low stock\n`;
      text += `- ${data.materials.outOfStock} out of stock\n\n`;
    } else {
      text += `**Materials:**\nMaterial information is unavailable for this project.\n\n`;
    }

    text += `**Key Attention:**\n`;
    if (data.todayPriorities.length > 0) {
      for (const p of data.todayPriorities.slice(0, 4)) {
        text += `- ${p.title} (${p.detail})\n`;
      }
    } else {
      text += `No immediate operational priorities were identified from the currently available BuildOps data.\n`;
    }
    text += `\n`;

    text += `**Recommended Actions:**\n`;
    if (data.todayPriorities.length > 0) {
      data.todayPriorities.slice(0, 3).forEach((p, idx) => {
        text += `${idx + 1}. ${p.recommendation}\n`;
      });
    } else {
      text += `1. Maintain standard site inspections and scheduled trade milestones.\n`;
    }

    return text.trim();
  }

  // Portfolio
  let text = `### CONSTRUCTION PORTFOLIO BRIEFING\n\n`;
  text += `**Projects:**\n${data.totalProjects} active projects\n\n`;
  text += `**Progress:**\nAverage available project progress: ${data.averageProgress}%\n\n`;

  text += `**Task Attention:**\n`;
  text += `- ${data.tasks.delayed} delayed tasks\n`;
  text += `- ${data.tasks.overdue} overdue tasks\n\n`;

  text += `**Material Attention:**\n`;
  text += `- ${data.materials.lowStock} low-stock materials\n`;
  text += `- ${data.materials.outOfStock} out-of-stock materials\n\n`;

  text += `**Projects Requiring Attention:**\n`;
  if (data.projectsRequiringAttention.length > 0) {
    for (const p of data.projectsRequiringAttention) {
      text += `- **${p.name}** (${p.progress}%): ${p.reason}\n`;
    }
  } else {
    text += `- None. All projects currently operating within planned tolerances.\n`;
  }
  text += `\n`;

  text += `**Key Operational Themes:**\n`;
  for (const theme of data.operationalThemes) {
    text += `- ${theme}\n`;
  }

  return text.trim();
};

/**
 * Generates an on-demand AI Project Briefing using Gemini AI with deterministic fallback.
 *
 * @param {string} projectId - Valid ObjectId string or 'all'
 * @returns {Promise<{ answer: string, sources: Array<{ type: string, label: string }>, confidence: string, briefingData: Object, projectId: string }>}
 */
export const generateProjectBriefing = async (projectId) => {
  // 1. Validate projectId
  if (projectId && projectId !== 'all' && !isValidObjectId(projectId)) {
    const error = new Error(`Invalid project ID format: ${projectId}`);
    error.statusCode = 400;
    throw error;
  }

  // 2. Fetch deterministic facts from MongoDB
  const briefingData = await buildDeterministicBriefingData(projectId);

  // 3. Prepare Sources list based on data used
  const sources = [{ type: 'project', label: 'Project Data' }];
  if (briefingData.scope === 'single_project') {
    if (briefingData.tasks.total > 0) sources.push({ type: 'tasks', label: 'Task Data' });
    if (briefingData.materials.total > 0) sources.push({ type: 'materials', label: 'Material Data' });
    sources.push({ type: 'inference', label: 'AI Inference' });
  } else {
    sources.push({ type: 'tasks', label: 'Task Data' });
    if (briefingData.materials.lowStock > 0 || briefingData.materials.outOfStock > 0) {
      sources.push({ type: 'materials', label: 'Material Data' });
    }
    sources.push({ type: 'inference', label: 'AI Inference' });
  }

  // 4. Synthesize with Gemini AI
  const systemInstruction = `You are BuildOps AI, a specialized Construction and Project Intelligence Assistant.
Generate a concise, professional construction operations briefing for the project manager based ONLY on the supplied deterministic data.

Target Length: 150 to 300 words.
Keep the response crisp, scannable, and practical.

CRITICAL RULES:
1. Ground strictly in the provided data. Never invent statistics, dates, tasks, materials, or risks.
2. Use cautious, professional construction language (avoid false certainty: say "indicates potential schedule risk" instead of "will be delayed").
3. Do not claim structural safety conclusions from project management records.
4. If task or material data is missing, state it clearly (e.g. "Material information is unavailable for this project").
5. Follow the requested structure cleanly:
   For Single Project:
   PROJECT BRIEFING
   Project: ...
   Current Status: ...
   Progress: ...%
   Schedule: ...
   Tasks: ...
   Materials: ...
   Key Attention: ...
   Recommended Actions: ...

   For Portfolio (All Projects):
   CONSTRUCTION PORTFOLIO BRIEFING
   Projects: ... active projects
   Progress: Average available project progress: ...%
   Task Attention: ...
   Material Attention: ...
   Projects Requiring Attention: ...
   Key Operational Themes: ...

At the end of your response, output a single invisible metadata tag:
<!-- METADATA {"sources": ${JSON.stringify(sources.map((s) => s.type))}, "confidence": "High"} -->`;

  const promptText = `Generate today's project briefing using this exact deterministic construction data:
${JSON.stringify(briefingData, null, 2)}`;

  let finalAnswer = '';
  try {
    const rawAiText = await callGemini(promptText, systemInstruction, false);
    const validated = extractAndValidateSourcesAndConfidence(rawAiText, {
      hasDocs: false,
      hasImages: false,
      documents: [],
      images: [],
      effectiveQuestion: 'Project Briefing',
    });
    finalAnswer = validated.answer;
  } catch (aiErr) {
    console.warn(`[Project Briefing] Gemini API call failed (${aiErr.message}), falling back to deterministic synthesis.`);
    finalAnswer = formatDeterministicBriefingFallback(briefingData);
  }

  return {
    answer: finalAnswer,
    sources,
    confidence: 'High',
    briefingData,
    projectId: projectId || 'all',
  };
};
