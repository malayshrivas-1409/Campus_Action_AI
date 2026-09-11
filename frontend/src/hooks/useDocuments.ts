import { useState, useCallback } from 'react';
import { documentAPI } from '@/services/api';
import { Document, PaginatedResponse } from '@/types';

interface UseDocumentsState {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: (skip?: number, limit?: number, documentType?: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export function useDocuments(): UseDocumentsState {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(
    async (skip = 0, limit = 20, documentType?: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await documentAPI.list(skip, limit, documentType);
        setDocuments(response.data.items);
      } catch (err: any) {
        const message = err.response?.data?.detail || 'Failed to fetch documents';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteDocument = useCallback(async (id: string) => {
    setError(null);

    try {
      await documentAPI.delete(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Failed to delete document';
      setError(message);
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    deleteDocument,
  };
}
