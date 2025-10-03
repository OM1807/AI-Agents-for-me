import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfluenceIcon } from '@/components/icons';
import { Settings, FileText, X } from 'lucide-react';
import { ConfluencePagesModal } from '@/components/shared/ConfluencePagesModal';
import { integrationApi } from '@/lib/api/api';
import type {
  EnhancedAtlassianPage,
  SupportingDocType,
  PRDBasedType,
} from '@/types';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';
import { useProject } from '@/hooks/useProject';
import ConfirmDisconnectModal from './ConfirmDisconnectModal';

interface ConfluenceDocumentsProps {
  type: SupportingDocType | PRDBasedType;
}

export function ConfluenceDocuments({ type }: ConfluenceDocumentsProps) {
  const { resetAtlassianMCPConnection, atlassianMCPConnection } = useOAuth();
  const { accessToken } = useUser();
  const {
    setPrdconfluence,
    setDocsconfluence,
    prdconfluence,
    docsconfluence,
    resetCachedConfluenceSpaces,
    resetCachedConfluencePages,
    resetPrdconfluence,
    resetDocsconfluence,
  } = useProject();
  const [showModal, setShowModal] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  const content = {
    prd: {
      title: 'Confluence PRD Documents',
      emptyText: 'No PRD pages selected.',
      disconnectMessage:
        'Are you sure you want to disconnect Confluence? This will remove all PRD pages and their associated data. This action cannot be undone.',
    },
    supporting_doc: {
      title: 'Confluence Support Documents',
      emptyText: 'No support documents selected.',
      disconnectMessage:
        'Are you sure you want to disconnect Confluence? This will remove all supporting documents and their associated data. This action cannot be undone.',
    },
  };

  const currentData = type === 'prd' ? prdconfluence : docsconfluence;
  const { title, emptyText } = content[type];

  const handleDisconnect = async () => {
    if (!accessToken) return;

    setIsDisconnecting(true);
    try {
      const response = await integrationApi.delete(
        atlassianMCPConnection.id,
        accessToken
      );

      if (response.success) {
        resetAtlassianMCPConnection();
        resetPrdconfluence();
        resetDocsconfluence();
        resetCachedConfluenceSpaces();
        resetCachedConfluencePages();
        toast.success('Confluence disconnected successfully');
        setShowDisconnectModal(false);
      } else {
        toast.error(
          `Failed to disconnect: ${response.error || 'Unknown error'}`
        );
      }
    } catch {
      toast.error('Failed to disconnect Confluence');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleConfirm = (
    selectedPages: EnhancedAtlassianPage[],
    pageIds: string[]
  ) => {
    const setter = type === 'prd' ? setPrdconfluence : setDocsconfluence;
    setter({ pages: selectedPages, selectedPages: pageIds });
    setShowModal(false);
  };

  const handleRemovePage = (pageId: string) => {
    const setter = type === 'prd' ? setPrdconfluence : setDocsconfluence;
    const filteredPages = currentData.pages.filter(page => page.id !== pageId);
    const filteredSelectedPages = currentData.selectedPages.filter(
      id => id !== pageId
    );

    setter({
      pages: filteredPages,
      selectedPages: filteredSelectedPages,
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
            <ConfluenceIcon className='h-5 w-5' />
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
              Disconnect
            </Button>
          </div>
        </div>

        {currentData.pages.length === 0 ? (
          <div className='py-6 text-center'>
            <FileText className='text-muted-foreground mx-auto mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>{emptyText}</p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Click &ldquo;Manage&rdquo; to select pages.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            <div className='text-muted-foreground text-xs'>
              Selected {currentData.pages.length} page
              {currentData.pages.length !== 1 ? 's' : ''}
            </div>
            <div className='flex flex-wrap gap-2'>
              {currentData.pages.map(page => (
                <Badge
                  key={page.id}
                  variant='outline'
                  className='group hover:bg-muted/50 relative max-w-[200px] pr-7 transition-colors'
                  title={page.title}
                >
                  <span className='block truncate'>{page.title}</span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleRemovePage(page.id);
                    }}
                    className='text-muted-foreground/60 hover:bg-muted hover:text-foreground absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-0.5 transition-all duration-200'
                    title='Remove this page'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfluencePagesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
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
    </>
  );
}
