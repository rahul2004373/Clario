import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
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
