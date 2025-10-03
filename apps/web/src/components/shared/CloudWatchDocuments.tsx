import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloudWatchIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X } from 'lucide-react';
import { CloudWatchServicesModal } from '@/components/shared/CloudWatchServicesModal';
import { integrationApi } from '@/lib/api/api';
import type { LogBasedType } from '@/types';
import type { LoggingService } from '@/types/integrations';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface CloudWatchDocumentsProps {
  type: LogBasedType;
}

export function CloudWatchDocuments({ type }: CloudWatchDocumentsProps) {
  const { resetCloudWatchConnection, cloudWatchConnection } = useOAuth();
  const { accessToken } = useUser();
  const { loggingcloudwatch, setLoggingcloudwatch, resetLoggingcloudwatch } =
    useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    logging: {
      title: 'CloudWatch Logs',
      emptyText: 'No CloudWatch logs configured.',
      disconnectMessage:
        'Are you sure you want to disconnect CloudWatch? This will remove all logs and their associated data. This action cannot be undone.',
    },
  };

  const { title, emptyText } = content[type];

  const handleRemoveService = (serviceId: string) => {
    const filteredLogs = loggingcloudwatch.logs.filter(
      log => log.id !== serviceId
    );
    setLoggingcloudwatch({
      logs: filteredLogs,
    });
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        cloudWatchConnection.id,
        accessToken
      );

      if (response.success) {
        resetCloudWatchConnection();
        resetLoggingcloudwatch();
        toast.success('CloudWatch disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect CloudWatch');
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
            <CloudWatchIcon className='h-5 w-5' />
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

        {loggingcloudwatch.logs.length === 0 ? (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>{emptyText}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Click &ldquo;Manage&rdquo; to configure logs.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {/* Logs Layout - Service Name + DateTime Range */}
            <div className='max-h-80 min-h-0 flex-1 overflow-auto bg-white'>
              {loggingcloudwatch.logs.map((service: LoggingService) => (
                <div key={service.id} className='relative border-b px-4 py-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex-1'>
                      <div className='text-sm text-gray-900'>
                        <span>Log Group: </span>
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
                      title='Remove this log group'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CloudWatchServicesModal
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
