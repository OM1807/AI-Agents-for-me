'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Github,
  ChevronDown,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { LinkIcon, GitIcon } from '@/components/icons';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { GitHubModal } from '@/components/shared/GitHubModal';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { useGitHub } from '@/hooks/useGitHub';
import { integrationApi } from '@/lib/api/api';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import type { RepositoryState } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';

interface RepositorySelectorProps {
  optional?: boolean;
}

export function RepositorySelector({
  optional = false,
}: RepositorySelectorProps) {
  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
  const [loadingBranchesFor, setLoadingBranchesFor] = useState<string | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchedBranches, setFetchedBranches] = useState<Set<string>>(
    new Set()
  );

  const {
    repositories: githubRepos,
    isLoading: isLoadingGitHub,
    error: gitHubError,
    fetchRepositories,
    fetchBranches,
    updateRepositoryBranches,
    clearData,
  } = useGitHub();

  const { gitHubConnection, setGitHubConnection } = useOAuth();
  const { setGitHubRepos, gitHubRepos, resetGitHubRepos } = useProject();
  const { accessToken } = useUser();

  // Fetch repositories when component mounts and GitHub is connected
  useEffect(() => {
    if (gitHubConnection.isConnected && accessToken) {
      fetchRepositories();
    }
  }, [gitHubConnection.isConnected, accessToken, fetchRepositories]);

  // Update store when GitHub repos are fetched
  useEffect(() => {
    if (githubRepos.length > 0) {
      let updatedRepos;

      if (isRefreshing) {
        // When refreshing, start fresh with no selections
        updatedRepos = githubRepos.map(repo => ({
          ...repo,
          selected: false,
          selectedBranch: repo.selectedBranch,
        }));
        setFetchedBranches(new Set());
        setIsRefreshing(false);
      } else {
        // Preserve selection state when updating repos normally
        const currentRepos = gitHubRepos.repositories || [];
        const selectedRepoIds = new Set(
          currentRepos.filter(r => r.selected).map(r => r.id)
        );

        updatedRepos = githubRepos.map(repo => ({
          ...repo,
          selected: selectedRepoIds.has(repo.id),
          selectedBranch:
            currentRepos.find(r => r.id === repo.id)?.selectedBranch ||
            repo.selectedBranch,
        }));
      }

      const selectedRepositories = updatedRepos
        .filter(repo => repo.selected)
        .map(repo => {
          return {
            url: repo.url,
            branch: repo.selectedBranch,
          };
        });
      setGitHubRepos({
        repositories: updatedRepos,
        selectedRepositories,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubRepos, isRefreshing]);

  const handleRepositoryToggle = (repoId: string) => {
    const updatedRepos = (gitHubRepos.repositories || []).map(repo =>
      repo.id === repoId ? { ...repo, selected: !repo.selected } : repo
    );
    const selectedRepositories = updatedRepos
      .filter(repo => repo.selected)
      .map(repo => {
        return {
          url: repo.url,
          branch: repo.selectedBranch,
        };
      });
    setGitHubRepos({
      repositories: updatedRepos,
      selectedRepositories,
    });
  };

  const handleBranchSelect = (repoId: string, branch: string) => {
    const updatedRepos = (gitHubRepos.repositories || []).map(repo =>
      repo.id === repoId ? { ...repo, selectedBranch: branch } : repo
    );
    const selectedRepositories = updatedRepos
      .filter(repo => repo.selected)
      .map(repo => {
        return {
          url: repo.url,
          branch: repo.selectedBranch,
        };
      });
    setGitHubRepos({
      repositories: updatedRepos,
      selectedRepositories,
    });
  };

  const handleFetchBranchesForRepo = async (repo: RepositoryState) => {
    // Skip if branches already fetched or currently loading
    if (fetchedBranches.has(repo.id) || loadingBranchesFor === repo.id) {
      return;
    }

    setLoadingBranchesFor(repo.id);

    try {
      const [owner, repoName] = repo.fullName.split('/');
      const branches = await fetchBranches(owner, repoName);

      if (branches.length > 0) {
        updateRepositoryBranches(
          repo.id,
          branches.map(b => b.name)
        );
        setFetchedBranches(prev => new Set([...prev, repo.id]));
      }
    } catch (error) {
      console.error(`Failed to fetch branches for ${repo.fullName}:`, error);
      toast.error(`Failed to fetch branches for ${repo.fullName}`);
      // Still mark as fetched to avoid repeated attempts
      // setFetchedBranches(prev => new Set([...prev, repo.id]));
    } finally {
      setLoadingBranchesFor(null);
    }
  };

  const handleDisconnectGitHub = async () => {
    try {
      setIsLoadingDisconnect(true);
      await integrationApi.delete(gitHubConnection.id, accessToken ?? '');

      setGitHubConnection({
        isConnected: false,
        id: 0,
      });
      clearData();
      setFetchedBranches(new Set());
      toast.success('GitHub disconnected successfully');
    } catch {
      toast.error('Failed to disconnect GitHub. Please try again.');
    } finally {
      setIsLoadingDisconnect(false);
    }
  };

  if (!gitHubConnection.isConnected) {
    return (
      <SectionWrapper
        icon={<GitIcon className='h-4 w-4' />}
        title='Select Repositories'
      >
        <FeatureCard
          icon={<LinkIcon className='h-10 w-10' />}
          heading='Connect your GitHub to get started'
          subheading='Once connected, you will be able to choose repositories for AI-powered code reviews, test generation, and more.'
          buttonIcon={<Github />}
          buttonText='Link GitHub Account'
          onButtonClick={() => setShowGitHubModal(true)}
        />
        <GitHubModal open={showGitHubModal} onOpenChange={setShowGitHubModal} />
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      icon={<GitIcon className='h-4 w-4' />}
      title={
        optional ? 'Select Repositories (Optional)' : 'Select Repositories'
      }
    >
      <div className='space-y-4'>
        {/* Connected state header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Badge
              variant='outline'
              className='border-0 bg-[#4a20f5]/5 text-[#4a20f5]'
            >
              {gitHubRepos.repositories?.length || 0} repositories found
            </Badge>
          </div>
          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='border-slate-700 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              onClick={() => {
                setIsRefreshing(true);
                resetGitHubRepos();
                fetchRepositories();
              }}
              disabled={isLoadingGitHub}
            >
              {isLoadingGitHub ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Refreshing...
                </>
              ) : (
                <>
                  <RotateCcw className='mr-2 h-4 w-4' />
                  Refresh
                </>
              )}
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDisconnectGitHub}
              className='border-red-700 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'
            >
              {isLoadingDisconnect ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </div>

        {/* Search input */}
        <div className='relative'>
          <Input
            type='text'
            placeholder='Search repositories...'
            className='w-full'
            value={repoSearchQuery}
            onChange={e => setRepoSearchQuery(e.target.value)}
          />
        </div>

        {/* Error display */}
        {gitHubError && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-red-600' />
              <p className='font-medium text-red-800'>{gitHubError.message}</p>
            </div>
          </div>
        )}

        {/* Repository list */}
        {isLoadingGitHub ? (
          <div className='rounded-lg border p-8 text-center'>
            <div className='flex items-center justify-center gap-3'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <div className='text-muted-foreground'>
                Loading repositories...
              </div>
            </div>
          </div>
        ) : (!gitHubRepos.repositories ||
            gitHubRepos.repositories.length === 0) &&
          !gitHubError &&
          !isLoadingGitHub ? (
          <div className='rounded-lg border p-8 text-center'>
            <Github className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
            <p className='text-muted-foreground'>
              No repositories found. Make sure you have access to repositories
              in your GitHub account.
            </p>
          </div>
        ) : (
          <div className='max-h-[250px] overflow-y-auto'>
            {(gitHubRepos.repositories as RepositoryState[])
              .filter((repo: RepositoryState) =>
                repo.fullName
                  ?.toLowerCase()
                  .includes(repoSearchQuery.toLowerCase())
              )
              .map((repo: RepositoryState) => (
                <div
                  key={repo.id}
                  className={`border-b px-4 py-3 transition-all ${
                    repo.selected
                      ? 'border-primary/50 bg-primary/5 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <input
                      type='checkbox'
                      checked={repo.selected}
                      onChange={() => handleRepositoryToggle(repo.id)}
                      className='text-primary focus:ring-primary h-4 w-4 rounded border-gray-300'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <h3 className='truncate text-sm font-medium text-gray-900'>
                          {repo.fullName}
                        </h3>
                        <Badge
                          variant='outline'
                          className={`h-5 text-xs font-normal ${
                            repo.private
                              ? 'border-amber-200 bg-amber-50 text-amber-700'
                              : 'border-green-200 bg-green-50 text-green-700'
                          }`}
                        >
                          {repo.private ? 'Private' : 'Public'}
                        </Badge>
                      </div>
                      <div className='text-muted-foreground mt-1 flex items-center gap-2 text-xs'>
                        <span className='text-gray-500'>{repo.ownerName}</span>
                        <span className='text-gray-400'>•</span>
                        <span>Updated {getRelativeTime(repo.updatedAt)}</span>
                      </div>
                    </div>
                    {repo.selected && (
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground text-xs'>
                          Branch:
                        </span>
                        <DropdownMenu
                          onOpenChange={open => {
                            if (open) {
                              handleFetchBranchesForRepo(repo);
                            }
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant='outline'
                              size='sm'
                              className='h-8 max-w-[180px] min-w-[120px] bg-white text-xs font-normal'
                              disabled={loadingBranchesFor === repo.id}
                            >
                              {loadingBranchesFor === repo.id ? (
                                <>
                                  <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <span className='truncate'>
                                    {repo.selectedBranch}
                                  </span>
                                  <ChevronDown className='ml-2 h-3 w-3 flex-shrink-0' />
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align='end'
                            className='w-[200px]'
                          >
                            {loadingBranchesFor === repo.id ? (
                              <DropdownMenuItem disabled>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Loading branches...
                              </DropdownMenuItem>
                            ) : repo.branches.length === 0 ? (
                              <DropdownMenuItem disabled>
                                No branches found
                              </DropdownMenuItem>
                            ) : (
                              repo.branches.map((branch: string) => (
                                <DropdownMenuItem
                                  key={branch}
                                  onClick={() =>
                                    handleBranchSelect(repo.id, branch)
                                  }
                                  className='text-sm'
                                >
                                  {branch}
                                </DropdownMenuItem>
                              ))
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        <GitHubModal open={showGitHubModal} onOpenChange={setShowGitHubModal} />
      </div>
    </SectionWrapper>
  );
}
