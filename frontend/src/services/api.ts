import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

console.log('[API] Using API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Guards against multiple concurrent 401/403 responses each independently
// calling logout() + window.location.href.
let isLoggingOut = false;

async function forceLogoutAndRedirect() {
  if (isLoggingOut) return;
  isLoggingOut = true;
  try {
    const { useAuthStore } = await import('../store/authStore');
    useAuthStore.getState().logout();
  } catch (e) {
    console.error('[API] Failed to logout:', e);
  } finally {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    } else {
      isLoggingOut = false;
    }
  }
}

// Add token to requests and refresh if needed
api.interceptors.request.use(async (config) => {
  // Prefer in-memory auth store when available, otherwise fall back to localStorage
  let token: string | null = null;
  let expiresAtStr: string | null = null;
  try {
    const { useAuthStore } = await import('../store/authStore');
    const authState = useAuthStore.getState();
    token = authState.token || localStorage.getItem('access_token');
    expiresAtStr = authState.tokenExpiresAt ? String(authState.tokenExpiresAt) : localStorage.getItem('token_expires_at');
  } catch (e) {
    // If dynamic import fails, fall back to localStorage
    token = localStorage.getItem('access_token');
    expiresAtStr = localStorage.getItem('token_expires_at');
  }

  if (token) {
    // Check if token is expiring soon (within 5 minutes)
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr);
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If token expires in less than 5 minutes, refresh it
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.log('[API] Token expiring soon, attempting refresh...');
        try {
          // Import here to avoid circular dependency
          const { useAuthStore } = await import('../store/authStore');
          const authStore = useAuthStore.getState();
          await authStore.refreshToken();
          // Get the new token after refresh
          const newToken = authStore.token || localStorage.getItem('access_token');
          if (newToken) {
            config.headers.Authorization = `Bearer ${newToken}`;
            return config;
          } else {
            // Token refresh succeeded but no new token returned - logout
            console.error('[API] Token refresh returned no token');
            await forceLogoutAndRedirect();
            return config;
          }
        } catch (error) {
          console.error('[API] Token refresh failed:', error);
          // Token refresh failed - logout and redirect
          await forceLogoutAndRedirect();
          return config;
        }
      }
    }

    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle unauthorized responses globally: logout and redirect to login
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // Prevent infinite retry loops
    if (originalRequest.__retry) {
      await forceLogoutAndRedirect();
      return Promise.reject(error);
    }

    if (status === 401 || status === 403) {
      if (originalRequest) originalRequest.__retry = true;
      console.log('[API] Received 401/403 - logging out user');
      await forceLogoutAndRedirect();
    }
    return Promise.reject(error);
  }
);

// Add token to requests

// Auth APIs
export const authAPI = {
  signup: (email: string, name: string, password: string) =>
    api.post('/api/v1/auth/signup', { email, name, password, role: 'student' }),
  
  login: (email: string, password: string) =>
    api.post('/api/v1/auth/login', { email, password }),
  
  getMe: () =>
    api.get('/api/v1/auth/me'),
  
  refreshToken: () =>
    api.post('/api/v1/auth/refresh', {}),
  
  getProfileStatus: () =>
    api.get('/api/v1/auth/profile-status'),
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
// Document APIs
const uploadDocumentFn = (file: File, title: string, documentType: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  formData.append('document_type', documentType);

  return api.post('/api/v1/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const documentAPI = {
  // backward-compatible names: `upload` and `uploadDocument`
  upload: uploadDocumentFn,
  uploadDocument: uploadDocumentFn,

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

  getDocumentView: (documentId: string) =>
    api.get(`/api/v1/documents/${documentId}/view`),

  delete: (documentId: string) =>
    api.delete(`/api/v1/documents/${documentId}`),
};

// Alias for backward compatibility
export const documentsAPI = documentAPI;

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
  sendMessage: (conversationId: string | null, message: string, topK: number = 10, vectorWeight: number = 0.7, keywordWeight: number = 0.3, selectedDocumentIds?: string[]) =>
    api.post('/api/v1/chat/message', { 
      conversation_id: conversationId, 
      message, 
      top_k: topK, 
      vector_weight: vectorWeight, 
      keyword_weight: keywordWeight,
      selected_document_ids: selectedDocumentIds,
    }),
  
  listConversations: (search?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    return api.get(`/api/v1/chat/conversations${params.toString() ? '?' + params : ''}`);
  },
  
  getConversation: (conversationId: string, skip?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());
    return api.get(`/api/v1/chat/conversations/${conversationId}${params.toString() ? '?' + params : ''}`);
  },
  
  deleteConversation: (conversationId: string) =>
    api.delete(`/api/v1/chat/conversations/${conversationId}`),
  
  exportConversation: (conversationId: string, format: 'json' | 'markdown' = 'markdown') =>
    api.get(`/api/v1/chat/conversations/${conversationId}/export?format=${format}`),
};

export default api;

// Activity APIs
export const activityAPI = {
  recent: (limit: number = 6) => api.get(`/api/v1/activity?limit=${limit}`),
}

