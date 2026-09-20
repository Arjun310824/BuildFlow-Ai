import mongoose from 'mongoose';

const VALID_STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed'];
const VALID_RISKS = ['Low', 'Medium', 'High'];

/**
 * Middleware to check if the route parameter :id is a valid MongoDB ObjectId
 */
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid project ID format: "${id}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
    });
  }
  next();
};

/**
 * Middleware to validate project payload when creating a project (POST)
 */
export const validateCreateProject = (req, res, next) => {
  const { name, client, location, manager, startDate, endDate, progress, status, risk } = req.body;
  const errors = [];

  // Required field checks
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Project name is required');
  }
  if (!client || typeof client !== 'string' || !client.trim()) {
    errors.push('Client name is required');
  }
  if (!location || typeof location !== 'string' || !location.trim()) {
    errors.push('Location is required');
  }
  if (!manager || typeof manager !== 'string' || !manager.trim()) {
    errors.push('Project manager is required');
  }
  if (!startDate) {
    errors.push('Start date is required');
  }
  if (!endDate) {
    errors.push('Expected end date is required');
  }

  // Date validity and comparison
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (startDate && isNaN(parsedStartDate.getTime())) {
    errors.push('Start date must be a valid date format (e.g. YYYY-MM-DD)');
  }
  if (endDate && isNaN(parsedEndDate.getTime())) {
    errors.push('Expected end date must be a valid date format (e.g. YYYY-MM-DD)');
  }
  if (
    startDate &&
    endDate &&
    !isNaN(parsedStartDate.getTime()) &&
    !isNaN(parsedEndDate.getTime()) &&
    parsedEndDate < parsedStartDate
  ) {
    errors.push('Expected end date cannot be earlier than start date');
  }

  // Progress validation
  if (progress !== undefined && progress !== null && progress !== '') {
    const numProgress = Number(progress);
    if (isNaN(numProgress) || numProgress < 0 || numProgress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  // Status enum check
  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}`);
  }

  // Risk enum check
  if (risk && !VALID_RISKS.includes(risk)) {
    errors.push(`Invalid risk level "${risk}". Allowed values: ${VALID_RISKS.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Middleware to validate project payload when updating a project (PUT)
 */
export const validateUpdateProject = (req, res, next) => {
  const { name, client, location, manager, startDate, endDate, progress, status, risk } = req.body;
  const errors = [];

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    errors.push('Project name cannot be empty');
  }
  if (client !== undefined && (typeof client !== 'string' || !client.trim())) {
    errors.push('Client name cannot be empty');
  }
  if (location !== undefined && (typeof location !== 'string' || !location.trim())) {
    errors.push('Location cannot be empty');
  }
  if (manager !== undefined && (typeof manager !== 'string' || !manager.trim())) {
    errors.push('Project manager cannot be empty');
  }

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (isNaN(parsedStart.getTime())) {
      errors.push('Start date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedEnd.getTime())) {
      errors.push('Expected end date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (startDate && endDate) {
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime()) && parsedEnd < parsedStart) {
      errors.push('Expected end date cannot be earlier than start date');
    }
  }

  if (progress !== undefined && progress !== null && progress !== '') {
    const numProgress = Number(progress);
    if (isNaN(numProgress) || numProgress < 0 || numProgress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Invalid status "${status}". Allowed values: ${VALID_STATUSES.join(', ')}`);
  }

  if (risk && !VALID_RISKS.includes(risk)) {
    errors.push(`Invalid risk level "${risk}". Allowed values: ${VALID_RISKS.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/* ==========================================================================
   TASK VALIDATION MIDDLEWARE
   ========================================================================== */

export const VALID_TASK_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Delayed'];
export const VALID_TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Middleware to check if the route parameter :id is a valid MongoDB ObjectId for tasks
 */
export const validateTaskId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task ID format: "${id}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
    });
  }
  next();
};

/**
 * Middleware to validate task payload when creating a task (POST /api/tasks)
 */
export const validateCreateTask = (req, res, next) => {
  const { projectId, title, startDate, dueDate, progress, status, priority } = req.body;
  const errors = [];

  // Required field checks
  if (!projectId) {
    errors.push('Project ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(projectId)) {
    errors.push(`Invalid projectId format: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`);
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Task title is required');
  }

  if (!dueDate) {
    errors.push('Due date is required');
  }

  // Date parsing and comparison
  if (dueDate) {
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      errors.push('Due date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      errors.push('Start date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (startDate && dueDate) {
    const parsedStartDate = new Date(startDate);
    const parsedDueDate = new Date(dueDate);
    if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedDueDate.getTime()) && parsedDueDate < parsedStartDate) {
      errors.push('Due date cannot be earlier than start date');
    }
  }

  // Progress check
  if (progress !== undefined && progress !== null && progress !== '') {
    const numProgress = Number(progress);
    if (isNaN(numProgress) || numProgress < 0 || numProgress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  // Status check
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    errors.push(`Invalid status "${status}". Allowed values: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  // Priority check
  if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
    errors.push(`Invalid priority "${priority}". Allowed values: ${VALID_TASK_PRIORITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Middleware to validate task payload when updating a task (PUT /api/tasks/:id)
 */
export const validateUpdateTask = (req, res, next) => {
  const { projectId, title, startDate, dueDate, progress, status, priority } = req.body;
  const errors = [];

  if (projectId !== undefined) {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      errors.push(`Invalid projectId format: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`);
    }
  }

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    errors.push('Task title cannot be empty');
  }

  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime())) {
      errors.push('Start date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (dueDate) {
    const parsedDueDate = new Date(dueDate);
    if (isNaN(parsedDueDate.getTime())) {
      errors.push('Due date must be a valid date format (e.g. YYYY-MM-DD)');
    }
  }

  if (startDate && dueDate) {
    const parsedStartDate = new Date(startDate);
    const parsedDueDate = new Date(dueDate);
    if (!isNaN(parsedStartDate.getTime()) && !isNaN(parsedDueDate.getTime()) && parsedDueDate < parsedStartDate) {
      errors.push('Due date cannot be earlier than start date');
    }
  }

  if (progress !== undefined && progress !== null && progress !== '') {
    const numProgress = Number(progress);
    if (isNaN(numProgress) || numProgress < 0 || numProgress > 100) {
      errors.push('Progress must be a number between 0 and 100');
    }
  }

  if (status && !VALID_TASK_STATUSES.includes(status)) {
    errors.push(`Invalid status "${status}". Allowed values: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
    errors.push(`Invalid priority "${priority}". Allowed values: ${VALID_TASK_PRIORITIES.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/* ==========================================================================
   MATERIAL VALIDATION MIDDLEWARE
   ========================================================================== */

/**
 * Middleware to check if the route parameter :id is a valid MongoDB ObjectId for materials
 */
export const validateMaterialId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `Invalid material ID format: "${id}". Must be a 24-character hexadecimal MongoDB ObjectId.`,
    });
  }
  next();
};

/**
 * Middleware to validate material payload when creating a material (POST /api/materials)
 */
export const validateCreateMaterial = (req, res, next) => {
  const { projectId, name, category, requiredQuantity, availableQuantity, usedQuantity, unit } = req.body;
  const errors = [];

  // Required field checks
  if (!projectId) {
    errors.push('Project ID is required');
  } else if (!mongoose.Types.ObjectId.isValid(projectId)) {
    errors.push(`Invalid projectId format: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`);
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Material name is required');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Material category is required');
  }

  if (!unit || typeof unit !== 'string' || !unit.trim()) {
    errors.push('Unit of measurement is required');
  }

  // Quantity checks
  if (requiredQuantity === undefined || requiredQuantity === null || requiredQuantity === '') {
    errors.push('Required quantity is required');
  } else {
    const reqNum = Number(requiredQuantity);
    if (isNaN(reqNum) || reqNum < 0) {
      errors.push('Required quantity cannot be negative');
    }
  }

  if (availableQuantity === undefined || availableQuantity === null || availableQuantity === '') {
    errors.push('Available quantity is required');
  } else {
    const availNum = Number(availableQuantity);
    if (isNaN(availNum) || availNum < 0) {
      errors.push('Available quantity cannot be negative');
    }
  }

  if (usedQuantity !== undefined && usedQuantity !== null && usedQuantity !== '') {
    const usedNum = Number(usedQuantity);
    if (isNaN(usedNum) || usedNum < 0) {
      errors.push('Used quantity cannot be negative');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

/**
 * Middleware to validate material payload when updating a material (PUT /api/materials/:id)
 */
export const validateUpdateMaterial = (req, res, next) => {
  const { projectId, name, category, requiredQuantity, availableQuantity, usedQuantity, unit } = req.body;
  const errors = [];

  if (projectId !== undefined) {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      errors.push(`Invalid projectId format: "${projectId}". Must be a 24-character hexadecimal MongoDB ObjectId.`);
    }
  }

  if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
    errors.push('Material name cannot be empty');
  }

  if (category !== undefined && (typeof category !== 'string' || !category.trim())) {
    errors.push('Material category cannot be empty');
  }

  if (unit !== undefined && (typeof unit !== 'string' || !unit.trim())) {
    errors.push('Unit of measurement cannot be empty');
  }

  if (requiredQuantity !== undefined && requiredQuantity !== null && requiredQuantity !== '') {
    const reqNum = Number(requiredQuantity);
    if (isNaN(reqNum) || reqNum < 0) {
      errors.push('Required quantity cannot be negative');
    }
  }

  if (availableQuantity !== undefined && availableQuantity !== null && availableQuantity !== '') {
    const availNum = Number(availableQuantity);
    if (isNaN(availNum) || availNum < 0) {
      errors.push('Available quantity cannot be negative');
    }
  }

  if (usedQuantity !== undefined && usedQuantity !== null && usedQuantity !== '') {
    const usedNum = Number(usedQuantity);
    if (isNaN(usedNum) || usedNum < 0) {
      errors.push('Used quantity cannot be negative');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};
