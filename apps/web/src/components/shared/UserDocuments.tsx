import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileIcon } from '@/components/icons';
import { Settings, FileText, Trash2 } from 'lucide-react';
import { filesUploadApi } from '@/lib/api/api';
import type { SupportingDocType, PRDBasedType } from '@/types';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';
import ConfirmDisconnectModal from '@/components/shared/ConfirmDisconnectModal';

interface UserDocumentsProps {
  type: SupportingDocType | PRDBasedType;
}

export function UserDocuments({ type }: UserDocumentsProps) {
  const { resetUserFilesConnection } = useOAuth();
  const { accessToken } = useUser();
  const {
    setPrdfiles,
    setDocsfiles,
    prdfiles,
    docsfiles,
    resetPrdfiles,
    resetDocsfiles,
  } = useProject();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const content = {
    prd: {
      title: 'Uploaded PRD Files',
      emptyText: 'No PRD files uploaded.',
      disconnectMessage:
        'Are you sure you want to remove all uploaded files? This will delete all PRD files and their associated data. This action cannot be undone.',
    },
    supporting_doc: {
      title: 'Uploaded Support Files',
      emptyText: 'No support files uploaded.',
      disconnectMessage:
        'Are you sure you want to remove all uploaded files? This will delete all supporting files and their associated data. This action cannot be undone.',
    },
  };

  const typeContent = content[type];
  const currentFiles = type === 'prd' ? prdfiles : docsfiles;
  const setCurrentFiles = type === 'prd' ? setPrdfiles : setDocsfiles;
  const resetCurrentFiles = type === 'prd' ? resetPrdfiles : resetDocsfiles;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      // Delete all files from the server
      const deletePromises = currentFiles.files.map(file =>
        filesUploadApi.delete(file.name, accessToken!)
      );

      await Promise.allSettled(deletePromises);

      // Reset local state
      resetCurrentFiles();
      resetUserFilesConnection();

      toast.success('All files removed successfully');
    } catch {
      toast.error('Failed to remove some files');
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectModal(false);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    setDeletingFile(fileName);
    try {
      const response = await filesUploadApi.delete(fileName, accessToken!);

      if (response.success) {
        // Remove file from local state
        const updatedFiles = {
          files: currentFiles.files.filter(file => file.name !== fileName),
          selectedFiles: currentFiles.selectedFiles.filter(
            name => name !== fileName
          ),
        };
        setCurrentFiles(updatedFiles);

        // If no files left, disconnect
        if (updatedFiles.files.length === 0) {
          resetUserFilesConnection();
        }

        toast.success('File deleted successfully');
      } else {
        throw new Error(response.error || 'Failed to delete file');
      }
    } catch {
      toast.error('Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  };

  if (currentFiles.files.length === 0) {
    return null;
  }

  return (
    <div className='rounded-lg border border-gray-200 bg-white p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100'>
            <FileIcon className='h-4 w-4 text-gray-600' />
          </div>
          <div>
            <h3 className='font-medium text-gray-900'>{typeContent.title}</h3>
            <p className='text-sm text-gray-500'>
              {currentFiles.files.length} file
              {currentFiles.files.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowDisconnectModal(true)}
          disabled={isDisconnecting}
          className='text-gray-500 hover:text-red-600'
        >
          <Settings className='h-4 w-4' />
        </Button>
      </div>

      {currentFiles.files.length > 0 ? (
        <div className='space-y-2'>
          {currentFiles.files.map(file => (
            <div
              key={file.name}
              className='flex items-center justify-between rounded-md bg-gray-50 p-3'
            >
              <div className='flex items-center gap-3'>
                <FileText className='h-4 w-4 text-gray-500' />
                <div className='min-w-0 flex-1'>
                  <p className='truncate text-sm font-medium text-gray-900'>
                    {file.name}
                  </p>
                  <p className='text-xs text-gray-500'>
                    Uploaded {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='secondary'
                  className='bg-green-100 text-green-800'
                >
                  Selected
                </Badge>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => handleDeleteFile(file.name)}
                  disabled={deletingFile === file.name}
                  className='text-gray-400 hover:text-red-600'
                >
                  {deletingFile === file.name ? (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600' />
                  ) : (
                    <Trash2 className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className='text-sm text-gray-500'>{typeContent.emptyText}</p>
      )}

      <ConfirmDisconnectModal
        open={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
        onConfirm={handleDisconnect}
        message={typeContent.disconnectMessage}
        isLoading={isDisconnecting}
      />
    </div>
  );
}
