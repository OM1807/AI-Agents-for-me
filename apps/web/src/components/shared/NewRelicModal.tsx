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
import { NewRelicIcon } from '@/components/icons';

interface NewRelicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRelicModal({ open, onOpenChange }: NewRelicModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setNewRelicConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanApiKey = apiKey.trim();
    const cleanAccountId = accountId.trim();
    const cleanRegion = region.trim();

    if (!cleanApiKey || !cleanAccountId || !cleanRegion) {
      toast.error('Please provide API key, account ID, and region');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'new_relic',
        auth_type: 'api_key',
        type: 'new_relic',
        is_active: true,
        credentials: {
          api_key: cleanApiKey,
          account_id: cleanAccountId,
          region: cleanRegion,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setNewRelicConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('New Relic connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect New Relic');
      }
    } catch {
      toast.error('Failed to connect New Relic');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setApiKey('');
    setAccountId('');
    setRegion('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <NewRelicIcon className='h-5 w-5' />
            Connect New Relic Account
          </DialogTitle>
          <DialogDescription>
            Enter your New Relic API key, account ID, and region to connect your
            monitoring data. You can find these details in your New Relic
            account settings.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='newrelic-api-key' className='text-sm font-medium'>
              New Relic API Key
            </label>
            <Input
              id='newrelic-api-key'
              type='password'
              placeholder='NRAK-xxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              Your key needs read permissions for applications and
              infrastructure.
            </p>
          </div>
          <div className='space-y-2'>
            <label
              htmlFor='newrelic-account-id'
              className='text-sm font-medium'
            >
              Account ID
            </label>
            <Input
              id='newrelic-account-id'
              type='text'
              placeholder='your-account-id'
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              Your New Relic account ID (found in account settings).
            </p>
          </div>
          <div className='space-y-2'>
            <label htmlFor='newrelic-region' className='text-sm font-medium'>
              Region
            </label>
            <Input
              id='newrelic-region'
              type='text'
              placeholder='your-region'
              value={region}
              onChange={e => setRegion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              Your New Relic region (US or EU).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={
              !apiKey.trim() || !accountId.trim() || !region.trim() || isLoading
            }
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <NewRelicIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
