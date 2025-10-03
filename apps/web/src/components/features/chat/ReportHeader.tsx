'use client';

import { useMemo, useState } from 'react';
import { Copy, RotateCcw, Check, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClaudeIcon,
  JiraIcon,
  ConfluenceIcon,
  NotionIcon,
  GitIcon,
  PagerDutyIcon,
  NewRelicIcon,
  DataDogIcon,
  SentryIcon,
  GrafanaIcon,
  FileIcon,
} from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  exportAllTestCasesAsZip,
  copyAllTestCasesAsJSON,
} from '@/lib/utils/test-case-export';
import { formatApiTestingData } from '@/lib/utils/api-testing-formatter';
import { PublishJiraModal } from '../product-management/publish-jira-modal';
import {
  copyRequirementsToClipboard,
  formatRequirementsData,
  getRequirementsCount,
} from '@/lib/utils/requirements-formatter';
import { useOAuth } from '@/hooks/useOAuth';
import { toast } from 'sonner';

interface ReportHeaderProps {
  analysisScope?: string;
  selectedEngine?: string;
  repositories?: Array<{
    id: string;
    fullName: string;
    selected: boolean;
  }>;
  selectedPR?: {
    html_url: string;
  } | null;
  onRegenerate?: () => void;
  createdFiles?: Array<{
    path: string;
    content: string;
  }>;
  agentType?: string;
  data?: any;
  usedServices?: {
    jira?: boolean;
    confluence?: boolean;
    notion?: boolean;
    pagerduty?: boolean;
    newrelic?: boolean;
    datadog?: boolean;
    sentry?: boolean;
    grafana?: boolean;
    github?: boolean;
    files?: boolean;
  };
  append?: (message: any) => void;
}

interface AgentConfig {
  showEngine: boolean;
  showAnalysisScope: boolean;
  showRepositories: boolean;
  showRegenerate: boolean;
  showCopy: boolean;
  showExport: boolean;
  downloadFilePrefix: string;
  showRequirementsCount: boolean;
  showExportActions: boolean; //default value of this is true
}

// Agent type configurations
const agentConfigs: Record<string, AgentConfig> = {
  test_case_generation: {
    showEngine: true,
    showAnalysisScope: false,
    showRequirementsCount: false,
    showRepositories: false,
    showRegenerate: true,
    showCopy: true,
    showExport: true,
    downloadFilePrefix: 'test-cases',
    showExportActions: true,
  },
  code_analysis: {
    showEngine: true,
    showAnalysisScope: true,
    showRequirementsCount: false,
    showRepositories: true,
    showRegenerate: true,
    showCopy: true,
    showExport: true,
    downloadFilePrefix: 'code-analysis',
    showExportActions: true,
  },
  code_reviewer: {
    showEngine: true,
    showAnalysisScope: true,
    showRequirementsCount: false,
    showRepositories: true,
    showRegenerate: true,
    showCopy: false,
    showExport: false,
    downloadFilePrefix: 'code-review',
    showExportActions: true,
  },
  requirements_to_tickets: {
    showEngine: true,
    showAnalysisScope: false,
    showRequirementsCount: true,
    showRepositories: false,
    showRegenerate: true,
    showCopy: true,
    showExport: true,
    downloadFilePrefix: 'requirements',
    showExportActions: true,
  },
  api_testing_suite: {
    showEngine: true,
    showAnalysisScope: false,
    showRequirementsCount: false,
    showRepositories: false,
    showRegenerate: true,
    showCopy: true,
    showExport: false,
    downloadFilePrefix: 'api-test-suite',
    showExportActions: false,
  },
  root_cause_analysis: {
    showEngine: true,
    showAnalysisScope: true,
    showRequirementsCount: false,
    showRepositories: true,
    showRegenerate: true,
    showCopy: false,
    showExport: false,
    downloadFilePrefix: 'root-cause-analysis',
    showExportActions: false,
  },
};

