'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DateTimeRangePicker } from '@/components/shared/DateTimeRangePicker';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { LoggingService } from '@/types/integrations';
import { useIntegrationLogs } from '@/hooks/useIntegrationLogs';
import { useProject } from '@/hooks/useProject';

interface LoggingServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedServices: LoggingService[]) => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  logProvider: string;
  initialSelectedServices?: LoggingService[];
  reset: () => void;
}

export function LoggingServicesModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  icon,
  logProvider,
  initialSelectedServices = [],
  reset,
}: LoggingServicesModalProps) {
  const [search, setSearch] = useState('');
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(initialSelectedServices.map(service => service.id))
  );
  const [services, setServices] = useState<LoggingService[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
    to: new Date(),
  });

  const { getServices } = useIntegrationLogs();
  const {
    setLoggingServicesCache,
    getLoggingServicesCache,
    clearLoggingServicesCache,
  } = useProject();

  // Fetch services using API with caching
  const fetchServices = useCallback(
    async (searchQuery?: string) => {
      const query = searchQuery?.trim() || undefined;
      const cacheKey = query || 'empty';

      // Check cache first
      const cachedServices = getLoggingServicesCache(logProvider, cacheKey);
      if (cachedServices) {
        setServices(cachedServices);
        return;
      }

      setIsLoading(true);

      try {
        const servicesData = await getServices(logProvider, query);
        setServices(servicesData);

        // Cache the response
        setLoggingServicesCache(logProvider, cacheKey, servicesData);
      } catch {
        const emptyResult: LoggingService[] = [];
        setServices(emptyResult);

        // Cache empty result too
        setLoggingServicesCache(logProvider, cacheKey, emptyResult);
      } finally {
        setIsLoading(false);
      }
    },
    [logProvider, getServices, getLoggingServicesCache, setLoggingServicesCache]
  );

  // Debounce search input
  useEffect(() => {
    if (search !== '' && isOpen) {
      const timer = setTimeout(() => {
        fetchServices(search);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [search, fetchServices, isOpen]);

  // Auto-fetch services when modal opens
  useEffect(() => {
    if (isOpen && search === '') fetchServices();
  }, [fetchServices, isOpen, search]);

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const selectedServicesList = services
      .filter(service => selectedServices.has(service.id))
      .map(service => ({
        ...service,
        dateRange: {
          from: dateRange.from?.toISOString(),
          to: dateRange.to?.toISOString(),
        },
      }));
    onConfirm(selectedServicesList);
    handleClose();
  };

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleRefresh = useCallback(() => {
    clearLoggingServicesCache(logProvider);
    setSelectedServices(new Set());
    setSearch('');
    setServices([]);
    reset();
    fetchServices();
  }, [clearLoggingServicesCache, logProvider, fetchServices, reset]);

  // Update selected services when initialSelectedServices changes
  useEffect(() => {
    setSelectedServices(
      new Set(initialSelectedServices.map(service => service.id))
    );
  }, [initialSelectedServices]);

  const selectedCount = selectedServices.size;
  const isValidSelection = selectedCount > 0 && dateRange.from && dateRange.to;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='flex max-h-[80vh] max-w-3xl flex-col overflow-hidden'>
        <DialogHeader className='flex-shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            {icon}
            {title}
          </DialogTitle>
          <p className='text-muted-foreground mt-1 text-sm'>{description}</p>
        </DialogHeader>

        {/* Step 1: Date Time Range Selector */}
        <div className='mb-0 p-2'>
          <DateTimeRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder='Select date range for log analysis'
          />
          <p className='text-muted-foreground mt-1 text-center text-xs'>
            Agent will fetch logs from selected services within this time range.
          </p>
        </div>

        {/* Search Section */}
        <div className='space-b-2'>
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <label htmlFor='search' className='block text-sm font-medium'>
                Filter Services
              </label>
              <Button
                onClick={handleRefresh}
                variant='outline'
                size='sm'
                className='flex items-center gap-1 text-xs'
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn('h-3 w-3', isLoading && 'animate-spin')}
                />
                Refresh
              </Button>
            </div>
            <Input
              id='search'
              type='text'
              placeholder='Type to filter by service name, type, or keyword...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='w-full'
            />
          </div>
        </div>

        {/* Services List */}
        <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-gray-50/40'>
          {isLoading ? (
            <div className='flex flex-1 items-center justify-center p-12'>
              <div className='text-center'>
                <Loader2 className='mx-auto h-8 w-8 animate-spin text-[#11054c]' />
                <p className='text-muted-foreground mt-3 text-sm'>
                  Fetching services...
                </p>
              </div>
            </div>
          ) : services.length === 0 ? (
            <div className='text-muted-foreground flex flex-1 items-center justify-center p-12'>
              <div className='text-center'>
                <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100'>
                  <AlertCircle className='h-8 w-8 text-yellow-600' />
                </div>
                <h3 className='mb-2 font-medium text-gray-900'>
                  No Services Found
                </h3>
                <p className='text-sm'>
                  {search
                    ? `No services found matching "${search}"`
                    : 'No logging services available'}
                </p>
              </div>
            </div>
          ) : (
            <div className='min-h-0 flex-1 overflow-auto bg-white'>
              {services.map(service => (
                <div
                  key={service.id}
                  className={cn(
                    'group relative flex items-center border-b px-4 py-3 transition-colors hover:bg-blue-50',
                    selectedServices.has(service.id) && 'bg-blue-50/80'
                  )}
                >
                  <Checkbox
                    id={service.id}
                    checked={selectedServices.has(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                    className='border-gray-300 data-[state=checked]:border-[#11054c] data-[state=checked]:bg-[#11054c]'
                  />
                  <div className='ml-3 min-w-0 flex-1'>
                    <label
                      htmlFor={service.id}
                      className='block cursor-pointer space-y-1'
                    >
                      <div className='flex items-start justify-between gap-3'>
                        <div className='min-w-0 flex-1'>
                          <h5 className='font-medium break-words text-gray-900 group-hover:text-[#11054c]'>
                            {service.name}
                          </h5>
                          <p className='mt-1 text-xs leading-relaxed text-gray-600'>
                            {service.description}
                          </p>
                        </div>
                        <div className='flex-shrink-0 text-xs text-gray-500'>
                          {formatDistanceToNow(new Date(service.last_updated), {
                            addSuffix: true,
                          })}
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className='flex-shrink-0 gap-2 border-t pt-4'>
          <Button variant='outline' onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isValidSelection}
            className='bg-[#11054c] text-white hover:bg-[#1a0a6b]'
          >
            Confirm {selectedCount > 0 && `(${selectedCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
