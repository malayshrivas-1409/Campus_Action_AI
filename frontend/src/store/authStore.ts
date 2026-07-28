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
  
  signup: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getMe: () => Promise<void>;
  getStudentProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  studentProfile: null,
  token: localStorage.getItem('access_token') || null,
  isLoading: false,
  error: null,

  signup: async (email, name, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.signup(email, name, password);
      const { access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      set({ token: access_token });
      
      // Fetch user data
      await authAPI.getMe();
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Signup failed';
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      const { access_token } = response.data;
      
      localStorage.setItem('access_token', access_token);
      set({ token: access_token });
      
      // Fetch user data
      await authAPI.getMe();
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
    set({ user: null, studentProfile: null, token: null });
  },

  getMe: async () => {
    try {
      const response = await authAPI.getMe();
      set({ user: response.data });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to fetch user';
      set({ error: message });
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

  clearError: () => set({ error: null }),
}));
