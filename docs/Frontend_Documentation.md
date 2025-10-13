# DevOrbit AI Frontend - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Type System](#type-system)
5. [State Management](#state-management)
6. [Component Architecture](#component-architecture)
7. [Agent Pages](#agent-pages)
8. [Integration Flows](#integration-flows)
9. [API Communication](#api-communication)
10. [Authentication & Authorization](#authentication--authorization)
11. [Development Guide](#development-guide)

---

## Overview

The DevOrbit AI web application is a modern Next.js 15 application built with TypeScript and React 19, providing an intuitive interface for AI-powered SDLC automation. It features real-time AI interactions, comprehensive third-party integrations, and agent-specific workflows for development, quality assurance, and product management tasks.

### Key Features

- ✅ **6 Specialized AI Agents** with custom UIs
- ✅ **11+ Service Integrations** (GitHub, Jira, Notion, Sentry, DataDog, etc.)
- ✅ **Real-Time AI Streaming** with Vercel AI SDK
- ✅ **Type-Safe Development** with comprehensive TypeScript definitions
- ✅ **Global State Management** with Zustand and persistence
- ✅ **OAuth 2.0 Flows** for secure third-party connections
- ✅ **Responsive Design** with Tailwind CSS 4
- ✅ **Component Library** using Radix UI and shadcn/ui patterns

---

## Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.3 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5+ | Type-safe JavaScript |
| **Node.js** | 18+ | JavaScript runtime |

### UI & Styling

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Radix UI** | Various | Headless UI primitives |
| **Lucide React** | 0.525.0 | Icon library |
| **Next Themes** | 0.4.6 | Dark mode support |
| **tw-animate-css** | 1.3.5 | Animation utilities |

### State & Data

| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.6 | Global state management |
| **Vercel AI SDK** | 4.3.19 | AI streaming chat |
| **TanStack Table** | 8.21.3 | Data table component |
| **React Markdown** | 10.1.0 | Markdown rendering |
| **React Force Graph 2D** | 1.28.0 | Graph visualization |

### Development Tools

| Technology | Version | Purpose |
|------------|---------|---------|
| **Vitest** | 3.2.4 | Unit testing |
| **ESLint** | 9 | Code linting |
| **Prettier** | 3.6.2 | Code formatting |
| **TypeScript ESLint** | 8.38.0 | TS-specific linting |

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page (redirect)
│   │   ├── (auth)/                # Auth route group
│   │   │   └── login/page.tsx
│   │   ├── (agents)/              # Protected routes
│   │   │   ├── layout.tsx         # Main layout + AuthGuard
│   │   │   ├── dashboard/
│   │   │   ├── chat/
│   │   │   ├── settings/
│   │   │   ├── development/
│   │   │   ├── product-management/
│   │   │   └── quality-assurance/
│   │   └── api/auth/              # OAuth callbacks
│   │
│   ├── components/                # Component library
│   │   ├── ui/                    # Base UI primitives (17 components)
│   │   ├── shared/                # Reusable business components (60+)
│   │   ├── features/              # Agent-specific components
│   │   ├── layout/                # Layout components
│   │   ├── auth/                  # Auth components
│   │   ├── dashboard/             # Dashboard widgets
│   │   └── icons/                 # Custom icons
│   │
│   ├── types/                     # TypeScript definitions (19 files)
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── github.ts
│   │   ├── atlassian.ts
│   │   ├── notion.ts
│   │   ├── integrations.ts
│   │   ├── test-cases.ts
│   │   ├── agent-rca.ts
│   │   ├── agent-api-suite.ts
│   │   └── ...
│   │
│   ├── store/                     # Zustand state stores
│   │   ├── user.ts                # User auth state
│   │   ├── oauth.ts               # Integration connections (11 services)
│   │   └── project.ts             # Agent session state (825 lines)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useGitHub.ts
│   │   ├── useNotion.ts
│   │   ├── useAtlassian.ts
│   │   ├── useOAuthTokenHandler.ts
│   │   └── useAgentSession.ts
│   │
│   ├── lib/                       # Utility libraries
│   │   └── api/
│   │       └── api.ts             # API client
│   │
│   └── tests/                     # Test files
│       ├── setup.ts
│       └── example/
│
├── public/                        # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── vitest.config.mts
```

---

## Type System

The application uses **19 TypeScript definition files** for comprehensive type safety.

### Core Types

#### API Response Types (`api.ts`)

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface ApiError {
  message: string;
  status: number;
  code?: string;
}

interface RequestConfig {
  endpoint: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: any;
  params?: Record<string, string>;
  headers?: Record<string, string>;
}
```

#### Authentication Types (`auth.ts`)

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
```

#### Chat Types (`chat.ts`)

```typescript
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: any }
  | { type: 'tool-result'; toolCallId: string; result: any };

interface MessageWithParts {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}
```

### Integration Types

#### GitHub (`github.ts`)

```typescript
interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}
```

#### Notion (`notion.ts`)

```typescript
interface NotionPage {
  id: string;
  properties: {
    title: {
      id: string;
      type: string;
      title: Array<{
        type: string;
        text: { content: string; link?: { url: string } };
        plain_text: string;
      }>;
    };
  };
  url: string;
  created_time: string;
  last_edited_time: string;
}

interface SelectedNotionPage {
  id: string;
  url: string;
}
```

#### Atlassian (`atlassian.ts`)

```typescript
interface AtlassianSpace {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  _links: {
    webui: string;
    self?: string;
  };
}

interface AtlassianPage {
  id: string;
  type: string;
  status: string;
  title: string;
  space: {
    id: string;
    key: string;
    name: string;
  };
  _links: {
    webui: string;
  };
}

interface AtlassianIssue {
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
      avatarUrls: Record<string, string>;
    };
    created: string;
    updated: string;
  };
}
```

### Agent-Specific Types

#### Test Cases (`test-cases.ts`)

```typescript
interface TestCase {
  id: string;
  title: string;
  type: 'functional' | 'edge' | 'negative' | 'regression';
  description: string;
  priority: string;
  environment: string;
  module: string;
  preconditions?: string[];
  test_steps?: Array<{
    step_id: string;
    action: string;
    test_data?: string;
    expected_result?: string;
  }>;
}
```

#### Root Cause Analysis (`agent-rca.ts`)

```typescript
interface RCAData {
  incident: {
    id: string;
    title: string;
    severity: string;
    detected_at: string;
    resolved_at: string | null;
    duration_minutes: number;
  };
  possible_solutions: Array<{
    id: string;
    type: 'immediate' | 'short_term' | 'long_term';
    title: string;
    description: string;
    effort: string;
    confidence: number;
    auto_fixable: boolean;
  }>;
}
```

#### API Testing (`agent-api-suite.ts`)

```typescript
interface ApiSpec {
  id: string;
  name: string;
  specType: string;
  source: string;
  type: 'url' | 'file';
  uploadedAt: string;
}

interface Framework {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
}

interface ApiTestCase {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  status: 'pass' | 'fail' | 'pending';
}
```

---

## State Management

The application uses **Zustand** with three main stores, all persisted to localStorage.

### 1. User Store (`store/user.ts`)

**Purpose**: Manages user authentication state

```typescript
interface UserState {
  name: string | null;
  email: string | null;
  accessToken: string | null;
  isHydrated: boolean;  // SSR hydration tracking

  // Actions
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setAccessToken: (accessToken: string) => void;
  setHydrated: (hydrated: boolean) => void;
  resetUser: () => void;
}
```

**Features**:
- Persisted to `localStorage` with key `'user-storage'`
- Redux DevTools integration
- Hydration callback for SSR safety

**Usage**:
```typescript
import { useUser } from '@/store/user';

const { name, email, accessToken, setAccessToken, resetUser } = useUser();

// Login
setAccessToken('Bearer eyJhbGci...');

// Logout
resetUser();
```

### 2. OAuth Store (`store/oauth.ts`)

**Purpose**: Tracks connection status for 11 integrations

```typescript
interface OAuthState {
  notionConnection: { isConnected: boolean; id: number };
  gitHubConnection: { isConnected: boolean; id: number };
  atlassianMCPConnection: { isConnected: boolean; id: number };
  figmaConnection: { isConnected: boolean; id: number };
  pagerDutyConnection: { isConnected: boolean; id: number };
  sentryConnection: { isConnected: boolean; id: number };
  newRelicConnection: { isConnected: boolean; id: number };
  dataDogConnection: { isConnected: boolean; id: number };
  grafanaConnection: { isConnected: boolean; id: number };
  cloudWatchConnection: { isConnected: boolean; id: number };
  userFilesConnection: { isConnected: boolean; id: number };

  // Actions for each connection
  setNotionConnection: (connection: { isConnected: boolean; id: number }) => void;
  // ... similar for all integrations

  resetConnections: () => void;
}
```

**Features**:
- Persisted to `localStorage` with key `'oauth-store'`
- Individual reset methods for each integration
- Global reset for logout

**Usage**:
```typescript
import { useOAuth } from '@/store/oauth';

const { notionConnection, setNotionConnection } = useOAuth();

// Connect integration
setNotionConnection({ isConnected: true, id: 123 });

// Check connection status
if (notionConnection.isConnected) {
  // Show connected UI
}
```

### 3. Project Store (`store/project.ts`)

**Purpose**: Manages comprehensive agent session state

**Key State Slices**:

```typescript
interface ProjectState {
  // Session metadata
  projectName: string;
  analysisType: string;
  aiEngine: string;
  mcpAgents: string[];
  userPrompt: string;
  agentType: string;
  sessionId: string;

  // GitHub
  gitHubRepos: {
    repositories: RepositoryState[];
    selectedRepositories: { url: string; branch: string }[];
    selectedPR?: { html_url: string } | null;
  };

  // PRD Sources
  prdnotion: { pages: NotionPage[]; selectedPages: SelectedNotionPage[] };
  prdconfluence: { pages: AtlassianPage[]; selectedPages: string[] };
  prdjira: { tickets: AtlassianIssue[]; selectedTickets: string[] };
  prdfiles: { files: FileInfo[]; selectedFiles: string[] };

  // Documentation Sources
  docsnotion: { pages: NotionPage[]; selectedPages: SelectedNotionPage[] };
  docsconfluence: { pages: AtlassianPage[]; selectedPages: string[] };
  docsjira: { tickets: AtlassianIssue[]; selectedTickets: string[] };
  docsfigma: { files: FigmaFile[]; selectedFiles: string[] };
  docsfiles: { files: FileInfo[]; selectedFiles: string[] };

  // Logging Sources (RCA)
  loggingdatadog: { logs: LoggingService[] };
  logginggrafana: { logs: LoggingService[] };
  loggingcloudwatch: { logs: LoggingService[] };

  // Incident Sources (RCA)
  incidentjira: { incident: IncidentService | null };
  incidentpagerduty: { incident: IncidentService | null };
  incidentsentry: { incident: IncidentService | null };
  incidentnewrelic: { incident: IncidentService | null };
  incidentdatadog: { incident: IncidentService | null };

  // API Testing
  apiSpecs: { specs: ApiSpec[]; selectedSpecs: string[] };
  testCases: { testCases: ApiTestCase[]; selectedTestCases: string[] };
  apiFrameworks: { frameworks: Framework[] };

  // Caching
  cachedNotionPages: NotionPage[];
  cachedConfluenceSpaces: AtlassianSpace[];
  cachedJiraProjects: AtlassianProject[];
  loggingServicesCache: Record<string, Record<string, LoggingService[]>>;

  // Output Configuration
  output_config_type: string[];
  output_config_content: string[];
  output: OutputConfigType[];

  // 100+ setter/getter methods
}
```

**Features**:
- **825 lines** of comprehensive state management
- Persisted to `localStorage` with key `'project-storage'`
- Redux DevTools integration
- Granular setters for each data slice
- Cache management for performance

**Usage**:
```typescript
import { useProject } from '@/store/project';

const {
  projectName,
  setProjectName,
  gitHubRepos,
  setGitHubRepos,
  prdnotion,
  setPrdnotion,
  resetProject
} = useProject();

// Set project name
setProjectName('E-commerce Checkout');

// Add GitHub repository
setGitHubRepos({
  ...gitHubRepos,
  selectedRepositories: [
    { url: 'https://github.com/company/backend', branch: 'main' }
  ]
});

// Reset all state
resetProject();
```

---

## Component Architecture

### Component Categories

#### 1. UI Primitives (`components/ui/`)

Shadcn/ui-style components built on Radix UI primitives.

**List of Components**:
- `button.tsx` - Button with variants
- `input.tsx` - Text input
- `textarea.tsx` - Multi-line text input
- `card.tsx` - Card container with header/content/footer
- `dialog.tsx` - Modal dialog
- `table.tsx` - Data table
- `tabs.tsx` - Tab navigation
- `badge.tsx` - Badge/pill component
- `dropdown-menu.tsx` - Dropdown menu
- `select.tsx` - Select dropdown
- `checkbox.tsx` - Checkbox input
- `avatar.tsx` - User avatar
- `skeleton.tsx` - Loading skeleton
- `sonner.tsx` - Toast notification wrapper
- `popover.tsx` - Popover component
- `label.tsx` - Form label
- `accordion.tsx` - Accordion/collapsible

**Example** (`button.tsx`):
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input bg-background...",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
  }
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
```

#### 2. Shared Components (`components/shared/`)

**60+ reusable business components** for common functionality.

**Key Components**:

**Navigation**:
- `Sidebar.tsx` - Main navigation sidebar
- `Header.tsx` - Top header bar

**Agent Controls**:
- `ProjectNameInput.tsx` - Project name field
- `AIEngineSelector.tsx` - AI model dropdown
- `AnalysisScopeSelector.tsx` - Analysis depth selector
- `CustomInstruction.tsx` - Custom prompt textarea
- `AgentActionButton.tsx` - Start agent button

**Integration Components**:
- `DocumentIntegration.tsx` - Multi-source document picker
- `RepositorySelector.tsx` - GitHub repo selector

**Modal Components** (11 integration modals):
- `NotionPagesModal.tsx`
- `ConfluencePagesModal.tsx`
- `JiraTicketsModal.tsx`
- `GitHubModal.tsx`
- `FigmaFileModal.tsx`
- `DataDogModal.tsx`
- `PagerDutyModal.tsx`
- `SentryModal.tsx`
- `NewRelicModal.tsx`
- `GrafanaModal.tsx`
- `CloudWatchModal.tsx`

**Document Display Components**:
- `NotionDocuments.tsx`
- `ConfluenceDocuments.tsx`
- `JiraDocuments.tsx`
- `FigmaDocuments.tsx`
- `UserDocuments.tsx`

**Visualization**:
- `KnowledgeGraph.tsx` - Force graph for code analysis
- `TreeView.tsx` - File tree display
- `MarkdownRenderer.tsx` - Markdown content display

#### 3. Feature Components (`components/features/`)

**Agent-specific** and feature-specific components.

**Chat Components** (`features/chat/`):
- `Chat.tsx` - Main chat interface
- `ChatMessage.tsx` - Message renderer
- `AssistantMessage.tsx` - AI response display
- `UserMessage.tsx` - User message display
- `AnalysisLoader.tsx` - Loading state
- `ReportHeader.tsx` - Report metadata header
- `CodeReviewReport.tsx` - Code review display
- `TestCaseViewer.tsx` - Test case table
- `CreatedFilesAccordion.tsx` - Generated files accordion

**Tool Renderers** (`features/chat/tool-renderers/`):
- `TodoTool.tsx` - Todo list display
- `TextTool.tsx` - Plain text display
- `FetchServicesTool.tsx` - Service fetch status

**Agent-Specific** (`features/`):
- `api-testing/` - API testing suite components
- `code-review/` - Code review components
- `product-management/` - PM components
- `quality-assurance/` - QA components

#### 4. Layout Components (`components/layout/`)

**MainLayout**:
```typescript
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className='flex h-screen'>
      <Sidebar />
      <div className='flex flex-1 flex-col overflow-hidden'>
        <Header />
        <main className='flex-1 overflow-auto bg-gray-50 p-6'>
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### 5. Auth Components (`components/auth/`)

**AuthGuard**:
```typescript
export const AuthGuard = memo<AuthGuardProps>(({ children }) => {
  const router = useRouter();
  const { accessToken, isHydrated } = useUser();
  const [authState, setAuthState] = useState<AuthState>('loading');

  useEffect(() => {
    if (!isHydrated) {
      setAuthState('loading');
      return;
    }

    if (!accessToken?.trim()) {
      setAuthState('unauthenticated');
      router.push('/login');
      return;
    }

    setAuthState('authenticated');
  }, [accessToken, isHydrated, router]);

  if (authState === 'loading') {
    return <LoadingSpinner />;
  }

  if (authState === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
});
```

---

## Agent Pages

### Agent Page Pattern

Each agent follows a consistent structure:

```typescript
export default function AgentPage() {
  useOAuthTokenHandler(); // Handle OAuth callbacks

  const { projectName, gitHubRepos } = useProject();
  const canStart = /* validation logic */;

  return (
    <div className="space-y-8">
      <ProjectNameInput />
      {/* Agent-specific inputs */}
      <DocumentIntegration type="supporting_doc" agentType="agent_name" />
      <AIEngineSelector />
      <AnalysisScopeSelector />
      <CustomInstruction />
      <AgentActionButton disabled={!canStart} />
    </div>
  );
}
```

### 1. Code Understanding Agent

**Route**: `/development/code-understanding`

**Required Inputs**:
- Project name
- GitHub repositories (1+)

**Optional Inputs**:
- Documentation sources (Notion, Confluence,Files)

**Validation**:
```typescript
const canStart = projectName !== '' &&
                 gitHubRepos.selectedRepositories.length > 0;
```

### 2. Code Reviewer Agent

**Route**: `/development/code-reviewer-agent`

**Required Inputs**:
- Project name
- Pull Request (via URL or selector)

**Component**:
```typescript
export default function CodeReviewerAgent() {
  useOAuthTokenHandler();

  const { gitHubRepos, projectName } = useProject();
  const canStart = gitHubRepos.selectedPR && projectName !== '';

  return (
    <div className='space-y-8'>
      <ProjectNameInput />
      <PullRequestSelector showPasteURL={true} />
      <DocumentIntegration type='supporting_doc' agentType='code_reviewer' />
      <AIEngineSelector />
      <AnalysisScopeSelector />
      <CustomInstruction />
      <AgentActionButton disabled={!canStart} />
    </div>
  );
}
```

### 3. Test Generation Agent

**Route**: `/quality-assurance/test-gen-ai-agent`

**Required Inputs**:
- Project name
- PRD sources (Notion, Confluence, Jira, Files)

**Optional Inputs**:
- Supporting documentation
- Output configuration (Jira project/epic)

### 4. Requirements to Tickets Agent

**Route**: `/product-management/requirement-to-ticket-agent`

**Required Inputs**:
- Project name
- PRD sources

**Optional Inputs**:
- Output configuration (target Jira project)

### 5. API Testing Suite Agent

**Route**: `/quality-assurance/api-testing-suite-agent`

**Required Inputs**:
- Project name
- API Spec (OpenAPI/Swagger file or URL)

**Optional Inputs**:
- Test cases (Jira or files)
- GitHub repository (for PR creation)
- Framework selection (Playwright, REST Assured, Postman)

### 6. Root Cause Analysis Agent

**Route**: `/development/root-cause-analysis`

**Required Inputs**:
- Project name
- Incident (from Jira, PagerDuty, Sentry, New Relic, or DataDog)

**Optional Inputs**:
- GitHub repositories
- Logs (DataDog, Grafana, CloudWatch)
- Supporting documentation

---

## Integration Flows

### OAuth Flow

**Sequence**:

1. **User initiates connection**:
   ```typescript
   const handleConnect = () => {
     window.location.href = '/api/auth/notion';
   };
   ```

2. **Next.js API route redirects to provider**:
   ```typescript
   // app/api/auth/notion/route.ts
   export async function GET(request: NextRequest) {
     if (!code) {
       // Redirect to OAuth provider
       return NextResponse.redirect(OAUTH_URL);
     }

     // Exchange code for token
     const tokens = await exchangeCodeForToken(code);

     // Redirect with token in hash
     redirectUrl.hash = new URLSearchParams({
       provider: 'notion',
       access_token: tokens.access_token,
     }).toString();

     return NextResponse.redirect(redirectUrl);
   }
   ```

3. **Frontend extracts token from URL**:
   ```typescript
   // hooks/useOAuthTokenHandler.ts
   const hash = window.location.hash.substring(1);
   const hashParams = new URLSearchParams(hash);
   const provider = hashParams.get('provider');
   const accessToken = hashParams.get('access_token');
   ```

4. **Save to backend**:
   ```typescript
   const response = await integrationApi.create(
     {
       name: provider,
       auth_type: 'oauth2',
       type: provider,
       credentials: { access_token: accessToken },
     },
     userAccessToken
   );
   ```

5. **Update local state**:
   ```typescript
   setNotionConnection({
     isConnected: true,
     id: response.data.id,
   });
   ```

### Integration Modal Pattern

**Standardized modal flow** for all integrations:

```typescript
export function NotionPagesModal({ isOpen, onClose, onConfirm, type }: Props) {
  const { pages, isLoading, searchPages } = useNotion();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      searchPages(''); // Initial load
    }
  }, [isOpen]);

  const handleSearch = useDebouncedCallback((query: string) => {
    searchPages(query);
  }, 500);

  const handleConfirm = () => {
    const selectedPages = pages.filter(p => selectedPageIds.includes(p.id));
    onConfirm?.(selectedPages);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Notion Pages</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
        />

        {/* List with checkboxes */}
        {isLoading ? <Skeleton /> : (
          <div className="space-y-2">
            {pages.map(page => (
              <div key={page.id} className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedPageIds.includes(page.id)}
                  onCheckedChange={(checked) => {
                    setSelectedPageIds(prev =>
                      checked
                        ? [...prev, page.id]
                        : prev.filter(id => id !== page.id)
                    );
                  }}
                />
                <label>{page.properties.title.title[0]?.plain_text}</label>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## API Communication

### API Client (`lib/api/api.ts`)

**Centralized API layer** with error handling:

```typescript
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function apiCall<T = any>({
  endpoint,
  method = 'GET',
  data,
  params,
  headers = {},
  ...config
}: RequestConfig): Promise<ApiResponse<T>> {
  let url = `${API_BASE_URL}${endpoint}`;

  // Add query params
  if (params && Object.keys(params).length > 0) {
    url += `?${new URLSearchParams(params).toString()}`;
  }

  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...config,
  };

  // Add body for POST/PUT/PATCH
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    if (data instanceof FormData) {
      requestConfig.body = data;
      delete (requestConfig.headers as any)['Content-Type'];
    } else {
      requestConfig.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, requestConfig);

    if (response.status === 204) {
      return { success: true, data: undefined };
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
    toast.error(`Status: ${error.status} Message: ${error.message}`);
    throw error;
  }
}
```

### API Modules

**Authentication**:
```typescript
export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiCall<LoginResponse>({
      endpoint: API_ENDPOINTS.AUTH.LOGIN(),
      method: 'POST',
      data: credentials,
    }),

  me: (accessToken: string) =>
    apiCall<AuthUser>({
      endpoint: API_ENDPOINTS.AUTH.ME(),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
```

**GitHub**:
```typescript
export const githubApi = {
  getRepositories: (accessToken: string) =>
    apiCall<Repository[]>({
      endpoint: API_ENDPOINTS.GITHUB.REPOSITORIES(),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getBranches: (owner: string, repo: string, accessToken: string) =>
    apiCall<GitHubBranch[]>({
      endpoint: API_ENDPOINTS.GITHUB.BRANCHES(owner, repo),
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
```

**Sessions**:
```typescript
export const sessionApi = {
  create: (agentType: string, payload: any, accessToken: string) =>
    apiCall<SessionResponse>({
      endpoint: API_ENDPOINTS.SESSION.CREATE(agentType),
      method: 'POST',
      data: payload,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};
```

### Custom Hooks

**useGitHub**:
```typescript
export function useGitHub() {
  const { accessToken } = useUser();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRepositories = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const response = await githubApi.getRepositories(accessToken);
      if (response.success && response.data) {
        setRepositories(response.data);
      }
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    repositories,
    isLoading,
    error,
    fetchRepositories,
    clearData: () => setRepositories([]),
  };
}
```

---

## Authentication & Authorization

### Login Flow

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // 1. Login
    const response = await authApi.login({ email, password });

    if (response.data?.access_token) {
      toast.success('Login successful');
      setAccessToken(response.data.access_token);

      // 2. Fetch user profile
      const user = await authApi.me(response.data.access_token);
      setName(user.data?.name ?? 'User');
      setEmail(user.data?.email ?? email);

      // 3. Fetch integrations
      const integrations = await integrationApi.list(response.data.access_token);
      if (integrations.data) {
        processIntegrations(integrations.data);
      }

      // 4. Redirect
      router.push(returnUrl || '/dashboard');
    }
  } catch {
    toast.error('Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

### Route Protection

```typescript
// (agents)/layout.tsx
export default function DashboardLayoutPage({ children }) {
  return (
    <Providers>
      <HeaderTitleManager />
      <AuthGuard>
        <MainLayout>{children}</MainLayout>
      </AuthGuard>
    </Providers>
  );
}
```

---

## Development Guide

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# OAuth Credentials
NEXT_PUBLIC_NOTION_CLIENT_ID=xxx
NEXT_PUBLIC_NOTION_CLIENT_SECRET=xxx
NEXT_PUBLIC_GITHUB_CLIENT_ID=xxx
NEXT_PUBLIC_GITHUB_CLIENT_SECRET=xxx
# ... other integrations
```

### Adding a New Agent Page

1. **Create route**: `app/(agents)/category/agent-name/page.tsx`
2. **Define required inputs**: Determine what data is needed
3. **Create session payload**: Extend `useAgentSession` hook
4. **Add to navigation**: Update `Sidebar.tsx`
5. **Create agent-specific components**: Add to `components/features/`

### Adding a New Integration

1. **Define types**: Add to `types/integration-name.ts`
2. **Create API methods**: Extend `lib/api/api.ts`
3. **Create custom hook**: Add `hooks/useIntegrationName.ts`
4. **Create modal**: Add `components/shared/IntegrationNameModal.tsx`
5. **Create OAuth route**: Add `app/api/auth/integration-name/route.ts`
6. **Update OAuth store**: Add connection state to `store/oauth.ts`
7. **Update project store**: Add data slices to `store/project.ts`

### Testing Components

```typescript
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Component from './Component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

---

## Conclusion

The DevOrbit AI frontend is a production-ready Next.js application with:

✅ **Type Safety**: Comprehensive TypeScript coverage
✅ **State Management**: Robust Zustand stores with persistence
✅ **Component Architecture**: Well-organized, reusable components
✅ **Integration System**: Consistent patterns across 11+ services
✅ **Agent System**: Specialized UIs for 6 agent types
✅ **Developer Experience**: Modern tooling, hot reload, type checking
✅ **Performance**: Memoization, code splitting, optimistic updates

The modular architecture and consistent patterns make it easy to extend with new agents and integrations.
