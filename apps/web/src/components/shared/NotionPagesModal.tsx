'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { NotionIcon } from '@/components/icons';
import { TreeView, TreeNode } from '@/components/shared/TreeView';
import { useNotion } from '@/hooks/useNotion';
import type { NotionPage, NotionPagesModalProps } from '@/types';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

// Helper function to get title from NotionPage
const getNotionPageTitle = (page: NotionPage): string => {
  return page.properties?.title?.title?.[0]?.plain_text || 'Untitled';
};

// Convert NotionPage to TreeNode
const convertToTreeNode = (page: NotionPage): TreeNode => ({
  id: page.id,
  label: getNotionPageTitle(page),
  icon: page.icon?.emoji,
  url: page.url,
});

// Build hierarchical tree structure
const buildTreeStructure = (pages: NotionPage[]): TreeNode[] => {
  const pageMap = new Map<string, TreeNode & { children: TreeNode[] }>();
  const rootNodes: TreeNode[] = [];

  // First pass: create nodes
  pages.forEach(page => {
    const node = { ...convertToTreeNode(page), children: [] };
    pageMap.set(page.id, node);
  });

  // Second pass: build hierarchy
  pages.forEach(page => {
    const currentNode = pageMap.get(page.id)!;

    if (page.parent?.type === 'page_id' && page.parent.page_id) {
      const parentNode = pageMap.get(page.parent.page_id);
      if (parentNode) {
        parentNode.children.push(currentNode);
      } else {
        rootNodes.push(currentNode);
      }
    } else {
      rootNodes.push(currentNode);
    }
  });

  // Sort alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label));
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(rootNodes);
  return rootNodes;
};

