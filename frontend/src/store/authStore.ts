import { create } from 'zustand';
import { authAPI, studentAPI } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface StudentProfile {
  id: string;
  user_id: string;
  roll_number: string;
  department: string;
  batch: number;
  cgpa: number | null;
  backlogs: number;
}

interface AuthStore {
  user: User | null;
  studentProfile: StudentProfile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  tokenExpiresAt: number | null;
  isInitialized: boolean;
  
  signup: (params: { name: string; email: string; password: string }) => Promise<void>;
  login: (params: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  getMe: () => Promise<void>;
  getStudentProfile: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  studentProfile: null,
  token: localStorage.getItem('access_token') || null,
  isLoading: false,
  error: null,
  tokenExpiresAt: (() => {
    const expiresAtStr = localStorage.getItem('token_expires_at');
    if (!expiresAtStr) return null;
    const expiresAt = parseInt(expiresAtStr);
    // If token is already expired, clear it immediately
    if (expiresAt <= Date.now()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_expires_at');
      return null;
    }
    return expiresAt;
  })(),
  isInitialized: false,

  signup: async ({ name, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.signup(email, name, password);
      const { access_token, expires_in } = response.data;
      
      const expiresAt = Date.now() + (expires_in * 1000);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_expires_at', expiresAt.toString());
      
      set({ token: access_token, tokenExpiresAt: expiresAt });
      
      // Fetch and store user data in state
      await get().getMe();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Signup failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access_token, expires_in } = response.data;
      
      const expiresAt = Date.now() + (expires_in * 1000);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_expires_at', expiresAt.toString());
      
      set({ token: access_token, tokenExpiresAt: expiresAt });
      
      // Fetch and store user data in state
      await get().getMe();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_expires_at');
    set({ user: null, studentProfile: null, token: null, tokenExpiresAt: null, isInitialized: true });
  },

  getMe: async () => {
    try {
      const response = await authAPI.getMe();
      const userData = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role,
        is_active: response.data.is_active,
      };
      set({ user: userData, isInitialized: true });
    } catch (error: any) {
      console.error('Failed to get user:', error);
      const message = error.response?.data?.detail || 'Failed to fetch user';
      const status = error.response?.status;
      if (status === 401 || status === 403 || status === 404) {
        get().logout();
      } else {
        set({ error: message, isInitialized: true });
      }
    }
  },

  getStudentProfile: async () => {
    try {
      const response = await studentAPI.getMyProfile();
      set({ studentProfile: response.data });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch profile';
      set({ error: message });
    }
  },

  refreshToken: async () => {
    try {
      const state = get();
      if (!state.token) {
        throw new Error('No token to refresh');
      }

      const response = await authAPI.refreshToken();
      const { access_token, expires_in } = response.data;
      
      const expiresAt = Date.now() + (expires_in * 1000);
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('token_expires_at', expiresAt.toString());
      
      set({ token: access_token, tokenExpiresAt: expiresAt });
      console.log('[Auth] Token refreshed successfully');
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout the user
      get().logout();
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  initialize: async () => {
    const { token, user, isInitialized } = get();
    if (isInitialized) return;
    if (!token) {
      set({ isInitialized: true });
      return;
    }
    if (user) {
      set({ isInitialized: true });
      return;
    }
    // Token exists (survived a page refresh) but no user in memory yet —
    // fetch it now instead of rendering the app shell with user: null.
    await get().getMe();
  },
}));
