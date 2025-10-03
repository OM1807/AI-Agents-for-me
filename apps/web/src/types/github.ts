import type { ApiError } from './api';

// ========================================
// GITHUB TYPES
// ========================================

// Main GitHub repository type from API
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

// Simplified Repository for UI state management
export interface RepositoryState {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  private: boolean;
  selected: boolean;
  branches: string[];
  selectedBranch: string;
  updatedAt: string;
  ownerName: string;
  default_branch?: string;
  language?: string;
  owner?: string;
  updated_at?: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

// Pull Request data structure
export interface PRData {
  id: string;
  number: number;
  title: string;
  description: string;
  author: string;
  branch: string;
  baseBranch: string;
  createdAt: string;
  html_url?: string;
  repositoryName?: string;
  state?: string;
  draft?: boolean;
}

export interface UseGitHubResult {
  repositories: RepositoryState[];
  isLoading: boolean;
  error: ApiError | null;
  fetchRepositories: () => Promise<void>;
  fetchBranches: (owner: string, repo: string) => Promise<GitHubBranch[]>;
  updateRepositoryBranches: (repoId: string, branches: string[]) => void;
  clearData: () => void;
}

export interface GithubRepoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (repoName: string, branchName: string) => void;
  title?: string;
  description?: string;
}
