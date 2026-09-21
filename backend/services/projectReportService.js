import mongoose from 'mongoose';
import { getChatContext, isValidObjectId } from './projectDataService.js';
import { callGemini, extractAndValidateSourcesAndConfidence } from './aiService.js';

/**
 * BuildOps AI — AI-Powered Project Report Generator Service (Task 12)
 *
 * Grounded strictly in real MongoDB project, task, and material data.
 * Computes deterministic operational metrics first, then utilizes Gemini AI for professional report synthesis.
 * Features a 100% resilient deterministic fallback if Gemini is unreachable.
 */

export const ALLOWED_REPORT_TYPES = [
  'Project Status Report',
  'Construction Progress Report',
];

/**
 * Normalizes and validates the requested report type
 * @param {string} [reportType]
 * @returns {string} Normalized report type (defaults to 'Project Status Report')
 */
export const normalizeReportType = (reportType) => {
  if (!reportType || typeof reportType !== 'string') {
    return 'Project Status Report';
  }

  const clean = reportType.trim();
  const lower = clean.toLowerCase();

  if (lower.includes('progress')) {
    return 'Construction Progress Report';
  }
  if (lower.includes('status') || lower.includes('overview') || lower.includes('management') || lower.includes('detail')) {
    return 'Project Status Report';
  }

  const matched = ALLOWED_REPORT_TYPES.find((t) => t.toLowerCase() === lower);
  return matched || 'Project Status Report';
};

/**
 * Compiles strictly deterministic report metrics for a single project or portfolio
 * @param {string} projectId - Project ObjectId or 'all'
 * @param {string} [reportType='Project Status Report']
 * @returns {Promise<Object>} Structured report data
 */
