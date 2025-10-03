import { useCallback } from 'react';
import { integrationLogsServicesApi } from '@/lib/api/api';
import type { LoggingService, ApiError } from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export interface UseIntegrationLogsResult {
  getServices: (provider: string, search?: string) => Promise<LoggingService[]>;
}

export const useIntegrationLogs = (): UseIntegrationLogsResult => {
  const { accessToken } = useUser();

  // Get logging services for a provider
  const getServices = useCallback(
    async (provider: string, search?: string): Promise<LoggingService[]> => {
      if (!accessToken) {
        const errorMessage = 'Please log in to access integration services';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!provider || provider.trim() === '') {
        const errorMessage = 'Provider is required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const response = await integrationLogsServicesApi.list(
          provider,
          accessToken,
          search
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch services');
        }
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = getErrorMessage(
          apiError,
          `fetch ${provider} services`,
          provider
        );
        toast.error(errorMessage);
        throw error;
      }
    },
    [accessToken]
  );

  // Helper function to get error message
  const getErrorMessage = (
    apiError: ApiError,
    action: string,
    provider: string
  ): string => {
    if (apiError.status === 401) {
      return `Authentication failed. Please reconnect your ${provider} account.`;
    } else if (apiError.status === 403) {
      return `Access denied. Please ensure your ${provider} integration has the necessary permissions.`;
    } else if (apiError.status === 404) {
      return `${provider} resource not found. Please check your configuration.`;
    } else if (apiError.message) {
      return apiError.message;
    } else {
      return `Failed to ${action}. Please try again.`;
    }
  };

  return {
    getServices,
  };
};
