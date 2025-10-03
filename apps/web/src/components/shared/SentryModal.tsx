'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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
import { SentryIcon } from '@/components/icons/SentryIcon';

interface SentryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SentryModal({ open, onOpenChange }: SentryModalProps) {
  const [sentryToken, setSentryToken] = useState('');
  const [organization, setOrganization] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setSentryConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = sentryToken.trim();
    const cleanOrganization = organization.trim();

    if (!cleanToken || !cleanOrganization) {
      toast.error('Please provide both API token and organization');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'sentry',
        auth_type: 'api_key',
        type: 'sentry',
        is_active: true,
        credentials: {
          token: cleanToken,
          organization: cleanOrganization,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setSentryConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('Sentry connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect Sentry');
      }
    } catch {
      toast.error('Failed to connect Sentry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSentryToken('');
    setOrganization('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect Sentry Account</DialogTitle>
          <DialogDescription>
            Enter your Sentry organization and auth token to connect your error
            tracking. You can create a token in your Sentry organization
            settings under Auth Tokens.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label
              htmlFor='sentry-organization'
              className='text-sm font-medium'
            >
              Sentry Organization ID
            </label>
            <Input
              id='sentry-organization'
              type='text'
              placeholder='your-organization-slug'
              value={organization}
              onChange={e => setOrganization(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your organization ID from the Sentry URL.
            </p>
          </div>
          <div className='space-y-2'>
            <label htmlFor='sentry-token' className='text-sm font-medium'>
              Sentry Auth Token
            </label>
            <Input
              id='sentry-token'
              type='password'
              placeholder='sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={sentryToken}
              onChange={e => setSentryToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your token needs project and event read permissions.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!sentryToken.trim() || !organization.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <SentryIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
