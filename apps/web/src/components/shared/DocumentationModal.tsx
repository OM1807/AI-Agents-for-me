'use client';

import { useState, useMemo } from 'react';
import { BookOpenText, X } from 'lucide-react';
import {
  NotionIcon,
  ConfluenceIcon,
  FigmaIcon,
  DataDogIcon,
  GrafanaIcon,
  NewRelicIcon,
  PagerDutyIcon,
  SentryIcon,
} from '@/components/icons';
import { UploadSimple } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useOAuth } from '@/hooks/useOAuth';
import { useProject } from '@/hooks/useProject';
import { FigmaModal } from './FigmaModal';
import { DataDogModal } from './DataDogModal';
import { GrafanaModal } from './GrafanaModal';
import { NewRelicModal } from './NewRelicModal';
import { PagerDutyModal } from './PagerDutyModal';
import { SentryModal } from './SentryModal';
import { getAvailableIntegrations } from '@/lib/utils/integrationUtils';
import type {
  SupportingDocType,
  PRDBasedType,
  LogBasedType,
  IncidentBasedType,
} from '@/types';
import { FileUploadModal } from './FileUploadModal';
import { toast } from 'sonner';

interface UploadedFileData {
  name?: string;
  file_name?: string;
  status?: string;
  [key: string]: any;
}

interface DocumentationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: SupportingDocType | PRDBasedType | LogBasedType | IncidentBasedType;
  agentType?: string;
}

