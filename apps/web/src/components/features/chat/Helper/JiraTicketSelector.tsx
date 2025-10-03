'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useUser } from '@/hooks/useUser';
import { atlassianApi } from '@/lib/api/api';
import type { AtlassianIssue, EnhancedAtlassianIssue } from '@/types';
import { toast } from 'sonner';
import { JiraTicketSelectorProps } from '@/types';

export function JiraTicketSelector({
  isOpen,
  onClose,
  onConfirm,
  title = 'Select Jira Ticket',
  description = 'Choose a Jira ticket to comment on',
}: JiraTicketSelectorProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedIssueKey, setSelectedIssueKey] = useState<string>('');
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [tickets, setTickets] = useState<EnhancedAtlassianIssue[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const { accessToken } = useUser();
  const { projects, getProjects, getIssues, isLoading } = useAtlassian();

  // Convert projects to dropdown options
  const projectOptions: MultiSelectOption[] = useMemo(() => {
    return projects.map(project => ({
      id: project.key,
      label: project.name,
      value: project.key,
      metadata: project,
    }));
  }, [projects]);

  // Filter tickets based on search query
  const filteredTickets = useMemo(() => {
    if (!ticketSearchQuery && !debouncedSearchQuery) return tickets;

    const searchTerm = debouncedSearchQuery || ticketSearchQuery;
    return tickets.filter(
      ticket =>
        ticket.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.fields.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, ticketSearchQuery, debouncedSearchQuery]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(ticketSearchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [ticketSearchQuery]);

  // Load tickets for selected projects
  const loadTicketsForProjects = useCallback(
    async (projectKeys: string[]) => {
      if (!accessToken || projectKeys.length === 0) {
        setTickets([]);
        return;
      }

      setIsLoadingTickets(true);
      try {
        const newTickets: EnhancedAtlassianIssue[] = [];

        for (const projectKey of projectKeys) {
          try {
            const project = projects.find(p => p.key === projectKey);
            if (!project) continue;

            const fetchedIssues = await getIssues(projectKey);

            if (fetchedIssues && fetchedIssues.length > 0) {
              const enhancedTickets = fetchedIssues.map(
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
              `Error fetching tickets for project ${projectKey}:`,
              error
            );
            toast.error(`Error fetching tickets for project ${projectKey}`);
          }
        }

        setTickets(newTickets);
      } finally {
        setIsLoadingTickets(false);
      }
    },
    [accessToken, projects, getIssues]
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
        const searchResults: EnhancedAtlassianIssue[] = [];

        for (const projectKey of selectedProjects) {
          try {
            const project = projects.find(p => p.key === projectKey);
            if (!project) continue;

            const response = await atlassianApi.getIssues(
              projectKey,
              accessToken,
              undefined,
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
              searchResults.push(...enhancedTickets);
            }
          } catch (error) {
            console.error(
              `Error searching tickets in project ${projectKey}:`,
              error
            );
          }
        }

        // Merge search results with existing tickets
        const ticketMap = new Map<string, EnhancedAtlassianIssue>();
        tickets.forEach(ticket => ticketMap.set(ticket.id, ticket));
        searchResults.forEach(ticket => ticketMap.set(ticket.id, ticket));

        setTickets(Array.from(ticketMap.values()));
      } catch (error) {
        console.error('Failed to search tickets:', error);
      } finally {
        setIsSearching(false);
      }
    },
    [accessToken, selectedProjects, projects, tickets]
  );

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIssueKey('');
      setTicketSearchQuery('');
      setDebouncedSearchQuery('');
      setSelectedProjects([]);
      setTickets([]);

      if (projects.length === 0) {
        getProjects();
      }
    }
  }, [isOpen, projects.length, getProjects]);

  // Load tickets when projects are selected
  useEffect(() => {
    if (selectedProjects.length > 0) {
      loadTicketsForProjects(selectedProjects);
    } else {
      setTickets([]);
    }
  }, [selectedProjects, loadTicketsForProjects]);

  // Trigger API search when debounced query changes
  useEffect(() => {
    if (isOpen && debouncedSearchQuery.trim() !== '') {
      handleApiSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, isOpen, handleApiSearch]);

  const handleConfirm = () => {
    if (selectedIssueKey) {
      onConfirm(selectedIssueKey);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedIssueKey('');
    setTicketSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedProjects([]);
    setTickets([]);
    onClose();
  };

  // Handle refresh - reload projects
  const handleRefresh = useCallback(async () => {
    if (!accessToken) return;

    // Reset all states
    setSelectedIssueKey('');
    setSelectedProjects([]);
    setTicketSearchQuery('');
    setDebouncedSearchQuery('');
    setTickets([]);

    // Reload projects
    await getProjects();
  }, [accessToken, getProjects]);

  const hasSelectedProjects = selectedProjects.length > 0;
  const ticketsDisabled = !hasSelectedProjects || isLoadingTickets;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-w-3xl flex-col overflow-hidden p-4'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                <JiraIcon className='h-5 w-5' />
                {title}
              </DialogTitle>
              <p className='text-muted-foreground mt-1 text-sm'>
                {description}
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

          {/* Step 2: Select Ticket */}
          <div className='flex-1 space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>2. Select Ticket</h3>
              {hasSelectedProjects && (
                <div className='text-muted-foreground text-xs'>
                  {isLoadingTickets
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
                  {isLoadingTickets ? (
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
                            selectedIssueKey === ticket.key && 'bg-accent'
                          )}
                          onClick={() => setSelectedIssueKey(ticket.key)}
                        >
                          <input
                            type='radio'
                            name='ticket-selection'
                            checked={selectedIssueKey === ticket.key}
                            onChange={() => {}} // Handled by parent click
                            className='text-primary focus:ring-primary pointer-events-none h-4 w-4'
                          />
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
            disabled={!selectedIssueKey}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
