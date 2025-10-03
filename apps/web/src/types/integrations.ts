// ========================================
// INTEGRATION TYPES
// ========================================

export interface IntegrationData {
  token?: string;
  [key: string]: any;
}

export interface Integration {
  id: number;
  name: string;
  auth_type: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: number;
}

export interface CreateIntegrationData {
  name: string;
  auth_type: string;
  type: string;
  is_active?: boolean;
  credentials?: {
    [key: string]: string;
  };
}

export interface UpdateIntegrationData {
  auth_type?: string;
  is_active?: boolean;
  credentials?: {
    [key: string]: string;
  };
}

// ========================================
// INTEGRATION UTILITY TYPES
// ========================================

export interface AvailableIntegrations {
  notion: boolean;
  confluence: boolean;
  jira: boolean;
  figma: boolean;
  files: boolean;
}

export interface ConnectionState {
  isConnected: boolean;
  id: number;
}

export interface ConnectionStateWithLoading {
  isConnected: boolean;
  isLoading: boolean;
}

export interface IntegrationSetters {
  setNotionConnection: (state: ConnectionState) => void;
  setAtlassianMCPConnection: (state: ConnectionState) => void;
  setGitHubConnection: (state: ConnectionState) => void;
  setFigmaConnection: (state: ConnectionState) => void;
}

// ========================================
// SERVICE TYPES
// ========================================

export interface LoggingService {
  id: string;
  name: string;
  description: string;
  last_updated: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
}

export interface IncidentService {
  id: string;
  title: string;
  type: string;
  link: string;
  last_seen: string;
  agent_payload?: {
    [key: string]: any;
  };
}

export interface IncidentProject {
  id: string;
  name: string;
}

export interface Environment {
  id: string;
  name: string;
  description: string;
}
