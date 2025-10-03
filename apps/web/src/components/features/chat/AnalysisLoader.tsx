'use client';

import { useEffect, useState } from 'react';
import {
  NotionIcon,
  ConfluenceIcon,
  JiraIcon,
  FigmaIcon,
  GitIcon,
  PostmanIcon,
  SwaggerIcon,
  OpenApiIcon,
  ApiSpecIcon,
  PagerDutyIcon,
  NewRelicIcon,
  DataDogIcon,
  SentryIcon,
  GrafanaIcon,
  FileIcon,
} from '@/components/icons';

import type {
  AtlassianIssue,
  NotionPage,
  FigmaFile,
  AtlassianPage,
  IncidentService,
} from '@/types';

interface ServiceData {
  incident?: IncidentService | null;
  logs?: Array<any>;
  hasData: boolean;
}

interface AnalysisLoaderProps {
  repositories?: Array<{
    id: string;
    fullName: string;
    selected: boolean;
  }>;
  selectedPR?: {
    html_url: string;
  } | null;
  jiraTickets?: Array<AtlassianIssue>;
  jiraIncident?: IncidentService | null;
  notionPages?: Array<NotionPage>;
  confluencePages?: Array<AtlassianPage>;
  figmaPages?: Array<FigmaFile>;
  apiSpecs?: Array<{
    id: string;
    name: string;
    specType?: string;
  }>;
  pagerduty?: IncidentService | boolean;
  newrelic?: ServiceData;
  datadog?: ServiceData;
  sentry?: ServiceData;
  grafana?: Array<any> | boolean;
  uploadedFiles?: Array<{
    name: string;
    uploadedAt: string;
  }>;
  isComplete?: boolean;
}

