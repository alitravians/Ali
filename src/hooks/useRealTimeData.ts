import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '@/lib/api';
import { handleApiError } from '@/lib/errors';

interface UseRealTimeDataOptions {
  endpoint: string;
  interval?: number;
  enabled?: boolean;
  onError?: (error: unknown) => void;
}

export function useRealTimeData<T>(options: UseRealTimeDataOptions) {
  const { endpoint, interval = 5000, enabled = true, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get<T>(endpoint);
      setData(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = handleApiError(err, 'فشل في تحميل البيانات');
      setError(errorMessage);
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
    endpoint: `/books/${bookId}/availability`,
    interval: 3000,
    onError: (err) => handleApiError(err, 'فشل في تحميل حالة توفر الكتاب'),
  });
}

export function useStudentStatus(studentId: number) {
  return useRealTimeData<{ active_loans: number; overdue_loans: number }>({
    endpoint: `/students/${studentId}/status`,
    interval: 5000,
    onError: (err) => handleApiError(err, 'فشل في تحميل حالة الطالب'),
  });
}

export function useLoanStatus(loanId: number) {
  return useRealTimeData<{ status: string; return_date: string | null }>({
    endpoint: `/loans/${loanId}/status`,
    interval: 3000,
    onError: (err) => handleApiError(err, 'فشل في تحميل حالة الاستعارة'),
  });
}

export function useRuleUpdates() {
  return useRealTimeData<{ updated_at: string }[]>({
    endpoint: `/rules/updates`,
    interval: 10000,
    onError: (err) => handleApiError(err, 'فشل في تحميل تحديثات القوانين'),
  });
}
