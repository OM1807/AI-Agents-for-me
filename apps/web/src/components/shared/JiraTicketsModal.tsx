'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { JiraIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  MultiSelectDropdown,
  MultiSelectOption,
} from '@/components/shared/MultiSelectDropdown';
import { useAtlassian } from '@/hooks/useAtlassian';
import { atlassianApi } from '@/lib/api/api';
import type {
  AtlassianProject,
  AtlassianIssue,
  JiraTicketsModalProps,
  EnhancedAtlassianIssue,
} from '@/types';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';

export function JiraTicketsModal({
  isOpen,
  onClose,
  onConfirm,
  onConfirmSingle,
  type,
  mode = 'multi',
}: JiraTicketsModalProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [fullyLoadedProjects, setFullyLoadedProjects] = useState<Set<string>>(
    new Set()
  );
  const [loadingProjects, setLoadingProjects] = useState<Set<string>>(
    new Set()
  );
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Use refs to avoid unnecessary callback recreations
  const cachedTicketsRef = useRef<EnhancedAtlassianIssue[]>([]);
  const allProjectsRef = useRef<AtlassianProject[]>([]);

  const { accessToken } = useUser();
  const { projects, getProjects, getIssues, isLoading } = useAtlassian();
  const {
    cachedJiraProjects,
    cachedJiraTickets,
    setCachedJiraProjects,
    setCachedJiraTickets,
    prdjira,
    docsjira,
    agentType,
  } = useProject();

  const content = {
    prd: {
      title: 'Select Jira PRD Tickets',
      description: 'First select projects, then choose specific tickets',
    },
    incident: {
      title:
        mode === 'single'
          ? 'Select Jira Incident'
          : 'Select Jira Incident Tickets',
      description:
        mode === 'single'
          ? 'First select projects, then choose a specific incident'
          : 'First select projects, then choose specific tickets',
    },
  };

  // Merge cached and fetched projects
  const allProjects = useMemo(() => {
    const projectMap = new Map();
    cachedJiraProjects.forEach(project => {
      projectMap.set(project.key, project);
    });
    projects.forEach(project => {
      projectMap.set(project.key, project);
    });
    const result = Array.from(projectMap.values());
    allProjectsRef.current = result;
    return result;
  }, [cachedJiraProjects, projects]);

  // Convert projects to dropdown options
  const projectOptions: MultiSelectOption[] = useMemo(() => {
    return allProjects.map(project => ({
      id: project.key,
      label: project.name,
      value: project.key,
      metadata: project,
    }));
  }, [allProjects]);

  // Update cached tickets ref
  useEffect(() => {
    cachedTicketsRef.current = cachedJiraTickets as EnhancedAtlassianIssue[];
  }, [cachedJiraTickets]);

  // Get tickets for selected projects only
  const filteredTickets = useMemo(() => {
    const ticketsInSelectedProjects = (
      cachedJiraTickets as EnhancedAtlassianIssue[]
    ).filter(ticket => selectedProjects.includes(ticket.projectKey));

    if (!ticketSearchQuery && !debouncedSearchQuery)
      return ticketsInSelectedProjects;

    const searchTerm = debouncedSearchQuery || ticketSearchQuery;
    return ticketsInSelectedProjects.filter(
      ticket =>
        ticket.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [
    cachedJiraTickets,
    selectedProjects,
    ticketSearchQuery,
    debouncedSearchQuery,
  ]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(ticketSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [ticketSearchQuery]);

  // Load projects on modal open
  const loadProjects = useCallback(async () => {
    if (!accessToken) return;

    await getProjects();
  }, [accessToken, getProjects]);

  // Handle refresh - clear all caches and reset states
  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;

    // Reset all states
    setSelectedTicketIds(new Set());
    setSelectedProjects([]);
    setTicketSearchQuery('');
    setDebouncedSearchQuery('');
    setFullyLoadedProjects(new Set());
    setLoadingProjects(new Set());

    // Clear all cached data
    setCachedJiraProjects([]);
    setCachedJiraTickets([]);

    // Reload projects
    await loadProjects();
  }, [accessToken, loadProjects, setCachedJiraProjects, setCachedJiraTickets]);

  // Load tickets for selected projects
  const loadTicketsForProjects = useCallback(
    async (projectKeys: string[]) => {
      if (!accessToken || projectKeys.length === 0) return;

      // Filter out projects that are already fully loaded or currently being loaded
      const projectsToFetch = projectKeys.filter(
        projectKey =>
          !fullyLoadedProjects.has(projectKey) &&
          !loadingProjects.has(projectKey)
      );

      if (projectsToFetch.length === 0) return;

      // Mark projects as loading
      setLoadingProjects(prev => {
        const newSet = new Set(prev);
        projectsToFetch.forEach(projectKey => newSet.add(projectKey));
        return newSet;
      });

      try {
        const newTickets: EnhancedAtlassianIssue[] = [];
        const successfullyLoadedProjects: string[] = [];

        for (const projectKey of projectsToFetch) {
          try {
            const project = allProjectsRef.current.find(
              p => p.key === projectKey
            );
            if (!project) continue;

            const fetchedIssues = await getIssues(
              projectKey,
              agentType === 'requirements_to_tickets' ? 'epic' : undefined
            );

            if (fetchedIssues && fetchedIssues.length > 0) {
              const enhancedTickets = fetchedIssues.map(
                (ticket: AtlassianIssue) => ({
                  ...ticket,
                  projectKey: project.key,
                  projectName: project.name,
                })
              );
              newTickets.push(...enhancedTickets);
              successfullyLoadedProjects.push(projectKey);
            }
          } catch (error) {
            console.error(
              `Error fetching tickets for project ${projectKey}:`,
              error
            );
            toast.error(`Error fetching tickets for project ${projectKey}`);
          }
        }

        if (newTickets.length > 0) {
          const prevTickets = cachedTicketsRef.current;
          const ticketMap = new Map<string, EnhancedAtlassianIssue>();

          // Remove existing tickets from these projects to avoid duplicates
          prevTickets
            .filter(
              ticket => !successfullyLoadedProjects.includes(ticket.projectKey)
            )
            .forEach(ticket => ticketMap.set(ticket.id, ticket));

          // Add new tickets
          newTickets.forEach(ticket => ticketMap.set(ticket.id, ticket));

          setCachedJiraTickets(Array.from(ticketMap.values()) as any);
        }

        // Mark projects as fully loaded and remove from loading set
        if (successfullyLoadedProjects.length > 0) {
          setFullyLoadedProjects(prev => {
            const newSet = new Set(prev);
            successfullyLoadedProjects.forEach(projectKey =>
              newSet.add(projectKey)
            );
            return newSet;
          });
        }
      } finally {
        // Remove all fetched projects from loading set
        setLoadingProjects(prev => {
          const newSet = new Set(prev);
          projectsToFetch.forEach(projectKey => newSet.delete(projectKey));
          return newSet;
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      accessToken,
      setCachedJiraTickets,
      fullyLoadedProjects,
      loadingProjects,
      agentType,
      // getIssues excluded intentionally to prevent infinite loops
    ]
  );

  // API search function for tickets
  const handleApiSearch = useCallback(
    async (query: string) => {
      if (!accessToken || selectedProjects.length === 0) return;

      if (query.trim() === '') {
        return;
      }

      setIsSearching(true);
      try {
        const newTickets: EnhancedAtlassianIssue[] = [];

        for (const projectKey of selectedProjects) {
          try {
            const project = allProjectsRef.current.find(
              p => p.key === projectKey
            );
            if (!project) continue;

            const response = await atlassianApi.getIssues(
              projectKey,
              accessToken,
              agentType === 'requirements_to_tickets' ? 'epic' : undefined,
              query
            );

            if (response.success && response.data) {
              const enhancedTickets = response.data.map(
                (ticket: AtlassianIssue) => ({
                  ...ticket,
                  projectKey: project.key,
                  projectName: project.name,
                })
              );
              newTickets.push(...enhancedTickets);
            }
          } catch (error) {
            console.error(
              `Error searching tickets in project ${projectKey}:`,
              error
            );
          }
        }

        if (newTickets.length > 0) {
          const prevTickets = cachedTicketsRef.current;
          const ticketMap = new Map<string, EnhancedAtlassianIssue>();

          // Add existing tickets
          prevTickets.forEach(ticket => ticketMap.set(ticket.id, ticket));

          // Add new search results
          newTickets.forEach(ticket => ticketMap.set(ticket.id, ticket));

          setCachedJiraTickets(Array.from(ticketMap.values()) as any);
        }
      } catch (error) {
        console.error('Failed to search tickets:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken, selectedProjects, setCachedJiraTickets, agentType]
  );

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Always reset search and selections
    setTicketSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedTicketId(null);

    if (mode === 'multi') {
      const currentData = type === 'prd' ? prdjira : docsjira;

      // Restore ticket selections for multi-select mode
      const persistedTicketIds = new Set(
        currentData.tickets.map(ticket => ticket.id)
      );
      setSelectedTicketIds(persistedTicketIds);

      // Handle persisted data
      if (currentData.tickets.length > 0) {
        const persistedProjectKeys = Array.from(
          new Set(
            currentData.tickets
              .map(ticket => (ticket as EnhancedAtlassianIssue).projectKey)
              .filter(Boolean)
          )
        );

        setSelectedProjects(persistedProjectKeys);
        setFullyLoadedProjects(new Set(persistedProjectKeys));
      } else {
        setSelectedProjects([]);
        setFullyLoadedProjects(new Set());
        setLoadingProjects(new Set());
      }
    } else {
      // For single select mode, start fresh
      setSelectedTicketIds(new Set());
      setSelectedProjects([]);
      setFullyLoadedProjects(new Set());
      setLoadingProjects(new Set());
    }
  }, [isOpen, prdjira, docsjira, type, mode]);

  // Separate effect to handle cache updates for persisted tickets (multi-select only)
  useEffect(() => {
    if (!isOpen || mode !== 'multi') return;

    const currentData = type === 'prd' ? prdjira : docsjira;

    if (currentData.tickets.length > 0) {
      // Ensure persisted tickets are in cache
      const existingTickets = cachedJiraTickets as EnhancedAtlassianIssue[];
      const existingTicketIds = new Set(existingTickets.map(t => t.id));
      const newTicketsToCache = currentData.tickets.filter(
        ticket => !existingTicketIds.has(ticket.id)
      ) as EnhancedAtlassianIssue[];

      if (newTicketsToCache.length > 0) {
        setCachedJiraTickets([...existingTickets, ...newTicketsToCache] as any);
      }
    }
  }, [
    isOpen,
    cachedJiraTickets,
    setCachedJiraTickets,
    prdjira,
    docsjira,
    type,
    mode,
  ]);

  // Load projects when modal opens if needed
  useEffect(() => {
    if (isOpen && allProjects.length === 0) {
      loadProjects();
    }
  }, [isOpen, allProjects.length, loadProjects]);

  // Update cached projects when fetched
  useEffect(() => {
    if (projects.length > 0) {
      setCachedJiraProjects(projects);
    }
  }, [projects, setCachedJiraProjects]);

  // Load tickets when projects are selected
  useEffect(() => {
    if (selectedProjects.length > 0) {
      loadTicketsForProjects(selectedProjects);
    }
  }, [selectedProjects, loadTicketsForProjects]);

  // Trigger API search when debounced query changes
  useEffect(() => {
    if (isOpen && debouncedSearchQuery.trim() !== '') {
      handleApiSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, isOpen, handleApiSearch]);

  // Handle ticket selection
  const handleToggleTicket = (ticketId: string) => {
    if (mode === 'single') {
      setSelectedTicketId(ticketId);
    } else {
      setSelectedTicketIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(ticketId)) {
          newSet.delete(ticketId);
        } else {
          newSet.add(ticketId);
        }
        return newSet;
      });
    }
  };

  const handleConfirm = () => {
    if (mode === 'single' && onConfirmSingle && selectedTicketId) {
      const selectedTicket = (
        cachedJiraTickets as EnhancedAtlassianIssue[]
      ).find(ticket => ticket.id === selectedTicketId);
      if (selectedTicket) {
        onConfirmSingle(selectedTicket);
      }
    } else if (mode === 'multi' && onConfirm) {
      const selectedTickets = (
        cachedJiraTickets as EnhancedAtlassianIssue[]
      ).filter(ticket => selectedTicketIds.has(ticket.id));
      const ticketIds = Array.from(selectedTicketIds);
      onConfirm(selectedTickets, ticketIds);
    }
    handleClose();
  };

  const handleClose = () => {
    setTicketSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedProjects([]);
    setSelectedTicketIds(new Set());
    setSelectedTicketId(null);
    setFullyLoadedProjects(new Set());
    setLoadingProjects(new Set());
    onClose();
  };

  const selectedTicketCount =
    mode === 'single' ? (selectedTicketId ? 1 : 0) : selectedTicketIds.size;
  const hasSelectedProjects = selectedProjects.length > 0;

  // Check if any selected projects are still being loaded or unloaded
  const hasUnloadedProjects = selectedProjects.some(
    projectKey => !fullyLoadedProjects.has(projectKey)
  );
  const hasLoadingProjects = selectedProjects.some(projectKey =>
    loadingProjects.has(projectKey)
  );

  const ticketsAreLoading =
    isLoading.issues || hasUnloadedProjects || hasLoadingProjects;
  const ticketsDisabled = !hasSelectedProjects || ticketsAreLoading;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-w-3xl flex-col overflow-hidden p-4'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                <JiraIcon className='h-5 w-5' />
                {content[type]?.title}
              </DialogTitle>
              <p className='text-muted-foreground mt-1 text-sm'>
                {content[type]?.description}
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isLoading.projects}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading.projects ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {/* Step 1: Select Projects */}
          <div className='space-y-2'>
            <h3 className='text-sm font-medium'>1. Select Jira Projects</h3>

            <MultiSelectDropdown
              options={projectOptions}
              selectedValues={selectedProjects}
              onSelectionChange={setSelectedProjects}
              placeholder={
                isLoading.projects
                  ? 'Loading projects...'
                  : 'Select projects...'
              }
              searchPlaceholder='Type to search projects...'
              emptyText='No projects available'
              loading={isLoading.projects}
              disabled={isLoading.projects}
            />
          </div>

          {/* Step 2: Select Tickets */}
          <div className='flex-1 space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>2. Select Tickets</h3>
              {hasSelectedProjects && (
                <div className='text-muted-foreground text-xs'>
                  {isLoading.issues
                    ? 'Loading tickets...'
                    : `${filteredTickets.length} tickets available`}
                </div>
              )}
            </div>

            {!hasSelectedProjects ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>
                  Select projects first to see available tickets
                </p>
              </div>
            ) : (
              <>
                {/* Ticket Search */}
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2' />
                  <Input
                    placeholder='Search tickets...'
                    value={ticketSearchQuery}
                    onChange={e => setTicketSearchQuery(e.target.value)}
                    className='pl-8'
                    disabled={ticketsDisabled}
                  />
                  {isSearching && (
                    <div className='absolute top-1/2 right-2 -translate-y-1/2'>
                      <Loader2 className='text-muted-foreground h-4 w-4 animate-spin' />
                    </div>
                  )}
                </div>

                {/* Tickets List */}
                <div
                  className={cn(
                    'max-h-60 overflow-y-auto rounded-md border',
                    ticketsDisabled && 'pointer-events-none opacity-50'
                  )}
                >
                  {isLoading.issues ? (
                    <div className='flex items-center justify-center p-8'>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      <span className='text-muted-foreground text-sm'>
                        Loading tickets...
                      </span>
                    </div>
                  ) : filteredTickets.length === 0 ? (
                    <div className='text-muted-foreground p-8 text-center'>
                      {isSearching ? (
                        <p className='text-sm'>Searching...</p>
                      ) : (
                        <p className='text-sm'>
                          {ticketSearchQuery || debouncedSearchQuery
                            ? 'No tickets found matching your search'
                            : 'No tickets found in selected projects'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className='p-2'>
                      {ticketSearchQuery && (
                        <div className='text-muted-foreground mb-3 flex items-center justify-between px-2 text-xs'>
                          <span>
                            Showing {filteredTickets.length} result
                            {filteredTickets.length !== 1 ? 's' : ''}
                            {isSearching && (
                              <span className='ml-1'>
                                (includes search results)
                              </span>
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
                      {filteredTickets.map(ticket => (
                        <div
                          key={ticket.id}
                          className={cn(
                            'hover:bg-accent flex cursor-pointer items-center gap-4 border-b px-4 py-3 text-sm transition-colors',
                            mode === 'single'
                              ? selectedTicketId === ticket.id && 'bg-accent'
                              : selectedTicketIds.has(ticket.id) && 'bg-accent'
                          )}
                          onClick={() => handleToggleTicket(ticket.id)}
                        >
                          {mode === 'single' ? (
                            <input
                              type='radio'
                              name='ticket-selection'
                              checked={selectedTicketId === ticket.id}
                              onChange={() => {}} // Handled by parent click
                              className='text-primary focus:ring-primary pointer-events-none h-4 w-4'
                            />
                          ) : (
                            <Checkbox
                              checked={selectedTicketIds.has(ticket.id)}
                              onChange={() => {}} // Handled by parent click
                              className='pointer-events-none'
                            />
                          )}
                          <div className='min-w-0 flex-1'>
                            <div className='mb-1 flex items-center gap-2'>
                              <p className='font-semibold text-gray-700'>
                                {ticket.key}
                              </p>
                              {ticket.fields?.issuetype?.name && (
                                <Badge variant='outline' className='text-xs'>
                                  {ticket.fields.issuetype.name}
                                </Badge>
                              )}
                              {ticket.fields?.priority?.name && (
                                <Badge variant='outline' className='text-xs'>
                                  {ticket.fields.priority.name}
                                </Badge>
                              )}
                            </div>
                            <p
                              className='text-muted-foreground mb-1 truncate text-xs'
                              title={ticket.fields.summary}
                            >
                              {ticket.fields.summary}
                            </p>
                            <div className='flex items-center gap-2 text-xs text-gray-500'>
                              <span>Project: {ticket.projectName}</span>
                              <span>•</span>
                              <span>Status: {ticket.fields.status?.name}</span>
                              {ticket.fields.assignee && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Assignee:{' '}
                                    {ticket.fields.assignee.displayName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
            disabled={selectedTicketCount === 0}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm{' '}
            {selectedTicketCount > 0 &&
              (mode === 'single'
                ? '(1 ticket)'
                : `(${selectedTicketCount} tickets)`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
