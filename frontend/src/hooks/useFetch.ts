import { useState, useEffect } from 'react';
import api from '@/services/api';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useFetch<T>(
  url: string | null,
  options?: any
): UseFetchState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(url, options);
      setData(response.data);
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to fetch data';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, loading, error, refetch: fetchData };
}
