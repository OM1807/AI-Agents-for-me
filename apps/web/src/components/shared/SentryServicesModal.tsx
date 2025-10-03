'use client';

import { SentryIcon } from '@/components/icons';
import { IncidentServicesModal } from '@/components/shared/IncidentServicesModal';
import type { IncidentBasedType } from '@/types';
import type { IncidentService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface SentryServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: IncidentBasedType;
}

export function SentryServicesModal({
  isOpen,
  onClose,
  type,
}: SentryServicesModalProps) {
  const { setIncidentsentry } = useProject();

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

      setIncidentsentry({
        incident: enhancedIncident,
      });
    } else {
      // Clear the incident if none selected
      setIncidentsentry({
        incident: null,
      });
    }
  };

  if (type === 'incident') {
    return (
      <IncidentServicesModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleIncidentConfirm}
        title='Select Sentry Incidents'
        description='Choose Sentry error and performance incidents to monitor'
        icon={<SentryIcon className='h-5 w-5' />}
        incidentProvider='sentry'
        initialSelectedProjects={[]}
        reset={() => {}}
      />
    );
  }
}