export function ReportHeader({
  analysisScope = '',
  selectedEngine = 'claude-4-sonnet',
  repositories = [],
  selectedPR,
  onRegenerate,
  createdFiles = [],
  agentType = '',
  data = [],
  usedServices = {},
  append,
}: ReportHeaderProps) {
  const { atlassianMCPConnection } = useOAuth();
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [showPublishJiraModal, setShowPublishJiraModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedRepos = repositories.filter(repo => repo.selected);

  const requirementsCount = useMemo(() => {
    return agentType === 'requirements_to_tickets'
      ? getRequirementsCount(formatRequirementsData(data) ?? [])
      : ({} as { epics: number; stories: number; tasks: number });
  }, [data, agentType]);

  // Get config for current agent type
  const config =
    agentConfigs[agentType as keyof typeof agentConfigs] ||
    agentConfigs.code_analysis;

  const currentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  // Utility function to extract repository name from GitHub PR URL
  const getRepositoryNameFromPRUrl = (prUrl: string): string | null => {
    try {
      const match = prUrl.match(/github\.com\/([^\/]+\/[^\/]+)\/pull\/\d+/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const getEngineIcon = () => {
    if (selectedEngine.includes('claude')) {
      return <ClaudeIcon className='h-4 w-4' />;
    }
    // Add other engine icons as needed
    return <span className='h-4 w-4 rounded-full bg-blue-500' />;
  };

  const getReportTitle = (agentType: string) => {
    switch (agentType) {
      case 'test_case_generation':
        return 'Test Case Generated';
      case 'code_analysis':
        return 'Code Understanding Report';
      case 'code_reviewer':
        return 'Code Review Report';
      case 'bug_fix':
        return 'Bug Fix Report';
      case 'feature_development':
        return 'Feature Development Report';
      case 'requirements_to_tickets':
        return 'Requirement Breakdown';
      default:
        return 'Analysis Report';
    }
  };

  const handleCopy = () => {
    switch (agentType) {
      case 'test_case_generation':
        if (data) {
          copyAllTestCasesAsJSON(data);
        }
        break;

      case 'code_analysis':
        if (createdFiles && createdFiles.length > 0) {
          const contentToCopy = createdFiles
            .map(f => `// File: ${f.path}\n\n${f.content}`)
            .join(`\n\n-----\n\n`);
          navigator.clipboard.writeText(contentToCopy);
        }
        break;
      case 'requirements_to_tickets':
        if (data) {
          copyRequirementsToClipboard(formatRequirementsData(data) ?? []);
        }
        break;
      case 'api_testing_suite':
        if (data) {
          const formattedData = formatApiTestingData(data);
          const jsonContent = JSON.stringify(formattedData, null, 2);
          navigator.clipboard.writeText(jsonContent);
        }
        break;
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadAllFiles = async () => {
    try {
      if (agentType === 'test_case_generation' && data) {
        await exportAllTestCasesAsZip(data);
      } else if (agentType === 'code_analysis' && createdFiles) {
        createdFiles.forEach(file => {
          try {
            const blob = new Blob([file.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.path.split('/').pop() || 'file.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          } catch {
            toast.error('Error downloading file');
          }
        });
      } else if (agentType === 'requirements_to_tickets' && data) {
        // Export requirements as JSON file
        const requirementsData = formatRequirementsData(data);
        if (requirementsData) {
          const blob = new Blob([JSON.stringify(requirementsData, null, 2)], {
            type: 'application/json',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `requirements-breakdown-${currentDate.replace(/\//g, '-')}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } else {
        toast.error('No data available to export');
      }
    } catch (error) {
      toast.error('Error exporting data');
      console.error('Export error:', error);
    }
  };

  const handlePublishToJira = () => {
    setShowPublishJiraModal(true);
  };

  const handlePublishToGitHub = () => {
    if (append) {
      // Send in the exact format specified
      const content = `Publish Pending Review`;
      append({
        role: 'user',
        content: content,
      });
    }
  };

  return (
    <div
      className='mb-4 rounded-xl border border-gray-200 px-6 py-4'
      style={{
        background:
          'linear-gradient(90deg, rgba(219, 219, 219, 0.14) 0%, rgba(40, 12, 178, 0.084) 51.44%, rgba(222, 76, 54, 0.14) 100%)',
      }}
    >
      <div className='flex items-center justify-between'>
        {/* Left side - Report title and details */}
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>
              {getReportTitle(agentType)}
            </h1>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className='flex items-center gap-2'>
          {config.showCopy && (
            <Button
              variant='outline'
              size='sm'
              className={`flex items-center gap-2 ${
                copied
                  ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-50'
                  : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              onClick={handleCopy}
              aria-live='polite'
              title='Copy'
            >
              {copied ? (
                <>
                  <Check className='h-4 w-4' />
                  <span className='hidden sm:inline'>Copied!</span>
                </>
              ) : (
                <Copy className='h-4 w-4' />
              )}
            </Button>
          )}
          {config.showExport && (
            <Button
              variant='outline'
              size='sm'
              className='flex items-center gap-2 border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              onClick={handleDownloadAllFiles}
              title='Export Files'
            >
              <Download className='h-4 w-4' />
              <span className='hidden sm:inline'>Export</span>
            </Button>
          )}
          {(config.showExport ||
            agentType === 'code_reviewer' ||
            agentType === 'requirements_to_tickets') && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2 border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  aria-label='Export options'
                >
                  <Download className='h-4 w-4' />
                  <span className='hidden sm:inline'>Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {agentType === 'code_reviewer' && (
                  <DropdownMenuItem onClick={handlePublishToGitHub}>
                    <GitIcon className='mr-2 h-4 w-4' />
                    Publish to GitHub
                  </DropdownMenuItem>
                )}
                {agentType === 'requirements_to_tickets' && (
                  <DropdownMenuItem
                    onClick={handlePublishToJira}
                    disabled={!atlassianMCPConnection?.isConnected}
                  >
                    <JiraIcon className='mr-2 h-4 w-4' />
                    Publish to Jira
                  </DropdownMenuItem>
                )}
                {config.showExport && (
                  <DropdownMenuItem onClick={handleDownloadAllFiles}>
                    <Download className='mr-2 h-4 w-4' />
                    Download Files
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {config.showRegenerate && (
            <Button
              variant='outline'
              size='sm'
              className='flex items-center gap-2 border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              onClick={onRegenerate}
            >
              <RotateCcw className='h-4 w-4' />
              <span className='hidden sm:inline'>Re-generate</span>
            </Button>
          )}
        </div>
      </div>

      {/* Second row - Model and Analysis details */}
      {(config.showEngine ||
        config.showAnalysisScope ||
        config.showRequirementsCount) && (
        <div className='mt-4 flex items-center justify-between'>
          <div className='flex items-center gap-6'>
            {/* Engine and Analysis Type */}
            <div className='flex items-center gap-2'>
              {config.showEngine && (
                <Badge variant='secondary' className='text-xs'>
                  <div className='flex items-center gap-2'>
                    {getEngineIcon()}
                    {selectedEngine
                      .replace('-', ' ')
                      .replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </Badge>
              )}
              {config.showAnalysisScope && analysisScope && (
                <Badge variant='secondary' className='text-xs'>
                  {analysisScope.charAt(0).toUpperCase() +
                    analysisScope.slice(1)}{' '}
                  Analysis
                </Badge>
              )}
              {config.showRequirementsCount && (
                <Badge variant='secondary' className='text-xs'>
                  Epics(
                  <span className='text-[#4a20f5]'>
                    {requirementsCount.epics}
                  </span>
                  ), Stories(
                  <span className='text-[#4a20f5]'>
                    {requirementsCount.stories}
                  </span>
                  ) & Tasks(
                  <span className='text-[#4a20f5]'>
                    {requirementsCount.tasks}
                  </span>
                  )
                </Badge>
              )}
            </div>
          </div>
          {/* Show timestamp here if no services and no repos */}
          {!config.showRepositories &&
            !usedServices.jira &&
            !usedServices.confluence &&
            !usedServices.notion &&
            !usedServices.pagerduty &&
            !usedServices.newrelic &&
            !usedServices.datadog &&
            !usedServices.sentry &&
            !usedServices.grafana &&
            !usedServices.files && (
              <div className='flex flex-col text-right'>
                <div className='text-sm font-medium text-gray-700'>
                  Generated
                </div>
                <div className='text-sm text-gray-600'>
                  {currentDate}, {currentTime}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Data Sources row - All Services */}
      {(usedServices.jira ||
        usedServices.confluence ||
        usedServices.notion ||
        usedServices.pagerduty ||
        usedServices.newrelic ||
        usedServices.datadog ||
        usedServices.sentry ||
        usedServices.grafana ||
        usedServices.files) && (
        <div className='mt-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {usedServices.jira && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <JiraIcon className='h-3.5 w-3.5' />
                <span>Jira</span>
              </Badge>
            )}
            {usedServices.confluence && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <ConfluenceIcon className='h-3.5 w-3.5' />
                <span>Confluence</span>
              </Badge>
            )}
            {usedServices.notion && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <NotionIcon className='h-3.5 w-3.5' />
                <span>Notion</span>
              </Badge>
            )}
            {usedServices.pagerduty && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <PagerDutyIcon className='h-3.5 w-3.5' />
                <span>PagerDuty</span>
              </Badge>
            )}
            {usedServices.newrelic && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <NewRelicIcon className='h-3.5 w-3.5' />
                <span>New Relic</span>
              </Badge>
            )}
            {usedServices.datadog && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <DataDogIcon className='h-3.5 w-3.5' />
                <span>DataDog</span>
              </Badge>
            )}
            {usedServices.sentry && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <SentryIcon className='h-3.5 w-3.5' />
                <span>Sentry</span>
              </Badge>
            )}
            {usedServices.grafana && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <GrafanaIcon className='h-3.5 w-3.5' />
                <span>Grafana</span>
                <FileIcon className='h-3.5 w-3.5' />
                <span>Files</span>
              </Badge>
            )}
            {usedServices.files && (
              <Badge
                variant='secondary'
                className='flex items-center gap-1.5 text-xs'
              >
                <FileIcon className='h-3.5 w-3.5' />
                <span>Files</span>
              </Badge>
            )}
          </div>
          {/* Show timestamp here if no repos */}
          {(!config.showRepositories ||
            (agentType !== 'code_reviewer' && selectedRepos.length === 0) ||
            (agentType === 'code_reviewer' && !selectedPR?.html_url)) && (
            <div className='flex flex-col text-right'>
              <div className='text-sm font-medium text-gray-700'>Generated</div>
              <div className='text-sm text-gray-600'>
                {currentDate}, {currentTime}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Repositories row - Show selected repos or PR repository */}
      {config.showRepositories &&
        ((agentType === 'code_reviewer' && selectedPR?.html_url) ||
          (agentType !== 'code_reviewer' && selectedRepos.length > 0)) && (
          <div className='mt-4 flex items-center justify-between'>
            {/* Repository badges */}
            <div
              className={`flex items-center gap-2 ${showAllRepos ? 'flex-wrap' : ''}`}
            >
              {agentType === 'code_reviewer' && selectedPR?.html_url ? (
                // Show PR repository for code reviewer
                <Badge variant='secondary' className='gap-1.5 text-xs'>
                  <GitIcon className='h-3.5 w-3.5' />
                  {getRepositoryNameFromPRUrl(selectedPR.html_url) ||
                    'Unknown Repository'}
                </Badge>
              ) : (
                // Show selected repositories for other agents
                <>
                  {showAllRepos
                    ? selectedRepos.map(repo => (
                        <Badge
                          key={repo.id}
                          variant='secondary'
                          className='gap-1.5 text-xs'
                        >
                          <GitIcon className='h-3.5 w-3.5' />
                          {repo.fullName}
                        </Badge>
                      ))
                    : selectedRepos.slice(0, 2).map(repo => (
                        <Badge
                          key={repo.id}
                          variant='secondary'
                          className='gap-1.5 text-xs'
                        >
                          <GitIcon className='h-3.5 w-3.5' />
                          {repo.fullName}
                        </Badge>
                      ))}
                  {selectedRepos.length > 2 && !showAllRepos && (
                    <Badge
                      variant='secondary'
                      className='cursor-pointer text-xs hover:bg-gray-300'
                      onClick={() => setShowAllRepos(true)}
                    >
                      +{selectedRepos.length - 2} more
                    </Badge>
                  )}
                  {showAllRepos && selectedRepos.length > 2 && (
                    <Badge
                      variant='secondary'
                      className='cursor-pointer text-xs hover:bg-gray-300'
                      onClick={() => setShowAllRepos(false)}
                    >
                      Show less
                    </Badge>
                  )}
                </>
              )}
            </div>
            {/* Generated timestamp - only show here if repos are present */}
            <div className='flex flex-col text-right'>
              <div className='text-sm font-medium text-gray-700'>Generated</div>
              <div className='text-sm text-gray-600'>
                {currentDate}, {currentTime}
              </div>
            </div>
          </div>
        )}

      {/* Standalone timestamp if no other rows are shown */}
      {!config.showEngine &&
        !config.showAnalysisScope &&
        !usedServices.jira &&
        !usedServices.confluence &&
        !usedServices.notion &&
        !usedServices.pagerduty &&
        !usedServices.newrelic &&
        !usedServices.datadog &&
        !usedServices.sentry &&
        !usedServices.grafana &&
        !usedServices.files &&
        (!config.showRepositories || selectedRepos.length === 0) && (
          <div className='mt-4 flex justify-end'>
            <div className='flex flex-col text-right'>
              <div className='text-sm font-medium text-gray-700'>Generated</div>
              <div className='text-sm text-gray-600'>
                {currentDate}, {currentTime}
              </div>
            </div>
          </div>
        )}
      {showPublishJiraModal && (
        <PublishJiraModal
          open={showPublishJiraModal}
          onOpenChange={setShowPublishJiraModal}
          onPublish={(project: string, board: string, sprint?: string) => {
            append?.({
              role: 'user',
              content: `Publish to Jira for project: ${project}${board ? `, board: ${board}` : ''}${sprint ? ` and sprint: ${sprint}` : ''}`,
            });
          }}
        />
      )}
    </div>
  );
}
