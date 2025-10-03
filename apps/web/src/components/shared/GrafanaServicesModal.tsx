'use client';

import { GrafanaIcon } from '@/components/icons';
import { LoggingServicesModal } from '@/components/shared/LoggingServicesModal';
import type { LogBasedType } from '@/types';
import type { LoggingService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface GrafanaServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogBasedType;
}

export function GrafanaServicesModal({
  isOpen,
  onClose,
}: GrafanaServicesModalProps) {
  const { logginggrafana, setLogginggrafana, resetLogginggrafana } =
    useProject();

  const handleConfirm = (selectedServices: LoggingService[]) => {
    const enhancedServices = selectedServices.map(service => ({
      id: service.id,
      name: service.name,
      description: service.description,
      last_updated: service.last_updated,
      dateRange: service.dateRange,
    }));

    setLogginggrafana({
      logs: enhancedServices,
    });
  };

  return (
    <LoggingServicesModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title='Select Grafana Dashboards'
      description='Choose Grafana dashboards and logging services to monitor'
      icon={<GrafanaIcon className='h-5 w-5' />}
      logProvider='grafana'
      initialSelectedServices={logginggrafana.logs}
      reset={resetLogginggrafana}
    />
  );
}
