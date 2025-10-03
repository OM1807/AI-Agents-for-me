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
import { DataDogIcon } from '@/components/icons/DataDogIcon';

interface DataDogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DataDogModal({ open, onOpenChange }: DataDogModalProps) {
  const [dataDogToken, setDataDogToken] = useState('');
  const [appKey, setAppKey] = useState('');
  const [site, setSite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setDataDogConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = dataDogToken.trim();
    const cleanAppKey = appKey.trim();
    const cleanSite = site.trim();

    if (!cleanToken || !cleanAppKey || !cleanSite) {
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'datadog',
        auth_type: 'api_key',
        type: 'datadog',
        is_active: true,
        credentials: {
          token: cleanToken,
          app_key: cleanAppKey,
          site: cleanSite,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setDataDogConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('DataDog connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect DataDog');
      }
    } catch {
      toast.error('Failed to connect DataDog');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setDataDogToken('');
    setAppKey('');
    setSite('datadoghq.com');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect DataDog Account</DialogTitle>
          <DialogDescription>
            Enter your DataDog credentials to connect your monitoring and
            logging data. You can create API and Application keys in your
            DataDog organization settings under API Keys and Application Keys.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='datadog-token' className='text-sm font-medium'>
              DataDog API Key
            </label>
            <Input
              id='datadog-token'
              type='password'
              placeholder='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={dataDogToken}
              onChange={e => setDataDogToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your key needs read permissions for metrics, logs, and dashboards.
            </p>
          </div>

          <div className='space-y-2'>
            <label htmlFor='datadog-app-key' className='text-sm font-medium'>
              DataDog Application Key
            </label>
            <Input
              id='datadog-app-key'
              type='password'
              placeholder='xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={appKey}
              onChange={e => setAppKey(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Application key for accessing DataDog APIs.
            </p>
          </div>

          <div className='space-y-2'>
            <label htmlFor='datadog-site' className='text-sm font-medium'>
              DataDog Site
            </label>
            <Input
              id='datadog-site'
              type='text'
              placeholder='datadoghq.eu'
              value={site}
              onChange={e => setSite(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your DataDog site domain (e.g., datadoghq.com, datadoghq.eu).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={
              !dataDogToken.trim() ||
              !appKey.trim() ||
              !site.trim() ||
              isLoading
            }
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <DataDogIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
