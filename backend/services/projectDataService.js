import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';
import { calculateProjectRisksFromData, detectPortfolioRisks } from './riskAnalysisService.js';

/**
 * Validates whether a given string is a valid MongoDB ObjectId
 * @param {string} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Retrieves and compiles strictly factual, real-time MongoDB data for a project
 * Executes parallel database queries for optimal performance.
 * @param {string} projectId
 * @returns {Promise<Object>} Structured project context
 */
export const getProjectContext = async (projectId) => {
  if (!projectId || !isValidObjectId(projectId)) {
    const error = new Error('Invalid project ID provided.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Concurrently fetch Project, Tasks, and Materials using Promise.all for high performance
  const [project, tasks, materials] = await Promise.all([
    Project.findById(projectId).lean(),
    Task.find({ projectId }).sort({ dueDate: 1 }).lean(),
    Material.find({ projectId }).sort({ name: 1 }).lean(),
  ]);

  if (!project) {
    const error = new Error(`Project with ID ${projectId} not found in database.`);
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 2. Calculate Objective Task Metrics & Date-Aware Comparisons
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const delayedTasks = tasks.filter((t) => t.status === 'Delayed');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'Not Started').length;

  // Tasks past due date that are not completed
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
  );

  // Tasks due within the upcoming 7 days
  const upcomingTasksThisWeek = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= endOfWeek
  );

  // Critical / High priority delayed or overdue tasks
  const highPriorityDelayed = tasks.filter(
    (t) => (t.priority === 'Critical' || t.priority === 'High') && (t.status === 'Delayed' || (t.dueDate && new Date(t.dueDate) < now))
  );

  // 3. Calculate Objective Material Metrics
  const totalMaterials = materials.length;
  const lowStockMaterials = materials.filter((m) => m.status === 'Low Stock');
  const outOfStockMaterials = materials.filter((m) => m.status === 'Out of Stock');

  const materialsWithStockLevels = materials.map((m) => {
    const req = Number(m.requiredQuantity) || 0;
    const avail = Number(m.availableQuantity) || 0;
    const used = Number(m.usedQuantity) || 0;
    const stockPercentage = req > 0 ? Math.round((avail / req) * 100) : 0;
    const deficit = Math.max(0, req - avail);

    return {
      name: m.name,
      category: m.category,
      requiredQuantity: req,
      availableQuantity: avail,
      usedQuantity: used,
      unit: m.unit,
      status: m.status,
      stockPercentage,
      deficit,
    };
  });

  // 4. Calculate Timeline Status & Deadline Proximity
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.endDate ? new Date(project.endDate) : null;
  const isPastDeadline = end && now > end && project.status !== 'Completed';
  const daysUntilDeadline = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;
  const isApproachingDeadline = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 30;

  // Build clean, strictly grounded context object
  return {
    referenceDate: now.toISOString().split('T')[0],
    project: {
      id: project._id.toString(),
      name: project.name,
      client: project.client,
      location: project.location,
      manager: project.manager,
      startDate: project.startDate ? project.startDate.toISOString().split('T')[0] : null,
      endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : null,
      progress: project.progress,
      status: project.status,
      risk: project.risk,
      budget: project.budget,
      spent: project.spent,
      isPastDeadline,
      daysUntilDeadline,
      isApproachingDeadline,
    },
    tasks: tasks.map((t) => {
      const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed';
      const daysOverdue = isOverdue ? Math.floor((now - new Date(t.dueDate)) / (1000 * 60 * 60 * 24)) : 0;
      return {
        id: t._id.toString(),
        title: t.title,
        description: t.description || 'No description provided.',
        assignedTo: t.assignedTo || 'Unassigned',
        startDate: t.startDate ? t.startDate.toISOString().split('T')[0] : null,
        dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
        status: t.status,
        progress: t.progress,
        priority: t.priority,
        isOverdue,
        daysOverdue,
      };
    }),
    materials: materialsWithStockLevels,
    calculatedMetrics: {
      totalTasks,
      completedTasks,
      delayedTasksCount: delayedTasks.length,
      overdueTasksCount: overdueTasks.length,
      upcomingTasksThisWeekCount: upcomingTasksThisWeek.length,
      inProgressTasks,
      notStartedTasks,
      highPriorityDelayedCount: highPriorityDelayed.length,
      totalMaterials,
      lowStockCount: lowStockMaterials.length,
      outOfStockCount: outOfStockMaterials.length,
      taskCompletionRatePercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    // 5. Deterministic Risk Detection (Task 9 Backend Calculated Rules)
    riskAnalysis: calculateProjectRisksFromData(project, tasks, materials, now),
  };
};

/**
 * Retrieves chat context based on user selection:
 * - If a specific project is selected: queries ONLY that project, its tasks, and materials (avoids querying entire DB).
 * - If 'all' or omitted: queries portfolio summary across all projects concurrently.
 * @param {string} [projectId]
 * @returns {Promise<Object>}
 */
export const getChatContext = async (projectId) => {
  if (projectId && projectId !== 'all') {
    if (!isValidObjectId(projectId)) {
      const error = new Error(`Invalid project ID format: ${projectId}`);
      error.statusCode = 400;
      throw error;
    }

    const selectedProject = await getProjectContext(projectId);
    return {
      type: 'single_project',
      project: selectedProject,
      risks: selectedProject.riskAnalysis,
      formattedText: formatProjectContextForAI({
        type: 'single_project',
        project: selectedProject,
        risks: selectedProject.riskAnalysis,
      }),
    };
  }

  const now = new Date();

  // Concurrently fetch all projects, tasks, and materials using Promise.all
  const [allProjects, allTasks, allMaterials] = await Promise.all([
    Project.find({}).sort({ name: 1 }).lean(),
    Task.find({}).lean(),
    Material.find({}).lean(),
  ]);

  // Deterministic Macro Portfolio Calculations
  const totalProjectsCount = allProjects.length;
  const inProgressProjectsCount = allProjects.filter((p) => p.status === 'In Progress').length;
  const completedProjectsCount = allProjects.filter((p) => p.status === 'Completed').length;
  const onHoldProjectsCount = allProjects.filter((p) => p.status === 'On Hold').length;
  const plannedProjectsCount = allProjects.filter((p) => p.status === 'Planning' || p.status === 'Planned').length;

  const totalProgressSum = allProjects.reduce((sum, p) => sum + (Number(p.progress) || 0), 0);
  const averageProgress = totalProjectsCount > 0 ? Math.round(totalProgressSum / totalProjectsCount) : 0;

  const portfolioRisksList = [];

  const allProjectsPortfolio = allProjects.map((p) => {
    const pIdStr = p._id.toString();
    const pTasks = allTasks.filter((t) => t.projectId && t.projectId.toString() === pIdStr);
    const pMaterials = allMaterials.filter((m) => m.projectId && m.projectId.toString() === pIdStr);

    // Compute deterministic risk for each project without additional DB roundtrips
    const projectRiskAnalysis = calculateProjectRisksFromData(p, pTasks, pMaterials, now);
    if (projectRiskAnalysis.detectedRisksCount > 0) {
      portfolioRisksList.push({
        projectId: pIdStr,
        projectName: p.name,
        location: p.location,
        manager: p.manager,
        progress: p.progress,
        status: p.status,
        overallRiskLevel: projectRiskAnalysis.overallRiskLevel,
        detectedRisksCount: projectRiskAnalysis.detectedRisksCount,
        topRisks: projectRiskAnalysis.risks.slice(0, 3),
      });
    }

    const delayed = pTasks.filter((t) => t.status === 'Delayed');
    const overdue = pTasks.filter((t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now);
    const completed = pTasks.filter((t) => t.status === 'Completed');
    const inProgress = pTasks.filter((t) => t.status === 'In Progress');
    const shortages = pMaterials.filter((m) => m.status === 'Low Stock' || m.status === 'Out of Stock');

    const end = p.endDate ? new Date(p.endDate) : null;
    const daysUntilDeadline = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;

    return {
      id: pIdStr,
      name: p.name,
      client: p.client,
      location: p.location,
      manager: p.manager,
      progress: p.progress,
      status: p.status,
      risk: p.risk,
      budget: p.budget,
      spent: p.spent,
      startDate: p.startDate ? p.startDate.toISOString().split('T')[0] : null,
      endDate: p.endDate ? p.endDate.toISOString().split('T')[0] : null,
      daysUntilDeadline,
      totalTasks: pTasks.length,
      completedTasksCount: completed.length,
      delayedTasksCount: delayed.length,
      overdueTasksCount: overdue.length,
      inProgressTasksCount: inProgress.length,
      delayedTaskTitles: delayed.map((d) => d.title),
      totalMaterials: pMaterials.length,
      materialShortagesCount: shortages.length,
      shortageMaterialNames: shortages.map((s) => `${s.name} (${s.status})`),
      riskAnalysis: projectRiskAnalysis,
    };
  });

  // Sort portfolio risks by severity
  const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  portfolioRisksList.sort(
    (a, b) => (severityWeight[b.overallRiskLevel] || 0) - (severityWeight[a.overallRiskLevel] || 0)
  );

  const portfolioRisks = {
    totalProjectsCount,
    projectsWithRisksCount: portfolioRisksList.length,
    portfolioRisks: portfolioRisksList,
    message:
      portfolioRisksList.length === 0
        ? 'No significant operational risks were detected across the portfolio from currently available BuildOps data.'
        : `${portfolioRisksList.length} out of ${totalProjectsCount} project(s) exhibit operational risk signals.`,
    safetyNotice: 'No structural safety conclusion can be made from the available project-management data.',
  };

  const totalDelayedTasksAcrossAll = allProjectsPortfolio.reduce((sum, p) => sum + p.delayedTasksCount, 0);
  const totalOverdueTasksAcrossAll = allProjectsPortfolio.reduce((sum, p) => sum + p.overdueTasksCount, 0);
  const totalShortagesAcrossAll = allProjectsPortfolio.reduce((sum, p) => sum + p.materialShortagesCount, 0);

  const lowestProgressProjects = [...allProjectsPortfolio]
    .filter((p) => p.status !== 'Completed')
    .sort((a, b) => (a.progress || 0) - (b.progress || 0))
    .slice(0, 3)
    .map((p) => `${p.name} (${p.progress}%)`);

  const approachingDeadlineProjects = allProjectsPortfolio
    .filter((p) => p.daysUntilDeadline !== null && p.daysUntilDeadline >= 0 && p.daysUntilDeadline <= 45 && p.status !== 'Completed')
    .map((p) => `${p.name} (${p.daysUntilDeadline} days left)`);

  const portfolioContext = {
    type: 'all_projects',
    referenceDate: now.toISOString().split('T')[0],
    macroMetrics: {
      totalProjectsCount,
      inProgressProjectsCount,
      completedProjectsCount,
      onHoldProjectsCount,
      plannedProjectsCount,
      averageProgress,
      totalDelayedTasksAcrossAll,
      totalOverdueTasksAcrossAll,
      totalShortagesAcrossAll,
      lowestProgressProjects,
      approachingDeadlineProjects,
    },
    portfolio: allProjectsPortfolio,
    risks: portfolioRisks,
  };

  return {
    ...portfolioContext,
    formattedText: formatProjectContextForAI(portfolioContext),
  };
};

/**
 * Formats MongoDB project records into clean, compact, structured text for Gemini AI
 * @param {Object} contextData
 * @returns {string}
 */
export const formatProjectContextForAI = (contextData) => {
  if (!contextData) return 'No project context available.';

  const referenceDate = contextData.referenceDate || new Date().toISOString().split('T')[0];

  if (contextData.type === 'single_project' && contextData.project) {
    const { project, tasks, materials, calculatedMetrics, riskAnalysis } = contextData.project;

    const projectInfo = [
      `=== PROJECT CONTEXT (MongoDB Source of Truth - Current Date: ${referenceDate}) ===`,
      `Project Name: ${project.name}`,
      `Client: ${project.client || 'N/A'}`,
      `Location: ${project.location || 'N/A'}`,
      `Project Manager: ${project.manager || 'N/A'}`,
      `Current Progress: ${project.progress}%`,
      `Status: ${project.status}`,
      `Risk Level: ${project.risk}`,
      `Start Date: ${project.startDate || 'N/A'}`,
      `Expected End Date: ${project.endDate || 'N/A'}${project.isPastDeadline ? ' (PAST DEADLINE)' : ''}`,
      `Days Remaining: ${project.daysUntilDeadline !== null ? project.daysUntilDeadline : 'N/A'}`,
      project.budget ? `Budget: ₹${project.budget.toLocaleString?.() || project.budget}` : '',
      project.spent ? `Spent: ₹${project.spent.toLocaleString?.() || project.spent}` : '',
    ].filter(Boolean).join('\n');

    let tasksInfo = '';
    if (!tasks || tasks.length === 0) {
      tasksInfo = `=== TASKS ===\nThere are currently no task records available for this project.`;
    } else {
      const taskLines = tasks.map((t, i) => {
        const overdueNote = t.isOverdue ? ` [OVERDUE by ${t.daysOverdue} days]` : '';
        return `${i + 1}. ${t.title}
   Status: ${t.status} | Priority: ${t.priority} | Progress: ${t.progress}% | Due Date: ${t.dueDate || 'N/A'}${overdueNote} | Assigned: ${t.assignedTo}
   Description: ${t.description}`;
      });
      tasksInfo = [
        `=== TASKS (Total: ${calculatedMetrics.totalTasks}, Completed: ${calculatedMetrics.completedTasks}, Delayed: ${calculatedMetrics.delayedTasksCount}, Overdue: ${calculatedMetrics.overdueTasksCount}, Upcoming This Week: ${calculatedMetrics.upcomingTasksThisWeekCount}) ===`,
        ...taskLines,
      ].join('\n');
    }

    let materialsInfo = '';
    if (!materials || materials.length === 0) {
      materialsInfo = `=== MATERIALS ===\nThere are currently no material records available for this project.`;
    } else {
      const materialLines = materials.map((m, i) => {
        const deficitNote = m.deficit > 0 ? ` (Deficit: ${m.deficit} ${m.unit})` : '';
        return `${i + 1}. ${m.name} (Category: ${m.category})
   Required: ${m.requiredQuantity} ${m.unit} | Available: ${m.availableQuantity} ${m.unit} | Used: ${m.usedQuantity} ${m.unit} | Status: ${m.status} (${m.stockPercentage}% available)${deficitNote}`;
      });
      materialsInfo = [
        `=== MATERIALS (Total: ${calculatedMetrics.totalMaterials}, Low Stock: ${calculatedMetrics.lowStockCount}, Out of Stock: ${calculatedMetrics.outOfStockCount}) ===`,
        ...materialLines,
      ].join('\n');
    }

    // Deterministic Operational Risk Analysis (Task 9 Backend Engine)
    let risksInfo = '';
    const activeRiskObj = riskAnalysis || contextData.risks;
    if (activeRiskObj) {
      const { overallRiskLevel, detectedRisksCount, risks, message, safetyNotice } = activeRiskObj;
      if (detectedRisksCount === 0) {
        risksInfo = [
          `=== DETERMINISTIC OPERATIONAL RISK ANALYSIS (Backend Rule Engine) ===`,
          `Overall Project Risk Level: ${overallRiskLevel}`,
          `Status: ${message}`,
          `Safety Limitation: ${safetyNotice}`,
        ].join('\n');
      } else {
        const riskBlocks = risks.map((r, i) => {
          return `${i + 1}. [${r.severity}] ${r.category}: ${r.title}
   Description: ${r.description}
   Evidence:
${r.evidence.map((ev) => `   - ${ev}`).join('\n')}
   Recommendation: ${r.recommendation}`;
        });

        risksInfo = [
          `=== DETERMINISTIC OPERATIONAL RISK ANALYSIS (Backend Rule Engine) ===`,
          `Overall Project Risk Level: ${overallRiskLevel} (${detectedRisksCount} operational risks detected)`,
          ...riskBlocks,
          `Safety Limitation: ${safetyNotice}`,
        ].join('\n');
      }
    }

    return [projectInfo, tasksInfo, materialsInfo, risksInfo].filter(Boolean).join('\n\n');
  }

  if (contextData.type === 'all_projects' && Array.isArray(contextData.portfolio)) {
    const { macroMetrics, portfolio, risks: portfolioRisksObj } = contextData;

    const macroHeader = [
      `=== ALL PROJECTS PORTFOLIO SUMMARY (MongoDB Source of Truth - Current Date: ${referenceDate}) ===`,
      `• Total Projects: ${macroMetrics.totalProjectsCount} (In Progress: ${macroMetrics.inProgressProjectsCount}, Completed: ${macroMetrics.completedProjectsCount}, On Hold: ${macroMetrics.onHoldProjectsCount}, Planning: ${macroMetrics.plannedProjectsCount})`,
      `• Portfolio Average Progress: ${macroMetrics.averageProgress}%`,
      `• Total Delayed Tasks Across Portfolio: ${macroMetrics.totalDelayedTasksAcrossAll}`,
      `• Total Overdue Tasks Across Portfolio: ${macroMetrics.totalOverdueTasksAcrossAll}`,
      `• Total Material Shortages Across Portfolio: ${macroMetrics.totalShortagesAcrossAll}`,
      macroMetrics.lowestProgressProjects.length > 0 ? `• Lowest Progress Projects: ${macroMetrics.lowestProgressProjects.join(', ')}` : '',
      macroMetrics.approachingDeadlineProjects.length > 0 ? `• Approaching Deadlines: ${macroMetrics.approachingDeadlineProjects.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    let portfolioRisksInfo = '';
    if (portfolioRisksObj && Array.isArray(portfolioRisksObj.portfolioRisks)) {
      const { totalProjectsCount, projectsWithRisksCount, portfolioRisks: pList, message, safetyNotice } = portfolioRisksObj;
      if (projectsWithRisksCount === 0) {
        portfolioRisksInfo = [
          `=== PORTFOLIO DETERMINISTIC RISK ANALYSIS ===`,
          `Status: ${message}`,
          `Safety Limitation: ${safetyNotice}`,
        ].join('\n');
      } else {
        const riskLines = pList.map((p, i) => {
          const topRiskSummaries = p.topRisks.map((r) => `${r.category} (${r.severity}: ${r.title})`).join('; ');
          return `${i + 1}. ${p.projectName} (${p.location || 'N/A'})
   Overall Risk Level: ${p.overallRiskLevel} | Progress: ${p.progress}% | Status: ${p.status}
   Active Risks (${p.detectedRisksCount}): ${topRiskSummaries}`;
        });

        portfolioRisksInfo = [
          `=== PORTFOLIO DETERMINISTIC RISK ANALYSIS (${projectsWithRisksCount}/${totalProjectsCount} projects exhibit operational risk signals) ===`,
          ...riskLines,
          `Safety Limitation: ${safetyNotice}`,
        ].join('\n');
      }
    }

    const portfolioLines = portfolio.map((p, i) => {
      const delayedInfo = p.delayedTasksCount > 0 ? ` | Delayed Tasks (${p.delayedTasksCount}): ${p.delayedTaskTitles.join(', ')}` : '';
      const overdueInfo = p.overdueTasksCount > 0 ? ` | Overdue Tasks: ${p.overdueTasksCount}` : '';
      const shortageInfo = p.materialShortagesCount > 0 ? ` | Material Shortages (${p.materialShortagesCount}): ${p.shortageMaterialNames.join(', ')}` : '';
      const riskLevel = p.riskAnalysis?.overallRiskLevel || p.risk || 'Low';
      return `${i + 1}. ${p.name}
   Location: ${p.location} | Client: ${p.client} | Manager: ${p.manager}
   Progress: ${p.progress}% | Status: ${p.status} | Overall Risk Level: ${riskLevel} | Timeline: ${p.startDate || 'N/A'} to ${p.endDate || 'N/A'}
   Tasks: ${p.totalTasks} total (${p.completedTasksCount} completed, ${p.delayedTasksCount} delayed${delayedInfo}${overdueInfo})
   Materials: ${p.totalMaterials} total (${p.materialShortagesCount} shortages${shortageInfo})`;
    });

    return [
      macroHeader,
      portfolioRisksInfo,
      `--- INDIVIDUAL PROJECT DETAILS ---`,
      ...portfolioLines,
    ].filter(Boolean).join('\n\n');
  }

  return 'No project context available.';
};

