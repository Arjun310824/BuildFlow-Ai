/**
 * API client configuration for BuildOps AI
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    let errorMsg = 'API request failed';
    if (data.errors && Array.isArray(data.errors)) {
      errorMsg = data.errors.join(', ');
    } else if (data.message) {
      errorMsg = data.message;
    } else if (data.error) {
      errorMsg = data.error;
    } else {
      errorMsg = `API request failed with status ${response.status}`;
    }

    const error = new Error(errorMsg);
    error.status = response.status;
    error.errors = data.errors;
    error.data = data;
    throw error;
  }

  return data;
};

// ==========================================
// Project Management CRUD Endpoints
// ==========================================

/**
 * Retrieve all projects with optional search, status, and risk filters
 * @param {Object} [params] - Query parameters ({ search, status, risk })
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getProjectsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.status && params.status !== 'All') {
    queryParams.append('status', params.status);
  }
  if (params.risk && params.risk !== 'All') {
    queryParams.append('risk', params.risk);
  }
  if (params.search && params.search.trim()) {
    queryParams.append('search', params.search.trim());
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/projects${queryString}`);
};
export const getProjects = getProjectsApi;

/**
 * Retrieve a single project by its ID
 * @param {string} id - Project ID
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getProjectByIdApi = async (id) => {
  return await apiClient(`/projects/${id}`);
};

/**
 * Create a new construction project
 * @param {Object} projectData - Project payload
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createProjectApi = async (projectData) => {
  return await apiClient('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
};

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} projectData - Updated fields
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateProjectApi = async (id, projectData) => {
  return await apiClient(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });
};

/**
 * Delete a project by its ID
 * @param {string} id - Project ID
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const deleteProjectApi = async (id) => {
  return await apiClient(`/projects/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// AI Project Intelligence Endpoints
// ==========================================

export const analyzeProjectApi = async (projectId) => {
  return await apiClient('/ai/analyze-project', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  });
};

export const chatWithProjectApi = async (projectId, message) => {
  return await apiClient('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ projectId, message }),
  });
};

export const getAiProjectsApi = async () => {
  return await apiClient('/ai/projects');
};

/**
 * Fetch AI Insights for a specific project from backend Gemini AI service
 * @param {string} projectId - Project identifier
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getProjectAIInsights = async (projectId) => {
  return apiClient(`/ai/project/${projectId}`);
};

// ==========================================
// Tasks Management CRUD Endpoints
// ==========================================

/**
 * Retrieve all tasks with optional filters (projectId, status, priority, search)
 * @param {Object} [params]
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getTasks = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.projectId && params.projectId !== 'All') {
    queryParams.append('projectId', params.projectId);
  }
  if (params.status && params.status !== 'All') {
    queryParams.append('status', params.status);
  }
  if (params.priority && params.priority !== 'All') {
    queryParams.append('priority', params.priority);
  }
  if (params.search && params.search.trim()) {
    queryParams.append('search', params.search.trim());
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/tasks${queryString}`);
};
export const getTasksApi = getTasks;

/**
 * Retrieve a single task by its ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getTaskById = async (id) => {
  return await apiClient(`/tasks/${id}`);
};
export const getTaskByIdApi = getTaskById;

/**
 * Create a new task in MongoDB
 * @param {Object} taskData
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createTask = async (taskData) => {
  return await apiClient('/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};
export const createTaskApi = createTask;

/**
 * Update an existing task
 * @param {string} id
 * @param {Object} taskData
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateTask = async (id, taskData) => {
  return await apiClient(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(taskData),
  });
};
export const updateTaskApi = updateTask;

/**
 * Delete a task by its ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const deleteTask = async (id) => {
  return await apiClient(`/tasks/${id}`, {
    method: 'DELETE',
  });
};
export const deleteTaskApi = deleteTask;

// ==========================================
// Materials Management CRUD Endpoints
// ==========================================

/**
 * Retrieve all materials with optional filters (projectId, category, status, search)
 * @param {Object} [params]
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getMaterialsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.projectId && params.projectId !== 'All') {
    queryParams.append('projectId', params.projectId);
  }
  if (params.category && params.category !== 'All') {
    queryParams.append('category', params.category);
  }
  if (params.status && params.status !== 'All') {
    queryParams.append('status', params.status);
  }
  if (params.search && params.search.trim()) {
    queryParams.append('search', params.search.trim());
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/materials${queryString}`);
};

/**
 * Retrieve a single material by its ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getMaterialByIdApi = async (id) => {
  return await apiClient(`/materials/${id}`);
};

/**
 * Create a new material record in MongoDB
 * @param {Object} materialData
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createMaterialApi = async (materialData) => {
  return await apiClient('/materials', {
    method: 'POST',
    body: JSON.stringify(materialData),
  });
};

/**
 * Update an existing material
 * @param {string} id
 * @param {Object} materialData
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateMaterialApi = async (id, materialData) => {
  return await apiClient(`/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(materialData),
  });
};

/**
 * Delete a material by its ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const deleteMaterialApi = async (id) => {
  return await apiClient(`/materials/${id}`, {
    method: 'DELETE',
  });
};

