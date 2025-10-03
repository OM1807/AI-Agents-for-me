import type {
  SupportingDocType,
  PRDBasedType,
  LogBasedType,
  IncidentBasedType,
} from '@/types';

// Single interface for all integrations with cleaner type-specific methods
export interface AvailableIntegrations {
  notion?: boolean;
  confluence?: boolean;
  jira?: boolean;
  figma?: boolean;
  datadog?: boolean;
  grafana?: boolean;
  newrelic?: boolean;
  cloudwatch?: boolean;
  sentry?: boolean;
  pagerduty?: boolean;
  files?: boolean;
}

// Integration data structure from API
interface Integration {
  id: number;
  type: string;
  is_active: boolean;
}

// Connection state structure
interface ConnectionState {
  isConnected: boolean;
  id: number;
}

// Setter functions for each integration type
interface IntegrationSetters {
  setNotionConnection: (state: ConnectionState) => void;
  setAtlassianMCPConnection: (state: ConnectionState) => void;
  setGitHubConnection: (state: ConnectionState) => void;
  setFigmaConnection: (state: ConnectionState) => void;
  setDataDogConnection: (state: ConnectionState) => void;
  setGrafanaConnection: (state: ConnectionState) => void;
  setNewRelicConnection: (state: ConnectionState) => void;
  setCloudWatchConnection: (state: ConnectionState) => void;
  setSentryConnection: (state: ConnectionState) => void;
  setPagerDutyConnection: (state: ConnectionState) => void;
  setUserFilesConnection: (state: ConnectionState) => void;
}

/**
 * Determine which integrations to show based on agent type and document type
 */
export function getAvailableIntegrations(
  agentType: string = 'default',
  documentType:
    | SupportingDocType
    | PRDBasedType
    | LogBasedType
    | IncidentBasedType
): AvailableIntegrations {
  switch (agentType) {
    case 'test_case_generation':
      switch (documentType) {
        case 'prd':
          return {
            notion: true,
            confluence: true,
            jira: true,
            files: true,
          };
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            files: true,
          };
        default:
          return {};
      }

    case 'code_analysis':
      switch (documentType) {
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            files: true,
          };

        default:
          return {};
      }

    case 'requirements_to_tickets':
      switch (documentType) {
        case 'prd':
          return {
            notion: true,
            confluence: true,
            jira: true,
            files: true,
          };
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            files: true,
          };
        default:
          return {};
      }

    case 'root_cause_analysis':
      switch (documentType) {
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            files: true,
          };
        case 'incident':
          return {
            jira: true,
            pagerduty: true,
            sentry: true,
            newrelic: true,
            datadog: true,
          };
        case 'logging':
          return {
            datadog: true,
            cloudwatch: true,
            grafana: true,
          };
        default:
          return {};
      }
    case 'code_reviewer':
      switch (documentType) {
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            files: true,
          };
        default:
          return {};
      }
    case 'api_testing_suite':
      switch (documentType) {
        case 'prd':
          return {
            notion: false,
            confluence: false,
            jira: true,
            figma: false,
            files: true,
          };
        case 'supporting_doc':
          return {
            notion: true,
            confluence: true,
            jira: false,
            figma: false,
            files: true,
          };
        default:
          return {
            notion: true,
            confluence: true,
            jira: true,
            figma: false,
            files: true,
          };
      }

    default:
      return {};
  }
}

/**
 * Process integration data and set connection states
 * @param integrations - Array of integration data from API
 * @param setters - Object containing setter functions for each integration type
 */
export function processIntegrations(
  integrations: Integration[],
  setters: IntegrationSetters
): void {
  integrations.forEach(integration => {
    if (!integration.is_active) return;

    const connectionState: ConnectionState = {
      isConnected: true,
      id: integration.id,
    };

    switch (integration.type) {
      case 'notion':
        setters.setNotionConnection(connectionState);
        break;
      case 'atlassian':
        setters.setAtlassianMCPConnection(connectionState);
        break;
      case 'github':
        setters.setGitHubConnection(connectionState);
        break;
      case 'figma':
        setters.setFigmaConnection(connectionState);
        break;
      case 'datadog':
        setters.setDataDogConnection(connectionState);
        break;
      case 'grafana':
        setters.setGrafanaConnection(connectionState);
        break;
      case 'new_relic':
        setters.setNewRelicConnection(connectionState);
        break;
      case 'cloudwatch':
        setters.setCloudWatchConnection(connectionState);
        break;
      case 'sentry':
        setters.setSentryConnection(connectionState);
        break;
      case 'pagerduty':
        setters.setPagerDutyConnection(connectionState);
        break;
      case 'cloudwatch':
        setters.setCloudWatchConnection(connectionState);
        break;
      default:
        // Handle unknown integration types gracefully
        console.warn(`Unknown integration type: ${integration.type}`);
        break;
    }
  });
}
