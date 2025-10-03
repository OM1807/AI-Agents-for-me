'use client';

import { useState } from 'react';
import {
  ConfluenceIcon,
  NotionIcon,
  GitIcon,
  GitLabIcon,
  LinearIcon,
  MSTeamsIcon,
  SlackIcon,
  ServiceNowIcon,
  GoogleDriveIcon,
  FigmaIcon,
  PagerDutyIcon,
  SentryIcon,
  NewRelicIcon,
  DataDogIcon,
  GrafanaIcon,
  CloudWatchIcon,
} from '@/components/icons';
import { ServiceTile } from '@/components/features/settings/ServiceTile';
import { GitHubModal } from '@/components/shared/GitHubModal';
import { FigmaModal } from '@/components/shared/FigmaModal';
import { PagerDutyModal } from '@/components/shared/PagerDutyModal';
import { SentryModal } from '@/components/shared/SentryModal';
import { NewRelicModal } from '@/components/shared/NewRelicModal';
import { DataDogModal } from '@/components/shared/DataDogModal';
import { GrafanaModal } from '@/components/shared/GrafanaModal';
import { CloudWatchModal } from '@/components/shared/CloudWatchModal';
import { useOAuth } from '@/hooks/useOAuth';
import { useUser } from '@/hooks/useUser';
import { integrationApi } from '@/lib/api/api';
import { toast } from 'sonner';

import { useOAuthTokenHandler } from '@/hooks/useOAuthTokenHandler';

// Service configuration constants
const SERVICES = [
  {
    id: 'notion',
    title: 'Notion',
    icon: NotionIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Connect with OAuth',
    type: 'oauth',
    oauthProvider: 'notion',
  },
  {
    id: 'atlassian',
    title: 'Atlassian',
    icon: ConfluenceIcon,
    connectedDescription: 'Connected via MCP',
    disconnectedDescription: 'Connect with MCP OAuth',
    type: 'oauth',
    oauthProvider: 'atlassian-mcp',
  },
  {
    id: 'github',
    title: 'GitHub',
    icon: GitIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter API token',
    type: 'token',
  },
  {
    id: 'figma',
    title: 'Figma',
    icon: FigmaIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'token',
    comingSoon: true,
  },
  {
    id: 'pagerduty',
    title: 'PagerDuty',
    icon: PagerDutyIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter API token',
    type: 'token',
  },
  {
    id: 'sentry',
    title: 'Sentry',
    icon: SentryIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter API token',
    type: 'token',
  },
  {
    id: 'newrelic',
    title: 'New Relic',
    icon: NewRelicIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter token',
    type: 'token',
  },
  {
    id: 'datadog',
    title: 'DataDog',
    icon: DataDogIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter API token',
    type: 'token',
  },
  {
    id: 'cloudwatch',
    title: 'CloudWatch',
    icon: CloudWatchIcon,
    connectedDescription: 'Connected',
    disconnectedDescription: 'Enter AWS credentials',
    type: 'token',
  },
  {
    id: 'grafana',
    title: 'Grafana',
    icon: GrafanaIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'token',
    comingSoon: true,
  },
  {
    id: 'gitlab',
    title: 'GitLab',
    icon: GitLabIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'token',
    comingSoon: true,
  },
  {
    id: 'linear',
    title: 'Linear',
    icon: LinearIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'oauth',
    comingSoon: true,
  },
  {
    id: 'msteams',
    title: 'Microsoft Teams',
    icon: MSTeamsIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'oauth',
    comingSoon: true,
  },
  {
    id: 'slack',
    title: 'Slack',
    icon: SlackIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'oauth',
    comingSoon: true,
  },
  {
    id: 'servicenow',
    title: 'ServiceNow',
    icon: ServiceNowIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'oauth',
    comingSoon: true,
  },
  {
    id: 'googledrive',
    title: 'Google Drive',
    icon: GoogleDriveIcon,
    connectedDescription: 'Coming Soon',
    disconnectedDescription: 'Coming Soon',
    type: 'oauth',
    comingSoon: true,
  },
] as const;

