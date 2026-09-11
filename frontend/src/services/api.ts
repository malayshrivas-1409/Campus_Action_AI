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

// Document APIs
export const documentAPI = {
  upload: (file: File, title: string, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('document_type', documentType);
    
    return api.post('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  list: (skip: number = 0, limit: number = 20, documentType?: string) => {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });
    if (documentType) {
      params.append('document_type', documentType);
    }
    return api.get(`/api/v1/documents?${params}`);
  },
  
  get: (documentId: string) =>
    api.get(`/api/v1/documents/${documentId}`),
  
  delete: (documentId: string) =>
    api.delete(`/api/v1/documents/${documentId}`),
};

// Search APIs
export const searchAPI = {
  vectorSearch: (query: string, limit: number = 10, threshold: number = 0.5) =>
    api.post('/api/v1/search/vector', { query, limit, threshold }),
  
  keywordSearch: (query: string, limit: number = 10) =>
    api.post('/api/v1/search/keyword', { query, limit }),
  
  getInfo: () =>
    api.get('/api/v1/search/info'),
};

// Embeddings APIs
export const embeddingsAPI = {
  generateAll: () =>
    api.post('/api/v1/embeddings/generate-all'),
  
  generateVersion: (versionId: string) =>
    api.post(`/api/v1/embeddings/generate-version/${versionId}`),
};

// RAG APIs
export const ragAPI = {
  retrieve: (query: string, topK: number = 10, vectorWeight: number = 0.7, keywordWeight: number = 0.3) =>
    api.post('/api/v1/rag/retrieve', { query, top_k: topK, vector_weight: vectorWeight, keyword_weight: keywordWeight }),
  
  query: (query: string, topK: number = 10, vectorWeight: number = 0.7, keywordWeight: number = 0.3) =>
    api.post('/api/v1/rag/query', { query, top_k: topK, vector_weight: vectorWeight, keyword_weight: keywordWeight }),
  
  status: () =>
    api.get('/api/v1/rag/status'),
};

// Chat APIs
export const chatAPI = {
  sendMessage: (conversationId: string | null, message: string, topK: number = 10, vectorWeight: number = 0.7, keywordWeight: number = 0.3) =>
    api.post('/api/v1/chat/message', { 
      conversation_id: conversationId, 
      message, 
      top_k: topK, 
      vector_weight: vectorWeight, 
      keyword_weight: keywordWeight 
    }),
  
  listConversations: () =>
    api.get('/api/v1/chat/conversations'),
  
  getConversation: (conversationId: string) =>
    api.get(`/api/v1/chat/conversations/${conversationId}`),
  
  deleteConversation: (conversationId: string) =>
    api.delete(`/api/v1/chat/conversations/${conversationId}`),
};

export default api;

