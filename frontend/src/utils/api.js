import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function resolveUploadUrl(path) {
  if (!path) return path;
  return /^https?:\/\//.test(path) ? path : `${API_ORIGIN}${path}`;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('shiptrack_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('shiptrack_token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;