export default function SettingsPage() {
  const {
    notionConnection,
    gitHubConnection,
    figmaConnection,
    atlassianMCPConnection,
    pagerDutyConnection,
    sentryConnection,
    newRelicConnection,
    dataDogConnection,
    grafanaConnection,
    cloudWatchConnection,
    setAtlassianMCPConnection,
    setNotionConnection,
    setGitHubConnection,
    setFigmaConnection,
    setPagerDutyConnection,
    setSentryConnection,
    setNewRelicConnection,
    setDataDogConnection,
    setGrafanaConnection,
    setCloudWatchConnection,
  } = useOAuth();
  const { accessToken } = useUser();
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showFigmaModal, setShowFigmaModal] = useState(false);
  const [showPagerDutyModal, setShowPagerDutyModal] = useState(false);
  const [showSentryModal, setShowSentryModal] = useState(false);
  const [showNewRelicModal, setShowNewRelicModal] = useState(false);
  const [showDataDogModal, setShowDataDogModal] = useState(false);
  const [showGrafanaModal, setShowGrafanaModal] = useState(false);
  const [showCloudWatchModal, setShowCloudWatchModal] = useState(false);

  // useOAuthTokenHandler
  useOAuthTokenHandler();

  const getConnectionStatus = (serviceId: string) => {
    switch (serviceId) {
      case 'notion':
        return notionConnection;
      case 'atlassian':
        return atlassianMCPConnection;
      case 'github':
        return gitHubConnection;
      case 'figma':
        return figmaConnection;
      case 'pagerduty':
        return pagerDutyConnection;
      case 'sentry':
        return sentryConnection;
      case 'newrelic':
        return newRelicConnection;
      case 'datadog':
        return dataDogConnection;
      case 'cloudwatch':
        return cloudWatchConnection;
      case 'grafana':
        return grafanaConnection;
      default:
        return { isConnected: false, id: 0 };
    }
  };

  // Handle OAuth service clicks
  const handleOAuthClick = (provider: string) => {
    window.location.href = `/api/auth/${provider}?from=${window.location.href}`;
  };

  // Handle token service clicks
  const handleTokenClick = (serviceId: string) => {
    switch (serviceId) {
      case 'github':
        setShowGitHubModal(true);
        break;
      case 'figma':
        setShowFigmaModal(true);
        break;
      case 'pagerduty':
        setShowPagerDutyModal(true);
        break;
      case 'sentry':
        setShowSentryModal(true);
        break;
      case 'newrelic':
        setShowNewRelicModal(true);
        break;
      case 'datadog':
        setShowDataDogModal(true);
        break;
      case 'cloudwatch':
        setShowCloudWatchModal(true);
        break;
      case 'grafana':
        setShowGrafanaModal(true);
        break;
      default:
        break;
    }
  };

  // Handle service disconnect
  const handleDisconnect = async (serviceId: string) => {
    const connectionStatus = getConnectionStatus(serviceId);
    if (!connectionStatus.isConnected || !connectionStatus.id || !accessToken) {
      return;
    }

    try {
      const response = await integrationApi.delete(
        connectionStatus.id,
        accessToken
      );

      if (response.success) {
        // Reset the connection state based on service type
        switch (serviceId) {
          case 'notion':
            setNotionConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('Notion disconnected successfully');
            break;
          case 'atlassian':
            setAtlassianMCPConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('Atlassian MCP disconnected successfully');
            break;
          case 'github':
            setGitHubConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('GitHub disconnected successfully');
            break;
          case 'figma':
            setFigmaConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('Figma disconnected successfully');
            break;
          case 'pagerduty':
            setPagerDutyConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('PagerDuty disconnected successfully');
            break;
          case 'sentry':
            setSentryConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('Sentry disconnected successfully');
            break;
          case 'newrelic':
            setNewRelicConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('New Relic disconnected successfully');
            break;
          case 'datadog':
            setDataDogConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('DataDog disconnected successfully');
            break;
          case 'cloudwatch':
            setCloudWatchConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('CloudWatch disconnected successfully');
            break;
          case 'grafana':
            setGrafanaConnection({
              isConnected: false,
              id: 0,
            });
            toast.success('Grafana disconnected successfully');
            break;
        }
      } else {
        toast.error(
          `Failed to disconnect ${serviceId}: ${response.error || response.message || 'Unknown error'}`
        );
      }
    } catch {
      toast.error(`Failed to disconnect ${serviceId}. Please try again.`);
    }
  };

  return (
    <div className='space-y-8'>
      <div>
        <div className='mb-6'>
          <h1 className='mb-2 text-2xl font-bold'>Integrations</h1>
          <p className='text-muted-foreground'>
            Connect your favorite tools and services to enhance your workflow
          </p>
        </div>

        {/* All Integrations */}
        <div className='flex flex-wrap gap-4'>
          {SERVICES.toSorted((a, b) => {
            // Sort by coming soon status first (false comes before true)
            const aComingSoon = 'comingSoon' in a ? a.comingSoon : false;
            const bComingSoon = 'comingSoon' in b ? b.comingSoon : false;

            if (aComingSoon !== bComingSoon) {
              return aComingSoon ? 1 : -1;
            }

            // Then sort alphabetically by title
            return a.title.localeCompare(b.title);
          }).map(service => {
            const connectionStatus = getConnectionStatus(service.id);
            return (
              <ServiceTile
                key={service.id}
                icon={service.icon}
                title={service.title}
                isConnected={connectionStatus.isConnected}
                description={
                  connectionStatus.isConnected
                    ? service.connectedDescription
                    : service.disconnectedDescription
                }
                onClick={() => {
                  if ('comingSoon' in service && service.comingSoon) return;
                  if (service.type === 'oauth' && 'oauthProvider' in service) {
                    handleOAuthClick(service.oauthProvider);
                  } else if (service.type === 'token') {
                    handleTokenClick(service.id);
                  }
                }}
                onDisconnect={() => handleDisconnect(service.id)}
                disabled={'comingSoon' in service && service.comingSoon}
              />
            );
          })}
        </div>
      </div>

      <GitHubModal open={showGitHubModal} onOpenChange={setShowGitHubModal} />
      <FigmaModal open={showFigmaModal} onOpenChange={setShowFigmaModal} />
      <PagerDutyModal
        open={showPagerDutyModal}
        onOpenChange={setShowPagerDutyModal}
      />
      <SentryModal open={showSentryModal} onOpenChange={setShowSentryModal} />
      <NewRelicModal
        open={showNewRelicModal}
        onOpenChange={setShowNewRelicModal}
      />
      <DataDogModal
        open={showDataDogModal}
        onOpenChange={setShowDataDogModal}
      />
      <CloudWatchModal
        open={showCloudWatchModal}
        onOpenChange={setShowCloudWatchModal}
      />
      <GrafanaModal
        open={showGrafanaModal}
        onOpenChange={setShowGrafanaModal}
      />
    </div>
  );
}
