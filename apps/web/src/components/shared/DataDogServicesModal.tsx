'use client';

import { DataDogIcon } from '@/components/icons';
import { LoggingServicesModal } from '@/components/shared/LoggingServicesModal';
import { IncidentServicesModal } from '@/components/shared/IncidentServicesModal';
import type { LogBasedType, IncidentBasedType } from '@/types';
import type { LoggingService, IncidentService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface DataDogServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogBasedType | IncidentBasedType;
}

export function DataDogServicesModal({
  isOpen,
  onClose,
  type,
}: DataDogServicesModalProps) {
  const {
    loggingdatadog,
    setLoggingdatadog,
    setIncidentdatadog,
    resetLoggingdatadog,
    resetIncidentdatadog,
  } = useProject();

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
    setLoggingdatadog({
      logs: enhancedServices,
    });
  };

  const handleIncidentConfirm = (selectedIncidents: IncidentService[]) => {
    // Since we now only select one incident, take the first one
    const incident = selectedIncidents[0];

    if (incident) {
      const enhancedIncident = {
        id: incident.id,
        title: incident.title,
        type: incident.type,
        last_seen: incident.last_seen,
        link: incident.link,
      };

      setIncidentdatadog({
        incident: enhancedIncident,
      });
    } else {
      // Clear the incident if none selected
      setIncidentdatadog({
        incident: null,
      });
    }
  };

  if (type === 'logging') {
    return (
      <LoggingServicesModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleLoggingConfirm}
        title='Select DataDog Services'
        description='Choose DataDog logging services to monitor'
        icon={<DataDogIcon className='h-5 w-5' />}
        logProvider='datadog'
        initialSelectedServices={loggingdatadog.logs}
        reset={resetLoggingdatadog}
      />
    );
  }

  if (type === 'incident') {
    return (
      <IncidentServicesModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleIncidentConfirm}
        title='Select DataDog Incidents'
        description='Choose DataDog monitoring incidents and alerts'
        icon={<DataDogIcon className='h-5 w-5' />}
        incidentProvider='datadog'
        initialSelectedProjects={[]}
        reset={resetIncidentdatadog}
        requiresProjectSelection={false}
      />
    );
  }
}
