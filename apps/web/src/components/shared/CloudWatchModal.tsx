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
import { CloudWatchIcon } from '@/components/icons/CloudWatchIcon';

interface CloudWatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloudWatchModal({ open, onOpenChange }: CloudWatchModalProps) {
  const [accessKey, setAccessKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCloudWatchConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanAccessKey = accessKey.trim();
    const cleanSecretKey = secretKey.trim();
    const cleanRegion = region.trim();

    if (!cleanAccessKey || !cleanSecretKey || !cleanRegion) {
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'cloudwatch',
        auth_type: 'api_key',
        type: 'cloudwatch',
        is_active: true,
        credentials: {
          access_key: cleanAccessKey,
          secret_key: cleanSecretKey,
          region: cleanRegion,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setCloudWatchConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('CloudWatch connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect CloudWatch');
      }
    } catch {
      toast.error('Failed to connect CloudWatch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setAccessKey('');
    setSecretKey('');
    setRegion('us-east-1');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect AWS CloudWatch</DialogTitle>
          <DialogDescription>
            Enter your AWS credentials to connect CloudWatch for monitoring and
            logging data. You can create access keys in your AWS IAM console
            under Security credentials.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label
              htmlFor='cloudwatch-access-key'
              className='text-sm font-medium'
            >
              AWS Access Key ID
            </label>
            <Input
              id='cloudwatch-access-key'
              type='text'
              placeholder='AKIAIOSFODNN7EXAMPLE'
              value={accessKey}
              onChange={e => setAccessKey(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your AWS access key ID for CloudWatch access.
            </p>
          </div>

          <div className='space-y-2'>
            <label
              htmlFor='cloudwatch-secret-key'
              className='text-sm font-medium'
            >
              AWS Secret Access Key
            </label>
            <Input
              id='cloudwatch-secret-key'
              type='password'
              placeholder='wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
              value={secretKey}
              onChange={e => setSecretKey(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your AWS secret access key corresponding to the access key ID.
            </p>
          </div>

          <div className='space-y-2'>
            <label htmlFor='cloudwatch-region' className='text-sm font-medium'>
              AWS Region
            </label>
            <Input
              id='cloudwatch-region'
              type='text'
              placeholder='us-east-1'
              value={region}
              onChange={e => setRegion(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              The AWS region where your CloudWatch resources are located (e.g.,
              us-east-1, eu-west-1).
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
              !accessKey.trim() ||
              !secretKey.trim() ||
              !region.trim() ||
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
                <CloudWatchIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
