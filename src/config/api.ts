// API Configuration
export const API_CONFIG = {
  // Pupiltree AI API (pupiltree.ai folder)
  PUPILTREEAI_BASE_URL: import.meta.env.VITE_PUPILTREEAI_BASE_URL || 'http://127.0.0.1:8000',
  
  // Pupiltree agents API (pupiltree-agents-develop) - not currently used
  AGENTS_BASE_URL: import.meta.env.VITE_AGENTS_BASE_URL || 'http://0.0.0.0:8001/api',
};

export const API_ENDPOINTS = {
  // Auth endpoints (pupiltree.ai)
  LOGIN: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/login_with_credentials`,
  REGISTER: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/register`,
  GET_USER: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/user`,
};
