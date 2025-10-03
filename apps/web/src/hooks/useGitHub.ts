import { useState, useCallback } from 'react';
import { githubApi } from '@/lib/api/api';
import type {
  RepositoryState,
  GitHubBranch,
  ApiError,
  Repository,
  UseGitHubResult,
} from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export const useGitHub = (): UseGitHubResult => {
  const [repositories, setRepositories] = useState<RepositoryState[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { accessToken } = useUser();

  // Transform GitHub repository data to match our Repository interface
  const transformGitHubRepos = (repos: Repository[]): RepositoryState[] => {
    return repos.map(repo => ({
      id: repo.id.toString(),
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description || 'No description available',
      url: repo.html_url,
      private: repo.private,
      selected: false,
      branches: repo.default_branch ? [repo.default_branch] : [],
      selectedBranch: repo.default_branch,
      updatedAt: repo.updated_at,
      ownerName: repo.owner?.login || '',
      default_branch: repo.default_branch,
      language: repo.language || undefined,
      owner: repo.owner?.login || '',
      updated_at: repo.updated_at,
    }));
  };

  // Fetch branches for a specific repository
  const fetchBranches = useCallback(
    async (owner: string, repo: string): Promise<GitHubBranch[]> => {
      if (!accessToken) {
        toast.error('Please log in to access GitHub branches');
        return [];
      }

      try {
        const response = await githubApi.getBranches(owner, repo, accessToken);
        if (response.success && response.data) {
          return response.data;
        }
        toast.error(`Failed to fetch branches for ${repo}`);
        return [];
      } catch {
        toast.error(`Failed to fetch branches for ${repo}. Please try again.`);
        return [];
      }
    },
    [accessToken]
  );

  // Fetch all repositories for the authenticated user
  const fetchRepositories = useCallback(async (): Promise<void> => {
    if (!accessToken) {
      const error = {
        message: 'Please log in to access GitHub repositories',
        status: 401,
      };
      setError(error);
      toast.error(error.message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch repositories from backend API
      const response = await githubApi.getRepositories(accessToken);

      if (response.success && response.data) {
        const repos = response.data;
        setRepositories(transformGitHubRepos(repos));
      } else {
        throw new Error(response.error || 'Failed to fetch repositories');
      }
    } catch (error) {
      const apiError = error as ApiError;

      // Provide more specific error messages
      if (apiError.status === 401) {
        apiError.message = 'Authentication failed. Please log in again.';
      } else if (apiError.status === 403) {
        apiError.message =
          'Access denied. Please ensure your GitHub integration is properly configured.';
      } else if (!apiError.message) {
        apiError.message =
          'Failed to fetch GitHub repositories. Please try again.';
      }

      setError(apiError);
      toast.error(apiError.message);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Update branches for a specific repository
  const updateRepositoryBranches = useCallback(
    (repoId: string, branches: string[]) => {
      setRepositories(prevRepos =>
        prevRepos.map(repo =>
          repo.id.toString() === repoId ? { ...repo, branches } : repo
        )
      );
    },
    []
  );

  // Clear all data
  const clearData = useCallback(() => {
    setRepositories([]);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    repositories,
    isLoading,
    error,
    fetchRepositories,
    fetchBranches,
    updateRepositoryBranches,
    clearData,
  };
};
