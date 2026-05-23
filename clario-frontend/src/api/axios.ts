import axios from 'axios';

// Create a configured Axios instance
// Uses relative '/api' route in production so Vercel can rewrite requests securely over SSL (bypassing Mixed Content warnings),
// while retaining full environment base paths during local localhost/127.0.0.1 development.
const api = axios.create({
  baseURL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api')
    : '/api',
});

// Add an interceptor to inject the Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clairo_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
