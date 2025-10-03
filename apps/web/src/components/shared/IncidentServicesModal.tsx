'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DateTimeRangePicker,
  type DateRangeValue,
} from '@/components/shared/DateTimeRangePicker';
import { formatDistanceToNow } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  IncidentService,
  IncidentProject,
  Environment,
  LoggingService,
} from '@/types/integrations';
import { useIntegrationIncidents } from '@/hooks/useIntegrationIncidents';
import { useIntegrationLogs } from '@/hooks/useIntegrationLogs';

interface IncidentServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedIncidents: IncidentService[]) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  incidentProvider: string;
  initialSelectedProjects?: IncidentProject[];
  reset: () => void;
  requiresProjectSelection?: boolean;
}

export function IncidentServicesModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  incidentProvider,
  initialSelectedProjects = [],
  reset,
  requiresProjectSelection = true,
}: IncidentServicesModalProps) {
  // Single-select states
  const [selectedProject, setSelectedProject] = useState<string>(
    initialSelectedProjects.length > 0 ? initialSelectedProjects[0].id : ''
  );
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [incidentsSearch, setIncidentsSearch] = useState('');

  // Date range (default to last 7 days)
  const [dateRange, setDateRange] = useState<DateRangeValue>(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0); // Start of day

    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999); // End of day

    return { from: weekAgo, to: toDate };
  });

  // Data states
  const [projects, setProjects] = useState<IncidentProject[]>([]);
  const [services, setServices] = useState<LoggingService[]>([]);
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [incidents, setIncidents] = useState<IncidentService[]>([]);

  // Loading states
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingEnvironments, setIsLoadingEnvironments] = useState(false);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check providers for specific handling
  const isSentryProvider = incidentProvider.toLowerCase() === 'sentry';
  const isPagerDutyProvider = incidentProvider.toLowerCase() === 'pagerduty';
  const isNewRelicProvider = incidentProvider.toLowerCase() === 'new_relic';

  // Hooks
  const { getProjects, getEnvironments, getIncidents } =
    useIntegrationIncidents();

  const { getServices } = useIntegrationLogs();

  // Fetch projects using API
  const fetchProjects = useCallback(
    async (searchQuery?: string) => {
      const query = searchQuery?.trim();

      setIsLoadingProjects(true);
      setError(null);

      try {
        const projectsData = await getProjects(incidentProvider, query);
        setProjects(projectsData);
      } catch {
        setError('Failed to fetch projects. Please try again.');
      } finally {
        setIsLoadingProjects(false);
      }
    },
    [incidentProvider, getProjects]
  );

  // Fetch services using API
  const fetchServices = useCallback(
    async (searchQuery?: string) => {
      const query = searchQuery?.trim();

      setIsLoadingServices(true);
      setError(null);

      try {
        const servicesData = await getServices(incidentProvider, query);
        setServices(servicesData);
      } catch {
        setError('Failed to fetch services. Please try again.');
      } finally {
        setIsLoadingServices(false);
      }
    },
    [incidentProvider, getServices]
  );

  // Fetch environments using API (for Sentry)
  const fetchEnvironments = useCallback(
    async (searchQuery?: string) => {
      if (!selectedProject || !isSentryProvider) {
        return;
      }

      const query = searchQuery?.trim();

      setIsLoadingEnvironments(true);
      setError(null);

      try {
        const environmentsData = await getEnvironments(
          incidentProvider,
          selectedProject,
          query
        );
        setEnvironments(environmentsData);
      } catch {
        setError('Failed to fetch environments. Please try again.');
      } finally {
        setIsLoadingEnvironments(false);
      }
    },
    [incidentProvider, selectedProject, isSentryProvider, getEnvironments]
  );

  // Fetch incidents using API
  const fetchIncidents = useCallback(async () => {
    if (!dateRange.from || !dateRange.to) {
      return;
    }

    // For PagerDuty and New Relic, check if service is selected
    if ((isPagerDutyProvider || isNewRelicProvider) && !selectedService) {
      return;
    }

    // For providers that require project selection (non-PagerDuty, non-New Relic), check if project is selected
    if (
      requiresProjectSelection &&
      !isPagerDutyProvider &&
      !isNewRelicProvider &&
      !selectedProject
    ) {
      return;
    }

    // For Sentry, also check if environment is selected
    if (isSentryProvider && !selectedEnvironment) {
      return;
    }

    setIsLoadingIncidents(true);
    setError(null);

    try {
      // Convert dates to ISO strings
      const start_time = dateRange.from.toISOString();
      const end_time = dateRange.to.toISOString();

      // For Sentry, convert environment ID to name
      let environmentName: string | undefined;
      if (isSentryProvider && selectedEnvironment) {
        const env = environments.find(e => e.id === selectedEnvironment);
        environmentName = env ? env.name : selectedEnvironment;
      }

      // For New Relic, get service name for entity_name
      let entityName: string | undefined;
      if (isNewRelicProvider && selectedService) {
        const service = services.find(s => s.id === selectedService);
        entityName = service ? service.name : selectedService;
      }

      const incidentsData = await getIncidents(
        incidentProvider,
        start_time,
        end_time,
        isPagerDutyProvider
          ? selectedService // For PagerDuty, pass service instead of project
          : requiresProjectSelection && !isNewRelicProvider
            ? selectedProject
            : undefined, // Pass undefined if project selection not required or New Relic
        incidentsSearch.trim() || undefined,
        environmentName,
        100, // limit
        entityName // For New Relic, pass service name as entity_name
      );

      setIncidents(incidentsData);
    } catch {
      setError('Failed to fetch incidents. Please try again.');
    } finally {
      setIsLoadingIncidents(false);
    }
  }, [
    dateRange.from,
    dateRange.to,
    selectedProject,
    selectedService,
    selectedEnvironment,
    incidentProvider,
    getIncidents,
    incidentsSearch,
    requiresProjectSelection,
    isSentryProvider,
    isPagerDutyProvider,
    isNewRelicProvider,
    environments,
    services,
  ]);

  // Load projects when modal opens (only if project selection is required and not PagerDuty or New Relic)
  useEffect(() => {
    if (
      requiresProjectSelection &&
      !isPagerDutyProvider &&
      !isNewRelicProvider &&
      isOpen
    ) {
      fetchProjects();
    }
  }, [
    requiresProjectSelection,
    isPagerDutyProvider,
    isNewRelicProvider,
    isOpen,
    fetchProjects,
  ]);

  // Load services when modal opens (for PagerDuty and New Relic)
  useEffect(() => {
    if ((isPagerDutyProvider || isNewRelicProvider) && isOpen) {
      fetchServices();
    }
  }, [isPagerDutyProvider, isNewRelicProvider, isOpen, fetchServices]);

  // Load environments when project is selected (for Sentry)
  useEffect(() => {
    if (isSentryProvider && isOpen && selectedProject) {
      fetchEnvironments();
    }
  }, [isSentryProvider, isOpen, selectedProject, fetchEnvironments]);

  // Debounce incidents search input
  useEffect(() => {
    if (
      incidentsSearch !== '' &&
      isOpen &&
      dateRange.from &&
      dateRange.to &&
      (isPagerDutyProvider || isNewRelicProvider ? selectedService : true) &&
      (requiresProjectSelection && !isPagerDutyProvider && !isNewRelicProvider
        ? selectedProject
        : true) &&
      (isSentryProvider ? selectedEnvironment : true)
    ) {
      const timer = setTimeout(() => {
        fetchIncidents();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [
    incidentsSearch,
    isOpen,
    dateRange.from,
    dateRange.to,
    selectedProject,
    selectedService,
    selectedEnvironment,
    fetchIncidents,
    requiresProjectSelection,
    isPagerDutyProvider,
    isNewRelicProvider,
    isSentryProvider,
  ]);

  // Handle refresh - clear all data and reload
  const handleRefresh = useCallback(async () => {
    setSelectedIncidentId(null);
    setSelectedProject('');
    setSelectedService('');
    setSelectedEnvironment('');
    setIncidents([]);
    setProjects([]);
    setServices([]);
    setEnvironments([]);
    setError(null);
    setIncidentsSearch('');
    setIsLoadingIncidents(false);
    setIsLoadingServices(false);
    setIsLoadingEnvironments(false);
    reset();

    // Reload data based on provider
    if (isPagerDutyProvider || isNewRelicProvider) {
      await fetchServices();
    } else if (requiresProjectSelection) {
      await fetchProjects();
    }
  }, [
    reset,
    fetchProjects,
    fetchServices,
    isPagerDutyProvider,
    isNewRelicProvider,
    requiresProjectSelection,
  ]);

  const handleIncidentSelect = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
  };

  const handleConfirm = () => {
    if (!selectedIncidentId) return;

    // For PagerDuty and New Relic, check if service is selected
    if ((isPagerDutyProvider || isNewRelicProvider) && !selectedService) return;

    // For providers that require project selection (non-PagerDuty, non-New Relic), check if project is selected
    if (
      requiresProjectSelection &&
      !isPagerDutyProvider &&
      !isNewRelicProvider &&
      !selectedProject
    )
      return;

    // For Sentry, also check if environment is selected
    if (isSentryProvider && !selectedEnvironment) return;

    const selectedIncident = incidents.find(
      incident => incident.id === selectedIncidentId
    );
    if (!selectedIncident) return;

    let enrichedIncident;

    if (isPagerDutyProvider || isNewRelicProvider) {
      // Handle service-based incident enrichment for PagerDuty and New Relic
      const sourceServiceId = selectedService;

      // Find service name
      const service = services.find(s => s.id === sourceServiceId);
      const serviceName = service ? service.name : sourceServiceId;

      enrichedIncident = {
        ...selectedIncident,
        sourceServiceId,
        serviceName,
      } as IncidentService;
    } else if (requiresProjectSelection) {
      // Handle project-based incident enrichment
      const sourceProjectId = selectedProject;

      // Find project name
      const project = projects.find(p => p.id === sourceProjectId);
      const projectName = project ? project.name : sourceProjectId;

      // For Sentry, get environment name instead of ID
      let environmentName: string | undefined;
      if (isSentryProvider && selectedEnvironment) {
        const env = environments.find(e => e.id === selectedEnvironment);
        environmentName = env ? env.name : selectedEnvironment;
      }

      enrichedIncident = {
        ...selectedIncident,
        sourceProjectId,
        projectName,
        ...(isSentryProvider &&
          environmentName && {
            environment: environmentName,
          }),
      } as IncidentService;
    } else {
      // For providers that don't require project selection, use incident as-is
      enrichedIncident = {
        ...selectedIncident,
      } as IncidentService;
    }

    onConfirm([enrichedIncident]);
    handleClose();
  };

  const handleClose = () => {
    setSelectedIncidentId(null);
    setSelectedService('');
    setSelectedEnvironment('');
    setIncidents([]);
    setServices([]);
    setEnvironments([]);
    setError(null);
    setIncidentsSearch('');
    setIsLoadingIncidents(false);
    setIsLoadingServices(false);
    setIsLoadingEnvironments(false);

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    setDateRange({ from: weekAgo, to: endOfDay });
    onClose();
  };

  // Update selected project when initialSelectedProjects changes
  useEffect(() => {
    setSelectedProject(
      initialSelectedProjects.length > 0 ? initialSelectedProjects[0].id : ''
    );
  }, [initialSelectedProjects]);

  const hasSelectedIncident = selectedIncidentId !== null;
  const hasSelectedProject = selectedProject !== '';
  const hasSelectedService = selectedService !== '';
  const hasSelectedEnvironment = selectedEnvironment !== '';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-w-4xl flex-col overflow-hidden p-4'>
        <DialogHeader className='flex-shrink-0'>
          <div className='flex items-center justify-between'>
            <div>
              <DialogTitle className='flex items-center gap-2'>
                {icon}
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
              disabled={isLoadingProjects || isLoadingServices}
              className='flex items-center gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingProjects || isLoadingServices ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          {/* Step 1: Select Project or Service (conditionally rendered) */}
          {isPagerDutyProvider || isNewRelicProvider ? (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>1. Select Service</h3>
              <Select
                value={selectedService}
                onValueChange={value => {
                  setSelectedService(value);
                  // Clear states when service changes
                  setSelectedIncidentId(null);
                  setIncidents([]);
                  setIncidentsSearch('');
                  setError(null);
                  setIsLoadingIncidents(false);
                }}
                disabled={isLoadingServices}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      isLoadingServices
                        ? 'Loading services...'
                        : 'Select a service...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {services.length === 0 ? (
                    <SelectItem value='no-services' disabled>
                      No services available
                    </SelectItem>
                  ) : (
                    services.map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : requiresProjectSelection && !isNewRelicProvider ? (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>1. Select Project</h3>
              <Select
                value={selectedProject}
                onValueChange={value => {
                  setSelectedProject(value);
                  // Clear all states when project changes
                  setSelectedEnvironment('');
                  setSelectedIncidentId(null);
                  setEnvironments([]);
                  setIncidents([]);
                  setIncidentsSearch('');
                  setError(null);
                  setIsLoadingEnvironments(false);
                  setIsLoadingIncidents(false);
                }}
                disabled={isLoadingProjects}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      isLoadingProjects
                        ? 'Loading projects...'
                        : 'Select a project...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.length === 0 ? (
                    <SelectItem value='no-projects' disabled>
                      No projects available
                    </SelectItem>
                  ) : (
                    projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {/* Step 2: Select Environment (for Sentry only) */}
          {isSentryProvider && requiresProjectSelection && (
            <div className='space-y-2'>
              <h3 className='text-sm font-medium'>2. Select Environment</h3>
              <Select
                value={selectedEnvironment}
                onValueChange={setSelectedEnvironment}
                disabled={isLoadingEnvironments || !selectedProject}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      isLoadingEnvironments
                        ? 'Loading environments...'
                        : 'Select an environment...'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {environments.length === 0 ? (
                    <SelectItem value='no-environments' disabled>
                      No environments available
                    </SelectItem>
                  ) : (
                    environments.map(env => (
                      <SelectItem key={env.id} value={env.id}>
                        {env.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step: Date Range Selection */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium'>
              {isPagerDutyProvider
                ? '2'
                : requiresProjectSelection
                  ? isSentryProvider
                    ? '3'
                    : '2'
                  : '1'}
              . Select Date Range
            </h3>
            {/* Date Time Picker and Search Button Row */}
            <div className='flex flex-col gap-4 lg:flex-row lg:items-end'>
              <div className='flex-1'>
                <DateTimeRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  label='Select Date & Time Range'
                  placeholder='Select start and end date & time'
                  caption='Select the time range to search for incidents'
                  disableFuture={true}
                />
              </div>

              <Button
                onClick={fetchIncidents}
                disabled={
                  !dateRange.from ||
                  !dateRange.to ||
                  ((isPagerDutyProvider || isNewRelicProvider) &&
                    !selectedService) ||
                  (requiresProjectSelection &&
                    !isPagerDutyProvider &&
                    !isNewRelicProvider &&
                    !selectedProject) ||
                  (isSentryProvider && !selectedEnvironment) ||
                  isLoadingIncidents
                }
                className='flex w-full items-center gap-2 bg-[#11054c] px-8 hover:bg-[#1a0a6b] lg:w-auto'
              >
                {isLoadingIncidents ? (
                  <RefreshCw className='h-4 w-4 animate-spin' />
                ) : (
                  <Search className='h-4 w-4' />
                )}
                {isLoadingIncidents ? 'Searching...' : 'Search Incidents'}
              </Button>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className='bg-destructive/10 text-destructive flex items-center gap-2 rounded-md p-3 text-sm'>
              <AlertCircle className='h-4 w-4' />
              {error}
            </div>
          )}

          {/* Step: Select Incidents */}
          <div className='flex-1 space-y-2'>
            <div className='flex items-center justify-between'>
              <h3 className='text-sm font-medium'>
                {isPagerDutyProvider
                  ? '3'
                  : requiresProjectSelection
                    ? isSentryProvider
                      ? '4'
                      : '3'
                    : '2'}
                . Select Incidents
              </h3>
              {(isPagerDutyProvider || isNewRelicProvider
                ? hasSelectedService
                : true) &&
                (requiresProjectSelection &&
                !isPagerDutyProvider &&
                !isNewRelicProvider
                  ? hasSelectedProject
                  : true) &&
                (isSentryProvider ? hasSelectedEnvironment : true) && (
                  <div className='text-muted-foreground text-xs'>
                    {`${incidents.length} incidents available`}
                  </div>
                )}
            </div>

            <div className='w-full'>
              <Input
                value={incidentsSearch}
                onChange={e => setIncidentsSearch(e.target.value)}
                placeholder='Search incidents by title, description...'
                className='mt-1'
              />
            </div>

            {(isPagerDutyProvider || isNewRelicProvider) &&
            !hasSelectedService ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>Select service and date range first</p>
              </div>
            ) : requiresProjectSelection &&
              !isPagerDutyProvider &&
              !isNewRelicProvider &&
              !hasSelectedProject ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>
                  Select{' '}
                  {isSentryProvider
                    ? 'project, environment and'
                    : 'project and'}{' '}
                  date range first
                </p>
              </div>
            ) : isSentryProvider && !hasSelectedEnvironment ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>
                  Select environment and date range first
                </p>
              </div>
            ) : !isPagerDutyProvider &&
              !isNewRelicProvider &&
              !requiresProjectSelection &&
              !dateRange.from &&
              !dateRange.to ? (
              <div className='text-muted-foreground py-8 text-center'>
                <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>Select date range first</p>
              </div>
            ) : (
              <div className='max-h-60 overflow-y-auto rounded-md border'>
                {isLoadingIncidents ? (
                  <div className='text-muted-foreground p-8 text-center'>
                    <RefreshCw className='mx-auto mb-2 h-8 w-8 animate-spin' />
                    <p className='text-sm'>Loading incidents...</p>
                  </div>
                ) : incidents.length === 0 ? (
                  <div className='text-muted-foreground p-8 text-center'>
                    <AlertCircle className='mx-auto mb-2 h-8 w-8' />
                    <p className='text-sm'>
                      No incidents found for the selected criteria
                    </p>
                  </div>
                ) : (
                  <div className='min-h-0 flex-1 overflow-auto bg-white'>
                    {incidents.map((incident, index) => {
                      // Create unique key using incident ID
                      const uniqueKey = `${incident.id}-${index}`;
                      const isSelected = selectedIncidentId === incident.id;

                      return (
                        <div
                          key={uniqueKey}
                          className={cn(
                            'group relative flex cursor-pointer items-center border-b px-4 py-3 transition-colors hover:bg-blue-50',
                            isSelected && 'bg-blue-50/80'
                          )}
                          onClick={() => handleIncidentSelect(incident.id)}
                        >
                          <input
                            type='radio'
                            name='incident-selection'
                            value={incident.id}
                            id={incident.id}
                            checked={isSelected}
                            onChange={() => handleIncidentSelect(incident.id)}
                            className='h-4 w-4 border-gray-300 text-[#11054c] focus:ring-[#11054c]'
                          />
                          <div className='ml-3 min-w-0 flex-1'>
                            <div className='block w-full space-y-1'>
                              <div className='flex items-center justify-between'>
                                <h5 className='font-medium text-gray-900 group-hover:text-[#11054c]'>
                                  {incident.title}
                                </h5>
                              </div>
                              {(isPagerDutyProvider ||
                                isNewRelicProvider ||
                                requiresProjectSelection) && (
                                <p className='text-xs leading-relaxed text-gray-600'>
                                  {isPagerDutyProvider || isNewRelicProvider ? (
                                    <>
                                      Service:{' '}
                                      {(() => {
                                        const service = services.find(
                                          s => s.id === selectedService
                                        );
                                        return service
                                          ? service.name
                                          : selectedService;
                                      })()}
                                    </>
                                  ) : (
                                    <>
                                      Project:{' '}
                                      {(() => {
                                        const project = projects.find(
                                          p => p.id === selectedProject
                                        );
                                        return project
                                          ? project.name
                                          : selectedProject;
                                      })()}
                                      {isSentryProvider &&
                                        selectedEnvironment && (
                                          <span>
                                            {' '}
                                            • Environment:{' '}
                                            {(() => {
                                              const env = environments.find(
                                                e =>
                                                  e.id === selectedEnvironment
                                              );
                                              return env
                                                ? env.name
                                                : selectedEnvironment;
                                            })()}
                                          </span>
                                        )}
                                    </>
                                  )}{' '}
                                  • Reported:{' '}
                                  {formatDistanceToNow(
                                    new Date(incident.last_seen),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='flex-shrink-0 gap-2 border-t pt-4'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasSelectedIncident}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm{hasSelectedIncident ? ' (1)' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
