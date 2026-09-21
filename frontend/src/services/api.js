/**
 * API client configuration for BuildOps AI
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Retrieve token from localStorage if available
  let token = null;
  try {
    token = localStorage.getItem('buildops_token');
  } catch (e) {
    console.warn('Unable to access localStorage for auth token');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

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
    // If backend returns 401 Unauthorized on a protected route, notify the auth state
    if (response.status === 401 && !endpoint.startsWith('/auth/login') && !endpoint.startsWith('/auth/register')) {
      try {
        localStorage.removeItem('buildops_token');
        localStorage.removeItem('buildflow_auth_user');
        window.dispatchEvent(new CustomEvent('buildops:auth:unauthorized'));
      } catch (e) {}
    }

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

export const chatWithProjectApi = async (
  projectId,
  message,
  images = [],
  documents = [],
  conversationHistory = []
) => {
  return await apiClient('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ projectId, message, images, documents, conversationHistory }),
  });
};

export const getAiProjectsApi = async () => {
  return await apiClient('/ai/projects');
};

/**
 * Deterministic AI Risk Detection Endpoint (Task 9)
 * @param {string} projectId - Project ID or 'all'
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getProjectRiskApi = async (projectId) => {
  return await apiClient(`/ai/project-risk/${projectId}`);
};

/**
 * On-demand AI Project Briefing Endpoint (Task 11)
 * @param {string} projectId - Project ID or 'all'
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getProjectBriefingApi = async (projectId) => {
  return await apiClient(`/ai/project-briefing/${projectId}`);
};

/**
 * AI-Powered Project Report Generation Endpoint (Task 12)
 * @param {Object} payload - { projectId, reportType, conversationId, message }
 * @returns {Promise<{ success: boolean, report: Object, answer: string, sources: Array, confidence: string }>}
 */