export const buildDeterministicReportData = async (projectId, reportType = 'Project Status Report') => {
  const normType = normalizeReportType(reportType);
  const context = await getChatContext(projectId);
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  if (context.type === 'single_project') {
    const p = context.project.project;
    const tasks = context.project.tasks || [];
    const materials = context.project.materials || [];
    const metrics = context.project.calculatedMetrics || {};
    const risks = context.risks?.risks || [];

    // Detailed task categories
    const completedTasksList = tasks.filter((t) => t.status === 'Completed');
    const inProgressTasksList = tasks.filter((t) => t.status === 'In Progress');
    const delayedTasksList = tasks.filter((t) => t.status === 'Delayed');
    const overdueTasksList = tasks.filter((t) => t.isOverdue);
    const notStartedTasksList = tasks.filter((t) => t.status === 'Not Started');

    // Material categories
    const lowStockList = materials.filter((m) => m.status === 'Low Stock');
    const outOfStockList = materials.filter((m) => m.status === 'Out of Stock');
    const availableMaterialsList = materials.filter((m) => m.status !== 'Low Stock' && m.status !== 'Out of Stock');

    // Schedule position calculation
    let schedulePosition = 'On schedule';
    if (delayedTasksList.length > 0 || overdueTasksList.length > 0 || p.isPastDeadline) {
      schedulePosition = 'Schedule variance observed — critical path attention required';
    } else if (inProgressTasksList.length > 0) {
      schedulePosition = 'Progressing as planned according to scheduled milestones';
    }

    // Key observations pre-computed from database facts
    const observations = [];
    if (p.progress >= 0) {
      observations.push(`Overall project physical completion is recorded at ${p.progress}%.`);
    }
    if (delayedTasksList.length > 0) {
      observations.push(`${delayedTasksList.length} task(s) currently marked as Delayed, including ${delayedTasksList.map((t) => `"${t.title}"`).join(', ')}.`);
    }
    if (overdueTasksList.length > 0) {
      observations.push(`${overdueTasksList.length} activity(ies) have exceeded scheduled due dates without completion.`);
    }
    if (outOfStockList.length > 0) {
      observations.push(`Critical material stockout: ${outOfStockList.map((m) => `"${m.name}" (0 ${m.unit} available)`).join(', ')}.`);
    } else if (lowStockList.length > 0) {
      observations.push(`Inventory buffer warning: ${lowStockList.map((m) => `"${m.name}" (${m.availableQuantity}/${m.requiredQuantity} ${m.unit})`).join(', ')}.`);
    }
    if (observations.length === 0) {
      observations.push('Site activities and material inventory remain aligned with baseline project schedule.');
    }

    // Recommended actions pre-computed from database facts
    const actions = [];
    if (delayedTasksList.length > 0 || overdueTasksList.length > 0) {
      actions.push('Review trade crew allocations and float dependencies immediately with the site in-charge to recover schedule milestones.');
    }
    if (outOfStockList.length > 0) {
      actions.push('Issue urgent procurement requisition and coordinate vendor dispatch for depleted material stocks.');
    } else if (lowStockList.length > 0) {
      actions.push('Confirm delivery schedules and purchase requisitions for low-stock materials before active trade consumption.');
    }
    if (p.isApproachingDeadline || p.isPastDeadline) {
      actions.push('Convene critical path review meeting with project leads to adjust contractor sequencing against target completion date.');
    }
    if (actions.length === 0) {
      actions.push('Maintain regular QA/QC inspections and scheduled trade milestones as planned.');
    }

    return {
      scope: 'single_project',
      reportType: normType,
      generatedDate: dateStr,
      projectOverview: {
        id: p.id,
        name: p.name,
        client: p.client || 'BuildOps Client Organization',
        location: p.location || 'Site Location Not Specified',
        manager: p.manager || 'Project Manager',
        status: p.status || 'In Progress',
        progress: p.progress || 0,
        startDate: p.startDate || 'Not specified',
        endDate: p.endDate || 'Not specified',
        budget: p.budget || 'Not available in the current BuildOps data.',
        spent: p.spent || 'Not available in the current BuildOps data.',
        isPastDeadline: p.isPastDeadline,
        daysUntilDeadline: p.daysUntilDeadline,
      },
      projectProgress: {
        progress: p.progress || 0,
        totalTasks: metrics.totalTasks,
        completedTasks: metrics.completedTasks,
        inProgressTasks: metrics.inProgressTasks,
        delayedTasks: metrics.delayedTasksCount,
        overdueTasks: metrics.overdueTasksCount,
        notStartedTasks: metrics.notStartedTasks,
        completionRatePercent: metrics.taskCompletionRatePercent,
        delayedList: delayedTasksList.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          progress: t.progress,
        })),
        overdueList: overdueTasksList.map((t) => ({
          title: t.title,
          dueDate: t.dueDate,
          daysOverdue: t.daysOverdue,
          priority: t.priority,
        })),
      },
      materialStatus: {
        totalMaterials: metrics.totalMaterials,
        availableCount: availableMaterialsList.length,
        lowStockCount: metrics.lowStockCount,
        outOfStockCount: metrics.outOfStockCount,
        lowStockList: lowStockList.map((m) => ({
          name: m.name,
          available: m.availableQuantity,
          required: m.requiredQuantity,
          unit: m.unit,
          stockPercentage: m.stockPercentage,
          deficit: m.deficit,
        })),
        outOfStockList: outOfStockList.map((m) => ({
          name: m.name,
          required: m.requiredQuantity,
          unit: m.unit,
          deficit: m.deficit,
        })),
      },
      scheduleStatus: {
        currentPosition: schedulePosition,
        overdueCount: overdueTasksList.length,
        upcomingDeadlines: tasks.filter((t) => t.isOverdue || t.status === 'Delayed').map((t) => ({
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
      },
      riskSummary: risks.map((r) => ({
        category: r.category,
        severity: r.severity,
        title: r.title,
        evidence: r.evidence,
        recommendation: r.recommendation,
      })),
      keyObservations: observations,
      recommendedActions: actions,
    };
  }

  // Portfolio Scope (All Projects)
  const allProjects = Array.isArray(context.portfolio) ? context.portfolio : (context.portfolio?.allProjects || []);
  const macro = context.macroMetrics || {};
  const totalProjects = macro.totalProjectsCount || allProjects.length;
  const avgProgress = typeof macro.averageProgress === 'number' ? macro.averageProgress : 0;

  const statusBreakdown = {
    inProgress: macro.inProgressProjectsCount ?? allProjects.filter((p) => p.status === 'In Progress').length,
    completed: macro.completedProjectsCount ?? allProjects.filter((p) => p.status === 'Completed').length,
    onHold: macro.onHoldProjectsCount ?? allProjects.filter((p) => p.status === 'On Hold').length,
    planning: macro.plannedProjectsCount ?? allProjects.filter((p) => p.status === 'Planning' || p.status === 'Planned').length,
  };

  const totalDelayed = macro.totalDelayedTasksAcrossAll ?? allProjects.reduce((acc, p) => acc + (p.delayedTasksCount || 0), 0);
  const totalOverdue = macro.totalOverdueTasksAcrossAll ?? allProjects.reduce((acc, p) => acc + (p.overdueTasksCount || 0), 0);
  const totalLowStock = macro.totalShortagesAcrossAll ?? allProjects.reduce((acc, p) => acc + (p.materialShortagesCount || 0), 0);
  const totalOutOfStock = allProjects.reduce((acc, p) => acc + (p.outOfStockCount || 0), 0);

  const projectsRequiringAttention = [];

  for (const p of allProjects) {
    const hasDelayed = (p.delayedTasksCount && p.delayedTasksCount > 0);
    const hasOverdue = (p.overdueTasksCount && p.overdueTasksCount > 0);
    const hasShortage = (p.materialShortagesCount && p.materialShortagesCount > 0);
    const hasRisks = (p.riskAnalysis && p.riskAnalysis.detectedRisksCount > 0);

    if (hasDelayed || hasOverdue || hasShortage || hasRisks) {
      const issues = [];
      if (hasDelayed) issues.push(`${p.delayedTasksCount} delayed task(s)`);
      if (hasOverdue) issues.push(`${p.overdueTasksCount} overdue task(s)`);
      if (hasShortage) issues.push(`${p.materialShortagesCount} material shortage(s)`);
      if (p.riskAnalysis?.risks?.[0]?.title) issues.push(p.riskAnalysis.risks[0].title);

      projectsRequiringAttention.push({
        name: p.name,
        progress: p.progress,
        status: p.status,
        evidence: issues.join('; ') || 'Schedule variance observed',
      });
    }
  }

  const operationalThemes = [];
  if (totalDelayed > 0 || totalOverdue > 0) {
    operationalThemes.push('Active trade schedule pressure on critical milestones');
  }
  if (totalLowStock > 0 || totalOutOfStock > 0) {
    operationalThemes.push('Material availability and procurement supply chain buffers');
  }
  if (operationalThemes.length === 0) {
    operationalThemes.push('All projects progressing within planned baseline tolerances');
  }

  const portfolioActions = [];
  if (totalDelayed > 0) {
    portfolioActions.push('Conduct site coordinator reviews for delayed critical-path tasks across affected projects.');
  }
  if (totalLowStock > 0 || totalOutOfStock > 0) {
    portfolioActions.push('Synchronize central vendor purchase orders to replenish low-stock materials before trade work stops.');
  }
  if (portfolioActions.length === 0) {
    portfolioActions.push('Continue monthly milestone verification and weekly site quality audits.');
  }

  return {
    scope: 'portfolio',
    reportType: normType === 'Construction Progress Report' ? 'Portfolio Construction Progress Report' : 'PORTFOLIO PROJECT STATUS REPORT',
    generatedDate: dateStr,
    overview: {
      totalProjects,
      averageProgress: avgProgress,
      statusBreakdown,
    },
    tasks: {
      totalDelayed,
      totalOverdue,
    },
    materials: {
      totalLowStock,
      totalOutOfStock,
    },
    projectsRequiringAttention,
    operationalThemes,
    recommendedActions: portfolioActions,
  };
};

