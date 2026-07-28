import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (email: string, name: string, password: string) =>
    api.post('/api/v1/auth/signup', { email, name, password, role: 'student' }),
  
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/api/v1/auth/me'),
};

// Student APIs
export const studentAPI = {
  createProfile: (rollNumber: string, department: string, batch: number, cgpa?: number) =>
    api.post('/api/v1/students/profile', { roll_number: rollNumber, department, batch, cgpa }),
  
  getMyProfile: () =>
    api.get('/api/v1/students/me'),
  
  updateProfile: (cgpa?: number, backlogs?: number) =>
    api.put('/api/v1/students/me', { cgpa, backlogs }),
  
  getProfile: (studentId: string) =>
    api.get(`/api/v1/students/${studentId}`),
};

export default api;
