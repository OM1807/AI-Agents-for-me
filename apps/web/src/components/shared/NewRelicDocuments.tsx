import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NewRelicIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NewRelicServicesModal } from '@/components/shared/NewRelicServicesModal';
import { AddIncidentModal } from '@/components/shared/AddIncidentModal';
import { integrationApi } from '@/lib/api/api';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';
import { IncidentBasedType } from '@/types';

export function NewRelicDocuments({ type }: { type: IncidentBasedType }) {
  const { resetNewRelicConnection, newRelicConnection } = useOAuth();
  const { accessToken } = useUser();
  const { incidentnewrelic, setIncidentnewrelic, resetIncidentnewrelic } =
    useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    title: 'New Relic Incidents',
    emptyText: 'No New Relic incidents configured.',
    disconnectMessage:
      'Are you sure you want to disconnect New Relic? This will remove all incidents and their associated data. This action cannot be undone.',
  };

  const { title, emptyText } = content;

  const handleRemoveService = useCallback(() => {
    setIncidentnewrelic({
      incident: null,
    });
  }, [setIncidentnewrelic]);

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        newRelicConnection.id,
        accessToken
      );

      if (response.success) {
        resetNewRelicConnection();
        resetIncidentnewrelic();
        toast.success('New Relic disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect New Relic');
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
            <NewRelicIcon className='h-5 w-5' />
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

        {/* Incidents Display */}
        {incidentnewrelic.incident ? (
          <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
            <div
              key={incidentnewrelic.incident.id}
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
                {incidentnewrelic.incident.title}
              </h4>

              {/* Description */}
              <p className='mb-2 text-xs leading-relaxed text-gray-600'>
                Incident details and information from New Relic APM monitoring
                system.
              </p>

              {/* Simple Badges */}
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline' className='text-xs'>
                  Type: {incidentnewrelic.incident.type}
                </Badge>
                <Badge variant='outline' className='text-xs'>
                  Reported:{' '}
                  {incidentnewrelic.incident.last_seen
                    ? formatDistanceToNow(
                        new Date(incidentnewrelic.incident.last_seen),
                        {
                          addSuffix: true,
                        }
                      )
                    : 'Unknown'}
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className='text-muted-foreground py-8 text-center'>
            <FileText className='mx-auto mb-2 h-8 w-8 opacity-50' />
            <p className='text-sm'>{emptyText}</p>
          </div>
        )}

        <NewRelicServicesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type={type}
        />

        {/* Add Custom Incident Modal */}
        <AddIncidentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          provider='new_relic'
          icon={<NewRelicIcon className='h-5 w-5' />}
        />

        {/* Disconnect Confirmation Modal */}
        <ConfirmDisconnectModal
          open={showDisconnectModal}
          message={content.disconnectMessage}
          onClose={() => setShowDisconnectModal(false)}
          onConfirm={handleDisconnect}
          isLoading={isDisconnecting}
        />
      </div>
    </>
  );
}
