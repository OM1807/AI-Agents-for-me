'use client';

import { NewRelicIcon } from '@/components/icons';
import { IncidentServicesModal } from '@/components/shared/IncidentServicesModal';
import { IncidentBasedType } from '@/types';
import type { IncidentService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface NewRelicServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: IncidentBasedType;
}

export function NewRelicServicesModal({
  isOpen,
  onClose,
  type,
}: NewRelicServicesModalProps) {
  const { setIncidentnewrelic } = useProject();

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

      setIncidentnewrelic({
        incident: enhancedIncident,
      });
    } else {
      // Clear the incident if none selected
      setIncidentnewrelic({
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
        title='Select New Relic Alerts'
        description='Choose New Relic alerts and performance incidents to monitor'
        icon={<NewRelicIcon className='h-5 w-5' />}
        incidentProvider='new_relic'
        initialSelectedProjects={[]}
        reset={() => {}}
      />
    );
  }
}