export const generateProjectReportApi = async (payload) => {
  return await apiClient('/ai/generate-report', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Conversation History API Endpoints (Task 6 & Task 7)
 */
export const getConversationsApi = async () => {
  return await apiClient('/ai/conversations');
};

export const getConversationByIdApi = async (id) => {
  return await apiClient(`/ai/conversations/${id}`);
};

export const createConversationApi = async (data = {}) => {
  return await apiClient('/ai/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const sendConversationMessageApi = async (id, data) => {
  return await apiClient(`/ai/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const deleteConversationApi = async (id) => {
  return await apiClient(`/ai/conversations/${id}`, {
    method: 'DELETE',
  });
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
export const getMaterials = getMaterialsApi;

/**
 * Retrieve a single material by its ID
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getMaterialByIdApi = async (id) => {
  return await apiClient(`/materials/${id}`);
};
export const getMaterialById = getMaterialByIdApi;
export const getMaterial = getMaterialByIdApi;

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
export const createMaterial = createMaterialApi;

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
export const updateMaterial = updateMaterialApi;

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
export const deleteMaterial = deleteMaterialApi;

// ==========================================
// Authentication Endpoints (Task 15)
// ==========================================

/**
 * Register a new user account
 * @param {Object} userData - { name, email, password, role }
 * @returns {Promise<{ success: boolean, message: string, token: string, user: Object }>}
 */
export const registerApi = async (userData) => {
  return await apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * Authenticate existing user with email and password
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ success: boolean, message: string, token: string, user: Object }>}
 */
export const loginApi = async (credentials) => {
  return await apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

/**
 * Retrieve current authenticated user profile using active JWT
 * @returns {Promise<{ success: boolean, user: Object }>}
 */
export const getMeApi = async () => {
  return await apiClient('/auth/me');
};

// ==========================================
// B2B Business Network & Controlled Sharing Endpoints (Task 20)
// ==========================================

/**
 * List registered organizations for partner discovery
 * @param {Object} [params] - { search, type, location }
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getOrganizationsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
  if (params.type && params.type !== 'All') queryParams.append('type', params.type);
  if (params.location && params.location !== 'All') queryParams.append('location', params.location);
  const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/organizations${qStr}`);
};

/**
 * Get current user's organization details
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getMyOrganizationApi = async () => {
  return await apiClient('/organizations/my');
};

/**
 * Create or update organization
 * @param {Object} orgData
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createOrganizationApi = async (orgData) => {
  return await apiClient('/organizations', {
    method: 'POST',
    body: JSON.stringify(orgData),
  });
};

/**
 * Retrieve all business connections for caller's organization
 * @param {string} [status] - Optional filter ('Pending', 'Accepted', 'Suspended')
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getBusinessConnectionsApi = async (status = null) => {
  const query = status && status !== 'ALL' ? `?status=${status}` : '';
  return await apiClient(`/business-connections${query}`);
};

/**
 * Get specific connection details
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getConnectionByIdApi = async (id) => {
  return await apiClient(`/business-connections/${id}`);
};

/**
 * Send a business connection request
 * @param {Object} payload - { receivingOrganizationId, permissions, purpose }
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createBusinessConnectionApi = async (payload) => {
  return await apiClient('/business-connections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Accept a pending connection request
 * @param {string} id
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const acceptBusinessConnectionApi = async (id) => {
  return await apiClient(`/business-connections/${id}/accept`, {
    method: 'PATCH',
  });
};

/**
 * Reject a pending connection request
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const rejectBusinessConnectionApi = async (id, reason = '') => {
  return await apiClient(`/business-connections/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Suspend an active business connection
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const suspendBusinessConnectionApi = async (id, reason = '') => {
  return await apiClient(`/business-connections/${id}/suspend`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Update data sharing permissions on a connection
 * @param {string} id
 * @param {Array<string>} permissions
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const updateBusinessConnectionPermissionsApi = async (id, permissions) => {
  return await apiClient(`/business-connections/${id}/permissions`, {
    method: 'PATCH',
    body: JSON.stringify({ permissions }),
  });
};

/**
 * Terminate a business connection
 * @param {string} id
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const deleteBusinessConnectionApi = async (id) => {
  return await apiClient(`/business-connections/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Query controlled shared data for an accepted connection
 * @param {string} id
 * @param {string} [category]
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getConnectionSharedDataApi = async (id, category = null) => {
  const query = category ? `?category=${category}` : '';
  return await apiClient(`/business-connections/${id}/shared-data${query}`);
};

/**
 * Retrieve collaboration audit logs
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getConnectionAuditLogsApi = async () => {
  return await apiClient('/business-connections/audit-logs');
};

/**
 * Retrieve notifications
 * @returns {Promise<{ success: boolean, count: number, unreadCount: number, data: Array }>}
 */
export const getNotificationsApi = async () => {
  return await apiClient('/notifications');
};

/**
 * Mark notification as read
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const markNotificationReadApi = async (id) => {
  return await apiClient(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
};

/**
 * Mark all notifications as read
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const markAllNotificationsReadApi = async () => {
  return await apiClient('/notifications/read-all', {
    method: 'PATCH',
  });
};

// ==========================================
// Business Transactions & Shared Workspace Endpoints (Task 21)
// ==========================================

/**
 * Retrieve business transactions for caller's organization
 * @param {Object} [params] - { status, requestType, role }
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getBusinessTransactionsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
  if (params.requestType && params.requestType !== 'ALL') queryParams.append('requestType', params.requestType);
  if (params.role) queryParams.append('role', params.role);
  const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/business-transactions${qStr}`);
};

/**
 * Get details of a single business transaction (triggers auto-view transition for recipient)
 * @param {string} id
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const getBusinessTransactionByIdApi = async (id) => {
  return await apiClient(`/business-transactions/${id}`);
};

/**
 * Create a new business transaction request (Material Request / Service Request)
 * @param {Object} payload
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const createBusinessTransactionApi = async (payload) => {
  return await apiClient('/business-transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

/**
 * Accept a business transaction request (Recipient organization only)
 * @param {string} id
 * @param {string} [responseMessage]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const acceptBusinessTransactionApi = async (id, responseMessage = '') => {
  return await apiClient(`/business-transactions/${id}/accept`, {
    method: 'PATCH',
    body: JSON.stringify({ responseMessage }),
  });
};

/**
 * Reject a business transaction request (Recipient organization only)
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const rejectBusinessTransactionApi = async (id, reason = '') => {
  return await apiClient(`/business-transactions/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Start delivery or operational execution of an accepted transaction
 * @param {string} id
 * @param {Object} [details]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const startBusinessTransactionApi = async (id, details = {}) => {
  return await apiClient(`/business-transactions/${id}/start`, {
    method: 'PATCH',
    body: JSON.stringify(details),
  });
};

/**
 * Mark a transaction as completed
 * @param {string} id
 * @param {string} [note]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const completeBusinessTransactionApi = async (id, note = '') => {
  return await apiClient(`/business-transactions/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  });
};

/**
 * Cancel a business transaction request (Requester organization only)
 * @param {string} id
 * @param {string} [reason]
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export const cancelBusinessTransactionApi = async (id, reason = '') => {
  return await apiClient(`/business-transactions/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
};

// ==========================================
// Site Updates CRUD Endpoints
// ==========================================

/**
 * Retrieve all site updates for current organization with optional projectId filter
 * @param {Object} [params] - Query parameters ({ projectId })
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getSiteUpdatesApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.projectId && params.projectId !== 'All') {
    queryParams.append('projectId', params.projectId);
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/site-updates${queryString}`);
};

/**
 * Create a new site update log
 * @param {Object} data - Update data ({ projectId, supervisor, workCompleted/workSummary, progress, workers, issues, etc. })
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const createSiteUpdateApi = async (data) => {
  return await apiClient('/site-updates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a site update log
 * @param {string} id - Site update ID
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteSiteUpdateApi = async (id) => {
  return await apiClient(`/site-updates/${id}`, {
    method: 'DELETE',
  });
};

// ==========================================
// Documents CRUD Endpoints
// ==========================================

/**
 * Retrieve all documents for current organization with optional projectId filter
 * @param {Object} [params] - Query parameters ({ projectId })
 * @returns {Promise<{ success: boolean, count: number, data: Array }>}
 */
export const getDocumentsApi = async (params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.projectId && params.projectId !== 'All') {
    queryParams.append('projectId', params.projectId);
  }
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return await apiClient(`/documents${queryString}`);
};

/**
 * Upload / register a new document
 * @param {Object} data - Document data ({ projectId, name, type, size, status, uploadedBy })
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const createDocumentApi = async (data) => {
  return await apiClient('/documents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a document
 * @param {string} id - Document ID
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export const deleteDocumentApi = async (id) => {
  return await apiClient(`/documents/${id}`, {
    method: 'DELETE',
  });
};
