'use client';

import { useState, useMemo, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileIcon,
  LinkIcon,
  LogsIcon,
  NotionIcon,
  GrafanaIcon,
  NewRelicIcon,
  PagerDutyIcon,
  SentryIcon,
  DataDogIcon,
  FigmaIcon,
  JiraIcon,
  ConfluenceIcon,
  CloudWatchIcon,
} from '@/components/icons';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { DocumentationModal } from '@/components/shared/DocumentationModal';
import SectionWrapper from '@/components/shared/SectionWrapper';
import { NotionDocuments } from '@/components/shared/NotionDocuments';
import { ConfluenceDocuments } from '@/components/shared/ConfluenceDocuments';
import { JiraDocuments } from '@/components/shared/JiraDocuments';
import { FigmaDocuments } from '@/components/shared/FigmaDocuments';
import { DataDogDocuments } from '@/components/shared/DataDogDocuments';
import { SentryDocuments } from '@/components/shared/SentryDocuments';
import { GrafanaDocuments } from '@/components/shared/GrafanaDocuments';
import { NewRelicDocuments } from '@/components/shared/NewRelicDocuments';
import { PagerDutyDocuments } from '@/components/shared/PagerDutyDocuments';
import { CloudWatchDocuments } from '@/components/shared/CloudWatchDocuments';
import { UserDocuments } from '@/components/shared/UserDocuments';
import { useOAuth } from '@/hooks/useOAuth';
import { useProject } from '@/hooks/useProject';
import { getAvailableIntegrations } from '@/lib/utils/integrationUtils';
import type {
  SupportingDocType,
  PRDBasedType,
  LogBasedType,
  IncidentBasedType,
  SupportedAgentType,
} from '@/types';

interface DocumentIntegrationProps {
  type: SupportingDocType | PRDBasedType | LogBasedType | IncidentBasedType;
  agentType?: SupportedAgentType;
  viewMode?: 'stack' | 'dropdown';
}