export function NotionPagesModal({
  isOpen,
  onClose,
  onConfirm,
  type,
}: NotionPagesModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const { notionConnection } = useOAuth();
  const { accessToken } = useUser();
  const {
    cachedNotionPages,
    setCachedNotionPages,
    prdnotion,
    docsnotion,
    resetPrdnotion,
    resetDocsnotion,
  } = useProject();

  // Type-specific content
  const content = {
    prd: {
      title: 'Select Notion PRD Pages',
      description: 'Choose PRD pages from your Notion workspace',
    },
    supporting_doc: {
      title: 'Select Notion Documents',
      description: 'Choose supporting documents from your Notion workspace',
    },
  };

  // Notion hook
  const {
    pages: fetchedPages,
    searchPages: searchNotionPages,
    isLoading,
    error,
  } = useNotion();

  // Merge cached pages with search results (using Set for deduplication)
  const allPages = useMemo(() => {
    const pageMap = new Map<string, NotionPage>();

    cachedNotionPages.forEach(page => {
      pageMap.set(page.id, page);
    });

    fetchedPages.forEach(page => {
      pageMap.set(page.id, page);
    });

    return Array.from(pageMap.values());
  }, [cachedNotionPages, fetchedPages]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // API search function
  const handleApiSearch = useCallback(
    async (query: string) => {
      if (!notionConnection.isConnected || !accessToken) return;

      if (query.trim() === '') {
        return;
      }

      setIsSearching(true);
      try {
        await searchNotionPages(query);
      } catch (error) {
        console.error('Failed to search pages:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [notionConnection.isConnected, accessToken, searchNotionPages]
  );

  // Refresh function (clears cache and reloads)
  const handleRefresh = useCallback(async () => {
    if (!notionConnection.isConnected || !accessToken) return;

    setIsRefreshing(true);
    try {
      setCachedNotionPages([]);
      await searchNotionPages('');
      resetDocsnotion();
      resetPrdnotion();
    } catch (error) {
      console.error('Failed to refresh pages:', error);
      toast.error('Failed to refresh Notion pages');
    } finally {
      setIsRefreshing(false);
    }
  }, [
    notionConnection.isConnected,
    accessToken,
    searchNotionPages,
    setCachedNotionPages,
    resetDocsnotion,
    resetPrdnotion,
  ]);

  // Trigger API search when debounced query changes
  useEffect(() => {
    if (isOpen && debouncedSearchQuery.trim() !== '') {
      handleApiSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, isOpen, handleApiSearch]);

  // Build tree structure (local filter + API results)
  const treeNodes = useMemo(() => {
    let filteredPages = allPages;

    if (searchQuery.trim() !== '') {
      filteredPages = allPages.filter(page =>
        getNotionPageTitle(page)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    }

    return buildTreeStructure(filteredPages);
  }, [allPages, searchQuery]);

  // Load persisted selections when modal opens
  useEffect(() => {
    if (isOpen) {
      const currentData = type === 'prd' ? prdnotion : docsnotion;
      const persistedIds = new Set(currentData.pages.map(page => page.id));
      setSelectedIds(persistedIds);
      setSearchQuery('');
      setDebouncedSearchQuery('');

      // Fetch initial pages if cache is empty
      if (
        cachedNotionPages.length === 0 &&
        notionConnection.isConnected &&
        accessToken
      ) {
        handleRefresh();
      }
    }
  }, [
    isOpen,
    type,
    prdnotion,
    docsnotion,
    cachedNotionPages.length,
    notionConnection.isConnected,
    accessToken,
    handleRefresh,
  ]);

  // Get all descendant IDs for tree selection
  const getAllDescendantIds = (nodeId: string, nodes: TreeNode[]): string[] => {
    const ids: string[] = [];

    const findAndCollect = (searchNodes: TreeNode[]) => {
      for (const node of searchNodes) {
        if (node.id === nodeId) {
          const collectIds = (n: TreeNode) => {
            if (n.children) {
              n.children.forEach(child => {
                ids.push(child.id);
                collectIds(child);
              });
            }
          };
          collectIds(node);
          return true;
        }
        if (node.children && findAndCollect(node.children)) {
          return true;
        }
      }
      return false;
    };

    findAndCollect(nodes);
    return ids;
  };

  const handleToggleNode = (nodeId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);

      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
        const descendantIds = getAllDescendantIds(nodeId, treeNodes);
        descendantIds.forEach(id => newSet.delete(id));
      } else {
        newSet.add(nodeId);
        const descendantIds = getAllDescendantIds(nodeId, treeNodes);
        descendantIds.forEach(id => newSet.add(id));
      }

      return newSet;
    });
  };

  // Update cached pages when new pages are fetched (merge with existing)
  useEffect(() => {
    if (fetchedPages.length > 0) {
      const pageMap = new Map<string, NotionPage>();

      cachedNotionPages.forEach(page => {
        pageMap.set(page.id, page);
      });

      fetchedPages.forEach(page => {
        pageMap.set(page.id, page);
      });

      const mergedPages = Array.from(pageMap.values());

      if (mergedPages.length !== cachedNotionPages.length) {
        setCachedNotionPages(mergedPages);
      }
    }
  }, [fetchedPages, cachedNotionPages, setCachedNotionPages]);

  const handleConfirm = () => {
    if (onConfirm) {
      const selectedPages = allPages.filter(page => selectedIds.has(page.id));
      const pageReferences = selectedPages
        .map(page => ({ id: page.id, url: page.url || '' }))
        .filter(ref => ref.url);

      onConfirm(selectedPages, pageReferences);
    }
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    onClose();
  };

  const selectedCount = selectedIds.size;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-h-[80vh] max-w-2xl flex-col overflow-hidden'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                <NotionIcon className='h-5 w-5' />
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
              disabled={isRefreshing || isLoading}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className='relative'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Search pages...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9'
          />
          {isSearching && (
            <div className='absolute top-1/2 right-2 -translate-y-1/2'>
              <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
            </div>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className='bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm'>
            <AlertCircle className='h-4 w-4' />
            {error.message}
          </div>
        )}

        {/* Content area */}
        <div className='flex-1 overflow-y-auto rounded-md border'>
          {isLoading || isRefreshing ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <span className='text-muted-foreground ml-2 text-sm'>
                {isRefreshing ? 'Refreshing pages...' : 'Loading pages...'}
              </span>
            </div>
          ) : treeNodes.length === 0 ? (
            <div className='text-muted-foreground p-8 text-center'>
              {searchQuery ? (
                <div>
                  <p>No pages found matching &ldquo;{searchQuery}&rdquo;</p>
                  {isSearching && (
                    <p className='mt-2 text-xs'>Searching API...</p>
                  )}
                </div>
              ) : allPages.length === 0 ? (
                'No pages available. Click refresh to load pages.'
              ) : (
                'No pages to display'
              )}
            </div>
          ) : (
            <div className='p-2'>
              {searchQuery && (
                <div className='text-muted-foreground mb-3 flex items-center justify-between px-2 text-xs'>
                  <span>
                    Showing {treeNodes.length} result
                    {treeNodes.length !== 1 ? 's' : ''}
                    {allPages.length !== cachedNotionPages.length && (
                      <span className='ml-1'>(includes search results)</span>
                    )}
                  </span>
                  {isSearching && (
                    <span className='flex items-center gap-1'>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      Searching...
                    </span>
                  )}
                </div>
              )}
              <TreeView
                nodes={treeNodes}
                selectedIds={selectedIds}
                onToggleNode={handleToggleNode}
              />
            </div>
          )}
        </div>

        <DialogFooter className='flex-shrink-0 gap-2 border-t pt-4'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
