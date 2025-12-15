// Centralized API utility
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

export const API_BASE_URL = isProduction 
  ? '/api'  // Relative URL - uses Vercel serverless functions
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

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const url = endpoint.startsWith('http') ? endpoint : getApiUrl(endpoint);
  const token = localStorage.getItem('dhl_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options?.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};
