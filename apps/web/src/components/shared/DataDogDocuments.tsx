import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataDogIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DataDogServicesModal } from '@/components/shared/DataDogServicesModal';
import { AddIncidentModal } from '@/components/shared/AddIncidentModal';
import { integrationApi } from '@/lib/api/api';
import type { LogBasedType, IncidentBasedType } from '@/types';
import type { LoggingService } from '@/types/integrations';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface DataDogDocumentsProps {
  type: LogBasedType | IncidentBasedType;
}

export function DataDogDocuments({ type }: DataDogDocumentsProps) {
  const { resetDataDogConnection, dataDogConnection } = useOAuth();
  const { accessToken } = useUser();
  const {
    loggingdatadog,
    setLoggingdatadog,
    resetLoggingdatadog,
    incidentdatadog,
    setIncidentdatadog,
    resetIncidentdatadog,
  } = useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    logging: {
      title: 'DataDog Logs',
      emptyText: 'No DataDog logs configured.',
      disconnectMessage:
        'Are you sure you want to disconnect DataDog? This will remove all logs and their associated data. This action cannot be undone.',
    },
    incident: {
      title: 'DataDog Incidents',
      emptyText: 'No DataDog incidents configured.',
      disconnectMessage:
        'Are you sure you want to disconnect DataDog? This will remove all incidents and their associated data. This action cannot be undone.',
    },
  };

  const { title, emptyText } = content[type];

  const handleRemoveService = useCallback(
    (serviceId: string) => {
      if (type === 'logging') {
        const filteredLogs = loggingdatadog.logs.filter(
          log => log.id !== serviceId
        );
        setLoggingdatadog({
          logs: filteredLogs,
        });
      } else {
        // For incidents, just clear the single incident
        setIncidentdatadog({
          incident: null,
        });
      }
    },
    [type, loggingdatadog.logs, setLoggingdatadog, setIncidentdatadog]
  );

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        dataDogConnection.id,
        accessToken
      );

      if (response.success) {
        resetDataDogConnection();
        resetLoggingdatadog();
        resetIncidentdatadog();
        toast.success('DataDog disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect DataDog');
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
            <DataDogIcon className='h-5 w-5' />
            <h3 className='font-medium'>{title}</h3>
          </div>

          <div className='flex items-center gap-2'>
            {type === 'incident' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowAddModal(true)}
                className='gap-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800'
              >
                <Plus className='h-4 w-4' />
                Add Link
              </Button>
            )}
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

        {(
          type === 'logging'
            ? loggingdatadog.logs.length === 0
            : !incidentdatadog.incident
        ) ? (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>{emptyText}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Click &ldquo;Manage&rdquo; to configure{' '}
              {type === 'logging' ? 'logs' : 'incidents'}.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {type === 'logging' ? (
              // Logs Layout - Service Name + DateTime Range
              <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
                {loggingdatadog.logs.map((service: LoggingService) => (
                  <div key={service.id} className='relative border-b px-4 py-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex-1'>
                        <div className='text-sm text-gray-900'>
                          <span>Service: </span>
                          <span className='font-medium'>
                            &apos;{service.name}&apos;
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveService(service.id);
                        }}
                        className='text-gray-400 hover:text-gray-600'
                        title='Remove this service'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Incidents Layout - Single incident display
              <>
                {incidentdatadog.incident && (
                  <div
                    key={incidentdatadog.incident.id}
                    className='group relative flex flex-col bg-white px-4 py-3'
                  >
                    {/* Remove button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveService(incidentdatadog.incident!.id);
                      }}
                      className='absolute top-3 right-3 text-gray-400 hover:text-gray-600'
                      title='Remove this incident'
                    >
                      <X className='h-4 w-4' />
                    </button>

                    {/* Title */}
                    <h4 className='mb-2 pr-8 text-sm font-medium text-gray-900'>
                      {incidentdatadog.incident.title}
                    </h4>

                    {/* Description */}
                    <p className='mb-2 text-xs leading-relaxed text-gray-600'>
                      Incident details and information from DataDog monitoring
                      system.
                    </p>

                    {/* Simple Badges */}
                    <div className='flex flex-wrap items-center gap-2'>
                      <Badge variant='outline' className='text-xs'>
                        Type: {incidentdatadog.incident.type}
                      </Badge>
                      <Badge variant='outline' className='text-xs'>
                        Reported:{' '}
                        {incidentdatadog.incident.last_seen
                          ? formatDistanceToNow(
                              new Date(incidentdatadog.incident.last_seen),
                              {
                                addSuffix: true,
                              }
                            )
                          : 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <DataDogServicesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type={type}
        />

        {/* Add Custom Incident Modal */}
        <AddIncidentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          provider='datadog'
          icon={<DataDogIcon className='h-5 w-5' />}
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
