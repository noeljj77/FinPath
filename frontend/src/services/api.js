import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const incomes = {
  getAll: () => api.get('/incomes'),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.put(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`)
};

export const expenses = {
  getAll: () => api.get('/expenses'),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`)
};

export const loans = {
  getAll: () => api.get('/loans'),
  create: (data) => api.post('/loans', data),
  update: (id, data) => api.put(`/loans/${id}`, data),
  delete: (id) => api.delete(`/loans/${id}`)
};

export const investments = {
  getAll: () => api.get('/investments'),
  create: (data) => api.post('/investments', data),
  update: (id, data) => api.put(`/investments/${id}`, data),
  delete: (id) => api.delete(`/investments/${id}`)
};

export const transactions = {
  getAll: (params) => api.get('/transactions', { params })
};

export const simulate = {
  run: (data) => api.post('/simulate', data),
  reset: () => api.post('/simulate/reset')
};

export const scenarios = {
  getAll: () => api.get('/scenarios'),
  getById: (id) => api.get(`/scenarios/${id}`),
  create: (data) => api.post('/scenarios', data),
  delete: (id) => api.delete(`/scenarios/${id}`)
};

export const creditRules = {
  get: () => api.get('/credit-rules'),
  update: (data) => api.put('/credit-rules', data)
};

export default api;