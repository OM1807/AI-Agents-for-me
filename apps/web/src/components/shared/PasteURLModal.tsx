'use client';

import { useState } from 'react';
import { Link, X, GitBranch, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { githubApi } from '@/lib/api/api';
import type { PRData } from '@/types';

interface PasteURLModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPRImported?: (prData: PRData) => void;
}

export function PasteURLModal({
  open,
  onOpenChange,
  onPRImported,
}: PasteURLModalProps) {
  const [prUrl, setPrUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prData, setPrData] = useState<PRData | null>(null);
  const { accessToken } = useUser();

  const validatePRUrl = (url: string): boolean => {
    // Basic validation for GitHub PR URLs
    const githubPRPattern =
      /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/pull\/\d+$/;
    return githubPRPattern.test(url.trim());
  };

  const handleImportPR = async () => {
    const cleanUrl = prUrl.trim();

    if (!cleanUrl) {
      toast.error('Please enter a PR URL');
      return;
    }

    if (!validatePRUrl(cleanUrl)) {
      toast.error(
        'Please enter a valid GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Call the backend API to validate and fetch PR data using the proper API integration
      // For public PRs, access token might not be required, but we'll pass it if available
      const response = await githubApi.validatePR(
        cleanUrl,
        accessToken || undefined
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to validate PR');
      }

      const backendPrData = response.data;

      if (!backendPrData) {
        throw new Error('No data received from API');
      }

      // Transform GitHub API response to match our interface
      const transformedPrData: PRData = {
        id:
          backendPrData.id?.toString() ||
          backendPrData.number?.toString() ||
          '',
        number: backendPrData.number || 0,
        title: backendPrData.title || `PR #${backendPrData.number}`,
        description: backendPrData.body || '',
        author: backendPrData.user?.login || 'Unknown',
        branch: backendPrData.head?.ref || 'main',
        baseBranch: backendPrData.base?.ref || 'main',
        html_url: backendPrData.html_url || cleanUrl,
        repositoryName:
          backendPrData.head?.repo?.full_name ||
          backendPrData.base?.repo?.full_name ||
          cleanUrl.split('/').slice(3, 5).join('/'),
        state: backendPrData.state || 'open',
        draft: backendPrData.draft || false,
        createdAt: backendPrData.created_at
          ? new Date(backendPrData.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })
          : new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            }),
      };

      setPrData(transformedPrData);

      // Auto-import the PR immediately after fetching data
      if (onPRImported) {
        onPRImported(transformedPrData);
      }
      handleClose();
      toast.success('PR imported successfully!');
    } catch {
      toast.error(
        'Failed to fetch PR data. Please check the URL and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setPrUrl('');
    setPrData(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className=''>
        <DialogHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='text-xl font-semibold'>
                Paste PR URL
              </DialogTitle>
              <DialogDescription className='mt-1 text-gray-600'>
                Paste your PR URL to fetch details automatically.
              </DialogDescription>
            </div>
            <button
              onClick={handleClose}
              className='rounded-full p-2 transition-colors hover:bg-gray-100'
            >
              <X size={20} />
            </button>
          </div>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {!prData ? (
            <div className='space-y-2'>
              <Input
                type='url'
                placeholder='Enter your PR url...'
                value={prUrl}
                onChange={e => setPrUrl(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleImportPR();
                  }
                }}
                className='w-full'
              />
              {prUrl && !validatePRUrl(prUrl) && (
                <p className='text-sm text-red-500'>
                  Please enter a valid GitHub PR URL
                </p>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {/* PR Card - matches repository PR card format */}
              <div className='cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:bg-gray-50/50'>
                <div className='flex items-start gap-3'>
                  {/* Selection Radio */}
                  <div className='mt-1'>
                    <input
                      type='radio'
                      checked={true}
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
                        <span>{prData.createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Back to edit URL */}
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setPrData(null)}
                className='text-sm text-gray-600 hover:text-gray-900'
              >
                ← Edit URL
              </Button>
            </div>
          )}
        </div>

        <div className='flex justify-end gap-3 pt-4'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          {!prData && (
            <Button
              onClick={handleImportPR}
              disabled={!prUrl.trim() || !validatePRUrl(prUrl) || isLoading}
              className='flex items-center gap-2'
            >
              {isLoading ? (
                <>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
                  Fetching PR...
                </>
              ) : (
                <>
                  <Link size={16} />
                  Fetch PR Data
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
