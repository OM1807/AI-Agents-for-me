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
import { FigmaIcon } from '@/components/icons/FigmaIcon';

interface FigmaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FigmaModal({ open, onOpenChange }: FigmaModalProps) {
  const [figmaToken, setFigmaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setFigmaConnection } = useOAuth();
  const { accessToken } = useUser();

  const handleConnect = async () => {
    const cleanToken = figmaToken.trim();
    if (!cleanToken) {
      return;
    }
    setIsLoading(true);
    try {
      const payload: CreateIntegrationData = {
        name: 'figma',
        auth_type: 'pat',
        type: 'figma',
        is_active: true,
        credentials: {
          token: cleanToken,
        },
      };

      // Create the integration
      const response = await integrationApi.create(payload, accessToken ?? '');

      if (response.success && response.data) {
        setFigmaConnection({
          isConnected: true,
          id: response.data.id,
        });
        toast.success('Figma connected successfully');
        handleClose();
      } else {
        toast.error('Failed to connect Figma');
      }
    } catch {
      toast.error('Failed to connect Figma');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFigmaToken('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={handleClose} />
        <DialogHeader>
          <DialogTitle>Connect Figma Account</DialogTitle>
          <DialogDescription>
            Enter your Figma personal access token to connect your design files.
            You can create a token in your Figma account settings under Personal
            access tokens.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='figma-token' className='text-sm font-medium'>
              Figma Access Token
            </label>
            <Input
              id='figma-token'
              type='password'
              placeholder='figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxx'
              value={figmaToken}
              onChange={e => setFigmaToken(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleConnect();
                }
              }}
            />
            <p className='text-muted-foreground text-xs'>
              Your token needs file access permissions to view design files.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!figmaToken.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Connecting...
              </>
            ) : (
              <>
                <FigmaIcon className='mr-2 h-4 w-4' />
                Connect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
