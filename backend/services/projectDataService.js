import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Material from '../models/Material.js';

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
 * @param {string} projectId
 * @returns {Promise<Object>} Structured project context
 */
export const getProjectContext = async (projectId) => {
  if (!projectId || !isValidObjectId(projectId)) {
    const error = new Error('Invalid project ID provided.');
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch Project record
  const project = await Project.findById(projectId).lean();
  if (!project) {
    const error = new Error(`Project with ID ${projectId} not found in database.`);
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch all Tasks belonging to this project
  const tasks = await Task.find({ projectId }).sort({ dueDate: 1 }).lean();

  // 3. Fetch all Materials belonging to this project
  const materials = await Material.find({ projectId }).sort({ name: 1 }).lean();

  // 4. Calculate Objective Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length;
  const delayedTasks = tasks.filter((t) => t.status === 'Delayed');
  const inProgressTasks = tasks.filter((t) => t.status === 'In Progress').length;
  const notStartedTasks = tasks.filter((t) => t.status === 'Not Started').length;

  const now = new Date();
  // Check for tasks past due date that are not completed
  const overdueUncompletedTasks = tasks.filter(
    (t) => t.status !== 'Completed' && t.dueDate && new Date(t.dueDate) < now
  );

  // Critical / High priority delayed tasks
  const highPriorityDelayed = tasks.filter(
    (t) => (t.priority === 'Critical' || t.priority === 'High') && (t.status === 'Delayed' || new Date(t.dueDate) < now)
  );

  // Material metrics
  const totalMaterials = materials.length;
  const lowStockMaterials = materials.filter((m) => m.status === 'Low Stock');
  const outOfStockMaterials = materials.filter((m) => m.status === 'Out of Stock');

  const materialsWithStockLevels = materials.map((m) => {
    const req = Number(m.requiredQuantity) || 0;
    const avail = Number(m.availableQuantity) || 0;
    const used = Number(m.usedQuantity) || 0;
    const stockPercentage = req > 0 ? Math.round((avail / req) * 100) : 0;

    return {
      name: m.name,
      category: m.category,
      requiredQuantity: req,
      availableQuantity: avail,
      usedQuantity: used,
      unit: m.unit,
      status: m.status,
      stockPercentage,
    };
  });

  // Calculate project timeline status
  const start = project.startDate ? new Date(project.startDate) : null;
  const end = project.endDate ? new Date(project.endDate) : null;
  const isPastDeadline = end && now > end && project.status !== 'Completed';
  const daysUntilDeadline = end ? Math.ceil((end - now) / (1000 * 60 * 60 * 24)) : null;

  // Build clean, strictly grounded context object
  return {
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
      isPastDeadline,
      daysUntilDeadline,
    },
    tasks: tasks.map((t) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description || 'No description provided.',
      assignedTo: t.assignedTo || 'Unassigned',
      startDate: t.startDate ? t.startDate.toISOString().split('T')[0] : null,
      dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : null,
      status: t.status,
      progress: t.progress,
      priority: t.priority,
      isOverdue: t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed',
    })),
    materials: materialsWithStockLevels,
    calculatedMetrics: {
      totalTasks,
      completedTasks,
      delayedTasksCount: delayedTasks.length,
      overdueTasksCount: overdueUncompletedTasks.length,
      inProgressTasks,
      notStartedTasks,
      highPriorityDelayedCount: highPriorityDelayed.length,
      totalMaterials,
      lowStockCount: lowStockMaterials.length,
      outOfStockCount: outOfStockMaterials.length,
      taskCompletionRatePercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
  };
};
