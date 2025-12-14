// API Configuration
// Use Railway backend in production, localhost in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://lead-hunter-v50-production.up.railway.app/api'
    : 'http://localhost:3001/api');

export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If endpoint already includes /api, use it as is
  if (cleanEndpoint.startsWith('api/')) {
    return `${API_BASE_URL.replace('/api', '')}/${cleanEndpoint}`;
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};
