import { useCallback } from 'react';
import {
  integrationIncidentsProjectsApi,
  integrationIncidentsApi,
  integrationEnvironmentsApi,
} from '@/lib/api/api';
import type {
  IncidentProject,
  IncidentService,
  ApiError,
  Environment,
} from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export interface UseIntegrationIncidentsResult {
  getProjects: (
    provider: string,
    search?: string
  ) => Promise<IncidentProject[]>;
  getEnvironments: (
    provider: string,
    projectId: string,
    search?: string
  ) => Promise<Environment[]>;
  getIncidents: (
    provider: string,
    start_time: string,
    end_time: string,
    selectedProjectId?: string,
    search?: string,
    environment?: string,
    limit?: number,
    entity_name?: string
  ) => Promise<IncidentService[]>;
}

export const useIntegrationIncidents = (): UseIntegrationIncidentsResult => {
  const { accessToken } = useUser();

  // Get incident projects for a provider
  const getProjects = useCallback(
    async (provider: string, search?: string): Promise<IncidentProject[]> => {
      if (!accessToken) {
        const errorMessage = 'Please log in to access integration projects';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!provider || provider.trim() === '') {
        const errorMessage = 'Provider is required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const response = await integrationIncidentsProjectsApi.list(
          provider,
          accessToken,
          search
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch projects');
        }
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = getErrorMessage(
          apiError,
          `fetch ${provider} projects`,
          provider
        );
        toast.error(errorMessage);
        throw error;
      }
    },
    [accessToken]
  );

  // Get environments for a provider and project
  const getEnvironments = useCallback(
    async (
      provider: string,
      projectId: string,
      search?: string
    ): Promise<Environment[]> => {
      if (!accessToken) {
        const errorMessage = 'Please log in to access integration environments';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!provider || provider.trim() === '') {
        const errorMessage = 'Provider is required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!projectId || projectId.trim() === '') {
        const errorMessage = 'Project ID is required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        const response = await integrationEnvironmentsApi.list(
          projectId,
          accessToken,
          search
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Failed to fetch environments');
        }
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = getErrorMessage(
          apiError,
          `fetch ${provider} environments`,
          provider
        );
        toast.error(errorMessage);
        throw error;
      }
    },
    [accessToken]
  );

  // Get incidents for a provider
  const getIncidents = useCallback(
    async (
      provider: string,
      start_time: string,
      end_time: string,
      selectedProjectId?: string,
      search?: string,
      environment?: string,
      limit: number = 100,
      entity_name?: string
    ): Promise<IncidentService[]> => {
      if (!accessToken) {
        const errorMessage = 'Please log in to access integration incidents';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!provider || provider.trim() === '') {
        const errorMessage = 'Provider is required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (!start_time || !end_time) {
        const errorMessage = 'Start time and end time are required';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      if (limit <= 0) {
        const errorMessage = 'Limit must be greater than 0';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      try {
        // Provider-specific logic for passing project IDs
        let service_id: string | undefined;
        let project_id: string | undefined;

        if (selectedProjectId) {
          if (
            provider.toLowerCase() === 'datadog' ||
            provider.toLowerCase() === 'pagerduty'
          ) {
            // For DataDog, pass project ID as service_id
            service_id = selectedProjectId;
          } else {
            // For other providers, use project_id
            project_id = selectedProjectId;
          }
        }

        const response = await integrationIncidentsApi.list(
          provider,
          start_time,
          end_time,
          accessToken,
          search,
          environment,
          project_id,
          service_id,
          entity_name,
          limit
        );

        if (response.success && response.data) {
          // Sort by last_seen date (most recent first)
          const sortedIncidents = response.data
            .map(incident => ({
              ...incident,
              sourceProjectId: selectedProjectId,
            }))
            .sort(
              (a, b) =>
                new Date(b.last_seen).getTime() -
                new Date(a.last_seen).getTime()
            );
          return sortedIncidents;
        } else {
          throw new Error(response.error || 'Failed to fetch incidents');
        }
      } catch (error) {
        const apiError = error as ApiError;
        const errorMessage = getErrorMessage(
          apiError,
          `fetch ${provider} incidents`,
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
    getProjects,
    getEnvironments,
    getIncidents,
  };
};