export function DocumentationModal({
  open,
  onOpenChange,
  type,
  agentType = 'default',
}: DocumentationModalProps) {
  const {
    notionConnection,
    atlassianMCPConnection,
    figmaConnection,
    dataDogConnection,
    grafanaConnection,
    newRelicConnection,
    sentryConnection,
    pagerDutyConnection,
    setUserFilesConnection,
  } = useOAuth();
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [showDataDogModal, setShowDataDogModal] = useState(false);
  const [showGrafanaModal, setShowGrafanaModal] = useState(false);
  const [showNewRelicModal, setShowNewRelicModal] = useState(false);
  const [showPagerDutyModal, setShowPagerDutyModal] = useState(false);
  const [showSentryModal, setShowSentryModal] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const { setPrdfiles, setDocsfiles, prdfiles, docsfiles } = useProject();

  const handleConnect = (provider: string) => {
    switch (provider) {
      case 'figma':
        setShowFigmaModal(true);
        break;
      case 'datadog':
        setShowDataDogModal(true);
        break;
      case 'grafana':
        setShowGrafanaModal(true);
        break;
      case 'newrelic':
        setShowNewRelicModal(true);
        break;
      case 'pagerduty':
        setShowPagerDutyModal(true);
        break;
      case 'sentry':
        setShowSentryModal(true);
        break;
      default:
        // OAuth-based integrations
        window.location.href = `/api/auth/${provider}?from=${window.location.href}`;
        break;
    }
  };

  const handleFilesUploaded = (newFiles: UploadedFileData[]) => {
    // Convert uploaded files to the format expected by the store
    const formattedFiles = newFiles.map(file => ({
      name: file.file_name || file.name || '',
      uploadedAt: new Date().toISOString(),
    }));

    // Update the appropriate store based on document type
    if (type === 'prd') {
      const updatedPrdFiles = {
        files: [...prdfiles.files, ...formattedFiles],
        selectedFiles: [
          ...prdfiles.selectedFiles,
          ...formattedFiles.map(f => f.name),
        ],
      };
      setPrdfiles(updatedPrdFiles);
    } else if (type === 'supporting_doc') {
      const updatedDocsFiles = {
        files: [...docsfiles.files, ...formattedFiles],
        selectedFiles: [
          ...docsfiles.selectedFiles,
          ...formattedFiles.map(f => f.name),
        ],
      };
      setDocsfiles(updatedDocsFiles);
    }

    // Mark user files as connected
    setUserFilesConnection({ isConnected: true, id: 1 });

    // Show success message
    toast.success(`Successfully uploaded ${newFiles.length} file(s)!`);

    // Close modals
    setShowFileUploadModal(false);
    onOpenChange(false);
  };

  // Type-specific content
  const content = {
    prd: {
      title: 'Connect Your PRD Source',
      description:
        'Link your PRD tool to help the AI understand your product requirements.',
    },
    supporting_doc: {
      title: 'Add Supporting Documentation',
      description:
        'Integrate your documentation to enhance AI understanding of your systems, workflows, and product requirements.',
    },
    logging: {
      title: 'Connect Your Logging Sources',
      description:
        'Link your logging and monitoring platforms to analyze system logs, performance metrics, and application behavior.',
    },
    incident: {
      title: 'Connect Your Incident Management Sources',
      description:
        'Link your incident management and error tracking tools to analyze incidents, alerts, and system reliability data.',
    },
    file: {
      title: 'Upload Your Files',
      description:
        'Upload your files to help the AI understand your product requirements.',
    },
  };

  const typeContent = content[type];

  const availableIntegrations = useMemo(
    () => getAvailableIntegrations(agentType, type),
    [agentType, type]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3 text-2xl'>
            <span className='text-2xl'>
              <BookOpenText className='h-7 w-7' />
            </span>
            {typeContent.title}
          </DialogTitle>
          <DialogDescription className='pt-2 text-base'>
            {typeContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-6 space-y-4'>
          {/* Notion Option */}
          {availableIntegrations.notion && (
            <button
              disabled={notionConnection.isConnected}
              onClick={() => handleConnect('notion')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <NotionIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>Connect to Notion</h3>
                  <p className='text-muted-foreground text-sm'>
                    {notionConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Confluence Option */}
          {(availableIntegrations.confluence || availableIntegrations.jira) && (
            <button
              disabled={atlassianMCPConnection.isConnected}
              onClick={() => handleConnect('atlassian-mcp')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <ConfluenceIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>
                    Connect to Atlassian
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {atlassianMCPConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Figma Option */}
          {availableIntegrations.figma && (
            <button
              disabled={figmaConnection.isConnected}
              onClick={() => handleConnect('figma')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <FigmaIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>Connect to Figma</h3>
                  <p className='text-muted-foreground text-sm'>
                    {figmaConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* DataDog Option */}
          {availableIntegrations.datadog && (
            <button
              disabled={dataDogConnection.isConnected}
              onClick={() => handleConnect('datadog')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <DataDogIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>Connect to DataDog</h3>
                  <p className='text-muted-foreground text-sm'>
                    {dataDogConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Grafana Option */}
          {availableIntegrations.grafana && (
            <button
              disabled={grafanaConnection.isConnected}
              onClick={() => handleConnect('grafana')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <GrafanaIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>Connect to Grafana</h3>
                  <p className='text-muted-foreground text-sm'>
                    {grafanaConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* New Relic Option */}
          {availableIntegrations.newrelic && (
            <button
              disabled={newRelicConnection.isConnected}
              onClick={() => handleConnect('newrelic')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <NewRelicIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>
                    Connect to New Relic
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {newRelicConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* PagerDuty Option */}
          {availableIntegrations.pagerduty && (
            <button
              disabled={pagerDutyConnection.isConnected}
              onClick={() => handleConnect('pagerduty')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <PagerDutyIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>
                    Connect to PagerDuty
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    {pagerDutyConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Sentry Option */}
          {availableIntegrations.sentry && (
            <button
              disabled={sentryConnection.isConnected}
              onClick={() => handleConnect('sentry')}
              className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
            >
              <div className='flex items-center gap-4'>
                <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                  <SentryIcon className='h-6 w-6' />
                </div>
                <div className='text-left'>
                  <h3 className='text-lg font-semibold'>Connect to Sentry</h3>
                  <p className='text-muted-foreground text-sm'>
                    {sentryConnection.isConnected
                      ? 'Connected'
                      : 'Not connected'}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* File Upload Option */}
        {availableIntegrations.files && (
          <button
            onClick={() => setShowFileUploadModal(true)}
            className='flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-2 transition-all hover:border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <div className='flex items-center gap-4'>
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100'>
                <UploadSimple size={28} />
              </div>
              <div className='text-left'>
                <h3 className='text-lg font-semibold'>File Upload</h3>
                <p className='text-muted-foreground text-sm'>
                  Upload documents from your device (.pdf, .docx)
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Custom close button */}
        <button
          onClick={() => onOpenChange(false)}
          className='ring-offset-background focus:ring-ring absolute top-4 right-22 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none'
        >
          <X className='h-4 w-4' />
          <span className='sr-only'>Close</span>
        </button>
      </DialogContent>

      <FigmaModal open={showFigmaModal} onOpenChange={setShowFigmaModal} />
      <DataDogModal
        open={showDataDogModal}
        onOpenChange={setShowDataDogModal}
      />
      <GrafanaModal
        open={showGrafanaModal}
        onOpenChange={setShowGrafanaModal}
      />
      <NewRelicModal
        open={showNewRelicModal}
        onOpenChange={setShowNewRelicModal}
      />
      <PagerDutyModal
        open={showPagerDutyModal}
        onOpenChange={setShowPagerDutyModal}
      />
      <SentryModal open={showSentryModal} onOpenChange={setShowSentryModal} />

      {/* File Upload Modal */}
      <FileUploadModal
        open={showFileUploadModal}
        onOpenChange={setShowFileUploadModal}
        onFilesUploaded={handleFilesUploaded}
      />
    </Dialog>
  );
}
