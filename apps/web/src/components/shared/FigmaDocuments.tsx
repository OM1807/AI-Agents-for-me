import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FigmaIcon } from '@/components/icons';
import { Loader2, Settings, FileText, X, Calendar, Folder } from 'lucide-react';
import { FigmaFileModal } from '@/components/shared/FigmaFileModal';
import { integrationApi } from '@/lib/api/api';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { SupportingDocType, FigmaFile } from '@/types';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface FigmaDocumentsProps {
  type: SupportingDocType;
}

export function FigmaDocuments({ type }: FigmaDocumentsProps) {
  const { resetFigmaConnection, figmaConnection } = useOAuth();
  const { accessToken } = useUser();
  const { setDocsfigma, docsfigma, resetDocsfigma } = useProject();
  const [showModal, setShowModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    supporting_doc: {
      title: 'Figma Support Documents',
      emptyText: 'No Figma files added.',
      disconnectMessage:
        'Are you sure you want to disconnect Figma? This will remove all files and their associated data. This action cannot be undone.',
    },
  };

  const currentData = docsfigma;
  const { title, emptyText } = content[type];

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        figmaConnection.id,
        accessToken
      );

      if (response.success) {
        resetFigmaConnection();
        resetDocsfigma();
        toast.success('Figma disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect Figma');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleAddFile = (newFile: FigmaFile) => {
    const setter = setDocsfigma;
    setter({
      files: [...currentData.files, newFile],
      selectedFiles: [...currentData.selectedFiles, newFile.url],
    });
    setShowModal(false);
  };

  const handleRemoveFile = (fileUrl: string) => {
    const setter = setDocsfigma;
    const filteredFiles = currentData.files.filter(
      file => file.url !== fileUrl
    );
    const filteredSelectedFiles = currentData.selectedFiles.filter(
      url => url !== fileUrl
    );

    setter({
      files: filteredFiles,
      selectedFiles: filteredSelectedFiles,
    });
  };

  const handleDisconnectClick = () => {
    setShowDisconnectModal(true);
  };

  return (
    <>
      <div className='bg-card rounded-lg border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <FigmaIcon className='h-5 w-5' />
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
              className='border-red-700 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-900'
              size='sm'
              onClick={handleDisconnectClick}
            >
              {isDisconnecting ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Disconnect'
              )}
            </Button>
          </div>
        </div>

        <div>
          {currentData.files.length === 0 ? (
            <div className='py-4 text-center'>
              <FileText className='text-muted-foreground mx-auto h-8 w-8' />
              <p className='text-muted-foreground mt-2 text-sm'>{emptyText}</p>
              <p className='text-muted-foreground mt-1 text-xs'>
                Click &ldquo;Manage&rdquo; to add Figma files.
              </p>
            </div>
          ) : (
            <div className='max-h-[400px] space-y-3 overflow-y-auto'>
              <div className='text-muted-foreground mb-3 text-xs'>
                Added {currentData.files.length} file
                {currentData.files.length !== 1 ? 's' : ''}
              </div>
              {currentData.files.map((file: FigmaFile) => (
                <div
                  key={file.url}
                  className='group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md'
                >
                  {/* Remove button - Always visible */}
                  <button
                    onClick={() => handleRemoveFile(file.url)}
                    className='text-muted-foreground/60 hover:bg-muted hover:text-foreground absolute top-2 right-2 rounded-full p-1 transition-all duration-200'
                    title='Remove this file'
                  >
                    <X className='h-4 w-4' />
                  </button>

                  <div className='flex h-28'>
                    {/* Thumbnail - 25% width */}
                    <div className='relative w-1/4 bg-gray-50'>
                      {file.thumbnail_url ? (
                        <Image
                          src={file.thumbnail_url}
                          alt={file.name}
                          fill
                          unoptimized
                          className='object-cover'
                          onError={e => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove(
                              'hidden'
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={cn(
                          'flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100',
                          file.thumbnail_url ? 'hidden' : ''
                        )}
                      >
                        <FigmaIcon className='h-12 w-12 text-gray-400' />
                      </div>
                    </div>

                    {/* Content - 75% width */}
                    <div className='flex flex-1 flex-col justify-center p-4 pr-14'>
                      <div className='space-y-2'>
                        {/* Title */}
                        <h3 className='line-clamp-2 text-lg leading-tight font-semibold text-gray-900'>
                          {file.name}
                        </h3>

                        {/* Folder if exists */}
                        {file.folder_name && (
                          <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <Folder className='h-4 w-4 text-gray-400' />
                            <span className='truncate font-medium'>
                              {file.folder_name}
                            </span>
                          </div>
                        )}

                        {/* Role and timestamp */}
                        <div className='flex items-center gap-3 pt-1'>
                          <Badge
                            variant='outline'
                            className={cn(
                              'px-2.5 py-1 text-xs font-semibold',
                              getRoleColor(file.role)
                            )}
                          >
                            {file.role}
                          </Badge>
                          <div className='flex items-center gap-1.5 text-sm text-gray-500'>
                            <Calendar className='h-4 w-4' />
                            <span className='font-medium'>
                              {getRelativeTime(file.last_touched_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <FigmaFileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleAddFile}
        type={type}
        existingFiles={currentData.files}
      />

      {/* Disconnect Confirmation Modal */}
      <ConfirmDisconnectModal
        open={showDisconnectModal}
        message={content[type]?.disconnectMessage}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        isLoading={isDisconnecting}
      />
    </>
  );
}
