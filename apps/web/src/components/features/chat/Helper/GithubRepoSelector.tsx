'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { GitIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useGitHub } from '@/hooks/useGitHub';
import { useUser } from '@/hooks/useUser';
import { GithubRepoSelectorProps } from '@/types';

export function GithubRepoSelector({
  isOpen,
  onClose,
  onConfirm,
  title = 'Select GitHub Repository',
  description = 'Choose a repository and branch for creating a PR',
}: GithubRepoSelectorProps) {
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBranchesFor, setLoadingBranchesFor] = useState<string | null>(
    null
  );

  const { accessToken } = useUser();
  const {
    repositories: githubRepos,
    isLoading: isLoadingGitHub,
    fetchRepositories,
    fetchBranches,
    updateRepositoryBranches,
  } = useGitHub();

  // Filter repositories based on search query
  const filteredRepos = useMemo(() => {
    if (!searchQuery) return githubRepos;
    return githubRepos.filter(
      repo =>
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [githubRepos, searchQuery]);

  // Get selected repository
  const selectedRepo = useMemo(() => {
    return githubRepos.find(repo => repo.id === selectedRepoId);
  }, [githubRepos, selectedRepoId]);

  // Load repositories on modal open
  const loadRepositories = useCallback(async () => {
    if (!accessToken) return;
    await fetchRepositories();
  }, [accessToken, fetchRepositories]);

  // Handle fetching branches for a repository
  const handleFetchBranchesForRepo = async (repo: any) => {
    setLoadingBranchesFor(repo.id);

    try {
      const [owner, repoName] = repo.fullName.split('/');
      const branches = await fetchBranches(owner, repoName);

      if (branches.length > 0) {
        updateRepositoryBranches(
          repo.id,
          branches.map(b => b.name)
        );

        // Auto-select first branch if none selected
        if (!selectedBranch && branches.length > 0) {
          setSelectedBranch(branches[0].name);
        }
      }
    } catch (error) {
      console.error(`Failed to fetch branches for ${repo.fullName}:`, error);
    } finally {
      setLoadingBranchesFor(null);
    }
  };

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRepoId('');
      setSelectedBranch('');
      setSearchQuery('');

      if (githubRepos.length === 0) {
        loadRepositories();
      }
    }
  }, [isOpen, githubRepos.length, loadRepositories]);

  // Auto-select default branch when repo is selected
  useEffect(() => {
    if (selectedRepo && selectedRepo.branches.length > 0 && !selectedBranch) {
      setSelectedBranch(
        selectedRepo.selectedBranch || selectedRepo.branches[0]
      );
    }
  }, [selectedRepo, selectedBranch]);

  const handleRepoSelect = (repoId: string) => {
    setSelectedRepoId(repoId);
    setSelectedBranch('');
    const repo = githubRepos.find(r => r.id === repoId);
    if (repo) {
      if (repo.branches.length === 0) {
        handleFetchBranchesForRepo(repo);
      } else {
        setSelectedBranch(repo.selectedBranch || repo.branches[0]);
      }
    }
  };

  const handleConfirm = () => {
    if (selectedRepo && selectedBranch) {
      onConfirm(selectedRepo.fullName, selectedBranch);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedRepoId('');
    setSelectedBranch('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <GitIcon className='h-5 w-5' />
            {title}
          </DialogTitle>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search input */}
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search repositories...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-8'
              disabled={isLoadingGitHub}
            />
          </div>

          {/* Repository list */}
          <div className='max-h-60 overflow-y-auto rounded-md border'>
            {isLoadingGitHub ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                <span className='text-muted-foreground text-sm'>
                  Loading repositories...
                </span>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center'>
                <p className='text-sm'>
                  {searchQuery
                    ? 'No repositories found matching your search'
                    : 'No repositories available'}
                </p>
              </div>
            ) : (
              <div className='p-2'>
                {filteredRepos.map(repo => (
                  <div
                    key={repo.id}
                    className={cn(
                      'hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md p-3 text-sm transition-colors',
                      selectedRepoId === repo.id && 'bg-accent'
                    )}
                    onClick={() => handleRepoSelect(repo.id)}
                  >
                    <input
                      type='radio'
                      checked={selectedRepoId === repo.id}
                      onChange={() => handleRepoSelect(repo.id)}
                      className='text-primary focus:ring-primary h-4 w-4'
                    />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p
                          className='truncate font-medium'
                          title={repo.fullName}
                        >
                          {repo.fullName}
                        </p>
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
                      <p className='text-muted-foreground text-xs'>
                        {repo.ownerName}
                      </p>
                    </div>
                    {selectedRepoId === repo.id && (
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground text-xs'>
                          Branch:
                        </span>
                        <DropdownMenu
                          onOpenChange={open => {
                            if (open && repo) {
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
                              onClick={e => e.stopPropagation()} // Prevent repo selection when clicking dropdown
                            >
                              {loadingBranchesFor === repo.id ? (
                                <>
                                  <Loader2 className='mr-2 h-3 w-3 animate-spin' />
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <span className='truncate'>
                                    {selectedBranch || 'Select branch'}
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
                                No branches available
                              </DropdownMenuItem>
                            ) : (
                              repo.branches.map((branch: string) => (
                                <DropdownMenuItem
                                  key={branch}
                                  onClick={() => setSelectedBranch(branch)}
                                  className='cursor-pointer text-sm'
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
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRepo || !selectedBranch}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
