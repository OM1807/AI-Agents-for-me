'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FigmaIcon } from '@/components/icons';
import { toast } from 'sonner';
import { useUser } from '@/hooks/useUser';
import { useFigma } from '@/hooks/useFigma';
import type { SupportingDocType, FigmaFile } from '@/types';

interface FigmaFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: FigmaFile) => void;
  type: SupportingDocType;
  existingFiles: FigmaFile[];
}

const validateFigmaUrl = (url: string): boolean => {
  const figmaUrlPattern =
    /^https:\/\/(www\.)?figma\.com\/(design|file|proto)\/[A-Za-z0-9]+/;
  return figmaUrlPattern.test(url);
};

const extractFileIdFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // For URLs like /design/{fileId}/{fileName} or /file/{fileId}/{fileName}
    if (
      pathParts.length >= 3 &&
      (pathParts[1] === 'design' ||
        pathParts[1] === 'file' ||
        pathParts[1] === 'proto')
    ) {
      return pathParts[2] || null;
    }
  } catch {
    // Invalid URL
  }
  return null;
};

export function FigmaFileModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  existingFiles,
}: FigmaFileModalProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken } = useUser();
  const { getFileMetadata } = useFigma();

  const content = {
    prd: {
      title: 'Add Figma PRD File',
      description:
        'Add a Figma file that contains your product requirements and designs.',
    },
    supporting_doc: {
      title: 'Add Figma Support File',
      description:
        'Add a Figma file that supports your product development process.',
    },
  };

  const { title, description } = content[type];

  const handleConfirm = async () => {
    if (!figmaUrl.trim()) {
      toast.error('Please enter a Figma URL');
      return;
    }

    if (!validateFigmaUrl(figmaUrl)) {
      toast.error('Please enter a valid Figma URL');
      return;
    }

    // Check for duplicate URLs
    const trimmedUrl = figmaUrl.trim();
    const isDuplicate = existingFiles.some(file => file.url === trimmedUrl);
    if (isDuplicate) {
      toast.error('This Figma file has already been added');
      return;
    }

    const fileId = extractFileIdFromUrl(figmaUrl);
    if (!fileId) {
      toast.error('Unable to extract file ID from the URL');
      return;
    }

    if (!accessToken) {
      toast.error('Please log in to add Figma files');
      return;
    }

    setIsLoading(true);
    try {
      const fileData = await getFileMetadata(fileId);

      if (!fileData) {
        return;
      }

      const figmaFile: FigmaFile = {
        ...fileData,
        url: figmaUrl.trim(), // Use the original URL from user input
      };

      onConfirm(figmaFile);
      handleClose();
      toast.success('Figma file added successfully');
    } catch (error) {
      console.error('Error adding Figma file:', error);
      toast.error('Failed to add Figma file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFigmaUrl('');
    setIsLoading(false);
    onClose();
  };

  const hasValidUrl = figmaUrl.trim() && validateFigmaUrl(figmaUrl);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <FigmaIcon className='h-6 w-6' />
            {title}
          </DialogTitle>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='figma-url'>Figma URL</Label>
            <div className='flex gap-2'>
              <Input
                id='figma-url'
                placeholder='https://www.figma.com/design/...'
                value={figmaUrl}
                onChange={e => setFigmaUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {figmaUrl && !validateFigmaUrl(figmaUrl) && (
              <p className='text-destructive text-xs'>
                Please enter a valid Figma file URL
              </p>
            )}
            <p className='text-muted-foreground text-xs'>
              Paste the URL from your Figma file (e.g.,
              https://www.figma.com/design/...)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasValidUrl || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Adding...
              </>
            ) : (
              'Add File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
