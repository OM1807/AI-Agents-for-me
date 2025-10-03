'use client';

import { CloudWatchIcon } from '@/components/icons';
import { LoggingServicesModal } from '@/components/shared/LoggingServicesModal';
import type { LogBasedType } from '@/types';
import type { LoggingService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface CloudWatchServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogBasedType;
}

export function CloudWatchServicesModal({
  isOpen,
  onClose,
  type,
}: CloudWatchServicesModalProps) {
  const { loggingcloudwatch, setLoggingcloudwatch, resetLoggingcloudwatch } =
    useProject();

  const handleLoggingConfirm = (selectedServices: LoggingService[]) => {
    const enhancedServices = selectedServices.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      last_updated: service.last_updated,
      dateRange: {
        from: service.dateRange?.from,
        to: service.dateRange?.to,
      },
    }));
    setLoggingcloudwatch({
      logs: enhancedServices,
    });
  };

  // CloudWatch only supports logging type
  if (type === 'logging') {
    return (
      <LoggingServicesModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleLoggingConfirm}
        title='Select CloudWatch Log Groups'
        description='Choose CloudWatch log groups to monitor'
        icon={<CloudWatchIcon className='h-5 w-5' />}
        logProvider='cloudwatch'
        initialSelectedServices={loggingcloudwatch.logs}
        reset={resetLoggingcloudwatch}
      />
    );
  }

  // Return null for unsupported types (like incident)
  return null;
}
