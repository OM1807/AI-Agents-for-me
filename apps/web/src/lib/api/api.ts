import type {
  Repository,
  GitHubBranch,
  NotionPage,
  AtlassianSpace,
  AtlassianPage,
  AtlassianProject,
  AtlassianIssue,
  FigmaFile,
  CreateSessionResponse,
  ApiResponse,
  ApiError,
  LoginCredentials,
  LoginResponse,
  AuthUser,
  Integration,
  CreateIntegrationData,
  UpdateIntegrationData,
  LoggingService,
  IncidentService,
  IncidentProject,
  Environment,
} from '@/types';
import type { FileUploadResponse, FileDeleteResponse } from '@/types/files';
import { toast } from 'sonner';
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: () => `/auth/login`,
    LOGOUT: () => `/auth/logout`,
    ME: () => `/auth/me`,
  },
  INTEGRATIONS: {
    LIST: () => `/integrations`,
    CREATE: () => `/integrations`,
    UPDATE: (id: number) => `/integrations/${id}`,
    DELETE: (id: number) => `/integrations/${id}`,
  },
  GITHUB: {
    REPOSITORIES: () => `/integrations/github/repos`,
    BRANCHES: (owner: string, repo: string) =>
      `/integrations/github/branches?owner=${owner}&repo=${repo}`,
    PULL_REQUESTS: (
      owner: string,
      repo: string,
      params?: {
        state?: string;
        sort?: string;
        direction?: string;
        page?: number;
        per_page?: number;
      }
    ) => {
      const searchParams = new URLSearchParams({
        owner,
        repo,
        page: (params?.page || 1).toString(),
        per_page: (params?.per_page || 10).toString(),
        ...(params?.state && { state: params.state }),
        ...(params?.sort && { sort: params.sort }),
        ...(params?.direction && { direction: params.direction }),
      });
      return `/integrations/github/pull-requests?${searchParams.toString()}`;
    },
    VALIDATE_PR: (url: string) =>
      `/integrations/github/pull-request/validate?url=${encodeURIComponent(url)}`,
  },
  NOTION: {
    PAGES: (query?: string) =>
      query && query.trim()
        ? `/integrations/notion/pages?query=${encodeURIComponent(query)}`
        : `/integrations/notion/pages`,
  },
  ATLASSIAN: {
    PAGES: (space?: string) =>
      space && space.trim()
        ? `/integrations/atlassian/pages?space_key=${encodeURIComponent(space)}`
        : `/integrations/atlassian/pages`,

    PROJECTS: () => `/integrations/atlassian/projects`,
    ISSUES: (
      project_key: string,
      issue_type?: string,
      search_query?: string
    ) => {
      let url = `/integrations/atlassian/issues?project_key=${project_key}`;

      if (issue_type) {
        url += `&issue_type=${issue_type}`;
      }

      if (search_query && search_query.trim()) {
        url += `&search_query=${encodeURIComponent(search_query.trim())}`;
      }

      return url;
    },
    SPACES: (keys?: string[]) =>
      keys && keys.length > 0
        ? `/integrations/atlassian/spaces?keys=${encodeURIComponent(keys.join(','))}`
        : `/integrations/atlassian/spaces`,
  },
  FIGMA: {
    FILES: (fileId: string) => `/integrations/figma/files/${fileId}/metadata`,
  },
  SESSION: {
    CREATE: (agentType: string) => `/agents/${agentType}/sessions`,
  },
  INTEGRATION_ENVIRONMENTS: {
    LIST: (projectId: string, search?: string) =>
      `/integrations/${projectId}/environments${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  },
  INTEGRATION_LOGS_SERVICES: {
    LIST: (provider: string, search?: string) =>
      `/integrations/${provider}/services${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  },
  INTEGRATION_INCIDENTS_PROJECTS: {
    LIST: (provider: string, search?: string) =>
      `/integrations/${provider}/projects${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  },
  INTEGRATION_INCIDENTS: {
    LIST: (
      provider: string,
      start_time: string,
      end_time: string,
      search?: string,
      environment?: string,
      project_id?: string,
      service_id?: string,
      entity_name?: string,
      limit?: number
    ) => {
      let url = `/integrations/${provider}/incidents?start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`;

      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }

      if (environment && environment.trim()) {
        url += `&environment=${encodeURIComponent(environment.trim())}`;
      }

      if (project_id && project_id.trim()) {
        url += `&project_id=${encodeURIComponent(project_id.trim())}`;
      }

      if (service_id && service_id.trim()) {
        url += `&service_id=${encodeURIComponent(service_id.trim())}`;
      }

      if (entity_name && entity_name.trim()) {
        url += `&entity_name=${encodeURIComponent(entity_name.trim())}`;
      }
      if (limit && limit > 0) {
        url += `&limit=${limit}`;
      }

      return url;
    },
    FROM_URL: (url: string, provider: string) =>
      `/integrations/incidents/from-url?url=${encodeURIComponent(url)}&provider=${encodeURIComponent(provider)}`,
  },
  FILES: {
    UPLOAD: () => `/files/upload`,
    DELETE: (filename: string) =>
      `/files/user-files/${encodeURIComponent(filename)}`,
  },
} as const;

interface RequestConfig extends RequestInit {
  endpoint: string;
  data?: any;
  params?: Record<string, string>;
}

// Common API utility function
export async function apiCall<T = any>({
  endpoint,
  method = 'GET',
  data,
  params,
  headers = {},
  ...config
}: RequestConfig): Promise<ApiResponse<T>> {
  let url = `${API_BASE_URL}${endpoint}`;

  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...config,
  };

  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  // Add body for POST, PUT, PATCH requests
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    if (data instanceof FormData) {
      requestConfig.body = data;
      // IMPORTANT: Remove Content-Type for FormData - browser will set it with boundary
      delete (requestConfig.headers as any)['Content-Type'];
    } else {
      requestConfig.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, requestConfig);

    // Handle 204 No Content responses
    if (response.status === 204) {
      return {
        success: true,
        data: undefined,
        message: 'Success',
      };
    }

    const result = await response.json();

    if (!response.ok) {
      throw {
        message: result.message || result.error || 'Request failed',
        status: response.status,
        code: result.code,
      } as ApiError;
    }

    return {
      success: true,
      data: result.data || result,
      message: result.message,
    };
  } catch (error) {
    console.error(`API Error [${method} ${endpoint}]:`, error);
    if (
      error &&
      typeof error === 'object' &&
      ('message' in error || 'status' in error)
    ) {
      const apiError = error as ApiError;
      toast.error(
        `Status: ${apiError.status || 'Unknown'} Message: ${apiError.message || 'Unknown error'}}`
      );
    } else {
      // Re-throw API errors
      throw error;
    }

    // Handle network or other errors
    throw {
      message: 'Network error or server unavailable',
      status: 0,
    } as ApiError;
  }
}

// Authentication API functions
export const authApi = {
  // Login with email and password
  login: (credentials: LoginCredentials) =>
    apiCall<LoginResponse>({
      endpoint: API_ENDPOINTS.AUTH.LOGIN(),
      method: 'POST',
      data: credentials,
    }),

  // Logout current user
  logout: () =>
    apiCall({
      endpoint: API_ENDPOINTS.AUTH.LOGOUT(),
      method: 'POST',
    }),

  // Get current user information
  me: (accessToken: string) =>
    apiCall<AuthUser>({
      endpoint: API_ENDPOINTS.AUTH.ME(),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

// Integration API functions
export const integrationApi = {
  // Get all integrations for a session
  list: (accessToken: string) =>
    apiCall<Integration[]>({
      endpoint: API_ENDPOINTS.INTEGRATIONS.LIST(),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Create a new integration
  create: (data: CreateIntegrationData, accessToken: string) =>
    apiCall<Integration>({
      endpoint: API_ENDPOINTS.INTEGRATIONS.CREATE(),
      method: 'POST',
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Update an existing integration
  update: (id: number, data: UpdateIntegrationData, accessToken: string) =>
    apiCall<Integration>({
      endpoint: API_ENDPOINTS.INTEGRATIONS.UPDATE(id),
      method: 'PUT',
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Delete an integration
  delete: (id: number, accessToken: string) =>
    apiCall({
      endpoint: API_ENDPOINTS.INTEGRATIONS.DELETE(id),
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

// GitHub API functions
export const githubApi = {
  // Get all repositories for the authenticated user
  getRepositories: (accessToken: string) =>
    apiCall<Repository[]>({
      endpoint: API_ENDPOINTS.GITHUB.REPOSITORIES(),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Get branches for a specific repository
  getBranches: (owner: string, repo: string, accessToken: string) =>
    apiCall<GitHubBranch[]>({
      endpoint: API_ENDPOINTS.GITHUB.BRANCHES(owner, repo),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Get pull requests for a specific repository
  getPullRequests: (
    owner: string,
    repo: string,
    accessToken: string,
    params?: {
      state?: string;
      sort?: string;
      direction?: string;
      page?: number;
      per_page?: number;
    }
  ) =>
    apiCall<{
      results: any[];
      total: number;
      page: number;
      per_page: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    }>({
      endpoint: API_ENDPOINTS.GITHUB.PULL_REQUESTS(owner, repo, params),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Validate and fetch PR data from URL
  validatePR: (url: string, accessToken?: string) => {
    return apiCall<any>({
      endpoint: API_ENDPOINTS.GITHUB.VALIDATE_PR(url),
      method: 'GET',
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : {},
    });
  },
};

// Notion API functions
export const notionApi = {
  // Search for Notion pages
  searchPages: (accessToken: string, query?: string) =>
    apiCall<NotionPage[]>({
      endpoint: API_ENDPOINTS.NOTION.PAGES(query),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

// Atlassian API functions
export const atlassianApi = {
  // Get Confluence spaces
  getSpaces: (accessToken: string, spaceKeys?: string[]) =>
    apiCall<AtlassianSpace[]>({
      endpoint: API_ENDPOINTS.ATLASSIAN.SPACES(spaceKeys),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Get Confluence pages by space
  getPages: (accessToken: string, spaceKey?: string) =>
    apiCall<AtlassianPage[]>({
      endpoint: API_ENDPOINTS.ATLASSIAN.PAGES(spaceKey),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Get Jira projects
  getProjects: (accessToken: string) =>
    apiCall<AtlassianProject[]>({
      endpoint: API_ENDPOINTS.ATLASSIAN.PROJECTS(),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  // Get Jira issues by project
  getIssues: (
    projectKey: string,
    accessToken: string,
    issueType?: string,
    searchQuery?: string
  ) =>
    apiCall<AtlassianIssue[]>({
      endpoint: API_ENDPOINTS.ATLASSIAN.ISSUES(
        projectKey,
        issueType,
        searchQuery
      ),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

export const figmaApi = {
  getFileMetadata: (fileId: string, accessToken: string) =>
    apiCall<FigmaFile>({
      endpoint: API_ENDPOINTS.FIGMA.FILES(fileId),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

// File Upload API functions
export const filesUploadApi = {
  // Upload a file to user's file storage
  upload: (files: File[], accessToken: string) => {
    if (files.length === 0) {
      return Promise.resolve({
        success: false,
        error: 'No files provided for upload',
      } as ApiResponse<FileUploadResponse>);
    }

    if (!accessToken) {
      return Promise.resolve({
        success: false,
        error: 'No access token provided',
      } as ApiResponse<FileUploadResponse>);
    }

    const formData = new FormData();
    formData.append('file', files[0]);

    return apiCall<FileUploadResponse>({
      endpoint: API_ENDPOINTS.FILES.UPLOAD(),
      method: 'POST',
      data: formData,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // Delete a file from user's file storage
  delete: (filename: string, accessToken: string) => {
    if (!accessToken) {
      return Promise.resolve({
        success: false,
        error: 'No access token provided',
      } as ApiResponse<FileDeleteResponse>);
    }

    return apiCall<FileDeleteResponse>({
      endpoint: API_ENDPOINTS.FILES.DELETE(filename),
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },
};

// Session API functions
export const sessionApi = {
  // Create a new session
  createSession: (accessToken: string, agentType: string, payload: any) =>
    apiCall<CreateSessionResponse>({
      endpoint: API_ENDPOINTS.SESSION.CREATE(agentType),
      method: 'POST',
      data: payload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

export const integrationLogsServicesApi = {
  list: (provider: string, accessToken: string, search?: string) =>
    apiCall<LoggingService[]>({
      endpoint: API_ENDPOINTS.INTEGRATION_LOGS_SERVICES.LIST(provider, search),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

export const integrationIncidentsProjectsApi = {
  list: (provider: string, accessToken: string, search?: string) =>
    apiCall<IncidentProject[]>({
      endpoint: API_ENDPOINTS.INTEGRATION_INCIDENTS_PROJECTS.LIST(
        provider,
        search
      ),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

export const integrationIncidentsApi = {
  list: (
    provider: string,
    start_time: string,
    end_time: string,
    accessToken: string,
    search?: string,
    environment?: string,
    project_id?: string,
    service_id?: string,
    entity_name?: string,
    limit?: number
  ) =>
    apiCall<IncidentService[]>({
      endpoint: API_ENDPOINTS.INTEGRATION_INCIDENTS.LIST(
        provider,
        start_time,
        end_time,
        search,
        environment,
        project_id,
        service_id,
        entity_name,
        limit
      ),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),

  fromUrl: (url: string, accessToken: string, provider: string) =>
    apiCall<IncidentService>({
      endpoint: API_ENDPOINTS.INTEGRATION_INCIDENTS.FROM_URL(url, provider),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};

export const integrationEnvironmentsApi = {
  list: (projectId: string, accessToken: string, search?: string) =>
    apiCall<Environment[]>({
      endpoint: API_ENDPOINTS.INTEGRATION_ENVIRONMENTS.LIST(projectId, search),
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
};
