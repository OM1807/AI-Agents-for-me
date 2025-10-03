import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { sessionApi } from '@/lib/api/api';
import { useUser } from './useUser';
import { useProject } from './useProject';
import type {
  CreateSessionOptions,
  SupportedAgentType,
  SelectedNotionPage,
} from '@/types';
import { useOAuth } from './useOAuth';

export function useAgentSession() {
  const router = useRouter();
  const { accessToken } = useUser();
  const {
    projectName,
    analysisType,
    aiEngine,
    userPrompt,
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
    loggingdatadog,
    logginggrafana,
    loggingcloudwatch,
    incidentjira,
    incidentpagerduty,
    incidentsentry,
    incidentnewrelic,
    incidentdatadog,
    docsfiles,
    output_config_type,
    output_config_content,
    output,
    apiSpecs,
    apiFrameworks,
    testCases,
  } = useProject();
  const { atlassianMCPConnection, gitHubConnection } = useOAuth();

  const [isCreatingSession, setIsCreatingSession] = useState(false);

  // Build MCP agents list based on selected integrations
  const mcpAgents = useMemo(() => {
    const mcpAgentsSet = new Set<string>();

    // Check for Notion usage
    if (
      prdnotion.selectedPages.length > 0 ||
      docsnotion.selectedPages.length > 0
    ) {
      mcpAgentsSet.add('notion');
    }

    // Check for Confluence usage
    if (
      prdconfluence.selectedPages.length > 0 ||
      docsconfluence.selectedPages.length > 0
    ) {
      mcpAgentsSet.add('atlassian');
    }

    // Check for Jira usage
    if (
      prdjira.selectedTickets.length > 0 ||
      docsjira.selectedTickets.length > 0
    ) {
      mcpAgentsSet.add('atlassian');
    }

    // Check for Figma usage
    if (docsfigma.selectedFiles.length > 0) {
      mcpAgentsSet.add('figma');
    }

    // Check for GitHub usage
    if (gitHubRepos.selectedRepositories.length > 0 || gitHubRepos.selectedPR) {
      mcpAgentsSet.add('github');
    }

    // Check for Atlassian usage
    if (
      (agentType === 'requirements_to_tickets' ||
        agentType === 'root_cause_analysis') &&
      atlassianMCPConnection.isConnected
    ) {
      mcpAgentsSet.add('atlassian');
    }

    // Check for Playwright usage (API Testing Suite with Atlassian MCP connection)
    if (agentType === 'api_testing_suite') {
      mcpAgentsSet.add('playwright');
    }

    if (agentType === 'root_cause_analysis' && gitHubConnection.isConnected) {
      mcpAgentsSet.add('github');
    }

    // Check for PagerDuty usage
    if (incidentpagerduty.incident) {
      mcpAgentsSet.add('pagerduty');
    }

    // Check for Sentry usage
    if (incidentsentry.incident) {
      mcpAgentsSet.add('sentry');
    }

    // Check for New Relic usage
    if (incidentnewrelic.incident) {
      mcpAgentsSet.add('newrelic');
    }

    // Check for Datadog usage
    if (incidentdatadog.incident) {
      mcpAgentsSet.add('datadog');
    }

    return Array.from(mcpAgentsSet);
  }, [
    prdnotion.selectedPages,
    docsnotion.selectedPages,
    prdconfluence.selectedPages,
    docsconfluence.selectedPages,
    prdjira.selectedTickets,
    docsjira.selectedTickets,
    docsfigma.selectedFiles,
    gitHubRepos.selectedRepositories,
    agentType,
    atlassianMCPConnection,
    gitHubConnection,
    incidentpagerduty.incident,
    incidentsentry.incident,
    incidentnewrelic.incident,
    incidentdatadog.incident,
    gitHubRepos.selectedPR,
  ]);

  const buildSessionPayload = useMemo(() => {
    const buildPayload = (): any => {
      // Base structure - always included
      const payload: any = {
        project_name: projectName,
        mcps: mcpAgents,
        custom_properties: {
          custom_instructions: userPrompt,
          ai_engine: aiEngine,
        },
      };

      // Agent-specific payload building
      switch (agentType as SupportedAgentType) {
        case 'code_analysis':
          // Add analysis type for code analysis
          payload.custom_properties.analysis_type = analysisType;

          // Add GitHub repositories if selected
          if (gitHubRepos.selectedRepositories.length > 0) {
            payload.custom_properties.github_repos =
              gitHubRepos.selectedRepositories;
          }

          // Add documentation sources for code analysis
          const codeAnalysisDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            codeAnalysisDocs.push({
              provider: 'Notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            codeAnalysisDocs.push({
              provider: 'Confluence',
              ids: docsconfluence.selectedPages,
            });
          }
          if (docsfiles.files.length > 0) {
            codeAnalysisDocs.push({
              provider: 'Files',
              files: docsfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }
          if (codeAnalysisDocs.length > 0) {
            payload.custom_properties.docs = codeAnalysisDocs;
          }
          break;

        case 'code_reviewer':
          // Code Reviewer Agent - use analysis_level and inputs structure
          payload.custom_properties.analysis_level = analysisType || 'basic';

          // Add selected PR data as inputs
          const codeReviewInputs = [];
          if (gitHubRepos.selectedPR) {
            codeReviewInputs.push({
              provider: 'github',
              type: 'pr',
              urls: [gitHubRepos.selectedPR.html_url],
            });
          }

          if (codeReviewInputs.length > 0) {
            payload.custom_properties.inputs = codeReviewInputs;
          }

          // Add documentation sources for code reviewer
          const codeReviewDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            codeReviewDocs.push({
              provider: 'Notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            codeReviewDocs.push({
              provider: 'Confluence',
              ids: docsconfluence.selectedPages,
            });
          }
          if (docsfiles.files.length > 0) {
            codeReviewDocs.push({
              provider: 'Files',
              files: docsfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }
          if (codeReviewDocs.length > 0) {
            payload.custom_properties.docs = codeReviewDocs;
          }

          break;

        case 'test_case_generation':
          // For test case generation, use individual input objects
          const testGenInputs = [];

          if (prdnotion.selectedPages.length > 0) {
            testGenInputs.push(
              ...prdnotion.selectedPages.map((page: SelectedNotionPage) => ({
                type: 'document',
                provider: 'Notion',
                id: page.id,
                url: page.url,
              }))
            );
          }

          if (prdconfluence.selectedPages.length > 0) {
            testGenInputs.push(
              ...prdconfluence.selectedPages.map((id: string) => ({
                type: 'document',
                provider: 'Confluence',
                id: id,
              }))
            );
          }

          if (prdjira.selectedTickets.length > 0) {
            testGenInputs.push(
              ...prdjira.selectedTickets.map((key: string) => ({
                type: 'issue',
                provider: 'Jira',
                key: key,
              }))
            );
          }

          if (prdfiles.files.length > 0) {
            testGenInputs.push({
              type: 'document',
              provider: 'Files',
              files: prdfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }

          if (testGenInputs.length > 0) {
            payload.custom_properties.inputs = testGenInputs;
          }

          // Add documentation sources for test generation
          const testGenDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            testGenDocs.push({
              provider: 'Notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            testGenDocs.push({
              provider: 'Confluence',
              ids: docsconfluence.selectedPages,
            });
          }
          if (docsfigma.selectedFiles.length > 0) {
            testGenDocs.push({
              provider: 'Figma',
              urls: docsfigma.selectedFiles,
            });
          }
          if (docsjira.selectedTickets.length > 0) {
            testGenDocs.push({
              provider: 'Jira',
              keys: docsjira.selectedTickets,
            });
          }
          if (docsfiles.files.length > 0) {
            testGenDocs.push({
              provider: 'Files',
              files: docsfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }

          if (testGenDocs.length > 0) {
            payload.custom_properties.docs = testGenDocs;
          }

          // Add output configuration if specified
          if (
            output_config_type.length > 0 ||
            output_config_content.length > 0
          ) {
            payload.custom_properties.output_config = {
              type: output_config_type,
              contents: output_config_content,
            };
          }
          break;

        case 'requirements_to_tickets':
          // Use descriptive_level instead of analysis_type
          payload.custom_properties.descriptive_level = analysisType;

          // For requirements_to_tickets: group inputs by provider
          const reqToTicketsInputs = [];

          if (prdnotion.selectedPages.length > 0) {
            reqToTicketsInputs.push({
              type: 'document',
              provider: 'Notion',
              ids: prdnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.id
              ),
              urls: prdnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }

          if (prdconfluence.selectedPages.length > 0) {
            reqToTicketsInputs.push({
              type: 'document',
              provider: 'Confluence',
              ids: prdconfluence.selectedPages,
            });
          }

          if (prdjira.selectedTickets.length > 0) {
            reqToTicketsInputs.push({
              type: 'epic',
              provider: 'Jira',
              keys: prdjira.selectedTickets,
            });
          }

          if (prdfiles.files.length > 0) {
            reqToTicketsInputs.push({
              type: 'document',
              provider: 'Files',
              files: prdfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }

          if (reqToTicketsInputs.length > 0) {
            payload.custom_properties.inputs = reqToTicketsInputs;
          }

          // Add documentation sources
          const reqToTicketsDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            reqToTicketsDocs.push({
              provider: 'Notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            reqToTicketsDocs.push({
              provider: 'Confluence',
              ids: docsconfluence.selectedPages,
            });
          }
          if (docsfigma.selectedFiles.length > 0) {
            reqToTicketsDocs.push({
              provider: 'Figma',
              urls: docsfigma.selectedFiles,
            });
          }
          if (docsjira.selectedTickets.length > 0) {
            reqToTicketsDocs.push({
              provider: 'Jira',
              keys: docsjira.selectedTickets,
            });
          }
          if (docsfiles.files.length > 0) {
            reqToTicketsDocs.push({
              provider: 'Files',
              files: docsfiles.files.map(
                (file: { name: string; uploadedAt: string }) => file.name
              ),
            });
          }

          if (reqToTicketsDocs.length > 0) {
            payload.custom_properties.docs = reqToTicketsDocs;
          }

          // Add outputs if specified
          if (output && output.length > 0) {
            payload.custom_properties.outputs = output;
          }
          break;

        case 'api_testing_suite':
          // Add framework selection
          const enabledFramework = apiFrameworks.frameworks.find(
            f => f.enabled
          );
          if (enabledFramework) {
            payload.custom_properties.framework = enabledFramework.id;
          }

          // Add API specs - REQUIRED
          if (apiSpecs.selectedSpecs.length > 0) {
            const selectedSpecsData = apiSpecs.specs.filter(spec =>
              apiSpecs.selectedSpecs.includes(spec.id)
            );

            if (selectedSpecsData.length > 0) {
              const spec = selectedSpecsData[0];
              // const provider = spec.specType?.toLowerCase() ;//if file is uploaded then provider is file else provider is specType
              const provider =
                spec.type === 'file' ? 'file' : spec.specType?.toLowerCase();
              payload.custom_properties.api_specs = [
                {
                  provider,
                  ...(spec.type === 'url'
                    ? { urls: [spec.source], names: [] }
                    : { urls: [], names: [spec.name] }),
                },
              ];
            }
          }

          // Test cases from multiple sources
          const testcaseSources = [];

          // Add Jira test cases
          if (docsjira.selectedTickets.length > 0) {
            testcaseSources.push({
              provider: 'jira',
              keys: docsjira.selectedTickets,
              urls: [],
              names: [],
            });
          }

          // Add uploaded file test cases
          if (testCases.selectedTestCases.length > 0) {
            const selectedTestCaseFiles = testCases.testCases.filter(
              tc =>
                testCases.selectedTestCases.includes(tc.id) &&
                tc.type === 'file'
            );

            if (selectedTestCaseFiles.length > 0) {
              testcaseSources.push({
                provider: 'file',
                keys: [],
                urls: [],
                names: selectedTestCaseFiles.map(tc => tc.name),
              });
            }
          }

          if (testcaseSources.length > 0) {
            payload.custom_properties.testcase_sources = testcaseSources;
          }

          // Documentation sources - OPTIONAL
          const apiTestingDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            apiTestingDocs.push({
              provider: 'notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
              ids: [],
              names: [],
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            apiTestingDocs.push({
              provider: 'confluence',
              urls: [],
              ids: docsconfluence.selectedPages,
              names: [],
            });
          }
          if (apiTestingDocs.length > 0) {
            payload.custom_properties.docs = apiTestingDocs;
          }

          // Repository information - OPTIONAL
          if (gitHubRepos.selectedRepositories.length > 0) {
            const repo = gitHubRepos.selectedRepositories[0];
            payload.custom_properties.repo = {
              url: repo.url,
              branch: repo.branch,
            };
          }

          // Add analysis level
          payload.custom_properties.analysis_level = analysisType;
          break;

        case 'root_cause_analysis':
          payload.custom_properties.analysis_type = analysisType;

          if (gitHubRepos.selectedRepositories.length > 0) {
            payload.custom_properties.github_repos =
              gitHubRepos.selectedRepositories.map(repo => ({
                provider: 'github',
                url: repo.url,
                branch: repo.branch,
              }));
          }

          // Add incident if one is selected
          let selectedIncident = null;

          if (incidentjira.incident) {
            selectedIncident = {
              provider: 'jira',
              id: incidentjira.incident.id,
              url: `https://jira.com/browse/${incidentjira.incident.id}`,
              agent_payload: incidentjira?.incident?.agent_payload,
            };
          } else if (incidentpagerduty.incident) {
            selectedIncident = {
              provider: 'pagerduty',
              id: incidentpagerduty.incident.id,
              url: incidentpagerduty.incident.link,
              agent_payload: incidentpagerduty?.incident?.agent_payload,
            };
          } else if (incidentsentry.incident) {
            selectedIncident = {
              provider: 'sentry',
              id: incidentsentry.incident.id,
              url: incidentsentry.incident.link,
              agent_payload: incidentsentry?.incident?.agent_payload,
            };
          } else if (incidentnewrelic.incident) {
            selectedIncident = {
              provider: 'newrelic',
              id: incidentnewrelic.incident.id,
              url: incidentnewrelic.incident.link,
              agent_payload: incidentnewrelic?.incident?.agent_payload,
            };
          } else if (incidentdatadog.incident) {
            selectedIncident = {
              provider: 'datadog',
              id: incidentdatadog.incident.id,
              url: incidentdatadog.incident.link,
              agent_payload: incidentdatadog?.incident?.agent_payload,
            };
          }

          if (selectedIncident) {
            payload.custom_properties.incident = selectedIncident;
          }

          // Add logs if any are selected
          const logs: Array<{
            provider: string;
            service_id?: string;
            project_id?: string;
            dateRange?: string;
          }> = [];

          if (loggingdatadog.logs.length > 0) {
            loggingdatadog.logs.forEach(log => {
              logs.push({
                provider: 'datadog',
                service_id: log.id,
                dateRange: `${log.dateRange?.from} to ${log.dateRange?.to}`,
              });
            });
          }

          if (logginggrafana.logs.length > 0) {
            logginggrafana.logs.forEach(log => {
              logs.push({
                provider: 'grafana',
                service_id: log.id,
                dateRange: `${log.dateRange?.from} to ${log.dateRange?.to}`,
              });
            });
          }

          if (loggingcloudwatch.logs.length > 0) {
            loggingcloudwatch.logs.forEach(log => {
              logs.push({
                provider: 'cloudwatch',
                service_id: log.id,
                dateRange: `${log.dateRange?.from} to ${log.dateRange?.to}`,
              });
            });
          }

          if (logs.length > 0) {
            payload.custom_properties.logs = logs;
          }

          const rootCauseAnalysisDocs = [];
          if (docsnotion.selectedPages.length > 0) {
            rootCauseAnalysisDocs.push({
              provider: 'Notion',
              urls: docsnotion.selectedPages.map(
                (page: SelectedNotionPage) => page.url
              ),
            });
          }
          if (docsconfluence.selectedPages.length > 0) {
            rootCauseAnalysisDocs.push({
              provider: 'Confluence',
              ids: docsconfluence.selectedPages,
            });
          }
          if (rootCauseAnalysisDocs.length > 0) {
            payload.custom_properties.docs = rootCauseAnalysisDocs;
          }
          break;

        default:
          break;
      }

      return payload;
    };

    return buildPayload;
  }, [
    projectName,
    mcpAgents,
    userPrompt,
    analysisType,
    aiEngine,
    agentType,
    gitHubRepos.selectedRepositories,
    gitHubRepos.selectedPR,
    prdnotion.selectedPages,
    prdconfluence.selectedPages,
    prdjira.selectedTickets,
    prdfiles.files,
    docsnotion.selectedPages,
    docsconfluence.selectedPages,
    docsfigma.selectedFiles,
    docsjira.selectedTickets,
    loggingdatadog.logs,
    logginggrafana.logs,
    loggingcloudwatch.logs,
    incidentjira.incident,
    incidentpagerduty.incident,
    incidentsentry.incident,
    incidentnewrelic.incident,
    incidentdatadog.incident,
    docsfiles.files,
    output,
    output_config_type,
    output_config_content,
    apiSpecs.selectedSpecs,
    apiSpecs.specs,
    apiFrameworks.frameworks,
    testCases.selectedTestCases,
    testCases.testCases,
  ]);

  const createSession = async (options: CreateSessionOptions = {}) => {
    // Check if user is authenticated
    if (!accessToken) {
      toast.error('Please login to create a session');
      router.push('/login');
      return null;
    }

    // Check if agent type is set
    if (!agentType) {
      toast.error('Agent type not set. Please go back and select an agent.');
      return null;
    }

    try {
      setIsCreatingSession(true);
      const sessionPayload = buildSessionPayload();

      const response = await sessionApi.createSession(
        accessToken,
        agentType,
        sessionPayload
      );

      if (response.success && response.data) {
        const sessionId = response.data.session_id.toString();

        if (options.onSuccess) {
          options.onSuccess(sessionId);
        }

        return sessionId;
      } else {
        throw new Error('Session creation failed - no data returned');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session. Please try again.');
      return null;
    } finally {
      setIsCreatingSession(false);
    }
  };

  return {
    createSession,
    isCreatingSession,
    buildSessionPayload,
    mcpAgents,
  };
}
