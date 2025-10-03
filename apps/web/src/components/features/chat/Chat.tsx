'use client';

import { useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Square, Sparkles } from 'lucide-react';
import { ChatbotIcon, JiraIcon } from '@/components/icons';
import { useChat } from '@ai-sdk/react';
import {
  AnalysisLoader,
  ChatMessage,
  TestCaseViewer,
} from '@/components/features/chat';
import { CodeReviewReport } from '@/components/features/chat/CodeReviewReport';
import { Textarea } from '@/components/ui/textarea';
import { API_BASE_URL } from '@/lib/api/api';
import React from 'react';
import CreatedFilesAccordion from '@/components/features/chat/CreatedFilesAccordion';
import {
  NotionIcon,
  ConfluenceIcon,
  GitIcon,
  MagicWandIcon,
  FigmaIcon,
  PagerDutyIcon,
  NewRelicIcon,
  DataDogIcon,
  SentryIcon,
  GrafanaIcon,
  FileIcon,
} from '@/components/icons';
import { ReportHeader } from '@/components/features/chat/ReportHeader';
import KnowledgeGraph from '@/components/shared/KnowledgeGraph';
import { useUser } from '@/hooks/useUser';
import { useProject } from '@/hooks/useProject';
import { RCAAgent } from '@/components/features/chat/Development/RCAAgent';
import { RequirementsTable } from '@/components/features/product-management/RequirementsTable';
import { ApiTestingReport } from '../api-testing/ApiTestingReport';

interface CreatedFile {
  path: string;
  content: string;
  timestamp: Date;
  type: string;
}

const MemoizedChatMessage = React.memo(ChatMessage);

interface ChatProps {
  sessionID: string;
  regenerate: () => void;
}

