import { useState, useCallback } from 'react';
import { atlassianApi } from '@/lib/api/api';
import type {
  AtlassianSpace,
  AtlassianPage,
  AtlassianProject,
  AtlassianIssue,
  ApiError,
} from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export interface UseAtlassianResult {
  spaces: AtlassianSpace[];
  pages: AtlassianPage[];
  projects: AtlassianProject[];
  issues: AtlassianIssue[];
  isLoading: {
    spaces: boolean;
    pages: boolean;
    projects: boolean;
    issues: boolean;
  };
  error: ApiError | null;
  getAllSpaces: () => Promise<void>;
  getSpaces: (spaceKeys: string[]) => Promise<void>;
  getPages: (spaceKey?: string) => Promise<AtlassianPage[]>;
  getProjects: () => Promise<void>;
  getIssues: (
    projectKey: string,
    issueType?: string,
    searchQuery?: string
  ) => Promise<AtlassianIssue[]>;
  clearData: () => void;
}

export const useAtlassian = (): UseAtlassianResult => {
  const [spaces, setSpaces] = useState<AtlassianSpace[]>([]);
  const [pages, setPages] = useState<AtlassianPage[]>([]);
  const [projects, setProjects] = useState<AtlassianProject[]>([]);
  const [issues, setIssues] = useState<AtlassianIssue[]>([]);
  const [isLoading, setIsLoading] = useState({
    spaces: false,
    pages: false,
    projects: false,
    issues: false,
  });
  const [error, setError] = useState<ApiError | null>(null);
  const { accessToken } = useUser();

  // Helper to set loading state for specific resource
  const setLoadingState = useCallback(
    (resource: keyof typeof isLoading, value: boolean) => {
      setIsLoading(prev => ({ ...prev, [resource]: value }));
    },
    []
  );

  // Get all Confluence spaces
  const getAllSpaces = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      const error = {
        message: 'Please log in to access Confluence spaces',
        status: 401,
      };
      setError(error);
      toast.error(error.message);
      return;
    }

    setLoadingState('spaces', true);
    setError(null);

    try {
      const response = await atlassianApi.getSpaces(accessToken);

      if (response.success && response.data) {
        setSpaces(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch spaces');
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleError(apiError, 'fetch Confluence spaces');
    } finally {
      setLoadingState('spaces', false);
    }
  }, [accessToken, setLoadingState]);

  // Get specific Confluence spaces by keys
  const getSpaces = useCallback(
    async (spaceKeys: string[]): Promise<void> => {
      if (!accessToken) {
        const error = {
          message: 'Please log in to access Confluence spaces',
          status: 401,
        };
        setError(error);
        toast.error(error.message);
        return;
      }

      if (!spaceKeys || spaceKeys.length === 0) {
        const error = {
          message: 'Space keys are required',
          status: 400,
        };
        setError(error);
        toast.error(error.message);
        return;
      }

      setLoadingState('spaces', true);
      setError(null);

      try {
        const response = await atlassianApi.getSpaces(accessToken, spaceKeys);

        if (response.success && response.data) {
          setSpaces(response.data);
        } else {
          throw new Error(response.error || 'Failed to fetch spaces');
        }
      } catch (error) {
        const apiError = error as ApiError;
        handleError(apiError, 'fetch Confluence spaces');
      } finally {
        setLoadingState('spaces', false);
      }
    },
    [accessToken, setLoadingState, setError]
  );

  // Get Confluence pages by space (optional)
  const getPages = useCallback(
    async (spaceKey?: string): Promise<AtlassianPage[]> => {
      if (!accessToken) {
        const error = {
          message: 'Please log in to access Confluence pages',
          status: 401,
        };
        setError(error);
        toast.error(error.message);
        return [];
      }

      setLoadingState('pages', true);
      setError(null);

      try {
        const response = await atlassianApi.getPages(accessToken, spaceKey);

        if (response.success && response.data) {
          setPages(response.data);
          return response.data; // Return the fetched pages
        } else {
          throw new Error(response.error || 'Failed to fetch pages');
        }
      } catch (error) {
        const apiError = error as ApiError;
        handleError(apiError, 'fetch Confluence pages');
        return [];
      } finally {
        setLoadingState('pages', false);
      }
    },
    [accessToken, setLoadingState]
  );

  // Get Jira projects
  const getProjects = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      const error = {
        message: 'Please log in to access Jira projects',
        status: 401,
      };
      setError(error);
      toast.error(error.message);
      return;
    }

    setLoadingState('projects', true);
    setError(null);

    try {
      const response = await atlassianApi.getProjects(accessToken);

      if (response.success && response.data) {
        setProjects(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch projects');
      }
    } catch (error) {
      const apiError = error as ApiError;
      handleError(apiError, 'fetch Jira projects');
    } finally {
      setLoadingState('projects', false);
    }
  }, [accessToken, setLoadingState]);

  // Get Jira issues by project
  const getIssues = useCallback(
    async (
      projectKey: string,
      issueType?: string,
      searchQuery?: string
    ): Promise<AtlassianIssue[]> => {
      if (!accessToken) {
        const error = {
          message: 'Please log in to access Jira issues',
          status: 401,
        };
        setError(error);
        toast.error(error.message);
        return [];
      }

      if (!projectKey.trim()) {
        const error = {
          message: 'Project key is required',
          status: 400,
        };
        setError(error);
        toast.error(error.message);
        return [];
      }

      setLoadingState('issues', true);
      setError(null);

      try {
        const response = await atlassianApi.getIssues(
          projectKey,
          accessToken,
          issueType,
          searchQuery
        );

        if (response.success && response.data) {
          setIssues(response.data);
          return response.data; // Return the fetched issues
        } else {
          throw new Error(response.error || 'Failed to fetch issues');
        }
      } catch (error) {
        const apiError = error as ApiError;
        handleError(apiError, 'fetch Jira issues');
        return [];
      } finally {
        setLoadingState('issues', false);
      }
    },
    [accessToken, setLoadingState]
  );

  // Handle errors with specific messages
  const handleError = (apiError: ApiError, action: string) => {
    if (apiError.status === 401) {
      apiError.message =
        'Authentication failed. Please reconnect your Atlassian account.';
    } else if (apiError.status === 403) {
      apiError.message =
        'Access denied. Please ensure your Atlassian integration has the necessary permissions.';
    } else if (!apiError.message) {
      apiError.message = `Failed to ${action}. Please try again.`;
    }

    setError(apiError);
    toast.error(apiError.message);
  };

  // Clear all data
  const clearData = useCallback(() => {
    setSpaces([]);
    setPages([]);
    setProjects([]);
    setIssues([]);
    setError(null);
    setIsLoading({
      spaces: false,
      pages: false,
      projects: false,
      issues: false,
    });
  }, []);

  return {
    spaces,
    pages,
    projects,
    issues,
    isLoading,
    error,
    getAllSpaces,
    getSpaces,
    getPages,
    getProjects,
    getIssues,
    clearData,
  };
};
