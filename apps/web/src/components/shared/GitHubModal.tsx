'use client';

import { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useOAuth } from '@/hooks/useOAuth';
import { integrationApi } from '@/lib/api/api';
import type { CreateIntegrationData } from '@/types';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

interface GitHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GitHubModal({ open, onOpenChange }: GitHubModalProps) {
  const [gitHubToken, setGitHubToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setGitHubConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = gitHubToken.trim();
    if (!cleanToken) {
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'github',
        auth_type: 'api_key',
        type: 'github',
        is_active: true,
        credentials: {
          token: cleanToken,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setGitHubConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('GitHub connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect GitHub');
      }
    } catch {
      toast.error('Failed to connect GitHub');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setGitHubToken('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect GitHub Account</DialogTitle>
          <DialogDescription>
            Enter your GitHub personal access token to connect your
            repositories. You can create a token in your GitHub settings under
            Developer settings → Personal access tokens.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='github-token' className='text-sm font-medium'>
              GitHub Access Token
            </label>
            <Input
              id='github-token'
              type='password'
              placeholder='ghp_xxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={gitHubToken}
              onChange={e => setGitHubToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your token needs the &apos;repo&apos; scope to access
              repositories.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!gitHubToken.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <Github className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
