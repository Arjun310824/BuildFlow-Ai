import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';
import { isValidObjectId } from './projectDataService.js';

/**
 * BuildOps AI — Deterministic Risk Detection Service
 *
 * Implements construction-focused operational risk rules based strictly on real MongoDB data.
 * All risks are computed deterministically from existing project, task, and material schemas.
 * Gemini AI is used exclusively for explanation and synthesis, never for calculating risk signals.
 */

export const RISK_CATEGORIES = {
  SCHEDULE: 'Schedule Risk',
  MATERIAL: 'Material Risk',
  PROGRESS: 'Project Progress Risk',
  DEADLINE: 'Deadline Risk',
  OPERATIONAL: 'Operational Risk',
};

export const RISK_SEVERITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

/**
 * Pure calculation engine: Evaluates deterministic risk rules on pre-loaded MongoDB records.
 * Avoids duplicate database roundtrips.
 *
 * @param {Object} project - Project document / lean object
 * @param {Array} [tasks=[]] - List of task documents / lean objects for this project
 * @param {Array} [materials=[]] - List of material documents / lean objects for this project
 * @param {Date|string} [referenceDate=new Date()] - Reference date for date calculations
 * @returns {Object} Structured risk analysis result
 */
export const calculateProjectRisksFromData = (
  project,
  tasks = [],
  materials = [],
  referenceDate = new Date()
) => {
  if (!project) {
    const error = new Error('Project data is required for risk calculation.');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date(referenceDate);
  const detectedRisks = [];

  const projectIdStr = project._id ? project._id.toString() : project.id || 'unknown';
  const projectName = project.name || 'Unnamed Project';
  const progress = Number(project.progress) || 0;

  // =========================================================================
  // 1. SCHEDULE RISKS (Overdue, Delayed, High-Priority Critical Path Tasks)
  // =========================================================================
  const delayedTasks = tasks.filter((t) => t.status === 'Delayed');
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
  );

  // Critical or High priority tasks that are delayed or overdue
  const highPriorityDelayedOrOverdue = tasks.filter(
    (t) =>
      (t.priority === 'High' || t.priority === 'Critical') &&
      (t.status === 'Delayed' || (t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now))
  );

  if (highPriorityDelayedOrOverdue.length > 0) {
    const hasMultipleOrCritical =
      highPriorityDelayedOrOverdue.length >= 2 ||
      highPriorityDelayedOrOverdue.some((t) => t.priority === 'Critical');

    detectedRisks.push({
      category: RISK_CATEGORIES.SCHEDULE,
      severity: hasMultipleOrCritical ? RISK_SEVERITY.CRITICAL : RISK_SEVERITY.HIGH,
      title: `${highPriorityDelayedOrOverdue.length} High/Critical Priority Task(s) Delayed or Overdue`,
      description: `Immediate schedule risk: High-impact activities on the critical path have exceeded planned timelines or are marked delayed.`,
      evidence: highPriorityDelayedOrOverdue.map((t) => {
        const dueStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A';
        const isPast = t.dueDate && new Date(t.dueDate) < now;
        return `Task "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Progress: ${t.progress || 0}% | Due: ${dueStr}${isPast ? ' (OVERDUE)' : ''}`;
      }),
      recommendation: `Consider reviewing trade crew allocations and float dependencies immediately with the site in-charge to prevent cascading milestone delays.`,
    });
  } else if (delayedTasks.length > 0 || overdueTasks.length > 0) {
    const combinedUnique = Array.from(new Set([...delayedTasks, ...overdueTasks]));
    detectedRisks.push({
      category: RISK_CATEGORIES.SCHEDULE,
      severity: combinedUnique.length >= 3 ? RISK_SEVERITY.HIGH : RISK_SEVERITY.MEDIUM,
      title: `${combinedUnique.length} Task(s) Delayed or Overdue`,
      description: `Schedule variance observed: Project activities have missed or are running behind scheduled completion dates.`,
      evidence: combinedUnique.map((t) => {
        const dueStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A';
        return `Task "${t.title}" | Status: ${t.status} | Priority: ${t.priority || 'Medium'} | Progress: ${t.progress || 0}% | Due: ${dueStr}`;
      }),
      recommendation: `Consider reviewing task progress with subcontractors and re-baselining upcoming completion targets.`,
    });
  } else {
    // Check for approaching due dates with low progress as early warning (Low severity)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingLaggingTasks = tasks.filter(
      (t) =>
        t.status !== 'Completed' &&
        t.dueDate &&
        new Date(t.dueDate) >= now &&
        new Date(t.dueDate) <= sevenDaysFromNow &&
        (Number(t.progress) || 0) < 40
    );

    if (upcomingLaggingTasks.length > 0) {
      detectedRisks.push({
        category: RISK_CATEGORIES.SCHEDULE,
        severity: RISK_SEVERITY.LOW,
        title: `${upcomingLaggingTasks.length} Task(s) Approaching Due Date with Low Progress`,
        description: `Early warning: Tasks scheduled for completion within the next 7 days currently have less than 40% recorded progress.`,
        evidence: upcomingLaggingTasks.map((t) => {
          const dueStr = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A';
          return `Task "${t.title}" | Status: ${t.status} | Priority: ${t.priority} | Progress: ${t.progress}% | Due: ${dueStr}`;
        }),
        recommendation: `Consider verifying daily work output with field crews to ensure milestone dates are met without last-minute delays.`,
      });
    }
  }

  // =========================================================================
  // 2. MATERIAL RISKS (Stockouts, Low Stock, Shortages)
  // =========================================================================
  const outOfStockMaterials = materials.filter(
    (m) => m.status === 'Out of Stock' || (Number(m.availableQuantity) || 0) <= 0
  );
  const lowStockMaterials = materials.filter(
    (m) => m.status === 'Low Stock' && (Number(m.availableQuantity) || 0) > 0
  );

  if (outOfStockMaterials.length > 0) {
    detectedRisks.push({
      category: RISK_CATEGORIES.MATERIAL,
      severity: RISK_SEVERITY.CRITICAL,
      title: `${outOfStockMaterials.length} Material Stockout(s) Detected`,
      description: `Operational halt risk: Critical materials have zero available inventory on site.`,
      evidence: outOfStockMaterials.map((m) => {
        const req = Number(m.requiredQuantity) || 0;
        return `Material "${m.name}" (${m.category || 'General'}) | Available: 0 ${m.unit || 'units'} | Required: ${req} ${m.unit || 'units'} | Status: Out of Stock`;
      }),
      recommendation: `Consider expediting emergency supplier delivery and checking active purchase orders to resume work without idling trade labor.`,
    });
  }

  if (lowStockMaterials.length > 0) {
    const hasStructuralShortage = lowStockMaterials.some((m) => {
      const name = (m.name || '').toLowerCase();
      const cat = (m.category || '').toLowerCase();
      return (
        cat.includes('steel') ||
        cat.includes('structural') ||
        cat.includes('cement') ||
        name.includes('rebar') ||
        name.includes('cement') ||
        name.includes('concrete')
      );
    });

    detectedRisks.push({
      category: RISK_CATEGORIES.MATERIAL,
      severity: hasStructuralShortage ? RISK_SEVERITY.HIGH : RISK_SEVERITY.MEDIUM,
      title: `${lowStockMaterials.length} Material Item(s) Running Low`,
      description: `Supply chain buffer risk: Material stock levels have depleted to Low Stock status.`,
      evidence: lowStockMaterials.map((m) => {
        const req = Number(m.requiredQuantity) || 0;
        const avail = Number(m.availableQuantity) || 0;
        const deficit = Math.max(0, req - avail);
        const percent = req > 0 ? Math.round((avail / req) * 100) : 0;
        return `Material "${m.name}" (${m.category || 'General'}) | Available: ${avail} ${m.unit || 'units'} | Required: ${req} ${m.unit || 'units'} (${percent}% stock, Deficit: ${deficit} ${m.unit || 'units'})`;
      }),
      recommendation: `Consider issuing purchase requisitions or confirming dispatch ETA with vendors before active trade work exhausts remaining inventory.`,
    });
  }

  // =========================================================================
  // 3. PROJECT PROGRESS RISKS (Timeline Position vs Actual Progress)
  // =========================================================================
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.endDate ? new Date(project.endDate) : null;

  if (start && end && end > start && project.status !== 'Completed') {
    const totalDurationMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();

    if (elapsedMs > 0) {
      const expectedProgress = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
      const progressGap = expectedProgress - progress;

      if (progressGap >= 25) {
        detectedRisks.push({
          category: RISK_CATEGORIES.PROGRESS,
          severity: RISK_SEVERITY.HIGH,
          title: `Project Progress Significantly Behind Schedule (-${progressGap}%)`,
          description: `Potential schedule risk detected: Project progress is ${progress}% compared to an approximate expected timeline position of ${expectedProgress}%.`,
          evidence: [
            `Project: ${projectName}`,
            `Current Progress: ${progress}% vs Expected Timeline Position: ${expectedProgress}% (Schedule Variance: -${progressGap}%)`,
            `Timeline: ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
          ],
          recommendation: `Consider conducting a schedule recovery review with trade foremen to evaluate fast-tracking non-conflicting tasks.`,
        });
      } else if (progressGap >= 15) {
        detectedRisks.push({
          category: RISK_CATEGORIES.PROGRESS,
          severity: RISK_SEVERITY.MEDIUM,
          title: `Project Progress Trailing Expected Pace (-${progressGap}%)`,
          description: `Potential schedule risk detected: Progress is ${progress}% against an expected ${expectedProgress}%.`,
          evidence: [
            `Current Progress: ${progress}% | Expected Timeline Position: ${expectedProgress}% | Schedule Float: Compressed`,
          ],
          recommendation: `Consider monitoring weekly task completion velocity closely and prioritizing critical trade activities.`,
        });
      }
    }
  }

  // =========================================================================
  // 4. DEADLINE RISKS (Target End Date Exceeded or Imminent with High Incomplete Work)
  // =========================================================================
  if (end && project.status !== 'Completed') {
    const isPastDeadline = now > end;
    const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isPastDeadline) {
      const daysOverdue = Math.abs(daysRemaining);
      detectedRisks.push({
        category: RISK_CATEGORIES.DEADLINE,
        severity: RISK_SEVERITY.CRITICAL,
        title: `Project Past Scheduled Completion Deadline (${daysOverdue} Days Overdue)`,
        description: `Contractual deadline exceeded: Project remains incomplete after the target completion date.`,
        evidence: [
          `Target End Date: ${end.toISOString().split('T')[0]} (Exceeded by ${daysOverdue} days)`,
          `Current Progress: ${progress}% | Status: ${project.status}`,
        ],
        recommendation: `Consider formalizing an extension of time (EOT) review and escalating critical path constraints to the project sponsor.`,
      });
    } else if (daysRemaining <= 30 && progress < 85) {
      detectedRisks.push({
        category: RISK_CATEGORIES.DEADLINE,
        severity: RISK_SEVERITY.HIGH,
        title: `Approaching Deadline with Incomplete Works (${daysRemaining} Days Left)`,
        description: `Project is scheduled to complete within ${daysRemaining} days but overall progress stands at ${progress}%.`,
        evidence: [
          `Target Completion: ${end.toISOString().split('T')[0]} (${daysRemaining} days remaining)`,
          `Unfinished Scope: ${100 - progress}% remaining`,
        ],
        recommendation: `Consider assessing snagging lists and deploying supplemental trade resources for high-priority commissioning works.`,
      });
    }
  }

  // =========================================================================
  // 5. OPERATIONAL COMPOUND RISKS (Co-occurrence of Delays & Material Shortages)
  // =========================================================================
  if (highPriorityDelayedOrOverdue.length > 0 && (lowStockMaterials.length > 0 || outOfStockMaterials.length > 0)) {
    const shortageNames = [...outOfStockMaterials, ...lowStockMaterials].map((m) => m.name).slice(0, 3);
    const delayTitles = highPriorityDelayedOrOverdue.map((t) => t.title).slice(0, 3);

    detectedRisks.push({
      category: RISK_CATEGORIES.OPERATIONAL,
      severity: RISK_SEVERITY.HIGH,
      title: `Compounded Operational Bottleneck: Simultaneous Delays and Material Constraints`,
      description: `High-impact activities are delayed while key materials have stock deficits, creating compound critical-path risks.`,
      evidence: [
        `High-Priority Delayed/Overdue: ${delayTitles.join(', ')}`,
        `Constrained Materials: ${shortageNames.join(', ')}`,
      ],
      recommendation: `Consider synchronizing procurement deliveries directly with revised trade task start dates to avoid re-mobilization costs.`,
    });
  }

  // Derive highest overall project risk level deterministically
  let overallRiskLevel = RISK_SEVERITY.LOW;
  if (detectedRisks.some((r) => r.severity === RISK_SEVERITY.CRITICAL)) {
    overallRiskLevel = RISK_SEVERITY.CRITICAL;
  } else if (detectedRisks.some((r) => r.severity === RISK_SEVERITY.HIGH)) {
    overallRiskLevel = RISK_SEVERITY.HIGH;
  } else if (detectedRisks.some((r) => r.severity === RISK_SEVERITY.MEDIUM)) {
    overallRiskLevel = RISK_SEVERITY.MEDIUM;
  }

  return {
    projectId: projectIdStr,
    projectName,
    projectLocation: project.location || 'N/A',
    currentProgress: progress,
    status: project.status || 'Active',
    overallRiskLevel,
    detectedRisksCount: detectedRisks.length,
    risks: detectedRisks,
    message:
      detectedRisks.length === 0
        ? 'No significant operational risks were detected from the currently available BuildOps data.'
        : `Detected ${detectedRisks.length} operational risk signal(s) requiring attention.`,
    safetyNotice: 'No structural safety conclusion can be made from the available project-management data.',
  };
};

/**
 * Analyzes a single project by ID and deterministically computes operational risks
 * Queries MongoDB once in parallel.
 *
 * @param {string} projectId - MongoDB Project ObjectId
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<Object>}
 */
export const detectProjectRisks = async (projectId, referenceDate = new Date()) => {
  if (!projectId || !isValidObjectId(projectId)) {
    const error = new Error(`Invalid project ID provided: ${projectId}`);
    error.statusCode = 400;
    throw error;
  }

  // Parallel fetch from MongoDB
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

  return calculateProjectRisksFromData(project, tasks, materials, referenceDate);
};

/**
 * Analyzes all projects across the portfolio and deterministically flags project-level risks
 * Executes 3 batched queries across the entire database to avoid N+1 queries.
 *
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<Object>}
 */
export const detectPortfolioRisks = async (referenceDate = new Date()) => {
  const [allProjects, allTasks, allMaterials] = await Promise.all([
    Project.find({}).sort({ name: 1 }).lean(),
    Task.find({}).lean(),
    Material.find({}).lean(),
  ]);

  // Group tasks and materials by projectId for O(N) lookup
  const tasksByProject = new Map();
  for (const t of allTasks) {
    if (t.projectId) {
      const pIdStr = t.projectId.toString();
      if (!tasksByProject.has(pIdStr)) tasksByProject.set(pIdStr, []);
      tasksByProject.get(pIdStr).push(t);
    }
  }

  const materialsByProject = new Map();
  for (const m of allMaterials) {
    if (m.projectId) {
      const pIdStr = m.projectId.toString();
      if (!materialsByProject.has(pIdStr)) materialsByProject.set(pIdStr, []);
      materialsByProject.get(pIdStr).push(m);
    }
  }

  const portfolioRisks = [];

  for (const proj of allProjects) {
    const pIdStr = proj._id.toString();
    const projTasks = tasksByProject.get(pIdStr) || [];
    const projMaterials = materialsByProject.get(pIdStr) || [];

    const analysis = calculateProjectRisksFromData(proj, projTasks, projMaterials, referenceDate);
    if (analysis.detectedRisksCount > 0) {
      portfolioRisks.push({
        projectId: pIdStr,
        projectName: proj.name,
        location: proj.location,
        manager: proj.manager,
        progress: proj.progress,
        status: proj.status,
        overallRiskLevel: analysis.overallRiskLevel,
        detectedRisksCount: analysis.detectedRisksCount,
        topRisks: analysis.risks.slice(0, 3),
      });
    }
  }

  // Sort portfolio by highest severity first (Critical > High > Medium > Low)
  const severityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  portfolioRisks.sort(
    (a, b) => (severityWeight[b.overallRiskLevel] || 0) - (severityWeight[a.overallRiskLevel] || 0)
  );

  return {
    totalProjectsCount: allProjects.length,
    projectsWithRisksCount: portfolioRisks.length,
    portfolioRisks,
    message:
      portfolioRisks.length === 0
        ? 'No significant operational risks were detected across the portfolio from currently available BuildOps data.'
        : `${portfolioRisks.length} out of ${allProjects.length} project(s) exhibit operational risk signals.`,
    safetyNotice: 'No structural safety conclusion can be made from the available project-management data.',
  };
};
