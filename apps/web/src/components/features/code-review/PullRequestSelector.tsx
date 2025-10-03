'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Github,
  RotateCcw,
  AlertCircle,
  Loader2,
  X,
  GitBranch,
  User,
  Clock,
} from 'lucide-react';
import { LinkIcon, GitIcon } from '@/components/icons';
import { GitHubModal } from '@/components/shared/GitHubModal';
import { PasteURLModal } from '@/components/shared/PasteURLModal';
import { RepositoryPRList } from '@/components/shared/RepositoryPRList';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { useGitHub } from '@/hooks/useGitHub';
import { integrationApi } from '@/lib/api/api';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import type { RepositoryState, PRData } from '@/types';
import { getRelativeTime } from '@/lib/utils';
import { useProject } from '@/hooks/useProject';

interface PullRequestSelectorProps {
  showPasteURL?: boolean;
}

export function PullRequestSelector({
  showPasteURL = true,
}: PullRequestSelectorProps) {
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);
  const [isLoadingDisconnect, setIsLoadingDisconnect] = useState(false);
  const [prRefreshTrigger, setPrRefreshTrigger] = useState(0);
  const [viewingPRsForRepo, setViewingPRsForRepo] = useState<string | null>(
    null
  );
  const [pastedPRs, setPastedPRs] = useState<PRData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    repositories: githubRepos,
    isLoading: isLoadingGitHub,
    error: gitHubError,
    fetchRepositories,
    clearData,
  } = useGitHub();

  const { gitHubConnection, setGitHubConnection } = useOAuth();
  const { setSelectedPR, gitHubRepos: projectRepos } = useProject();
  const { accessToken } = useUser();

  // Fetch repositories when component mounts and GitHub is connected
  useEffect(() => {
    if (gitHubConnection.isConnected && accessToken) {
      fetchRepositories();
    } else {
      // Reset PR viewing state when GitHub is disconnected
      setViewingPRsForRepo(null);
    }
  }, [gitHubConnection.isConnected, accessToken, fetchRepositories]);

  const handleConnectGitHub = () => {
    setShowGitHubModal(true);
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
      setViewingPRsForRepo(null);
      setSelectedPR(null);
      toast.success('GitHub disconnected successfully');
    } catch {
      toast.error('Failed to disconnect GitHub. Please try again.');
    } finally {
      setIsLoadingDisconnect(false);
    }
  };

  const handleViewPRs = (repoName: string) => {
    setViewingPRsForRepo(repoName);
  };

  const handleBackFromPRs = () => {
    setViewingPRsForRepo(null);
    setSearchQuery('');
  };

  const handlePRSelect = (prData: PRData) => {
    // Set the selected PR in global state
    setSelectedPR({
      html_url: prData.html_url || '',
    });

    toast.success(`PR selected: ${prData.title}`);
  };

  const handleRefreshPRs = () => {
    // Trigger the actual PR refresh in RepositoryPRList
    setPrRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    if (viewingPRsForRepo) {
      handleRefreshPRs();
    } else {
      fetchRepositories();
    }
  };

  const handlePRImported = (prData: PRData) => {
    // Replace any existing pasted PRs with the new one (only show current PR)
    setPastedPRs([prData]);

    // Auto-select the imported PR
    setSelectedPR({
      html_url: prData.html_url || '',
    });
  };

  const handleRemovePRUrl = (url: string) => {
    setPastedPRs(prev => prev.filter(pr => pr.html_url !== url));

    // If the removed URL matches the currently selected PR, clear the selection
    if (projectRepos.selectedPR?.html_url === url) {
      setSelectedPR(null);
    }

    toast.success('PR URL removed');
  };

  const filteredRepos = githubRepos.filter(repo =>
    repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!gitHubConnection.isConnected) {
    return (
      <SectionWrapper
        icon={<GitIcon className='h-4 w-4' />}
        title='Select Pull Request'
      >
        <div className='space-y-4'>
          {/* Show pasted PRs if any exist */}
          {pastedPRs.length > 0 && (
            <>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <Badge
                    variant='outline'
                    className='border-0 bg-[#4a20f5]/5 text-[#4a20f5]'
                  >
                    {pastedPRs.length} pasted PRs
                  </Badge>
                </div>
                <div className='flex items-center gap-3'>
                  {showPasteURL && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setShowPRModal(true)}
                      className='border-purple-600 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-900'
                    >
                      Paste PR URL
                    </Button>
                  )}
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleConnectGitHub}
                    className='border-slate-700 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  >
                    <Github className='mr-2 h-4 w-4' />
                    Connect GitHub
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                {pastedPRs.map((prData, index) => {
                  const isSelected =
                    projectRepos.selectedPR?.html_url === prData.html_url;

                  return (
                    <div
                      key={index}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50 ${
                        isSelected ? 'border-primary/50' : 'border-gray-200'
                      }`}
                      onClick={() => handlePRSelect(prData)}
                    >
                      <div className='flex items-start gap-3 bg-white'>
                        {/* Selection Radio */}
                        <div className='mt-1'>
                          <input
                            type='radio'
                            checked={isSelected}
                            readOnly
                            className='text-primary focus:ring-primary h-4 w-4 border-gray-300'
                          />
                        </div>

                        {/* PR Content */}
                        <div className='min-w-0 flex-1'>
                          {/* Title */}
                          <div className='mb-2'>
                            <h4 className='truncate font-medium text-gray-900'>
                              #{prData.number} – {prData.title}
                            </h4>
                          </div>

                          {/* Description */}
                          <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
                            {prData.description || 'No description available'}
                          </p>

                          {/* Meta Info */}
                          <div className='flex items-center gap-4 text-xs text-gray-500'>
                            <div className='flex items-center gap-1'>
                              <GitBranch className='h-3 w-3' />
                              <span>
                                {prData.author}:{prData.branch}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <User className='h-3 w-3' />
                              <span>By {prData.author}</span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Clock className='h-3 w-3' />
                              <span>{getRelativeTime(prData.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleRemovePRUrl(prData.html_url || '');
                          }}
                          className='h-8 w-8 p-0 text-gray-400 hover:text-red-600'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Show default state if no pasted PRs */}
          {pastedPRs.length === 0 && (
            <div className='animate-in fade-in slide-in-from-bottom-4 bg-card w-full space-y-6 rounded-xl border border-dashed p-6 text-center duration-500'>
              {/* Icon */}
              <div className='flex justify-center'>
                <div className='flex h-20 w-20 items-center justify-center rounded-2xl'>
                  <LinkIcon className='h-10 w-10' />
                </div>
              </div>

              {/* Heading */}
              <h1 className='text-foreground text-2xl font-bold tracking-tight'>
                Connect your GitHub to get started
              </h1>

              {/* Subheading */}
              <p className='text-muted-foreground mx-auto max-w-xl text-sm'>
                Once connected, you will be able to choose pull requests for
                AI-powered code reviews.
              </p>

              {/* Primary Button */}
              <Button
                size='lg'
                onClick={handleConnectGitHub}
                className='min-w-[200px] bg-[#11054c] hover:bg-[#11054c]/90'
              >
                <Github className='mr-2 h-4 w-4' />
                Link GitHub Account
              </Button>

              {/* Alternative Option */}
              {showPasteURL && (
                <>
                  {/* Separator */}
                  <div className='flex items-center justify-center'>
                    <span className='text-sm text-gray-500'>Or</span>
                  </div>

                  {/* Secondary Button */}
                  <div className='flex justify-center'>
                    <Button
                      variant='outline'
                      onClick={() => setShowPRModal(true)}
                      className='flex items-center gap-2 text-[#4A20F5]'
                    >
                      <LinkIcon className='h-4 w-4' />
                      Paste PR URL
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <GitHubModal open={showGitHubModal} onOpenChange={setShowGitHubModal} />
        {showPasteURL && (
          <PasteURLModal
            open={showPRModal}
            onOpenChange={setShowPRModal}
            onPRImported={handlePRImported}
          />
        )}
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      icon={<GitIcon className='h-4 w-4' />}
      title='Select Repositories'
    >
      <div className='space-y-4'>
        {/* Connected state header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {/* Show either repositories count OR pasted PRs count, not both */}
            {pastedPRs.length > 0 ? (
              <Badge
                variant='outline'
                className='border-0 bg-purple-50 text-purple-600'
              >
                {pastedPRs.length} pasted PRs
              </Badge>
            ) : !viewingPRsForRepo ? (
              <Badge
                variant='outline'
                className='border-0 bg-[#4a20f5]/5 text-[#4a20f5]'
              >
                {filteredRepos.length} repositories found
              </Badge>
            ) : null}
          </div>
          <div className='flex items-center gap-3'>
            {showPasteURL && !viewingPRsForRepo && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowPRModal(true)}
                className='border-purple-600 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-900'
              >
                Paste PR URL
              </Button>
            )}
            <Button
              variant='outline'
              size='sm'
              className='border-slate-700 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              onClick={handleRefresh}
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

        {/* Search input - Only show when displaying repositories (not pasted PRs) */}
        {pastedPRs.length === 0 && (
          <div className='relative'>
            <Input
              type='text'
              placeholder={
                viewingPRsForRepo ? 'Search PRs...' : 'Search repositories...'
              }
              className='w-full'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* Error display */}
        {gitHubError && (
          <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='h-5 w-5 text-red-600' />
              <p className='font-medium text-red-800'>{gitHubError.message}</p>
            </div>
          </div>
        )}

        {/* Content Section - Show PR list if viewing PRs for a specific repository */}
        {viewingPRsForRepo ? (
          <RepositoryPRList
            repositoryName={viewingPRsForRepo}
            onBack={handleBackFromPRs}
            onPRSelect={handlePRSelect}
            refreshTrigger={prRefreshTrigger}
            searchQuery={searchQuery}
            pastedPRUrls={pastedPRs.map(pr => pr.html_url || '')}
            pastedPRs={pastedPRs}
            onRemovePRUrl={handleRemovePRUrl}
            isGitHubConnected={true}
            selectedPR={projectRepos.selectedPR}
          />
        ) : (
          <>
            {/* Show Pasted PRs OR Repository List (not both) */}
            {pastedPRs.length > 0 ? (
              <div className='mb-4 space-y-3'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-gray-900'>
                    Pasted PR URLs ({pastedPRs.length})
                  </h4>
                </div>
                <div className='space-y-2 rounded-lg border p-3'>
                  {pastedPRs.map((prData, index) => {
                    const isSelected =
                      projectRepos.selectedPR?.html_url === prData.html_url;

                    return (
                      <div
                        key={index}
                        className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50 ${
                          isSelected ? 'border-primary/50' : 'border-gray-200'
                        }`}
                        onClick={() => handlePRSelect(prData)}
                      >
                        <div className='flex items-start gap-3'>
                          {/* Selection Radio */}
                          <div className='mt-1'>
                            <input
                              type='radio'
                              checked={isSelected}
                              readOnly
                              className='text-primary focus:ring-primary h-4 w-4 border-gray-300'
                            />
                          </div>

                          {/* PR Content */}
                          <div className='min-w-0 flex-1'>
                            {/* Title */}
                            <div className='mb-2'>
                              <h4 className='truncate font-medium text-gray-900'>
                                #{prData.number} – {prData.title}
                              </h4>
                            </div>

                            {/* Description */}
                            <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
                              {prData.description || 'No description available'}
                            </p>

                            {/* Meta Info */}
                            <div className='flex items-center gap-4 text-xs text-gray-500'>
                              <div className='flex items-center gap-1'>
                                <GitBranch className='h-3 w-3' />
                                <span>
                                  {prData.author}:{prData.branch}
                                </span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                <span>By {prData.author}</span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                <span>{getRelativeTime(prData.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={e => {
                              e.stopPropagation();
                              handleRemovePRUrl(prData.html_url || '');
                            }}
                            className='h-8 w-8 p-0 text-gray-400 hover:text-red-600'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Repository List - Show ONLY when no pasted PRs exist */
              <>
                {isLoadingGitHub ? (
                  <div className='rounded-lg border p-8 text-center'>
                    <div className='flex items-center justify-center gap-3'>
                      <Loader2 className='h-6 w-6 animate-spin' />
                      <div className='text-muted-foreground'>
                        Loading repositories...
                      </div>
                    </div>
                  </div>
                ) : (!githubRepos || githubRepos.length === 0) &&
                  !gitHubError &&
                  !isLoadingGitHub ? (
                  <div className='rounded-lg border p-8 text-center'>
                    <Github className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
                    <p className='text-muted-foreground'>
                      No repositories found. Make sure you have access to
                      repositories in your GitHub account.
                    </p>
                  </div>
                ) : (
                  <div className='max-h-[250px] overflow-y-auto'>
                    {filteredRepos.map((repo: RepositoryState) => (
                      <div
                        key={repo.id}
                        className='cursor-pointer border-b px-4 py-3 transition-all hover:border-gray-300 hover:bg-gray-50/50'
                        onClick={() => handleViewPRs(repo.fullName)}
                      >
                        <div className='flex items-center gap-3'>
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
                              <span className='text-gray-500'>
                                {repo.ownerName}
                              </span>
                              <span className='text-gray-400'>•</span>
                              <span>
                                Updated {getRelativeTime(repo.updatedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        <GitHubModal open={showGitHubModal} onOpenChange={setShowGitHubModal} />
        {showPasteURL && (
          <PasteURLModal
            open={showPRModal}
            onOpenChange={setShowPRModal}
            onPRImported={handlePRImported}
          />
        )}
      </div>
    </SectionWrapper>
  );
}