/**
 * Generates a clean, professional markdown report directly from deterministic data
 * Used as a fallback when Gemini is unavailable, and for strict validation.
 *
 * @param {Object} data - Deterministic report data
 * @returns {string} Factual Markdown Report
 */
export const formatDeterministicReportFallback = (data) => {
  if (data.scope === 'single_project') {
    const p = data.projectOverview;
    const prog = data.projectProgress;
    const mat = data.materialStatus;
    const sched = data.scheduleStatus;

    let md = `## ${data.reportType.toUpperCase()}\n\n`;
    md += `**Generated Date:** ${data.generatedDate}\n\n`;

    md += `### PROJECT OVERVIEW\n`;
    md += `- **Project Name:** ${p.name}\n`;
    md += `- **Client:** ${p.client}\n`;
    md += `- **Location:** ${p.location}\n`;
    md += `- **Current Status:** ${p.status}\n`;
    md += `- **Overall Progress:** ${p.progress}%\n`;
    md += `- **Start Date:** ${p.startDate}\n`;
    md += `- **End Date:** ${p.endDate}\n`;
    md += `- **Budget:** ${p.budget}\n`;
    md += `- **Spent:** ${p.spent}\n\n`;

    md += `### PROJECT PROGRESS\n`;
    md += `- **Current Progress:** ${prog.progress}%\n`;
    if (prog.totalTasks > 0) {
      md += `- **Task Summary:** ${prog.totalTasks} total tasks tracked (${prog.completionRatePercent}% completion rate)\n`;
      md += `  - Completed: ${prog.completedTasks}\n`;
      md += `  - In Progress: ${prog.inProgressTasks}\n`;
      md += `  - Delayed: ${prog.delayedTasks}\n`;
      md += `  - Overdue: ${prog.overdueTasks}\n`;
      md += `  - Not Started: ${prog.notStartedTasks}\n`;
      if (prog.delayedList.length > 0) {
        md += `\n**Delayed Tasks:**\n`;
        prog.delayedList.forEach((t) => {
          md += `- ${t.title} (Priority: ${t.priority}, Due: ${t.dueDate || 'N/A'}, Progress: ${t.progress || 0}%)\n`;
        });
      }
    } else {
      md += `- **Task Summary:** No task records available for this project in the current BuildOps data.\n`;
    }
    md += `\n`;

    md += `### MATERIAL STATUS\n`;
    if (mat.totalMaterials > 0) {
      md += `- **Available Materials:** ${mat.availableCount}\n`;
      md += `- **Low-Stock Materials:** ${mat.lowStockCount}\n`;
      md += `- **Out-of-Stock Materials:** ${mat.outOfStockCount}\n`;
      if (mat.lowStockList.length > 0) {
        md += `\n**Low-Stock Items:**\n`;
        mat.lowStockList.forEach((m) => {
          md += `- ${m.name}: ${m.available} ${m.unit} available / ${m.required} ${m.unit} required (Deficit: ${m.deficit} ${m.unit})\n`;
        });
      }
      if (mat.outOfStockList.length > 0) {
        md += `\n**Out-of-Stock Items:**\n`;
        mat.outOfStockList.forEach((m) => {
          md += `- ${m.name}: Deficit of ${m.deficit} ${m.unit}\n`;
        });
      }
    } else {
      md += `Material information is unavailable for this project in current BuildOps data.\n`;
    }
    md += `\n`;

    md += `### SCHEDULE STATUS\n`;
    md += `- **Current Position:** ${sched.currentPosition}\n`;
    md += `- **Overdue Activities:** ${sched.overdueCount}\n`;
    if (sched.upcomingDeadlines.length > 0) {
      md += `- **Activities Requiring Schedule Attention:**\n`;
      sched.upcomingDeadlines.slice(0, 4).forEach((d) => {
        md += `  - ${d.title} (Status: ${d.status}, Due: ${d.dueDate || 'N/A'})\n`;
      });
    }
    md += `\n`;

    md += `### RISK SUMMARY\n`;
    if (data.riskSummary && data.riskSummary.length > 0) {
      data.riskSummary.forEach((r, i) => {
        md += `**${i + 1}. ${r.category} — ${r.severity}**\n`;
        md += `- **Evidence:** ${r.evidence.join('; ')}\n`;
        md += `- **Recommendation:** ${r.recommendation}\n\n`;
      });
    } else {
      md += `No critical operational risks were detected from the currently available BuildOps data.\n\n`;
    }

    md += `### KEY OBSERVATIONS\n`;
    data.keyObservations.forEach((obs) => {
      md += `- ${obs}\n`;
    });
    md += `\n`;

    md += `### RECOMMENDED ACTIONS\n`;
    data.recommendedActions.forEach((act, idx) => {
      md += `${idx + 1}. ${act}\n`;
    });
    md += `\n*Safety Limitation: No structural safety conclusion can be made from the available project-management data.*`;

    return md.trim();
  }

  // Portfolio Fallback
  let md = `## PORTFOLIO PROJECT STATUS REPORT\n\n`;
  md += `**Generated Date:** ${data.generatedDate}\n\n`;

  md += `### PORTFOLIO OVERVIEW\n`;
  md += `- **Total Active Projects:** ${data.overview.totalProjects}\n`;
  md += `- **Average Progress:** ${data.overview.averageProgress}%\n`;
  md += `- **Status Breakdown:**\n`;
  md += `  - In Progress: ${data.overview.statusBreakdown.inProgress}\n`;
  md += `  - Completed: ${data.overview.statusBreakdown.completed}\n`;
  md += `  - On Hold: ${data.overview.statusBreakdown.onHold}\n`;
  md += `  - Planning: ${data.overview.statusBreakdown.planning}\n\n`;

  md += `### TASK ATTENTION\n`;
  md += `- **Delayed Tasks:** ${data.tasks.totalDelayed} across active portfolio\n`;
  md += `- **Overdue Tasks:** ${data.tasks.totalOverdue} across active portfolio\n\n`;

  md += `### MATERIAL ATTENTION\n`;
  md += `- **Low-Stock Materials:** ${data.materials.totalLowStock}\n`;
  md += `- **Out-of-Stock Materials:** ${data.materials.totalOutOfStock}\n\n`;

  md += `### PROJECTS REQUIRING ATTENTION\n`;
  if (data.projectsRequiringAttention.length > 0) {
    data.projectsRequiringAttention.forEach((p) => {
      md += `- **${p.name}** (${p.progress}%): ${p.evidence}\n`;
    });
  } else {
    md += `- All projects operating within scheduled baseline limits.\n`;
  }
  md += `\n`;

  md += `### COMMON OPERATIONAL THEMES\n`;
  data.operationalThemes.forEach((theme) => {
    md += `- ${theme}\n`;
  });
  md += `\n`;

  md += `### RECOMMENDED MANAGEMENT ACTIONS\n`;
  data.recommendedActions.forEach((act, idx) => {
    md += `${idx + 1}. ${act}\n`;
  });

  return md.trim();
};

