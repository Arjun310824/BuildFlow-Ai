/**
 * API client configuration for BuildFlow AI
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
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `API request failed with status ${response.status}`);
  }

  return data;
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
