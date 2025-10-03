'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfluenceIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useAtlassian } from '@/hooks/useAtlassian';
import { useUser } from '@/hooks/useUser';
import { ConfluenceSpaceSelectorProps } from '@/types';

export function ConfluenceSpaceSelector({
  isOpen,
  onClose,
  onConfirm,
  title = 'Select Confluence Space',
  description = 'Choose a Confluence space for documentation',
}: ConfluenceSpaceSelectorProps) {
  const [selectedSpaceKey, setSelectedSpaceKey] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const { accessToken } = useUser();
  const { spaces, getAllSpaces, isLoading } = useAtlassian();

  // Filter spaces based on search query
  const filteredSpaces = useMemo(() => {
    if (!searchQuery) return spaces;
    return spaces.filter(
      space =>
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [spaces, searchQuery]);

  // Load spaces on modal open
  const loadSpaces = useCallback(async () => {
    if (!accessToken) return;
    await getAllSpaces();
  }, [accessToken, getAllSpaces]);

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSpaceKey('');
      setSearchQuery('');
      if (spaces.length === 0) {
        loadSpaces();
      }
    }
  }, [isOpen, spaces.length, loadSpaces]);

  const handleConfirm = () => {
    if (selectedSpaceKey) {
      onConfirm(selectedSpaceKey);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedSpaceKey('');
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ConfluenceIcon className='h-5 w-5' />
            {title}
          </DialogTitle>
          <p className='text-muted-foreground text-sm'>{description}</p>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Search input */}
          <div className='relative'>
            <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
            <Input
              placeholder='Search spaces...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-8'
              disabled={isLoading.spaces}
            />
          </div>

          {/* Spaces list */}
          <div className='max-h-60 overflow-y-auto rounded-md border'>
            {isLoading.spaces ? (
              <div className='flex items-center justify-center p-8'>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                <span className='text-muted-foreground text-sm'>
                  Loading spaces...
                </span>
              </div>
            ) : filteredSpaces.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center'>
                <p className='text-sm'>
                  {searchQuery
                    ? 'No spaces found matching your search'
                    : 'No spaces available'}
                </p>
              </div>
            ) : (
              <div className='p-2'>
                {filteredSpaces.map(space => (
                  <div
                    key={space.key}
                    className={cn(
                      'hover:bg-accent flex cursor-pointer items-center gap-3 rounded-md p-3 text-sm transition-colors',
                      selectedSpaceKey === space.key && 'bg-accent'
                    )}
                    onClick={() => setSelectedSpaceKey(space.key)}
                  >
                    <input
                      type='radio'
                      checked={selectedSpaceKey === space.key}
                      onChange={() => setSelectedSpaceKey(space.key)}
                      className='text-primary focus:ring-primary h-4 w-4'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate font-medium' title={space.name}>
                        {space.name}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        Key: {space.key}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSpaceKey}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