/**
 * Generates an AI-powered project report using Gemini with deterministic fallback.
 *
 * @param {string} projectId - Project ObjectId or 'all'
 * @param {string} [reportType='Project Status Report'] - Report type
 * @returns {Promise<{ answer: string, sources: Array<{ type: string, label: string }>, confidence: string, reportData: Object, reportType: string, projectId: string }>}
 */
export const generateProjectReport = async (projectId, reportType = 'Project Status Report') => {
  // 1. Validate projectId
  if (projectId && projectId !== 'all' && !isValidObjectId(projectId)) {
    const error = new Error(`Invalid project ID format: ${projectId}`);
    error.statusCode = 400;
    throw error;
  }

  const normType = normalizeReportType(reportType);

  // 2. Fetch deterministic facts from MongoDB
  const reportData = await buildDeterministicReportData(projectId, normType);

  // 3. Prepare Sources list based on real collections accessed
  const sources = [{ type: 'project', label: 'Project Data' }];
  if (reportData.scope === 'single_project') {
    if (reportData.projectProgress.totalTasks > 0) sources.push({ type: 'tasks', label: 'Task Data' });
    if (reportData.materialStatus.totalMaterials > 0) sources.push({ type: 'materials', label: 'Material Data' });
    sources.push({ type: 'inference', label: 'Risk Analysis' });
  } else {
    sources.push({ type: 'tasks', label: 'Task Data' });
    sources.push({ type: 'materials', label: 'Material Data' });
    sources.push({ type: 'inference', label: 'Risk Analysis' });
  }

  // 4. Prompt Gemini AI with strict rules
  const systemInstruction = `You are BuildOps AI, a specialized Construction and Project Intelligence Assistant.
Generate a formal, professional construction project report based ONLY on the supplied deterministic data.

REPORT FORMAT REQUIREMENTS:
For a specific project, include these exact headings:
### PROJECT OVERVIEW
### PROJECT PROGRESS
### MATERIAL STATUS
### SCHEDULE STATUS
### RISK SUMMARY
### KEY OBSERVATIONS
### RECOMMENDED ACTIONS

For portfolio (All Projects), include:
### PORTFOLIO OVERVIEW
### TASK ATTENTION
### MATERIAL ATTENTION
### PROJECTS REQUIRING ATTENTION
### COMMON OPERATIONAL THEMES
### RECOMMENDED MANAGEMENT ACTIONS

CRITICAL GROUNDING RULES:
1. Ground every figure, name, and count strictly in the provided data. Never fabricate contractor names, budgets, percentages, dates, task names, material quantities, or safety records.
2. If task or material data is absent, state: "Not available in the current BuildOps data."
3. Avoid false certainty: use "indicates potential schedule risk" instead of "will be delayed".
4. Safety Limitation: Never make structural or engineering safety conclusions from project management data. Always conclude with:
   "*Safety Limitation: No structural safety conclusion can be made from the available project-management data.*"
5. Do not expose internal database IDs, connection strings, or system code.

At the very end of your response, output a single invisible metadata tag:
<!-- METADATA {"sources": ${JSON.stringify(sources.map((s) => s.type))}, "confidence": "High"} -->`;

  const promptText = `Generate a professional ${normType} using this exact deterministic construction data:
${JSON.stringify(reportData, null, 2)}`;

  let finalAnswer = '';
  try {
    const rawAiText = await callGemini(promptText, systemInstruction, false);
    const validated = extractAndValidateSourcesAndConfidence(rawAiText, {
      hasDocs: false,
      hasImages: false,
      documents: [],
      images: [],
      effectiveQuestion: normType,
    });
    finalAnswer = validated.answer;
  } catch (aiErr) {
    console.warn(`[Project Report] Gemini API call failed (${aiErr.message}), falling back to deterministic synthesis.`);
    finalAnswer = formatDeterministicReportFallback(reportData);
  }

  return {
    answer: finalAnswer,
    sources,
    confidence: 'High',
    reportData,
    reportType: normType,
    projectId: projectId || 'all',
  };
};
