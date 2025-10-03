'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfluenceIcon } from '@/components/icons';
import {
  MultiSelectDropdown,
  MultiSelectOption,
} from '@/components/shared/MultiSelectDropdown';
import { useAtlassian } from '@/hooks/useAtlassian';
import type { EnhancedAtlassianPage, ConfluencePagesModalProps } from '@/types';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ConfluencePagesModal({
  isOpen,
  onClose,
  onConfirm,
  type,
}: ConfluencePagesModalProps) {
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(
    new Set()
  );
  const [pageSearchQuery, setPageSearchQuery] = useState('');
  const [fullyLoadedSpaces, setFullyLoadedSpaces] = useState<Set<string>>(
    new Set()
  );
  const [loadingSpaces, setLoadingSpaces] = useState<Set<string>>(new Set());

  // Use refs to avoid unnecessary callback recreations
  const cachedPagesRef = useRef<any[]>([]);
  const allSpacesRef = useRef<any[]>([]);
  const prevSelectedSpacesRef = useRef<string[]>([]);

  const { accessToken } = useUser();
  const { spaces, getAllSpaces, getPages, isLoading } = useAtlassian();
  const {
    cachedConfluenceSpaces,
    cachedConfluencePages,
    setCachedConfluenceSpaces,
    setCachedConfluencePages,
    prdconfluence,
    docsconfluence,
    resetPrdconfluence,
    resetDocsconfluence,
  } = useProject();

  const content = {
    prd: {
      title: 'Select Confluence PRD Pages',
      description: 'First select spaces, then choose specific pages',
    },
    supporting_doc: {
      title: 'Select Confluence Documents',
      description: 'First select spaces, then choose specific pages',
    },
  };

  // Merge cached and fetched spaces
  const allSpaces = useMemo(() => {
    const spaceMap = new Map();
    cachedConfluenceSpaces.forEach(space => {
      spaceMap.set(space.key, space);
    });
    spaces.forEach(space => {
      spaceMap.set(space.key, space);
    });
    const result = Array.from(spaceMap.values());
    allSpacesRef.current = result; // Update ref
    return result;
  }, [cachedConfluenceSpaces, spaces]);

  // Convert spaces to dropdown options
  const spaceOptions: MultiSelectOption[] = useMemo(() => {
    return allSpaces.map(space => ({
      id: space.key,
      label: space.name,
      value: space.key,
      metadata: space,
    }));
  }, [allSpaces]);

  // Update cached pages ref
  useEffect(() => {
    cachedPagesRef.current = cachedConfluencePages;
  }, [cachedConfluencePages]);

  // Get pages for selected spaces only
  const filteredPages = useMemo(() => {
    const pagesInSelectedSpaces = (
      cachedConfluencePages as EnhancedAtlassianPage[]
    ).filter(page => selectedSpaces.includes(page.spaceKey));

    if (!pageSearchQuery) return pagesInSelectedSpaces;

    return pagesInSelectedSpaces.filter(page =>
      page.title.toLowerCase().includes(pageSearchQuery.toLowerCase())
    );
  }, [cachedConfluencePages, selectedSpaces, pageSearchQuery]);

  // Load spaces on modal open
  const loadSpaces = useCallback(async () => {
    if (!accessToken) return;

    await getAllSpaces();
  }, [accessToken, getAllSpaces]);

  // Handle refresh - clear all caches and reset states
  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;

    // Reset all states
    setSelectedPageIds(new Set());
    setSelectedSpaces([]);
    setPageSearchQuery('');
    setFullyLoadedSpaces(new Set());
    setLoadingSpaces(new Set());

    // Clear all cached data
    setCachedConfluenceSpaces([]);
    setCachedConfluencePages([]);
    resetPrdconfluence();
    resetDocsconfluence();

    // Reload spaces
    await loadSpaces();
  }, [
    accessToken,
    loadSpaces,
    setCachedConfluenceSpaces,
    setCachedConfluencePages,
    resetPrdconfluence,
    resetDocsconfluence,
  ]);

  // Load pages for selected spaces
  const loadPagesForSpaces = useCallback(
    async (spaceKeys: string[]) => {
      if (!accessToken || spaceKeys.length === 0) return;

      // Filter out spaces that are already fully loaded or currently being loaded
      const spacesToFetch = spaceKeys.filter(
        spaceKey =>
          !fullyLoadedSpaces.has(spaceKey) && !loadingSpaces.has(spaceKey)
      );

      if (spacesToFetch.length === 0) return;

      // Mark spaces as loading
      setLoadingSpaces(prev => {
        const newSet = new Set(prev);
        spacesToFetch.forEach(spaceKey => newSet.add(spaceKey));
        return newSet;
      });

      try {
        const newPages: EnhancedAtlassianPage[] = [];
        const successfullyLoadedSpaces: string[] = [];

        for (const spaceKey of spacesToFetch) {
          try {
            const space = allSpacesRef.current.find(s => s.key === spaceKey);
            if (!space) continue;

            const fetchedPages = await getPages(spaceKey);
            if (fetchedPages) {
              // Mark as successfully loaded regardless of page count
              successfullyLoadedSpaces.push(spaceKey);

              if (fetchedPages.length > 0) {
                const enhancedPages = fetchedPages.map(page => ({
                  ...page,
                  spaceKey: space.key,
                  spaceName: space.name,
                }));
                newPages.push(...enhancedPages);
              }
            }
          } catch (error) {
            console.error(`Error fetching pages for space ${spaceKey}:`, error);
            toast.error(`Error fetching pages for space ${spaceKey}`);
          }
        }

        // Update cache regardless of whether there are new pages
        const prevPages = cachedPagesRef.current as EnhancedAtlassianPage[];
        const pageMap = new Map<string, EnhancedAtlassianPage>();

        // Remove existing pages from successfully loaded spaces to avoid duplicates
        prevPages
          .filter(page => !successfullyLoadedSpaces.includes(page.spaceKey))
          .forEach(page => pageMap.set(page.id, page));

        // Add new pages (if any)
        newPages.forEach(page => pageMap.set(page.id, page));

        setCachedConfluencePages(Array.from(pageMap.values()) as any);

        // Mark spaces as fully loaded and remove from loading set
        if (successfullyLoadedSpaces.length > 0) {
          setFullyLoadedSpaces(prev => {
            const newSet = new Set(prev);
            successfullyLoadedSpaces.forEach(spaceKey => newSet.add(spaceKey));
            return newSet;
          });
        }
      } finally {
        // Remove all fetched spaces from loading set
        setLoadingSpaces(prev => {
          const newSet = new Set(prev);
          spacesToFetch.forEach(spaceKey => newSet.delete(spaceKey));
          return newSet;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, setCachedConfluencePages]
  );

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const currentData = type === 'prd' ? prdconfluence : docsconfluence;

    // Always reset search
    setPageSearchQuery('');

    // Restore page selections
    const persistedPageIds = new Set(currentData.pages.map(page => page.id));
    setSelectedPageIds(persistedPageIds);

    // Handle persisted data
    if (currentData.pages.length > 0) {
      const persistedSpaceKeys = Array.from(
        new Set(
          currentData.pages
            .map(page => (page as EnhancedAtlassianPage).spaceKey)
            .filter(Boolean)
        )
      );

      setSelectedSpaces(persistedSpaceKeys);
      setFullyLoadedSpaces(new Set(persistedSpaceKeys));
    } else {
      setSelectedSpaces([]);
      setFullyLoadedSpaces(new Set());
      setLoadingSpaces(new Set());
    }
  }, [isOpen, type, prdconfluence, docsconfluence]);

  // Separate effect to handle cache updates for persisted pages
  useEffect(() => {
    if (!isOpen) return;

    const currentData = type === 'prd' ? prdconfluence : docsconfluence;

    if (currentData.pages.length > 0) {
      // Ensure persisted pages are in cache
      const existingPages = cachedConfluencePages as EnhancedAtlassianPage[];
      const existingPageIds = new Set(existingPages.map(p => p.id));
      const newPagesToCache = currentData.pages.filter(
        page => !existingPageIds.has(page.id)
      ) as EnhancedAtlassianPage[];

      if (newPagesToCache.length > 0) {
        setCachedConfluencePages([...existingPages, ...newPagesToCache] as any);
      }
    }
  }, [
    isOpen,
    type,
    cachedConfluencePages,
    setCachedConfluencePages,
    prdconfluence,
    docsconfluence,
  ]);

  // Load spaces when modal opens if needed
  useEffect(() => {
    if (isOpen && allSpaces.length === 0) {
      loadSpaces();
    }
  }, [isOpen, allSpaces.length, loadSpaces]);

  // Update cached spaces when fetched
  useEffect(() => {
    if (spaces.length > 0) {
      setCachedConfluenceSpaces(spaces);
    }
  }, [spaces, setCachedConfluenceSpaces]);

  // Load pages when spaces are selected
  useEffect(() => {
    if (selectedSpaces.length === 0) {
      prevSelectedSpacesRef.current = [];
      return;
    }

    // Find newly selected spaces
    const prevSpaces = new Set(prevSelectedSpacesRef.current);
    const newSpaces = selectedSpaces.filter(
      spaceKey => !prevSpaces.has(spaceKey)
    );

    if (newSpaces.length > 0) {
      loadPagesForSpaces(newSpaces);
    }

    prevSelectedSpacesRef.current = selectedSpaces;
  }, [selectedSpaces, loadPagesForSpaces]);

  // Handle page selection
  const handleTogglePage = (pageId: string) => {
    setSelectedPageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    if (onConfirm) {
      const selectedPages = (
        cachedConfluencePages as EnhancedAtlassianPage[]
      ).filter(page => selectedPageIds.has(page.id));
      const pageIds = Array.from(selectedPageIds);
      onConfirm(selectedPages, pageIds);
    }
    handleClose();
  };

  const handleClose = () => {
    setPageSearchQuery('');
    setSelectedSpaces([]);
    setFullyLoadedSpaces(new Set());
    setLoadingSpaces(new Set());
    onClose();
  };

  const selectedPageCount = selectedPageIds.size;
  const hasSelectedSpaces = selectedSpaces.length > 0;

  // Check if any selected spaces are still being loaded or unloaded
  const hasUnloadedSpaces = selectedSpaces.some(
    spaceKey => !fullyLoadedSpaces.has(spaceKey)
  );
  const hasLoadingSpaces = selectedSpaces.some(spaceKey =>
    loadingSpaces.has(spaceKey)
  );

  const pagesAreLoading = hasUnloadedSpaces || hasLoadingSpaces;
  const pagesDisabled = !hasSelectedSpaces || pagesAreLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-w-3xl flex-col overflow-hidden p-4'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                <ConfluenceIcon className='h-5 w-5' />
                {content[type].title}
              </DialogTitle>
              <p className='text-muted-foreground mt-1 text-sm'>
                {content[type].description}
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isLoading.spaces}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading.spaces ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {/* Step 1: Select Spaces */}
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>1. Select Confluence Spaces</h3>

            <MultiSelectDropdown
              options={spaceOptions}
              selectedValues={selectedSpaces}
              onSelectionChange={setSelectedSpaces}
              placeholder={
                isLoading.spaces ? 'Loading spaces...' : 'Select spaces...'
              }
              searchPlaceholder='Type to search spaces...'
              emptyText='No spaces available'
              loading={isLoading.spaces}
              disabled={isLoading.spaces}
            />
          </div>

          {/* Step 2: Select Pages */}
          <div className='flex-1 space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>2. Select Pages</h3>
              {hasSelectedSpaces && (
                <div className='text-muted-foreground text-xs'>
                  {pagesAreLoading
                    ? 'Loading pages...'
                    : `${filteredPages.length} pages available`}
                </div>
              )}
            </div>

            {!hasSelectedSpaces ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>
                  Select spaces first to see available pages
                </p>
              </div>
            ) : (
              <>
                {/* Page Search */}
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                  <Input
                    placeholder='Search pages...'
                    value={pageSearchQuery}
                    onChange={e => setPageSearchQuery(e.target.value)}
                    className='pl-8'
                    disabled={pagesDisabled}
                  />
                </div>

                {/* Pages List */}
                <div
                  className={cn(
                    'max-h-60 overflow-y-auto rounded-md border',
                    pagesDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  {pagesAreLoading ? (
                    <div className='flex items-center justify-center p-8'>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      <span className='text-muted-foreground text-sm'>
                        Loading pages...
                      </span>
                    </div>
                  ) : filteredPages.length === 0 ? (
                    <div className='text-muted-foreground p-8 text-center'>
                      <p className='text-sm'>
                        {pageSearchQuery
                          ? 'No pages found matching your search'
                          : 'No pages found in selected spaces'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {filteredPages.map(page => (
                        <div
                          key={page.id}
                          className={cn(
                            'hover:bg-accent flex cursor-pointer items-center gap-4 border-b px-4 py-3 text-sm transition-colors',
                            selectedPageIds.has(page.id) && 'bg-accent'
                          )}
                          onClick={() => handleTogglePage(page.id)}
                        >
                          <Checkbox
                            checked={selectedPageIds.has(page.id)}
                            onChange={() => {}} // Handled by parent click
                            className='pointer-events-none'
                          />
                          <div className='min-w-0 flex-1'>
                            <p
                              className='truncate font-medium'
                              title={page.title}
                            >
                              {page.title}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {page.spaceName}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className='flex-shrink-0 gap-2'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedPageCount === 0}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm {selectedPageCount > 0 && `(${selectedPageCount} pages)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
