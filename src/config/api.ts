// API Configuration
// Use Vercel serverless functions (same domain as frontend)
const isProduction = window.location.hostname !== 'localhost';
export const API_BASE_URL = isProduction 
  ? '/api'  // Relative URL - uses same Vercel domain
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