export function DocumentIntegration({
  type,
  agentType,
  viewMode = 'stack',
}: DocumentIntegrationProps) {
  const [showDocumentationModal, setShowDocumentationModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const {
    notionConnection,
    atlassianMCPConnection,
    figmaConnection,
    dataDogConnection,
    grafanaConnection,
    newRelicConnection,
    sentryConnection,
    pagerDutyConnection,
    cloudWatchConnection,
  } = useOAuth();

  // Project state reset functions
  const {
    resetPrdnotion,
    resetPrdconfluence,
    resetPrdjira,
    resetDocsnotion,
    resetDocsconfluence,
    resetDocsjira,
    resetDocsfigma,
    resetLoggingdatadog,
    resetLogginggrafana,
    resetIncidentjira,
    resetIncidentpagerduty,
    resetIncidentsentry,
    resetIncidentnewrelic,
    resetIncidentdatadog,
    prdfiles,
    docsfiles,
  } = useProject();

  // Get available integrations based on agent type and document type
  const availableIntegrations = useMemo(
    () => getAvailableIntegrations(agentType, type),
    [agentType, type]
  );

  // Get connected integrations that are available for this document type
  const connectedIntegrations = useMemo(() => {
    const integrations = [];

    if (notionConnection.isConnected && availableIntegrations.notion) {
      integrations.push({ id: 'notion', name: 'Notion', icon: <NotionIcon /> });
    }

    if (
      atlassianMCPConnection.isConnected &&
      availableIntegrations.confluence
    ) {
      integrations.push({
        id: 'confluence',
        name: 'Confluence',
        icon: <ConfluenceIcon />,
      });
    }

    if (atlassianMCPConnection.isConnected && availableIntegrations.jira) {
      integrations.push({ id: 'jira', name: 'Jira', icon: <JiraIcon /> });
    }

    if (figmaConnection.isConnected && availableIntegrations.figma) {
      integrations.push({ id: 'figma', name: 'Figma', icon: <FigmaIcon /> });
    }

    if (dataDogConnection.isConnected && availableIntegrations.datadog) {
      integrations.push({
        id: 'datadog',
        name: 'DataDog',
        icon: <DataDogIcon />,
      });
    }

    if (sentryConnection.isConnected && availableIntegrations.sentry) {
      integrations.push({ id: 'sentry', name: 'Sentry', icon: <SentryIcon /> });
    }

    if (grafanaConnection.isConnected && availableIntegrations.grafana) {
      integrations.push({
        id: 'grafana',
        name: 'Grafana',
        icon: <GrafanaIcon />,
      });
    }

    if (newRelicConnection.isConnected && availableIntegrations.newrelic) {
      integrations.push({
        id: 'newrelic',
        name: 'New Relic',
        icon: <NewRelicIcon />,
      });
    }

    if (pagerDutyConnection.isConnected && availableIntegrations.pagerduty) {
      integrations.push({
        id: 'pagerduty',
        name: 'PagerDuty',
        icon: <PagerDutyIcon />,
      });
    }

    if (cloudWatchConnection.isConnected && availableIntegrations.cloudwatch) {
      integrations.push({
        id: 'cloudwatch',
        name: 'CloudWatch',
        icon: <CloudWatchIcon />,
      });
    }

    return integrations;
  }, [
    notionConnection.isConnected,
    atlassianMCPConnection.isConnected,
    figmaConnection.isConnected,
    dataDogConnection.isConnected,
    sentryConnection.isConnected,
    grafanaConnection.isConnected,
    newRelicConnection.isConnected,
    pagerDutyConnection.isConnected,
    cloudWatchConnection.isConnected,
    availableIntegrations,
  ]);

  // Auto-select first integration in dropdown mode
  useEffect(() => {
    if (viewMode === 'dropdown' && connectedIntegrations.length > 0) {
      // If no selection or current selection is not available, select first item
      if (
        !selectedIntegration ||
        !connectedIntegrations.find(i => i.id === selectedIntegration)
      ) {
        setSelectedIntegration(connectedIntegrations[0].id);
      }
    }
  }, [viewMode, connectedIntegrations, selectedIntegration]);

  // Smart reset: Clear other integrations when switching between integrations
  useEffect(() => {
    if (!selectedIntegration || viewMode !== 'dropdown') return;

    const resetOtherIntegrations = () => {
      // Get all available integrations for current document type
      const currentAvailable = availableIntegrations;

      // Reset logic based on document type and selected integration
      switch (type) {
        case 'prd':
          // Reset other PRD integrations except the selected one
          if (selectedIntegration !== 'notion' && currentAvailable.notion) {
            resetPrdnotion();
          }
          if (
            selectedIntegration !== 'confluence' &&
            currentAvailable.confluence
          ) {
            resetPrdconfluence();
          }
          if (selectedIntegration !== 'jira' && currentAvailable.jira) {
            resetPrdjira();
          }
          break;

        case 'supporting_doc':
          // Reset other supporting doc integrations except the selected one
          if (selectedIntegration !== 'notion' && currentAvailable.notion) {
            resetDocsnotion();
          }
          if (
            selectedIntegration !== 'confluence' &&
            currentAvailable.confluence
          ) {
            resetDocsconfluence();
          }
          if (selectedIntegration !== 'jira' && currentAvailable.jira) {
            resetDocsjira();
          }
          if (selectedIntegration !== 'figma' && currentAvailable.figma) {
            resetDocsfigma();
          }
          break;

        case 'logging':
          // Reset other logging integrations except the selected one
          if (selectedIntegration !== 'datadog' && currentAvailable.datadog) {
            resetLoggingdatadog();
          }
          if (selectedIntegration !== 'grafana' && currentAvailable.grafana) {
            resetLogginggrafana();
          }
          break;

        case 'incident':
          // Reset other incident integrations except the selected one
          if (selectedIntegration !== 'jira' && currentAvailable.jira) {
            resetIncidentjira();
          }
          if (
            selectedIntegration !== 'pagerduty' &&
            currentAvailable.pagerduty
          ) {
            resetIncidentpagerduty();
          }
          if (selectedIntegration !== 'sentry' && currentAvailable.sentry) {
            resetIncidentsentry();
          }
          if (selectedIntegration !== 'newrelic' && currentAvailable.newrelic) {
            resetIncidentnewrelic();
          }
          if (selectedIntegration !== 'datadog' && currentAvailable.datadog) {
            resetIncidentdatadog();
          }
          break;
      }
    };
    resetOtherIntegrations();
  }, [
    selectedIntegration,
    type,
    viewMode,
    availableIntegrations,
    resetPrdnotion,
    resetPrdconfluence,
    resetPrdjira,
    resetDocsnotion,
    resetDocsconfluence,
    resetDocsjira,
    resetDocsfigma,
    resetLoggingdatadog,
    resetLogginggrafana,
    resetIncidentjira,
    resetIncidentpagerduty,
    resetIncidentsentry,
    resetIncidentnewrelic,
    resetIncidentdatadog,
  ]);
  // Check if there are actual files uploaded for this document type
  const hasUploadedFiles =
    type === 'prd' ? prdfiles.files.length > 0 : docsfiles.files.length > 0;

  const hasConnections =
    (notionConnection.isConnected && availableIntegrations.notion) ||
    (atlassianMCPConnection.isConnected && availableIntegrations.confluence) ||
    (atlassianMCPConnection.isConnected && availableIntegrations.jira) ||
    (figmaConnection.isConnected && availableIntegrations.figma) ||
    (dataDogConnection.isConnected && availableIntegrations.datadog) ||
    (grafanaConnection.isConnected && availableIntegrations.grafana) ||
    (newRelicConnection.isConnected && availableIntegrations.newrelic) ||
    (sentryConnection.isConnected && availableIntegrations.sentry) ||
    (pagerDutyConnection.isConnected && availableIntegrations.pagerduty) ||
    (cloudWatchConnection.isConnected && availableIntegrations.cloudwatch) ||
    (hasUploadedFiles && availableIntegrations.files);

  // Type-specific content
  const content = {
    prd: {
      smallIcon: <FileIcon className='h-4 w-4' />,
      icon: <FileIcon className='h-16 w-16' />,
      title: 'Add PRD Documentation',
      heading: 'Add PRD Documentation',
      subheading:
        'Connect your Product Requirement Documents to help AI understand your product specifications, features, and requirements.',
      buttonText: 'Connect PRD Documentation',
      addButtonText: 'Add PRD Documentation',
    },
    supporting_doc: {
      smallIcon: <FileIcon className='h-4 w-4' />,
      icon: <FileIcon className='h-16 w-16' />,
      title: 'Add Supporting Documentation (Optional)',
      heading: 'Add Supporting Documentation',
      subheading:
        'Integrate your documentation to enhance AI understanding of your systems, workflows, and product requirements.',
      buttonText: 'Connect Supporting Documents',
      addButtonText: 'Add Supporting Documents',
    },
    logging: {
      smallIcon: <LogsIcon className='h-4 w-4' />,
      icon: <LogsIcon className='h-16 w-16' />,
      title: 'Connect Your Logs (Optional)',
      heading: 'Connect Your Logs',
      subheading:
        'Connect PagerDuty, Sentry, Datadog, and other log sources to fetch real-time logs.',
      buttonText: 'Connect Logs',
      addButtonText: 'Add Logs',
    },
    incident: {
      smallIcon: <LinkIcon className='h-4 w-4' />,
      icon: <LinkIcon className='h-16 w-16' />,
      title: 'Connect Your Incident Feed Source',
      heading: 'Connect Your Incident Feed Source',
      subheading:
        'Link PagerDuty, Sentry, Datadog, and more to fetch real-time incident data.',
      buttonText: 'Connect Incident Feed Source',
      addButtonText: 'Add Incident Feed Source',
    },
    file: {
      smallIcon: <FileIcon className='h-4 w-4' />,
      icon: <FileIcon className='h-16 w-16' />,
      title: 'Upload Your Files',
      heading: 'Upload Your Files',
      subheading:
        'Upload your files to help the AI understand your product requirements.',
      buttonText: 'Upload Files',
      addButtonText: 'Add Files',
    },
  };

  const typeContent = content[type];

  // Function to render selected integration component
  const renderSelectedIntegration = () => {
    if (!selectedIntegration) return null;

    switch (selectedIntegration) {
      case 'notion':
        return (
          <NotionDocuments type={type as SupportingDocType | PRDBasedType} />
        );
      case 'confluence':
        return (
          <ConfluenceDocuments
            type={type as SupportingDocType | PRDBasedType}
          />
        );
      case 'jira':
        return (
          <JiraDocuments type={type as PRDBasedType | IncidentBasedType} />
        );
      case 'figma':
        return <FigmaDocuments type={type as SupportingDocType} />;
      case 'datadog':
        return <DataDogDocuments type={type as LogBasedType} />;
      case 'sentry':
        return <SentryDocuments type={type as IncidentBasedType} />;
      case 'grafana':
        return <GrafanaDocuments type={type as LogBasedType} />;
      case 'newrelic':
        return <NewRelicDocuments type={type as IncidentBasedType} />;
      case 'pagerduty':
        return <PagerDutyDocuments type={type as IncidentBasedType} />;
      case 'cloudwatch':
        return <CloudWatchDocuments type={type as LogBasedType} />;
      default:
        return null;
    }
  };

  return (
    <SectionWrapper icon={typeContent.smallIcon} title={typeContent.title}>
      {!hasConnections ? (
        <FeatureCard
          icon={typeContent.icon}
          heading={typeContent.heading}
          subheading={typeContent.subheading}
          buttonIcon={<Plus />}
          buttonText={typeContent.buttonText}
          onButtonClick={() => setShowDocumentationModal(true)}
        />
      ) : (
        <div className='space-y-4'>
          {viewMode === 'dropdown' && connectedIntegrations.length > 0 ? (
            <>
              {/* Integration Selector Dropdown */}
              <div className='flex items-center justify-end gap-3'>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      className='max-w-xs justify-between'
                    >
                      {selectedIntegration &&
                        connectedIntegrations.find(
                          i => i.id === selectedIntegration
                        )?.icon}
                      {selectedIntegration
                        ? connectedIntegrations.find(
                            i => i.id === selectedIntegration
                          )?.name
                        : 'Select integration'}
                      <ChevronDown className='h-4 w-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className='w-56'>
                    {connectedIntegrations.map(integration => (
                      <DropdownMenuItem
                        key={integration.id}
                        onClick={() => setSelectedIntegration(integration.id)}
                      >
                        <div className='flex items-center gap-2'>
                          <span>{integration.icon}</span>
                          <span>{integration.name}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowDocumentationModal(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  {typeContent.addButtonText}
                </Button>
              </div>

              {/* Selected Integration Component */}
              {renderSelectedIntegration()}
            </>
          ) : (
            <>
              {/* Add Knowledge Source Button */}
              <div className='flex justify-end'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowDocumentationModal(true)}
                  className='flex items-center gap-2'
                >
                  <Plus className='h-4 w-4' />
                  {typeContent.addButtonText}
                </Button>
              </div>

              {/* Connected Services - Stack View */}
              <div className='space-y-3'>
                {notionConnection.isConnected &&
                  availableIntegrations.notion && (
                    <NotionDocuments
                      type={type as SupportingDocType | PRDBasedType}
                    />
                  )}
                {atlassianMCPConnection.isConnected &&
                  availableIntegrations.confluence && (
                    <ConfluenceDocuments
                      type={type as SupportingDocType | PRDBasedType}
                    />
                  )}
                {atlassianMCPConnection.isConnected &&
                  availableIntegrations.jira && (
                    <JiraDocuments
                      type={type as PRDBasedType | IncidentBasedType}
                    />
                  )}
                {figmaConnection.isConnected && availableIntegrations.figma && (
                  <FigmaDocuments type={type as SupportingDocType} />
                )}
                {dataDogConnection.isConnected &&
                  availableIntegrations.datadog && (
                    <DataDogDocuments type={type as LogBasedType} />
                  )}
                {sentryConnection.isConnected &&
                  availableIntegrations.sentry && (
                    <SentryDocuments type={type as IncidentBasedType} />
                  )}
                {grafanaConnection.isConnected &&
                  availableIntegrations.grafana && (
                    <GrafanaDocuments type={type as LogBasedType} />
                  )}
                {newRelicConnection.isConnected &&
                  availableIntegrations.newrelic && (
                    <NewRelicDocuments type={type as IncidentBasedType} />
                  )}
                {pagerDutyConnection.isConnected &&
                  availableIntegrations.pagerduty && (
                    <PagerDutyDocuments type={type as IncidentBasedType} />
                  )}
                {cloudWatchConnection.isConnected &&
                  availableIntegrations.cloudwatch && (
                    <CloudWatchDocuments type={type as LogBasedType} />
                  )}
                {hasUploadedFiles && availableIntegrations.files && (
                  <UserDocuments
                    type={type as SupportingDocType | PRDBasedType}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Documentation Modal */}
      <DocumentationModal
        open={showDocumentationModal}
        onOpenChange={setShowDocumentationModal}
        type={type}
        agentType={agentType}
      />
    </SectionWrapper>
  );
}
