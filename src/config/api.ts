// API Configuration
export const API_CONFIG = {
  // Pupiltree AI API (pupiltree.ai folder)
  PUPILTREEAI_BASE_URL: import.meta.env.VITE_PUPILTREEAI_BASE_URL,
  
  // Pupiltree agents API (pupiltree-agents-develop) - not currently used
  AGENTS_BASE_URL: import.meta.env.VITE_AGENTS_BASE_URL ,
};

export const API_ENDPOINTS = {
  // Auth endpoints (pupiltree.ai)
  LOGIN: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/login_with_credentials`,
  REGISTER: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/register`,
  GET_USER: `${API_CONFIG.PUPILTREEAI_BASE_URL}/users/user`,
};