export function AnalysisLoader({
  repositories = [],
  selectedPR = null,
  notionPages = [],
  confluencePages = [],
  figmaPages = [],
  jiraTickets = [],
  apiSpecs = [],
  jiraIncident,
  pagerduty,
  newrelic,
  datadog,
  sentry,
  grafana,
  uploadedFiles = [],
  isComplete = false,
}: AnalysisLoaderProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (!isComplete) {
      const interval = setInterval(() => {
        setRotation(prev => (prev + 1) % 360);
      }, 30); // Smoother rotation

      return () => clearInterval(interval);
    }
  }, [isComplete]);

  // Get selected repositories
  const selectedRepos = repositories.filter(repo => repo.selected).slice(0, 2);
  const selectedJiraTickets = jiraTickets.slice(0, 2);
  const selectedNotionPages = notionPages.slice(0, 2);
  const selectedConfluencePages = confluencePages.slice(0, 2);
  const selectedFigmaPages = figmaPages.slice(0, 2);

  // Calculate positions for items
  const items: Array<{
    content: React.ReactNode;
    label: string;
  }> = [];

  // Add selected repositories
  selectedRepos.forEach(repo => {
    items.push({
      content: <GitIcon className='h-5 w-5' />,
      label: repo.fullName.split('/')[1],
    });
  });

  // Add selected PR repository if available (for pasted PRs)
  if (selectedPR && selectedPR.html_url) {
    // Extract repository name from GitHub URL: https://github.com/owner/repo/pull/123
    const urlParts = selectedPR.html_url.split('/');
    const repositoryFullName = `${urlParts[3]}/${urlParts[4]}`;

    if (!selectedRepos.some(repo => repo.fullName === repositoryFullName)) {
      items.push({
        content: <GitIcon className='h-5 w-5' />,
        label: urlParts[4], // Just the repo name, not owner/repo
      });
    }
  }

  // Add Jira if connected and has links
  selectedJiraTickets.forEach(ticket => {
    items.push({
      content: <JiraIcon className='h-5 w-5' />,
      label: ticket.key,
    });
  });

  // Add Jira Incident if present
  if (jiraIncident) {
    items.push({
      content: <JiraIcon className='h-5 w-5' />,
      label: jiraIncident.title || 'Jira Incident',
    });
  }

  // Add Notion if connected and has links
  selectedNotionPages.forEach(page => {
    items.push({
      content: <NotionIcon className='h-5 w-5' />,
      label: page.properties?.title?.title?.[0]?.plain_text || 'Untitled',
    });
  });

  // Add Confluence if connected and has links
  selectedConfluencePages.forEach(page => {
    items.push({
      content: <ConfluenceIcon className='h-5 w-5' />,
      label: page.title,
    });
  });

  // Add Figma if connected and has links
  selectedFigmaPages.forEach(page => {
    items.push({
      content: <FigmaIcon className='h-5 w-5' />,
      label: page.name,
    });
  });

  apiSpecs.forEach(spec => {
    const getApiSpecIcon = (specType?: string) => {
      switch (specType?.toLowerCase()) {
        case 'swagger':
          return <SwaggerIcon className='h-5 w-5' />;
        case 'postman':
          return <PostmanIcon className='h-5 w-5' />;
        case 'openapi':
          return <OpenApiIcon className='h-5 w-5' />;
        default:
          return <ApiSpecIcon className='h-5 w-5' />;
      }
    };

    items.push({
      content: getApiSpecIcon(spec.specType),
      label: spec.name,
    });
  });

  // Add PagerDuty if has incident data
  if (pagerduty && typeof pagerduty === 'object' && 'title' in pagerduty) {
    items.push({
      content: <PagerDutyIcon className='h-5 w-5' />,
      label: pagerduty.title || 'PagerDuty',
    });
  }

  // Add New Relic if has data
  if (newrelic?.hasData) {
    const hasIncident = !!newrelic.incident;
    const hasLogs = newrelic.logs && newrelic.logs.length > 0;

    // Add incident item if present
    if (hasIncident) {
      items.push({
        content: <NewRelicIcon className='h-5 w-5' />,
        label: newrelic.incident?.title || 'New Relic Incident',
      });
    }

    // Add logs item if present
    if (hasLogs) {
      const logCount = newrelic.logs?.length || 0;
      const logLabel =
        logCount > 1 ? `New Relic Logs (${logCount})` : 'New Relic Logs';
      items.push({
        content: <NewRelicIcon className='h-5 w-5' />,
        label: logLabel,
      });
    }
  }

  // Add DataDog if has data
  if (datadog?.hasData) {
    const hasIncident = !!datadog.incident;
    const hasLogs = datadog.logs && datadog.logs.length > 0;

    // Add incident item if present
    if (hasIncident) {
      items.push({
        content: <DataDogIcon className='h-5 w-5' />,
        label: datadog.incident?.title || 'DataDog Incident',
      });
    }

    // Add logs item if present
    if (hasLogs) {
      const logCount = datadog.logs?.length || 0;
      const logLabel =
        logCount > 1 ? `DataDog Logs (${logCount})` : 'DataDog Logs';
      items.push({
        content: <DataDogIcon className='h-5 w-5' />,
        label: logLabel,
      });
    }
  }

  // Add Sentry if has data
  if (sentry?.hasData) {
    const hasIncident = !!sentry.incident;

    // Add incident item if present
    if (hasIncident) {
      items.push({
        content: <SentryIcon className='h-5 w-5' />,
        label: sentry.incident?.title || 'Sentry Incident',
      });
    }
  }

  // Add Grafana if has logs
  if (grafana && Array.isArray(grafana) && grafana.length > 0) {
    const logCount = grafana.length;
    const logLabel =
      logCount > 1 ? `Grafana Logs (${logCount})` : 'Grafana Logs';
    items.push({
      content: <GrafanaIcon className='h-5 w-5' />,
      label: logLabel,
    });
  }
  // Add uploaded files
  const selectedUploadedFiles = uploadedFiles.slice(0, 2);
  selectedUploadedFiles.forEach(file => {
    items.push({
      content: <FileIcon className='h-5 w-5' />,
      label: file.name,
    });
  });

  const totalItems = items.length;
  const angleStep = totalItems > 0 ? 360 / totalItems : 0;

  return (
    <div className='relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl'>
      {/* Background with light purple gradient */}
      <div
        className='absolute inset-0'
        style={{
          background:
            'linear-gradient(179.6deg, rgba(255, 171, 213, 0.14) 6.53%, rgba(30, 4, 162, 0.112) 57.79%, rgba(255, 69, 40, 0.14) 106.18%)',
        }}
      />

      {/* Subtle scan lines effect */}
      <div
        className='absolute inset-0 opacity-[0.05]'
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Container for rings and content */}
      <div className='relative h-96 w-96'>
        {/* Outer rings with gradient borders */}
        <div className='absolute inset-0 rounded-full border border-gray-700/30 opacity-70' />
        <div className='absolute inset-6 rounded-full border border-gray-600/25 opacity-60' />
        <div className='absolute inset-12 rounded-full border border-gray-500/20 opacity-50' />

        {/* Inner circle with content */}
        <div className='absolute inset-24 flex flex-col items-center justify-center rounded-full border border-gray-600/20'>
          {isComplete ? (
            <>
              <h3 className='text-2xl font-medium'>Analysis</h3>
              <p className='mt-1 text-xl'>Complete</p>
            </>
          ) : (
            <>
              <h3 className='text-2xl font-medium'>Analyzing</h3>
              <p className='mt-1 text-xl'>Results</p>
            </>
          )}
        </div>

        {/* Orbiting items */}
        {totalItems > 0 && (
          <div className='absolute inset-0'>
            {items.map((item, index) => {
              const angle = isComplete
                ? index * angleStep
                : (index * angleStep + rotation) % 360;
              const radius = 180;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <div
                  key={index}
                  className={`absolute top-1/2 left-1/2 ${isComplete ? 'transition-all duration-1000' : 'transition-transform duration-75'}`}
                  style={{
                    transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                  }}
                >
                  <div className='flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg shadow-white/10'>
                    {item.content}
                    <span className='max-w-[120px] truncate text-sm font-medium text-gray-700'>
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom helping text */}
      {isComplete && (
        <div className='absolute bottom-8 left-1/2 -translate-x-1/2 transform'>
          <p className='text-center text-sm text-gray-500'>
            Please refresh the chatbot to see the results.
          </p>
        </div>
      )}

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
