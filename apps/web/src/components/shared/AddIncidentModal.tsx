'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { integrationIncidentsApi } from '@/lib/api/api';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import type { IncidentService } from '@/types/integrations';

interface AddIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'datadog' | 'sentry' | 'new_relic' | 'pagerduty' | 'jira';
  icon: React.ReactNode;
  onSuccess?: (incident: IncidentService) => void;
}

export function AddIncidentModal({
  isOpen,
  onClose,
  provider,
  icon,
  onSuccess,
}: AddIncidentModalProps) {
  const { accessToken } = useUser();
  const {
    setIncidentdatadog,
    setIncidentsentry,
    setIncidentnewrelic,
    setIncidentpagerduty,
    setIncidentjira,
  } = useProject();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidentUrl, setIncidentUrl] = useState('');

  const handleSubmit = async () => {
    if (!incidentUrl.trim()) {
      toast.error('Please provide an incident URL');
      return;
    }

    if (!accessToken) {
      toast.error('Authentication required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call the backend API to fetch incident metadata from URL
      const response = await integrationIncidentsApi.fromUrl(
        incidentUrl,
        accessToken,
        provider
      );

      if (response.success && response.data) {
        const incident = response.data;

        // Transform the incident data to match our IncidentService type
        const incidentData: IncidentService = {
          id: incident.id,
          title: incident.title,
          type: incident.type || 'Incident',
          last_seen: incident.last_seen,
          link: incident.link,
          agent_payload: incident?.agent_payload,
        };
        // Save to appropriate provider state
        switch (provider) {
          case 'datadog':
            setIncidentdatadog({ incident: incidentData });
            break;
          case 'sentry':
            setIncidentsentry({ incident: incidentData });
            break;
          case 'new_relic':
            setIncidentnewrelic({ incident: incidentData });
            break;
          case 'pagerduty':
            setIncidentpagerduty({ incident: incidentData });
            break;
          case 'jira':
            setIncidentjira({ incident: incidentData });
            break;
        }

        toast.success(`Incident successfully added from ${provider}`);
        onSuccess?.(incidentData);
        onClose();

        // Reset form
        setIncidentUrl('');
      } else {
        toast.error('Failed to fetch incident details from URL');
      }
    } catch {
      toast.error('Failed to fetch incident details from URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIncidentUrl('');
    onClose();
  };

  const getPlaceholderUrl = (): string => {
    switch (provider) {
      case 'datadog':
        return 'https://app.datadoghq.com/incidents/12345';
      case 'sentry':
        return 'https://sentry.io/organizations/myorg/issues/12345/';
      case 'new_relic':
        return 'https://one.newrelic.com/launcher/incident-intelligence.incidents';
      case 'pagerduty':
        return 'https://mycompany.pagerduty.com/incidents/P123ABC';
      case 'jira':
        return 'https://mycompany.atlassian.net/browse/PROJ-123';
      default:
        return 'https://example.com/incident/12345';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            {icon}
            <div>
              <DialogTitle>Add Incident Link</DialogTitle>
              <DialogDescription>
                Paste a {provider} incident URL to import its details
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* URL Input */}
          <div className='space-y-2'>
            <Label htmlFor='incident-url'>
              Incident URL <span className='text-red-500'>*</span>
            </Label>
            <div className='relative'>
              <LinkIcon className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                id='incident-url'
                value={incidentUrl}
                onChange={e => setIncidentUrl(e.target.value)}
                placeholder={getPlaceholderUrl()}
                className='pl-10'
                disabled={isSubmitting}
              />
            </div>
            <p className='text-muted-foreground text-xs'>
              Paste the full URL of the incident from {provider}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !incidentUrl.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Fetching...
              </>
            ) : (
              <>
                <LinkIcon className='mr-2 h-4 w-4' />
                Add Incident
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
