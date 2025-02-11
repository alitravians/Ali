import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface UseRealTimeDataOptions {
  endpoint: string;
  interval?: number;
  enabled?: boolean;
  onError?: (error: unknown) => void;
}

export function useRealTimeData<T>(options: UseRealTimeDataOptions) {
  const { endpoint, interval = 5000, enabled = true, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get<T>(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      if (onError) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, onError]);

  useEffect(() => {
    if (!enabled || !isAdmin) return;

    // Initial fetch
    fetchData();

    // Set up polling
    const intervalId = setInterval(fetchData, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, interval, enabled, isAdmin]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchData();
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    refetch,
  };
}

// Specialized hooks for each data type
export function useBookAvailability(bookId: number) {
  return useRealTimeData<{ available_copies: number }>({
    endpoint: `/admin/books/${bookId}/availability`,
    interval: 3000,
  });
}

export function useStudentStatus(studentId: number) {
  return useRealTimeData<{ active_loans: number; overdue_loans: number }>({
    endpoint: `/admin/students/${studentId}/status`,
    interval: 5000,
  });
}

export function useLoanStatus(loanId: number) {
  return useRealTimeData<{ status: string; return_date: string | null }>({
    endpoint: `/admin/loans/${loanId}/status`,
    interval: 3000,
  });
}

export function useRuleUpdates() {
  return useRealTimeData<{ updated_at: string }[]>({
    endpoint: `/admin/rules/updates`,
    interval: 10000,
  });
}
