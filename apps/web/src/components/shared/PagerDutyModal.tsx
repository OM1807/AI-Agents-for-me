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
import { PagerDutyIcon } from '@/components/icons/PagerDutyIcon';

interface PagerDutyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PagerDutyModal({ open, onOpenChange }: PagerDutyModalProps) {
  const [pagerDutyToken, setPagerDutyToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setPagerDutyConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = pagerDutyToken.trim();
    if (!cleanToken) {
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'pagerduty',
        auth_type: 'api_key',
        type: 'pagerduty',
        is_active: true,
        credentials: {
          token: cleanToken,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setPagerDutyConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('PagerDuty connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect PagerDuty');
      }
    } catch {
      toast.error('Failed to connect PagerDuty');
    } finally {
      setIsLoading(false);
    }

    toast.success('PagerDuty connected successfully');
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setPagerDutyToken('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect PagerDuty Account</DialogTitle>
          <DialogDescription>
            Enter your PagerDuty API token to connect your incident management.
            You can create a token in your PagerDuty account settings under API
            Access Keys.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='pagerduty-token' className='text-sm font-medium'>
              PagerDuty API Token
            </label>
            <Input
              id='pagerduty-token'
              type='password'
              placeholder='pd_xxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={pagerDutyToken}
              onChange={e => setPagerDutyToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your token needs read and write permissions for incident
              management.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!pagerDutyToken.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <PagerDutyIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
