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
import { GrafanaIcon } from '@/components/icons';

interface GrafanaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrafanaModal({ open, onOpenChange }: GrafanaModalProps) {
  const [grafanaToken, setGrafanaToken] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setGrafanaConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = grafanaToken.trim();
    const cleanBaseUrl = baseUrl.trim();

    if (!cleanToken || !cleanBaseUrl) {
      toast.error('Please provide both token and base URL');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'grafana',
        auth_type: 'api_key',
        type: 'grafana',
        is_active: true,
        credentials: {
          token: cleanToken,
          base_url: cleanBaseUrl,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setGrafanaConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('Grafana connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect Grafana');
      }
    } catch {
      toast.error('Failed to connect Grafana');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setGrafanaToken('');
    setBaseUrl('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <GrafanaIcon className='h-5 w-5' />
            Connect Grafana Account
          </DialogTitle>
          <DialogDescription>
            Enter your Grafana service account token and base URL to connect
            your dashboards and metrics. You can create a token in your Grafana
            settings under Service Accounts.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='grafana-base-url' className='text-sm font-medium'>
              Grafana Base URL
            </label>
            <Input
              id='grafana-base-url'
              type='url'
              placeholder='https://your-org.grafana.net'
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              The base URL of your Grafana instance (e.g.,
              https://your-org.grafana.net)
            </p>
          </div>
          <div className='space-y-2'>
            <label htmlFor='grafana-token' className='text-sm font-medium'>
              Grafana Service Account Token
            </label>
            <Input
              id='grafana-token'
              type='password'
              placeholder='glsa_xxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={grafanaToken}
              onChange={e => setGrafanaToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
              disabled={isLoading}
            />
            <p className='text-muted-foreground text-xs'>
              Your token needs viewer permissions for dashboards and data
              sources.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!grafanaToken.trim() || !baseUrl.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <GrafanaIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
