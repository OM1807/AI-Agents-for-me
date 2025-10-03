'use client';

import { PagerDutyIcon } from '@/components/icons';
import { IncidentServicesModal } from '@/components/shared/IncidentServicesModal';
import type { LogBasedType, IncidentBasedType } from '@/types';
import type { IncidentService } from '@/types/integrations';
import { useProject } from '@/hooks/useProject';

interface PagerDutyServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogBasedType | IncidentBasedType;
}

export function PagerDutyServicesModal({
  isOpen,
  onClose,
  type,
}: PagerDutyServicesModalProps) {
  const { setIncidentpagerduty } = useProject();

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

      setIncidentpagerduty({
        incident: enhancedIncident,
      });
    } else {
      // Clear the incident if none selected
      setIncidentpagerduty({
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
        title='Select PagerDuty Incidents'
        description='Choose PagerDuty incident management alerts to monitor'
        icon={<PagerDutyIcon className='h-5 w-5' />}
        incidentProvider='pagerduty'
        reset={() => {}}
      />
    );
  }
}