export default function Chat({ sessionID, regenerate }: ChatProps) {
  const { accessToken } = useUser();

  const {
    analysisType,
    aiEngine,
    agentType,
    gitHubRepos,
    prdnotion,
    prdconfluence,
    prdjira,
    prdfiles,
    docsnotion,
    docsconfluence,
    docsfigma,
    docsjira,
    apiSpecs,
    incidentjira,
    incidentpagerduty,
    incidentsentry,
    incidentnewrelic,
    incidentdatadog,
    loggingdatadog,
    logginggrafana,
    docsfiles,
  } = useProject();

  const firstRender = useRef(true);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    error,
    append,
    data,
  } = useChat({
    api: `${API_BASE_URL}/agents/${agentType}/run?session_id=${sessionID}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStreaming = status === 'streaming';
  const isDisabled = status === 'streaming' || status === 'submitted';

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-send first message
  useEffect(() => {
    if (messages.length === 0 && firstRender.current) {
      firstRender.current = false;
      append({ role: 'user', content: 'Start Analysing' });
    }
  }, [messages.length, append]);

  // Extract created files efficiently
  const createdFiles = useMemo(() => {
    const fileMap = new Map<string, CreatedFile>();

    messages.forEach(message => {
      if (message.role === 'assistant' && (message as any).parts) {
        (message as any).parts.forEach((part: any) => {
          if (
            part.type === 'tool-invocation' &&
            part.toolInvocation?.state === 'result'
          ) {
            const { toolName, args } = part.toolInvocation;
            if (
              ['write_file', 'create_file', 'edit_file'].includes(toolName) &&
              (args?.target_file || args?.file_path)
            ) {
              const filePath = args.target_file || args.file_path || 'untitled';
              const content = args.code_edit || args.content || '';
              const fileExtension = filePath.split('.').pop() || 'txt';

              const newFile: CreatedFile = {
                path: filePath,
                content,
                timestamp: new Date(),
                type: fileExtension,
              };

              // Only update if this is a newer version or the file doesn't exist
              const existingFile = fileMap.get(filePath);
              if (!existingFile || newFile.timestamp > existingFile.timestamp) {
                fileMap.set(filePath, newFile);
              }
            }
          }
        });
      }
    });

    // Convert map to array and sort by timestamp (newest first)
    return Array.from(fileMap.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }, [messages]);

  // Stable callbacks
  const handleFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !isDisabled) handleSubmit(e);
    },
    [input, isDisabled, handleSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleFormSubmit(e as any);
      }
    },
    [handleFormSubmit]
  );

  console.log('stream', data);

  // Dynamic chat panel info based on agent type and identifier
  const getChatPanelInfo = () => {
    if (agentType === 'code_analysis') {
      return {
        title: 'Code Understanding Agent',
        description: 'Ask questions about your codebase analysis',
      };
    } else if (agentType === 'test_case_generation') {
      return {
        title: 'Test Generation Agent',
        description: 'Ask questions about your test case generation',
      };
    } else if (agentType === 'requirements_to_tickets') {
      return {
        title: 'Requirements Agent',
        description: 'Ask questions about your requirements breakdown',
      };
    } else if (agentType === 'code_reviewer') {
      return {
        title: 'Code Reviewer Agent',
        description: 'Ask questions about your code review analysis',
      };
    } else if (agentType === 'api_testing_suite') {
      return {
        title: 'API Testing Suite Agent',
        description: 'Ask questions about your API testing analysis',
      };
    } else if (agentType === 'root_cause_analysis') {
      return {
        title: 'Root Cause Analysis Agent',
        description: 'Ask questions about your root cause analysis',
      };
    } else {
      return {
        title: 'SDLC Agents',
        description: 'Ask questions about your analysis',
      };
    }
  };

  const chatPanelInfo = getChatPanelInfo();

  const renderData = () => {
    if (agentType === 'test_case_generation') {
      if (data && data.length > 0) {
        return (
          <>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              onRegenerate={regenerate}
              createdFiles={createdFiles}
              agentType={agentType}
              usedServices={{
                jira: prdjira.selectedTickets.length > 0,
                confluence:
                  prdconfluence.selectedPages.length > 0 ||
                  docsconfluence.selectedPages.length > 0,
                notion:
                  prdnotion.selectedPages.length > 0 ||
                  docsnotion.selectedPages.length > 0,
                files: prdfiles.files.length > 0 || docsfiles.files.length > 0,
              }}
              data={data?.filter(Boolean) as any}
            />
            <TestCaseViewer
              data={data?.filter(Boolean) as any}
              append={append}
            />
          </>
        );
      } else {
        return (
          <AnalysisLoader
            repositories={gitHubRepos.repositories}
            selectedPR={gitHubRepos.selectedPR}
            notionPages={[...prdnotion.pages, ...docsnotion.pages]}
            confluencePages={[...prdconfluence.pages, ...docsconfluence.pages]}
            figmaPages={[...docsfigma.files]}
            jiraTickets={prdjira.tickets}
            uploadedFiles={[...prdfiles.files, ...docsfiles.files]}
            isComplete={!isStreaming}
          />
        );
      }
    } else if (agentType === 'requirements_to_tickets') {
      if (data && data.length > 0) {
        return (
          <div className='flex h-full flex-col'>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              onRegenerate={regenerate}
              createdFiles={createdFiles}
              agentType={agentType}
              usedServices={{
                jira: prdjira.selectedTickets.length > 0,
                confluence:
                  prdconfluence.selectedPages.length > 0 ||
                  docsconfluence.selectedPages.length > 0,
                notion:
                  prdnotion.selectedPages.length > 0 ||
                  docsnotion.selectedPages.length > 0,
                files: prdfiles.files.length > 0 || docsfiles.files.length > 0,
              }}
              data={data?.filter(Boolean) as any}
              append={append}
            />

            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='min-h-0 flex-1'>
                <RequirementsTable
                  data={data?.filter(Boolean) as any}
                  append={append}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <AnalysisLoader
            repositories={gitHubRepos.repositories}
            selectedPR={gitHubRepos.selectedPR}
            notionPages={[...prdnotion.pages, ...docsnotion.pages]}
            confluencePages={[...prdconfluence.pages, ...docsconfluence.pages]}
            figmaPages={[...docsfigma.files]}
            jiraTickets={prdjira.tickets}
            uploadedFiles={[...prdfiles.files, ...docsfiles.files]}
            isComplete={!isStreaming}
          />
        );
      }
    } else if (agentType === 'root_cause_analysis') {
      if (data && data.length > 0) {
        return (
          <div className='flex h-full flex-col'>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              onRegenerate={regenerate}
              agentType={agentType}
              usedServices={{
                jira: !!incidentjira.incident,
                confluence: docsconfluence.selectedPages.length > 0,
                notion: docsnotion.selectedPages.length > 0,
                pagerduty: !!incidentpagerduty.incident,
                newrelic: !!incidentnewrelic.incident,
                datadog:
                  !!incidentdatadog.incident || loggingdatadog.logs.length > 0,
                sentry: !!incidentsentry.incident,
                grafana: logginggrafana.logs.length > 0,
              }}
              data={data?.filter(Boolean) as any}
              append={append}
            />

            <div className='flex min-h-0 flex-1 flex-col'>
              <div className='min-h-0 flex-1'>
                <RCAAgent
                  data={data?.filter(Boolean) as any}
                  append={append}
                  isStreaming={isStreaming}
                />
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <AnalysisLoader
            repositories={gitHubRepos.repositories}
            notionPages={[...prdnotion.pages, ...docsnotion.pages]}
            confluencePages={[...prdconfluence.pages, ...docsconfluence.pages]}
            figmaPages={[...docsfigma.files]}
            jiraTickets={prdjira.tickets}
            jiraIncident={incidentjira.incident}
            pagerduty={incidentpagerduty.incident || undefined}
            newrelic={{
              incident: incidentnewrelic.incident,
              hasData: !!incidentnewrelic.incident,
            }}
            datadog={{
              incident: incidentdatadog.incident,
              logs: loggingdatadog.logs,
              hasData:
                !!incidentdatadog.incident || loggingdatadog.logs.length > 0,
            }}
            sentry={{
              incident: incidentsentry.incident,
              hasData: !!incidentsentry.incident,
            }}
            grafana={logginggrafana.logs}
            isComplete={!isStreaming}
          />
        );
      }
    } else if (agentType === 'code_analysis') {
      // For Code Understanding Agent only
      if (createdFiles.length > 0) {
        return (
          <>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              onRegenerate={regenerate}
              createdFiles={createdFiles}
              agentType={agentType}
              usedServices={{
                jira: prdjira.selectedTickets.length > 0,
                confluence:
                  prdconfluence.selectedPages.length > 0 ||
                  docsconfluence.selectedPages.length > 0,
                notion:
                  prdnotion.selectedPages.length > 0 ||
                  docsnotion.selectedPages.length > 0,
                files: prdfiles.files.length > 0 || docsfiles.files.length > 0,
              }}
              data={data?.filter(Boolean) as any}
            />
            <CreatedFilesAccordion createdFiles={createdFiles} />
          </>
        );
      } else {
        return <KnowledgeGraph />;
      }
    } else if (agentType === 'code_reviewer') {
      if (data && data.length > 0) {
        return (
          <>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              selectedPR={gitHubRepos.selectedPR}
              onRegenerate={regenerate}
              createdFiles={createdFiles}
              agentType={agentType}
              usedServices={{
                jira: prdjira.selectedTickets.length > 0,
                confluence:
                  prdconfluence.selectedPages.length > 0 ||
                  docsconfluence.selectedPages.length > 0,
                notion:
                  prdnotion.selectedPages.length > 0 ||
                  docsnotion.selectedPages.length > 0,
                files: prdfiles.files.length > 0 || docsfiles.files.length > 0,
              }}
              data={data?.filter(Boolean) as any}
              append={append}
            />
            <CodeReviewReport
              data={data?.filter(Boolean) as any}
              append={append}
            />
          </>
        );
      } else {
        return (
          <AnalysisLoader
            repositories={gitHubRepos.repositories}
            selectedPR={gitHubRepos.selectedPR}
            notionPages={[...prdnotion.pages, ...docsnotion.pages]}
            confluencePages={[...prdconfluence.pages, ...docsconfluence.pages]}
            figmaPages={[...docsfigma.files]}
            jiraTickets={prdjira.tickets}
            uploadedFiles={[...prdfiles.files, ...docsfiles.files]}
            isComplete={!isStreaming}
          />
        );
      }
    } else if (agentType === 'api_testing_suite') {
      if (data && data.length > 0) {
        return (
          <div className='h-full overflow-y-auto'>
            <ReportHeader
              analysisScope={analysisType}
              selectedEngine={aiEngine}
              repositories={gitHubRepos.repositories}
              onRegenerate={regenerate}
              createdFiles={createdFiles}
              agentType={agentType}
              usedServices={{
                jira: docsjira.selectedTickets.length > 0,
                confluence: docsconfluence.selectedPages.length > 0,
                notion: docsnotion.selectedPages.length > 0,
              }}
              data={data?.filter(Boolean) as any}
            />
            <ApiTestingReport
              data={(data?.filter(Boolean) as any[]) || []}
              append={append}
            />
          </div>
        );
      } else {
        return (
          <AnalysisLoader
            repositories={gitHubRepos.repositories}
            selectedPR={gitHubRepos.selectedPR}
            notionPages={docsnotion.pages}
            confluencePages={docsconfluence.pages}
            figmaPages={docsfigma.files}
            jiraTickets={docsjira.tickets}
            uploadedFiles={docsfiles.files}
            apiSpecs={apiSpecs.specs}
            isComplete={!isStreaming}
          />
        );
      }
    } else {
      return (
        <AnalysisLoader
          repositories={gitHubRepos.repositories}
          notionPages={[...prdnotion.pages, ...docsnotion.pages]}
          confluencePages={[...prdconfluence.pages, ...docsconfluence.pages]}
          figmaPages={[...docsfigma.files]}
          jiraTickets={prdjira.tickets}
          isComplete={!isStreaming}
        />
      );
    }
  };

  return (
    <div className='flex h-full max-h-screen flex-col'>
      {/* Main Content */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left Panel - Files/Loader */}
        <div className='mr-4 flex w-2/3 flex-col'>{renderData()}</div>

        {/* Right Panel - Chat */}
        <div className='flex w-1/3 flex-col rounded-xl border-1 bg-white'>
          {/* Chat Header */}
          <div className='flex items-center justify-between border-b px-4 py-3'>
            <div className='flex items-center gap-2'>
              <div className='rounded-full border border-gray-200 p-2'>
                <ChatbotIcon className='h-4 w-4' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  {chatPanelInfo.title}
                </h3>
                <p className='text-sm text-gray-500'>
                  {chatPanelInfo.description}
                </p>
              </div>
            </div>
          </div>
          {/* Analysis Context */}

          <div className='border-b px-4 py-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Analysis Context
                </h3>
              </div>
            </div>
            <div className='mt-2 flex flex-wrap items-center gap-2'>
              {gitHubRepos.repositories.filter(repo => repo.selected).length >
                0 && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <GitIcon className='h-4 w-4' />
                  &nbsp; Repositories:{' '}
                  {
                    gitHubRepos.repositories.filter(repo => repo.selected)
                      .length
                  }
                </Badge>
              )}
              {(prdnotion.selectedPages.length > 0 ||
                docsnotion.selectedPages.length > 0) && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <NotionIcon className='h-4 w-4' />
                  &nbsp; pages:{' '}
                  {prdnotion.selectedPages.length +
                    docsnotion.selectedPages.length}
                </Badge>
              )}
              {(prdconfluence.selectedPages.length > 0 ||
                docsconfluence.selectedPages.length > 0) && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <ConfluenceIcon className='h-4 w-4' />
                  &nbsp; pages:{' '}
                  {prdconfluence.selectedPages.length +
                    docsconfluence.selectedPages.length}
                </Badge>
              )}
              {prdjira.selectedTickets.length > 0 && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <JiraIcon className='h-4 w-4' />
                  &nbsp; tickets: {prdjira.selectedTickets.length}
                </Badge>
              )}
              {docsfigma.files.length > 0 && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <FigmaIcon className='h-4 w-4' />
                  &nbsp; files: {docsfigma.files.length}
                </Badge>
              )}
              {incidentjira.incident && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <JiraIcon className='h-4 w-4' />
                  &nbsp;Jira (Incident)
                </Badge>
              )}
              {incidentpagerduty.incident && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <PagerDutyIcon className='h-4 w-4' />
                  &nbsp; PagerDuty (Incident)
                </Badge>
              )}
              {incidentnewrelic.incident && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <NewRelicIcon className='h-4 w-4' />
                  &nbsp; New Relic (Incident)
                </Badge>
              )}
              {(incidentdatadog.incident || loggingdatadog.logs.length > 0) && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <DataDogIcon className='h-4 w-4' />
                  &nbsp; DataDog{' '}
                  {incidentdatadog.incident && loggingdatadog.logs.length > 0
                    ? '(Incident & Logs)'
                    : incidentdatadog.incident
                      ? '(Incident)'
                      : '(Logs)'}
                </Badge>
              )}
              {incidentsentry.incident && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <SentryIcon className='h-4 w-4' />
                  &nbsp; Sentry (Incident)
                </Badge>
              )}
              {logginggrafana.logs.length > 0 && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <GrafanaIcon className='h-4 w-4' />
                  &nbsp; Grafana (Logs)
                </Badge>
              )}

              {(prdfiles.files.length > 0 || docsfiles.files.length > 0) && (
                <Badge variant='secondary' className='text-xs font-normal'>
                  <FileIcon className='h-4 w-4' />
                  &nbsp; files: {prdfiles.files.length + docsfiles.files.length}
                </Badge>
              )}
              <Badge variant='secondary' className='text-xs font-normal'>
                <MagicWandIcon className='h-4 w-4 text-[#11054C]' />
                &nbsp; Scope: {analysisType}
              </Badge>
              <Badge variant='secondary' className='text-xs font-normal'>
                <Sparkles className='h-4 w-4 text-[#11054C]' />
                &nbsp; AI Engine: {aiEngine}
              </Badge>
            </div>
          </div>

          {/* Messages */}
          <div className='flex-1 space-y-4 overflow-y-auto p-4'>
            {messages.length === 0 ? (
              <div className='flex h-full items-center justify-center'>
                <div className='space-y-2 text-center'>
                  <h3 className='text-lg font-medium text-stone-600'>
                    Analysis Chat
                  </h3>
                  <p className='text-sm text-stone-500'>
                    Watch as the AI analyzes your repositories
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-4'>
                {messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={message.id}
                    message={message}
                    index={index}
                    totalMessages={messages.length}
                    isStreaming={isStreaming}
                  />
                ))}
              </div>
            )}
            {error && (
              <div className='rounded-lg border border-red-200 bg-red-50 p-4'>
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-red-800'>
                    Error occurred
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={regenerate}
                    className='border-red-300 text-red-700 hover:bg-red-100'
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className='p-3'>
            <form onSubmit={handleFormSubmit}>
              <div className='relative flex items-end rounded-lg border border-gray-300 bg-white p-2 pr-10'>
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder='Ask anything about analysis or request clarification'
                  disabled={isDisabled}
                  className='flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm placeholder-gray-400 focus:border-transparent focus:ring-0 focus:outline-none disabled:opacity-50'
                  style={{ minHeight: '36px', overflowY: 'auto' }}
                  autoFocus
                />
                {isStreaming ? (
                  <button
                    type='button'
                    onClick={stop}
                    className='absolute right-2 bottom-2 cursor-pointer p-1.5 text-gray-600 hover:text-gray-900'
                  >
                    <div className='flex items-center gap-2 rounded-full bg-gray-100 p-2'>
                      <Square className='h-3 w-3' />
                    </div>
                  </button>
                ) : (
                  <button
                    type='submit'
                    disabled={isDisabled || !input.trim()}
                    className='absolute right-0 bottom-2 cursor-pointer p-1.5 text-blue-600 hover:text-blue-700 disabled:text-gray-300'
                  >
                    <div className='flex items-center gap-2 rounded-full bg-gray-100 p-2'>
                      <Send className='h-3 w-3' />
                    </div>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
