// API Configuration
// Always use Railway backend in production (Vercel deployment)
const isProduction = window.location.hostname !== 'localhost';
export const API_BASE_URL = isProduction 
  ? 'https://lead-hunter-v50-production.up.railway.app/api'
  : 'http://localhost:3001/api';

export const getApiUrl = (endpoint: string) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If endpoint already includes /api, use it as is
  if (cleanEndpoint.startsWith('api/')) {
    return `${API_BASE_URL.replace('/api', '')}/${cleanEndpoint}`;
  }
  
  return `${API_BASE_URL}/${cleanEndpoint}`;
};
