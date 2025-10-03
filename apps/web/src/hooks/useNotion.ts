import { useState, useCallback } from 'react';
import { notionApi } from '@/lib/api/api';
import type { NotionPage, ApiError, UseNotionResult } from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export const useNotion = (): UseNotionResult => {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { accessToken } = useUser();

  // Search for Notion pages
  const searchPages = useCallback(
    async (query: string): Promise<void> => {
      if (!accessToken) {
        const error = {
          message: 'Please log in to access Notion pages',
          status: 401,
        };
        setError(error);
        toast.error(error.message);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await notionApi.searchPages(accessToken, query);

        if (response.success && response.data) {
          setPages(response.data);
        } else {
          throw new Error(response.error || 'Failed to search pages');
        }
      } catch (error) {
        const apiError = error as ApiError;

        // Provide more specific error messages
        if (apiError.status === 401) {
          apiError.message =
            'Authentication failed. Please reconnect your Notion account.';
        } else if (apiError.status === 403) {
          apiError.message =
            'Access denied. Please ensure your Notion integration has the necessary permissions.';
        } else if (!apiError.message) {
          apiError.message = 'Failed to search Notion pages. Please try again.';
        }

        setError(apiError);
        toast.error(apiError.message);
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken]
  );

  // Clear all data
  const clearData = useCallback(() => {
    setPages([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    pages,
    isLoading,
    error,
    searchPages,
    clearData,
  };
};
