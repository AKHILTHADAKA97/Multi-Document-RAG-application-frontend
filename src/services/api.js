import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for LLM inferences
});

// Request interceptor for logging & header injection
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data || '');
    }
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status, response.data);
    }
    return response;
  },
  (error) => {
    const errorMsg =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    console.error(`[API Error] ${error.config?.url || 'Unknown endpoint'}:`, errorMsg);
    
    const errorStr = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
    let sanitizedMsg = errorStr;
    const lower = errorStr.toLowerCase();
    if (
      lower.includes('insufficient_quota') ||
      lower.includes('credit_balance_exhausted') ||
      lower.includes('credit balance') ||
      error.response?.status === 429
    ) {
      sanitizedMsg = 'AI processing is waiting for available API credits.';
    }

    // Attach user-friendly extracted message to error object
    error.userMessage = sanitizedMsg;
    return Promise.reject(error);
  }
);

export default api;
