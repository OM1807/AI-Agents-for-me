import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PagerDutyIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { PagerDutyServicesModal } from '@/components/shared/PagerDutyServicesModal';
import { AddIncidentModal } from '@/components/shared/AddIncidentModal';
import { integrationApi } from '@/lib/api/api';
import type { IncidentBasedType } from '@/types';
// import type { IncidentService } from '@/types/integrations';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface PagerDutyDocumentsProps {
  type: IncidentBasedType;
}

export function PagerDutyDocuments({ type }: PagerDutyDocumentsProps) {
  const { resetPagerDutyConnection, pagerDutyConnection } = useOAuth();
  const { accessToken } = useUser();
  const { incidentpagerduty, setIncidentpagerduty, resetIncidentpagerduty } =
    useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    incident: {
      title: 'PagerDuty Incidents',
      emptyText: 'No PagerDuty incidents configured.',
      disconnectMessage:
        'Are you sure you want to disconnect PagerDuty? This will remove all incidents and their associated data. This action cannot be undone.',
    },
  };

  const { title, emptyText } = content[type];

  const handleRemoveService = useCallback(() => {
    // For incidents, just clear the single incident
    setIncidentpagerduty({
      incident: null,
    });
  }, [setIncidentpagerduty]);

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        pagerDutyConnection.id,
        accessToken
      );

      if (response.success) {
        resetPagerDutyConnection();
        resetIncidentpagerduty();
        toast.success('PagerDuty disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect PagerDuty');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  return (
    <>
      <div className='bg-card rounded-lg border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <PagerDutyIcon className='h-5 w-5' />
            <h3 className='font-medium'>{title}</h3>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowAddModal(true)}
              className='gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800'
            >
              <Plus className='h-4 w-4' />
              Add Link
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowModal(true)}
              className='gap-2'
            >
              <Settings className='h-4 w-4' />
              Manage
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDisconnectClick}
              className='border-red-700 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'
            >
              {isDisconnecting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </div>

        {!incidentpagerduty.incident ? (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>{emptyText}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Click &ldquo;Manage&rdquo; to configure incidents.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
              {incidentpagerduty.incident && (
                <div
                  key={incidentpagerduty.incident.id}
                  className='group relative flex flex-col border-b px-4 py-3 transition-colors hover:bg-blue-50'
                >
                  {/* Remove button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemoveService();
                    }}
                    className='absolute top-3 right-3 text-gray-400 hover:text-gray-600'
                    title='Remove this incident'
                  >
                    <X className='h-4 w-4' />
                  </button>

                  {/* Title */}
                  <h4 className='mb-2 pr-8 text-sm font-medium text-gray-900'>
                    {incidentpagerduty.incident.title}
                  </h4>

                  {/* Description */}
                  <p className='mb-2 text-xs leading-relaxed text-gray-600'>
                    Incident details and information from PagerDuty monitoring
                    system.
                  </p>

                  {/* Simple Badges */}
                  <div className='flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      Type: {incidentpagerduty.incident.type}
                    </Badge>
                    <Badge variant='outline' className='text-xs'>
                      Reported:{' '}
                      {incidentpagerduty.incident.last_seen
                        ? formatDistanceToNow(
                            new Date(incidentpagerduty.incident.last_seen),
                            {
                              addSuffix: true,
                            }
                          )
                        : 'Unknown'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <PagerDutyServicesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type={type}
        />

        {/* Add Custom Incident Modal */}
        <AddIncidentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          provider='pagerduty'
          icon={<PagerDutyIcon className='h-5 w-5' />}
        />

        {/* Disconnect Confirmation Modal */}
        <ConfirmDisconnectModal
          open={showDisconnectModal}
          message={content[type]?.disconnectMessage}
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={handleDisconnect}
          isLoading={isDisconnecting}
        />
      </div>
    </>
  );
}
