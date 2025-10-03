import type {
  SupportingDocType,
  PRDBasedType,
  IncidentBasedType,
} from './common';
// ========================================
// ATLASSIAN TYPES
// ========================================

// Consolidated Atlassian/Confluence Space type
export interface AtlassianSpace {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  _links: {
    webui: string;
    self?: string;
  };
  // Extended Confluence-specific fields
  spaceOwnerId?: string;
  authorId?: string;
  createdAt?: string;
  homepageId?: string;
  icon?: string | null;
  description?: string | null;
  currentActiveAlias?: string;
}

export interface AtlassianPage {
  id: string;
  type: string;
  status: string;
  title: string;
  space: {
    id: string;
    key: string;
    name: string;
  };
  version: {
    number: number;
    when: string;
  };
  _links: {
    webui: string;
    self: string;
  };
}

export interface AtlassianProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls: {
    '48x48': string;
    '24x24': string;
    '16x16': string;
    '32x32': string;
  };
  simplified: boolean;
  style: string;
}

export interface AtlassianIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: string;
    status: {
      name: string;
      statusCategory: {
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority: {
      name: string;
      iconUrl: string;
    };
    issuetype: {
      name: string;
      iconUrl: string;
      subtask: boolean;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
      avatarUrls: {
        '48x48': string;
        '24x24': string;
        '16x16': string;
        '32x32': string;
      };
    };
    created: string;
    updated: string;
  };
}

export interface ConfluencePagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (
    selectedPages: EnhancedAtlassianPage[],
    pageIds: string[]
  ) => void;
  type: SupportingDocType | PRDBasedType;
}

export interface JiraTicketsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (
    selectedTickets: EnhancedAtlassianIssue[],
    ticketIds: string[]
  ) => void;
  onConfirmSingle?: (selectedTicket: EnhancedAtlassianIssue) => void;
  type: PRDBasedType | IncidentBasedType;
  mode?: 'multi' | 'single';
}

// Enhanced versions with selection state
export interface EnhancedAtlassianIssue extends AtlassianIssue {
  selected?: boolean;
  projectKey: string;
  projectName: string;
}

export interface EnhancedAtlassianPage extends AtlassianPage {
  selected?: boolean;
  spaceKey: string;
  spaceName: string;
}

export interface ConfluenceSpaceSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (spaceKey: string) => void;
  title?: string;
  description?: string;
}

export interface JiraProjectSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectKey: string) => void;
  title?: string;
  description?: string;
}

export interface JiraTicketSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (issueKey: string) => void;
  title?: string;
  description?: string;
}
