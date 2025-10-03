import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  RepositoryState,
  AtlassianIssue,
  AtlassianPage,
  AtlassianProject,
  AtlassianSpace,
  NotionPage,
  FigmaFile,
  ApiSpec,
  ApiSpecState,
  ApiTestCase,
  TestCasesState,
  ApiFrameworkState,
} from '@/types';
import type { LoggingService, IncidentService } from '@/types/integrations';

type OutputConfigType = {
  type: string;
  contents: string[];
};
interface ProjectState {
  projectName: string;
  analysisType: string;
  aiEngine: string;
  mcpAgents: string[];
  contentsToInclude: string[];
  userPrompt: string;
  agentType: string;
  sessionId: string;
  output_config_type: string[];
  output_config_content: string[];
  output: OutputConfigType[];
  loggingServicesCache: Record<string, Record<string, LoggingService[]>>;
  selectedIncidentServices: Record<string, string | null>;
  prdnotion: {
    pages: NotionPage[];
    selectedPages: { id: string; url: string }[];
  };
  prdconfluence: {
    pages: AtlassianPage[];
    selectedPages: string[];
  };
  prdjira: {
    tickets: AtlassianIssue[];
    selectedTickets: string[];
  };
  docsnotion: {
    pages: NotionPage[];
    selectedPages: { id: string; url: string }[];
  };
  docsconfluence: {
    pages: AtlassianPage[];
    selectedPages: string[];
  };
  docsjira: {
    tickets: AtlassianIssue[];
    selectedTickets: string[];
  };
  docsfigma: {
    files: FigmaFile[];
    selectedFiles: string[];
  };
  loggingdatadog: {
    logs: LoggingService[];
  };
  logginggrafana: {
    logs: LoggingService[];
  };
  loggingcloudwatch: {
    logs: LoggingService[];
  };
  incidentjira: {
    incident: IncidentService | null;
  };
  incidentpagerduty: {
    incident: IncidentService | null;
  };
  incidentsentry: {
    incident: IncidentService | null;
  };
  incidentnewrelic: {
    incident: IncidentService | null;
  };
  incidentdatadog: {
    incident: IncidentService | null;
  };
  prdfiles: {
    files: { name: string; uploadedAt: string }[];
    selectedFiles: string[];
  };
  docsfiles: {
    files: { name: string; uploadedAt: string }[];
    selectedFiles: string[];
  };
  cachedNotionPages: NotionPage[];
  cachedConfluenceSpaces: AtlassianSpace[];
  cachedConfluencePages: AtlassianPage[];
  cachedJiraProjects: AtlassianProject[];
  cachedJiraTickets: AtlassianIssue[];
  gitHubRepos: {
    repositories: RepositoryState[];
    selectedRepositories: {
      url: string;
      branch: string;
    }[];
    selectedPR?: {
      html_url: string;
    } | null;
  };
  apiSpecs: ApiSpecState;
  testCases: TestCasesState;
  apiFrameworks: ApiFrameworkState;
  setPrdnotion: (prdnotion: {
    pages: NotionPage[];
    selectedPages: { id: string; url: string }[];
  }) => void;
  setPrdconfluence: (prdconfluence: {
    pages: AtlassianPage[];
    selectedPages: string[];
  }) => void;
  setPrdjira: (prdjira: {
    tickets: AtlassianIssue[];
    selectedTickets: string[];
  }) => void;
  setDocsnotion: (docsnotion: {
    pages: NotionPage[];
    selectedPages: { id: string; url: string }[];
  }) => void;
  setDocsconfluence: (docsconfluence: {
    pages: AtlassianPage[];
    selectedPages: string[];
  }) => void;
  setDocsjira: (docsjira: {
    tickets: AtlassianIssue[];
    selectedTickets: string[];
  }) => void;
  setDocsfigma: (docsfigma: {
    files: FigmaFile[];
    selectedFiles: string[];
  }) => void;
  setLoggingdatadog: (loggingdatadog: { logs: LoggingService[] }) => void;
  setLogginggrafana: (logginggrafana: { logs: LoggingService[] }) => void;
  setLoggingcloudwatch: (loggingcloudwatch: { logs: LoggingService[] }) => void;
  setIncidentjira: (incidentjira: { incident: IncidentService | null }) => void;
  setIncidentpagerduty: (incidentpagerduty: {
    incident: IncidentService | null;
  }) => void;
  setIncidentsentry: (incidentsentry: {
    incident: IncidentService | null;
  }) => void;
  setIncidentnewrelic: (incidentnewrelic: {
    incident: IncidentService | null;
  }) => void;
  setIncidentdatadog: (incidentdatadog: {
    incident: IncidentService | null;
  }) => void;
  setPrdfiles: (prdfiles: {
    files: { name: string; uploadedAt: string }[];
    selectedFiles: string[];
  }) => void;
  setDocsfiles: (docsfiles: {
    files: { name: string; uploadedAt: string }[];
    selectedFiles: string[];
  }) => void;
  setCachedNotionPages: (cachedNotionPages: NotionPage[]) => void;
  setCachedConfluenceSpaces: (cachedConfluenceSpaces: AtlassianSpace[]) => void;
  setCachedConfluencePages: (cachedConfluencePages: AtlassianPage[]) => void;
  setCachedJiraProjects: (cachedJiraProjects: AtlassianProject[]) => void;
  setCachedJiraTickets: (cachedJiraTickets: AtlassianIssue[]) => void;
  setGitHubRepos: (gitHubRepos: {
    repositories: RepositoryState[];
    selectedRepositories: {
      url: string;
      branch: string;
    }[];
    selectedPR?: {
      html_url: string;
    } | null;
  }) => void;
  setSelectedPR: (
    pr: {
      html_url: string;
    } | null
  ) => void;
  setApiSpecs: (apiSpecs: ApiSpecState) => void;
  addApiSpec: (apiSpec: Omit<ApiSpec, 'uploadedAt'>) => void;
  removeApiSpec: (specId: string) => void;
  toggleApiSpec: (specId: string) => void;
  setOutputConfigType: (output_config_type: string[]) => void;
  setOutputConfigContent: (output_config_content: string[]) => void;
  setOutput: (output: OutputConfigType[]) => void;
  setSessionId: (sessionId: string) => void;
  setAgentType: (agentType: string) => void;
  setUserPrompt: (userPrompt: string) => void;
  setContentsToInclude: (contentsToInclude: string[]) => void;
  setMcpAgents: (mcpAgents: string[]) => void;
  setAiEngine: (aiEngine: string) => void;
  setAnalysisType: (analysisType: string) => void;
  setProjectName: (projectName: string) => void;
  resetProject: () => void;
  resetGitHubRepos: () => void;
  resetPrdnotion: () => void;
  resetPrdconfluence: () => void;
  resetPrdjira: () => void;
  resetDocsnotion: () => void;
  resetDocsconfluence: () => void;
  resetDocsjira: () => void;
  resetDocsfigma: () => void;
  resetLoggingdatadog: () => void;
  resetLogginggrafana: () => void;
  resetLoggingcloudwatch: () => void;
  resetIncidentjira: () => void;
  resetIncidentpagerduty: () => void;
  resetIncidentsentry: () => void;
  resetIncidentnewrelic: () => void;
  resetIncidentdatadog: () => void;
  resetPrdfiles: () => void;
  resetDocsfiles: () => void;
  resetCachedNotionPages: () => void;
  resetCachedConfluenceSpaces: () => void;
  resetCachedConfluencePages: () => void;
  resetCachedJiraProjects: () => void;
  resetCachedJiraTickets: () => void;
  resetApiSpecs: () => void;
  setTestCases: (testCases: TestCasesState) => void;
  addTestCase: (testCase: Omit<ApiTestCase, 'uploadedAt'>) => void;
  removeTestCase: (testCaseId: string) => void;
  toggleTestCase: (testCaseId: string) => void;
  resetTestCases: () => void;
  setApiFrameworks: (frameworks: ApiFrameworkState) => void;
  updateApiFramework: (frameworkId: string, enabled: boolean) => void;
  resetApiFrameworks: () => void;
  resetOutputConfigType: () => void;
  resetOutputConfigContent: () => void;
  setLoggingServicesCache: (
    provider: string,
    searchKey: string,
    services: LoggingService[]
  ) => void;
  clearLoggingServicesCache: (provider?: string) => void;
  getLoggingServicesCache: (
    provider: string,
    searchKey: string
  ) => LoggingService[] | null;
}

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        projectName: '',
        analysisType: 'deep',
        aiEngine: 'claude-4-sonnet',
        mcpAgents: [],
        contentsToInclude: [],
        userPrompt: '',
        agentType: '',
        prdnotion: {
          pages: [],
          selectedPages: [],
        },
        prdconfluence: {
          pages: [],
          selectedPages: [],
        },
        prdjira: {
          tickets: [],
          selectedTickets: [],
        },
        docsnotion: {
          pages: [],
          selectedPages: [],
        },
        docsconfluence: {
          pages: [],
          selectedPages: [],
        },
        docsjira: {
          tickets: [],
          selectedTickets: [],
        },
        docsfigma: {
          files: [],
          selectedFiles: [],
        },
        loggingdatadog: {
          logs: [],
        },
        logginggrafana: {
          logs: [],
        },
        loggingcloudwatch: {
          logs: [],
        },
        incidentjira: {
          incident: null,
        },
        incidentpagerduty: {
          incident: null,
        },
        incidentsentry: {
          incident: null,
        },
        incidentnewrelic: {
          incident: null,
        },
        incidentdatadog: {
          incident: null,
        },
        prdfiles: {
          files: [],
          selectedFiles: [],
        },
        docsfiles: {
          files: [],
          selectedFiles: [],
        },
        cachedNotionPages: [],
        cachedConfluenceSpaces: [],
        cachedConfluencePages: [],
        cachedJiraProjects: [],
        cachedJiraTickets: [],
        gitHubRepos: {
          repositories: [],
          selectedRepositories: [],
          selectedPR: null,
        },
        apiSpecs: {
          specs: [],
          selectedSpecs: [],
        },
        testCases: {
          testCases: [],
          selectedTestCases: [],
        },
        apiFrameworks: {
          frameworks: [
            { id: 'playwright', name: 'Playwright', enabled: true },
            { id: 'rest-assured', name: 'REST Assured', enabled: false },
            { id: 'postman', name: 'Postman', enabled: false },
          ],
        },
        sessionId: '',
        output_config_type: [],
        output_config_content: [],
        output: [],
        loggingServicesCache: {},
        selectedIncidentProjects: {},
        selectedIncidentServices: {},
        setSessionId: (sessionId: string) => set(() => ({ sessionId })),
        setAgentType: (agentType: string) => set(() => ({ agentType })),
        setUserPrompt: (userPrompt: string) => set(() => ({ userPrompt })),
        setProjectName: (projectName: string) => set(() => ({ projectName })),
        setAnalysisType: (analysisType: string) =>
          set(() => ({ analysisType })),
        setAiEngine: (aiEngine: string) => set(() => ({ aiEngine })),
        setMcpAgents: (mcpAgents: string[]) => set(() => ({ mcpAgents })),
        setContentsToInclude: (contentsToInclude: string[]) =>
          set(() => ({ contentsToInclude })),
        setPrdnotion: (prdnotion: {
          pages: NotionPage[];
          selectedPages: { id: string; url: string }[];
        }) => set(() => ({ prdnotion })),
        setPrdconfluence: (prdconfluence: {
          pages: AtlassianPage[];
          selectedPages: string[];
        }) => set(() => ({ prdconfluence })),
        setPrdjira: (prdjira: {
          tickets: AtlassianIssue[];
          selectedTickets: string[];
        }) => set(() => ({ prdjira })),
        setDocsnotion: (docsnotion: {
          pages: NotionPage[];
          selectedPages: { id: string; url: string }[];
        }) => set(() => ({ docsnotion })),
        setDocsconfluence: (docsconfluence: {
          pages: AtlassianPage[];
          selectedPages: string[];
        }) => set(() => ({ docsconfluence })),
        setDocsjira: (docsjira: {
          tickets: AtlassianIssue[];
          selectedTickets: string[];
        }) => set(() => ({ docsjira })),
        setDocsfigma: (docsfigma: {
          files: FigmaFile[];
          selectedFiles: string[];
        }) => set(() => ({ docsfigma })),
        setLoggingdatadog: (loggingdatadog: { logs: LoggingService[] }) =>
          set(() => ({ loggingdatadog })),
        setLogginggrafana: (logginggrafana: { logs: LoggingService[] }) =>
          set(() => ({ logginggrafana })),
        setLoggingcloudwatch: (loggingcloudwatch: { logs: LoggingService[] }) =>
          set(() => ({ loggingcloudwatch })),
        setIncidentjira: (incidentjira: { incident: IncidentService | null }) =>
          set(() => ({ incidentjira })),
        setIncidentpagerduty: (incidentpagerduty: {
          incident: IncidentService | null;
        }) => set(() => ({ incidentpagerduty })),
        setIncidentsentry: (incidentsentry: {
          incident: IncidentService | null;
        }) => set(() => ({ incidentsentry })),
        setIncidentnewrelic: (incidentnewrelic: {
          incident: IncidentService | null;
        }) => set(() => ({ incidentnewrelic })),
        setIncidentdatadog: (incidentdatadog: {
          incident: IncidentService | null;
        }) => set(() => ({ incidentdatadog })),
        setPrdfiles: (prdfiles: {
          files: { name: string; uploadedAt: string }[];
          selectedFiles: string[];
        }) => set(() => ({ prdfiles })),
        setDocsfiles: (docsfiles: {
          files: { name: string; uploadedAt: string }[];
          selectedFiles: string[];
        }) => set(() => ({ docsfiles })),
        setCachedNotionPages: (cachedNotionPages: NotionPage[]) =>
          set(() => ({ cachedNotionPages })),
        setCachedConfluenceSpaces: (cachedConfluenceSpaces: AtlassianSpace[]) =>
          set(() => ({ cachedConfluenceSpaces })),
        setCachedConfluencePages: (cachedConfluencePages: AtlassianPage[]) =>
          set(() => ({ cachedConfluencePages })),
        setCachedJiraProjects: (cachedJiraProjects: AtlassianProject[]) =>
          set(() => ({ cachedJiraProjects })),
        setCachedJiraTickets: (cachedJiraTickets: AtlassianIssue[]) =>
          set(() => ({ cachedJiraTickets })),
        setGitHubRepos: (gitHubRepos: {
          repositories: RepositoryState[];
          selectedRepositories: {
            url: string;
            branch: string;
          }[];
          selectedPR?: {
            html_url: string;
          } | null;
        }) => set(() => ({ gitHubRepos })),
        setSelectedPR: (
          selectedPR: {
            html_url: string;
          } | null
        ) =>
          set(state => ({
            gitHubRepos: {
              ...state.gitHubRepos,
              selectedPR,
            },
          })),
        setOutputConfigType: (output_config_type: string[]) =>
          set(() => ({ output_config_type })),
        setOutputConfigContent: (output_config_content: string[]) =>
          set(() => ({ output_config_content })),
        setOutput: (output: OutputConfigType[]) => set(() => ({ output })),
        setApiSpecs: (apiSpecs: ApiSpecState) => set(() => ({ apiSpecs })),
        addApiSpec: (apiSpec: Omit<ApiSpec, 'uploadedAt'>) =>
          set(state => ({
            apiSpecs: {
              specs: [
                ...state.apiSpecs.specs,
                {
                  ...apiSpec,
                  uploadedAt: new Date().toISOString(),
                },
              ],
              selectedSpecs: [apiSpec.id], // Auto-select new spec (replacing any previous selection)
            },
          })),
        removeApiSpec: (specId: string) =>
          set(state => ({
            apiSpecs: {
              specs: state.apiSpecs.specs.filter(spec => spec.id !== specId),
              selectedSpecs: state.apiSpecs.selectedSpecs.filter(
                id => id !== specId
              ),
            },
          })),
        toggleApiSpec: (specId: string) =>
          set(state => ({
            apiSpecs: {
              ...state.apiSpecs,
              selectedSpecs: [specId], // Single-selection: always replace current selection
            },
          })),
        resetProject: () =>
          set(() => ({
            projectName: '',
            analysisType: 'deep',
            aiEngine: 'claude-4-sonnet',
            mcpAgents: [],
            contentsToInclude: [],
            userPrompt: '',
            agentType: '',
            sessionId: '',
            prdnotion: {
              pages: [],
              selectedPages: [],
            },
            prdconfluence: {
              pages: [],
              selectedPages: [],
            },
            prdjira: {
              tickets: [],
              selectedTickets: [],
            },
            docsnotion: {
              pages: [],
              selectedPages: [],
            },
            docsconfluence: {
              pages: [],
              selectedPages: [],
            },
            docsjira: {
              tickets: [],
              selectedTickets: [],
            },
            docsfigma: {
              files: [],
              selectedFiles: [],
            },
            loggingdatadog: {
              logs: [],
            },
            logginggrafana: {
              logs: [],
            },
            loggingcloudwatch: {
              logs: [],
            },
            incidentjira: {
              incident: null,
            },
            incidentpagerduty: {
              incident: null,
            },
            incidentsentry: {
              incident: null,
            },
            incidentnewrelic: {
              incident: null,
            },
            incidentdatadog: {
              incident: null,
            },
            prdfiles: {
              files: [],
              selectedFiles: [],
            },
            docsfiles: {
              files: [],
              selectedFiles: [],
            },
            cachedNotionPages: [],
            cachedConfluenceSpaces: [],
            cachedConfluencePages: [],
            cachedJiraProjects: [],
            cachedJiraTickets: [],
            gitHubRepos: {
              repositories: [],
              selectedRepositories: [],
              selectedPR: null,
            },
            apiSpecs: {
              specs: [],
              selectedSpecs: [],
            },
            testCases: {
              testCases: [],
              selectedTestCases: [],
            },
            apiFrameworks: {
              frameworks: [
                { id: 'playwright', name: 'Playwright', enabled: true },
                { id: 'rest-assured', name: 'REST Assured', enabled: false },
                { id: 'postman', name: 'Postman', enabled: false },
              ],
            },
            output_config_type: [],
            output_config_content: [],
            output: [],
            loggingServicesCache: {},
            selectedIncidentProjects: {},
            selectedIncidentServices: {},
          })),
        resetGitHubRepos: () =>
          set(() => ({
            gitHubRepos: {
              repositories: [],
              selectedRepositories: [],
              selectedPR: null,
            },
          })),
        resetPrdnotion: () =>
          set(() => ({
            prdnotion: {
              pages: [],
              selectedPages: [],
            },
          })),
        resetPrdconfluence: () =>
          set(() => ({
            prdconfluence: {
              pages: [],
              selectedPages: [],
            },
          })),
        resetPrdjira: () =>
          set(() => ({
            prdjira: {
              tickets: [],
              selectedTickets: [],
            },
          })),
        resetDocsnotion: () =>
          set(() => ({
            docsnotion: {
              pages: [],
              selectedPages: [],
            },
          })),
        resetDocsconfluence: () =>
          set(() => ({
            docsconfluence: {
              pages: [],
              selectedPages: [],
            },
          })),
        resetDocsjira: () =>
          set(() => ({
            docsjira: {
              tickets: [],
              selectedTickets: [],
            },
          })),
        resetDocsfigma: () =>
          set(() => ({
            docsfigma: {
              files: [],
              selectedFiles: [],
            },
          })),
        resetLoggingdatadog: () =>
          set(() => ({
            loggingdatadog: {
              logs: [],
            },
          })),
        resetLogginggrafana: () =>
          set(() => ({
            logginggrafana: {
              logs: [],
            },
          })),
        resetLoggingcloudwatch: () =>
          set(() => ({
            loggingcloudwatch: {
              logs: [],
            },
          })),
        resetIncidentjira: () =>
          set(() => ({
            incidentjira: {
              incident: null,
            },
          })),
        resetIncidentpagerduty: () =>
          set(() => ({
            incidentpagerduty: {
              incident: null,
            },
          })),
        resetIncidentsentry: () =>
          set(() => ({
            incidentsentry: {
              incident: null,
            },
          })),
        resetIncidentnewrelic: () =>
          set(() => ({
            incidentnewrelic: {
              incident: null,
            },
          })),
        resetIncidentdatadog: () =>
          set(() => ({
            incidentdatadog: {
              incident: null,
            },
          })),
        resetPrdfiles: () =>
          set(() => ({
            prdfiles: {
              files: [],
              selectedFiles: [],
            },
          })),
        resetDocsfiles: () =>
          set(() => ({
            docsfiles: {
              files: [],
              selectedFiles: [],
            },
          })),
        resetCachedNotionPages: () => set(() => ({ cachedNotionPages: [] })),
        resetCachedConfluenceSpaces: () =>
          set(() => ({ cachedConfluenceSpaces: [] })),
        resetCachedConfluencePages: () =>
          set(() => ({ cachedConfluencePages: [] })),
        resetCachedJiraProjects: () => set(() => ({ cachedJiraProjects: [] })),
        resetCachedJiraTickets: () => set(() => ({ cachedJiraTickets: [] })),
        resetApiSpecs: () =>
          set(() => ({
            apiSpecs: {
              specs: [],
              selectedSpecs: [],
            },
          })),
        setTestCases: (testCases: TestCasesState) => set(() => ({ testCases })),
        addTestCase: (testCase: Omit<ApiTestCase, 'uploadedAt'>) =>
          set(state => ({
            testCases: {
              ...state.testCases,
              testCases: [
                ...state.testCases.testCases,
                {
                  ...testCase,
                  uploadedAt: new Date().toISOString(),
                },
              ],
            },
          })),
        removeTestCase: (testCaseId: string) =>
          set(state => ({
            testCases: {
              testCases: state.testCases.testCases.filter(
                testCase => testCase.id !== testCaseId
              ),
              selectedTestCases: state.testCases.selectedTestCases.filter(
                id => id !== testCaseId
              ),
            },
          })),
        toggleTestCase: (testCaseId: string) =>
          set(state => ({
            testCases: {
              ...state.testCases,
              selectedTestCases: state.testCases.selectedTestCases.includes(
                testCaseId
              )
                ? state.testCases.selectedTestCases.filter(
                    id => id !== testCaseId
                  )
                : [...state.testCases.selectedTestCases, testCaseId],
            },
          })),
        resetTestCases: () =>
          set(() => ({
            testCases: {
              testCases: [],
              selectedTestCases: [],
            },
          })),
        setApiFrameworks: (frameworks: ApiFrameworkState) =>
          set(() => ({ apiFrameworks: frameworks })),
        updateApiFramework: (frameworkId: string, enabled: boolean) =>
          set(state => ({
            apiFrameworks: {
              frameworks: state.apiFrameworks.frameworks.map(framework =>
                framework.id === frameworkId
                  ? { ...framework, enabled }
                  : framework
              ),
            },
          })),
        resetApiFrameworks: () =>
          set(() => ({
            apiFrameworks: {
              frameworks: [
                { id: 'playwright', name: 'Playwright', enabled: true },
                { id: 'rest-assured', name: 'REST Assured', enabled: false },
                { id: 'postman', name: 'Postman', enabled: false },
              ],
            },
          })),
        resetOutputConfigType: () => set(() => ({ output_config_type: [] })),
        resetOutputConfigContent: () =>
          set(() => ({ output_config_content: [] })),
        setLoggingServicesCache: (
          provider: string,
          searchKey: string,
          services: LoggingService[]
        ) =>
          set(state => ({
            loggingServicesCache: {
              ...state.loggingServicesCache,
              [provider]: {
                ...state.loggingServicesCache[provider],
                [searchKey]: services,
              },
            },
          })),
        clearLoggingServicesCache: (provider?: string) =>
          set(state => ({
            loggingServicesCache: provider
              ? {
                  ...state.loggingServicesCache,
                  [provider]: {},
                }
              : {},
          })),
        getLoggingServicesCache: (provider: string, searchKey: string) => {
          const state = get();
          return state.loggingServicesCache[provider]?.[searchKey] || null;
        },
      }),
      {
        name: 'project-storage',
      }
    ),
    {
      name: 'project-store',
    }
  )
);
