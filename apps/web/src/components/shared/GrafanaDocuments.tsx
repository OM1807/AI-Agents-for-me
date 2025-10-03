import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { GrafanaIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X } from 'lucide-react';
import { GrafanaServicesModal } from '@/components/shared/GrafanaServicesModal';
import { integrationApi } from '@/lib/api/api';
import type { LogBasedType } from '@/types';
import type { LoggingService } from '@/types/integrations';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface GrafanaDocumentsProps {
  type: LogBasedType;
}

export function GrafanaDocuments({ type }: GrafanaDocumentsProps) {
  const { resetGrafanaConnection, grafanaConnection } = useOAuth();
  const { accessToken } = useUser();
  const { logginggrafana, setLogginggrafana, resetLogginggrafana } =
    useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    logging: {
      title: 'Grafana Logs',
      emptyText: 'No Grafana logs configured.',
      disconnectMessage:
        'Are you sure you want to disconnect Grafana? This will remove all logs and their associated data. This action cannot be undone.',
    },
  };

  const { title, emptyText } = content[type];

  const handleRemoveService = useCallback(
    (serviceId: string) => {
      const filteredLogs = logginggrafana.logs.filter(
        log => log.id !== serviceId
      );

      setLogginggrafana({
        logs: filteredLogs,
      });
    },
    [logginggrafana.logs, setLogginggrafana]
  );

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        grafanaConnection.id,
        accessToken
      );

      if (response.success) {
        resetGrafanaConnection();
        resetLogginggrafana();
        toast.success('Grafana disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect Grafana');
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
            <GrafanaIcon className='h-5 w-5' />
            <h3 className='font-medium'>{title}</h3>
          </div>

          <div className='flex items-center gap-2'>
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

        {logginggrafana.logs.length === 0 ? (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>{emptyText}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Click &ldquo;Manage&rdquo; to configure Logs.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
              {logginggrafana.logs.map((service: LoggingService) => (
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
          </div>
        )}

        <GrafanaServicesModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          type={type}
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
