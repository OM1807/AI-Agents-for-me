'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, GitBranch, User, Clock, Loader2, X } from 'lucide-react';
import { githubApi } from '@/lib/api/api';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import type { PRData } from '@/types';

interface RepositoryPRListProps {
  repositoryName: string;
  onBack?: () => void;
  onPRSelect?: (pr: PRData) => void;
  refreshTrigger?: number;
  searchQuery?: string;
  pastedPRUrls?: string[];
  pastedPRs?: PRData[];
  onRemovePRUrl?: (url: string) => void;
  isGitHubConnected?: boolean;
  selectedPR?: {
    html_url: string;
  } | null;
}

export function RepositoryPRList({
  repositoryName,
  onBack,
  onPRSelect,
  refreshTrigger,
  searchQuery = '',
  pastedPRUrls = [],
  pastedPRs = [],
  onRemovePRUrl,
  isGitHubConnected = true,
  selectedPR,
}: RepositoryPRListProps) {
  const [selectedPRUrl, setSelectedPRUrl] = useState<string | null>(null);
  const [prs, setPrs] = useState<PRData[]>([]);
  const [fetchingPRs, setFetchingPRs] = useState(false);
  const [prError, setPrError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const { accessToken } = useUser();

  // Sync local state with selectedPR prop
  useEffect(() => {
    if (selectedPR?.html_url) {
      setSelectedPRUrl(selectedPR.html_url);
    } else {
      setSelectedPRUrl(null);
    }
  }, [selectedPR]);

  const transformGitHubPRs = (apiPRs: any[]): PRData[] => {
    return apiPRs.map(pr => ({
      id: pr.id?.toString() || pr.number?.toString() || '',
      number: pr.number || 0,
      title: pr.title || 'Untitled PR',
      description: pr.body || 'No description available',
      author: pr.user?.login || pr.author?.login || 'Unknown author',
      branch: pr.head?.ref || 'unknown-branch',
      baseBranch: pr.base?.ref || 'main',
      createdAt: pr.created_at
        ? new Date(pr.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'Unknown date',
      html_url: pr.html_url,
    }));
  };

  const fetchPRs = async (page: number = 1, showLoading: boolean = true) => {
    if (!accessToken || !repositoryName) return;

    const [owner, repo] = repositoryName.split('/');
    if (!owner || !repo) return;

    if (showLoading) setFetchingPRs(true);
    setPrError(null);

    try {
      const response = await githubApi.getPullRequests(
        owner,
        repo,
        accessToken,
        {
          state: 'open',
          sort: 'created',
          direction: 'desc',
          page,
          per_page: 10,
        }
      );

      if (response.success && response.data) {
        const { results, has_next } = response.data;
        const transformedPRs = transformGitHubPRs(results);

        if (page === 1) {
          setPrs(transformedPRs);
        } else {
          setPrs(prev => [...prev, ...transformedPRs]);
        }

        setCurrentPage(page);
        setHasMore(has_next);
      } else {
        throw new Error('API response not successful');
      }
    } catch {
      setPrs([]);
      setCurrentPage(1);
      setHasMore(false);
      toast.error(
        'Failed to fetch PRs. Please check your connection and try again.'
      );
    } finally {
      if (showLoading) setFetchingPRs(false);
    }
  };

  useEffect(() => {
    if (isGitHubConnected) {
      fetchPRs(1, true);
    } else {
      // When GitHub is not connected, only show pasted PRs (no sample public PRs)
      setPrs([]);
      setFetchingPRs(false);
      setPrError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositoryName, accessToken, isGitHubConnected]);

  // Filter PRs based on search query
  const filteredPRs = prs.filter(pr => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      pr.title.toLowerCase().includes(query) ||
      pr.description.toLowerCase().includes(query) ||
      pr.author.toLowerCase().includes(query) ||
      pr.number.toString().includes(query) ||
      pr.branch.toLowerCase().includes(query)
    );
  });

  const handlePRSelection = (pr: PRData) => {
    setSelectedPRUrl(pr.html_url || '');
    if (onPRSelect) {
      onPRSelect(pr);
    }
  };

  const handleRefresh = () => {
    fetchPRs(1, true);
  };

  // Listen for refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchPRs(1, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const handleLoadMore = () => {
    if (hasMore && !fetchingPRs) {
      fetchPRs(currentPage + 1, false);
    }
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button variant='ghost' size='sm' onClick={onBack}>
            <ArrowLeft className='mr-2 h-4 w-4' />
          </Button>
          <div>
            <h3 className='text-lg font-semibold'>
              {isGitHubConnected ? 'Open Pull Requests' : 'Pasted PR URLs'} (
              {isGitHubConnected ? filteredPRs.length : pastedPRUrls.length})
              {searchQuery && ` (filtered)`}
            </h3>
            <p className='text-sm text-gray-600'>Repo: {repositoryName}</p>
          </div>
        </div>
      </div>

      {/* Pasted PRs Section - Use full PR data when available */}
      {(pastedPRs.length > 0 || pastedPRUrls.length > 0) && (
        <div className='space-y-3'>
          {/* Use full PR data if available, otherwise fall back to URLs */}
          {pastedPRs.length > 0
            ? pastedPRs.map((prData, index) => {
                const isSelected = selectedPR?.html_url === prData.html_url;

                return (
                  <div
                    key={`pasted-pr-${index}`}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      const transformedPrData: PRData = {
                        id: prData.id,
                        number: prData.number,
                        title: prData.title,
                        description: prData.description,
                        author: prData.author,
                        branch: prData.branch,
                        baseBranch: prData.baseBranch,
                        createdAt: prData.createdAt,
                        html_url: prData.html_url,
                      };
                      handlePRSelection(transformedPrData);
                    }}
                  >
                    <div className='flex items-start gap-3'>
                      {/* Selection Radio */}
                      <div className='mt-1'>
                        <input
                          type='radio'
                          name='pr-selection'
                          checked={isSelected}
                          onChange={() => {}}
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
                            <span>{prData.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {onRemovePRUrl && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            onRemovePRUrl(prData.html_url || '');
                          }}
                          className='h-8 w-8 p-0 text-gray-400 hover:text-red-500'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            : pastedPRUrls.map((url, index) => {
                const isSelected = selectedPR?.html_url === url;
                const urlParts = url.split('/');
                const prNumber = parseInt(urlParts[6]);
                const repoName = `${urlParts[3]}/${urlParts[4]}`;

                return (
                  <div
                    key={`pasted-url-${index}`}
                    className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50 ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5 shadow-sm'
                        : 'border-gray-200'
                    }`}
                    onClick={() => {
                      const prData: PRData = {
                        id: `pasted-${prNumber}`,
                        number: prNumber,
                        title: `Pasted PR #${prNumber}`,
                        description: `Pasted from ${repoName}`,
                        author: 'Unknown',
                        branch: 'main',
                        baseBranch: 'main',
                        createdAt: 'Just now',
                        html_url: url,
                      };
                      handlePRSelection(prData);
                    }}
                  >
                    <div className='flex items-start gap-3'>
                      {/* Selection Radio */}
                      <div className='mt-1'>
                        <input
                          type='radio'
                          name='pr-selection'
                          checked={isSelected}
                          onChange={() => {}}
                          className='text-primary focus:ring-primary h-4 w-4 border-gray-300'
                        />
                      </div>

                      {/* PR Content */}
                      <div className='min-w-0 flex-1'>
                        {/* Title */}
                        <div className='mb-2'>
                          <h4 className='truncate font-medium text-gray-900'>
                            #{prNumber} – {repoName}
                          </h4>
                        </div>

                        {/* Description */}
                        <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
                          Pasted PR URL
                        </p>

                        {/* Meta Info */}
                        <div className='flex items-center gap-4 text-xs text-gray-500'>
                          <div className='flex items-center gap-1'>
                            <GitBranch className='h-3 w-3' />
                            <span>Unknown:main</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <User className='h-3 w-3' />
                            <span>By Unknown</span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3' />
                            <span>Just now</span>
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      {onRemovePRUrl && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            onRemovePRUrl(url);
                          }}
                          className='h-8 w-8 p-0 text-gray-400 hover:text-red-500'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      )}

      {/* PR List */}
      {fetchingPRs ? (
        <div className='rounded-lg border p-8 text-center'>
          <div className='flex items-center justify-center gap-3'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <div className='text-muted-foreground'>
              {fetchingPRs
                ? 'Fetching PRs from GitHub...'
                : 'Refreshing PRs...'}
            </div>
          </div>
        </div>
      ) : prError ? (
        <div className='rounded-lg border border-red-200 bg-red-50 p-8 text-center'>
          <div className='space-y-3'>
            <p className='text-sm text-red-600'>{prError}</p>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              className='flex items-center gap-2'
            >
              <Loader2 className='h-4 w-4' />
              Retry
            </Button>
          </div>
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredPRs.map(pr => (
            <div
              key={pr.id}
              className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50 ${
                selectedPRUrl === pr.html_url
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-gray-200'
              }`}
            >
              <div className='flex items-start gap-3'>
                {/* Selection Radio */}
                <div className='mt-1'>
                  <input
                    type='radio'
                    checked={selectedPRUrl === pr.html_url}
                    onChange={() => handlePRSelection(pr)}
                    className='text-primary focus:ring-primary h-4 w-4 border-gray-300'
                  />
                </div>

                {/* PR Content */}
                <div className='min-w-0 flex-1'>
                  {/* Title */}
                  <div className='mb-2'>
                    <h4 className='truncate font-medium text-gray-900'>
                      #{pr.number} – {pr.title}
                    </h4>
                  </div>

                  {/* Description */}
                  <p className='mb-3 line-clamp-2 text-sm text-gray-600'>
                    {pr.description}
                  </p>

                  {/* Meta Info */}
                  <div className='flex items-center gap-4 text-xs text-gray-500'>
                    <div className='flex items-center gap-1'>
                      <GitBranch className='h-3 w-3' />
                      <span>
                        {pr.author}:{pr.branch}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <User className='h-3 w-3' />
                      <span>By {pr.author}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      <span>{pr.createdAt}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && !fetchingPRs && !searchQuery && (
            <div className='pt-4 text-center'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleLoadMore}
                className='flex items-center gap-2'
              >
                Load More PRs
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No PRs State - Only show when there are no pasted PRs AND no regular PRs */}
      {!fetchingPRs &&
        !prError &&
        filteredPRs.length === 0 &&
        pastedPRUrls.length === 0 &&
        pastedPRs.length === 0 && (
          <div className='py-8 text-center'>
            <GitBranch className='mx-auto mb-3 h-12 w-12 text-gray-400' />
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {searchQuery ? 'No PRs Found' : 'No Open Pull Requests'}
            </h3>
            <p className='text-gray-600'>
              {searchQuery
                ? `No pull requests match "${searchQuery}". Try adjusting your search.`
                : "This repository doesn't have any open pull requests."}
            </p>
          </div>
        )}
    </div>
  );
}
