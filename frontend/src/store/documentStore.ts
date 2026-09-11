import { create } from 'zustand';
import { Document } from '@/types';
import { documentAPI } from '@/services/api';

interface DocumentStore {
  documents: Document[];
  loading: boolean;
  error: string | null;
  
  fetchDocuments: (skip?: number, limit?: number, type?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  loading: false,
  error: null,

  fetchDocuments: async (skip = 0, limit = 20, type?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await documentAPI.list(skip, limit, type);
      set({ documents: response.data.items });
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to fetch documents';
      set({ error });
    } finally {
      set({ loading: false });
    }
  },

  deleteDocument: async (id: string) => {
    try {
      await documentAPI.delete(id);
      set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
      }));
    } catch (err: any) {
      const error = err.response?.data?.detail || 'Failed to delete document';
      set({ error });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
