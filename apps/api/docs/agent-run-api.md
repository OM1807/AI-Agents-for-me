## Agent Run API

This document describes the streaming Agent Run APIs and the request contracts. Streams support three protocols:

- AI SDK UI message stream (v5)
- AI SDK v4 data stream (default)
- Server‑Sent Events (SSE)

Select the protocol via the `protocol` query param (`v5` | `v4` | `sse`).
- For `v5`, the response includes header `x-vercel-ai-ui-message-stream: v1` and uses `Content-Type: text/event-stream`.
- For `v4`, the response includes header `x-vercel-ai-data-stream: v1` and uses `Content-Type: text/plain`.
- For `sse`, the response uses `Content-Type: text/event-stream`.

### Endpoints

- POST `/api/v1/agents/{agent_type}/sessions`
  - Creates a new session for the agent type.

- POST `/api/v1/agents/{agent_type}/run?session_id={session_id}`
  - Runs an agent in an existing session and streams results.
  - If the session has an llm_session_id, it continues the conversation; otherwise, it starts a new one.

- POST `/api/v1/agents/{agent_type}/{session_id}/run` - DEPRECATED
  - Old endpoint for running a session, use the query parameter version instead.

All endpoints require authentication and respect per-user scoping.

### Query Parameters

For run endpoint:
- `session_id` (required): `int`
  - The session ID to run the agent in.
- `protocol` (optional): `"v5" | "v4" | "sse"`
  - Default: `v4`
  - Selects the streaming protocol.
- `include_event_names` (optional, only for `protocol=sse`): `true | false`
  - Default: `true`
  - When `true`, SSE emits named events using the internal `type` (e.g., `event: tool_call`). When `false`, SSE emits data‑only messages without an `event:` field. In both cases, the JSON payload includes a `type` field.

### Path Parameters

- `agent_type` (string; enum `AgentIdentifier`):
  - `code_analysis`
  - `test_case_generation`
  - `code_reviewer`

### Request Bodies

#### Create session: SessionCreate

```
{
  "project_name": "optional-project-name",
  "mcps": ["github", "atlassian"],
  "custom_properties": { /* agent-specific properties */ }
}
```

- `project_name`: optional; if omitted, a default is used.
- `mcps`: optional list of integration providers to include; when omitted, the backend renders MCP configs for all connected active integrations.
- `custom_properties`: flexible per-agent payload; see Code Analysis specification below.

Response:
```
{
  "session_id": 123,
  "project_id": 456,
  "agent_id": 789,
  "is_active": true,
  "mcps": ["github", "atlassian"],
  "custom_properties": { /* agent-specific properties */ },
  "created_at": "2025-08-20T07:18:59.453Z"
}
```

#### Run session: AgentRunRequest

```
{
  "messages": [ {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}, ... ]
}
```

- `messages`: list of message dicts. The backend persists only user messages.
- `session_id`: provided as query parameter.

### Streaming Protocols

#### AI SDK UI Message Stream (v5)

Responses follow the AI SDK UI message stream protocol and include header `x-vercel-ai-ui-message-stream: v1` with `Content-Type: text/event-stream`.

- Always data-only SSE frames (no `event:` field)
- Initial start part with a generated `messageId`
- Text parts: `text-start` → `text-delta` → `text-end`
- Tool call parts: `start-step` → `tool-input-start` → `tool-input-available`
- Tool result parts: `tool-output-available` → `finish-step`
- Error → `{ "type": "error", "errorText": "..." }`
- Finish → at least `{ "type": "finish" }`, followed by terminal `data: [DONE]`

Example:
```
data: {"type":"start","messageId":"ses_123"}

data: {"type":"text-start","id":"msg_1"}
data: {"type":"text-delta","id":"msg_1","delta":"Hello"}
data: {"type":"text-end","id":"msg_1"}

data: {"type":"start-step"}
data: {"type":"tool-input-start","toolCallId":"call_123","toolName":"todo"}
data: {"type":"tool-input-available","toolCallId":"call_123","toolName":"todo","input":{"item":"..."}}

data: {"type":"tool-output-available","toolCallId":"call_123","output":{"ok":true}}
data: {"type":"finish-step"}

data: {"type":"finish"}
data: [DONE]
```

#### AI SDK v4 Data Stream (default)

Responses follow the AI SDK v4 frames and include header `x-vercel-ai-data-stream: v1` with `Content-Type: text/plain`:

- Text/data parts as frames (implementation may include structured frames)
- Tool call → `9:{json}\n`
- Tool result → `a:{json}\n`
- Error → `3:{json}\n`
- Finish → `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`

Reference: [AI SDK UI Stream Protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)

#### Server‑Sent Events (SSE)

Responses use standard SSE with `Content-Type: text/event-stream` and no `x-vercel-ai-data-stream` header.

- Named events (default):
  - Example:
    ```
    event: tool_call
    data: {"type":"tool_call","toolCallId":"call_123","toolName":"todo","args":{"item":"..."}}

    event: finish
    data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}
    ```
- Data‑only messages (when `include_event_names=false`):
  - Example:
    ```
    data: {"type":"tool_call","toolCallId":"call_123","toolName":"todo","args":{"item":"..."}}

    data: {"type":"finish","finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}
    ```

Notes:
- Each payload includes a `type` field (e.g., `text`, `data`, `tool_call`, `tool_result`, `annotation`, `error`, `finish`).
- A final `finish` message is guaranteed even if upstream omitted it.
- See MDN for SSE format details: [Using server‑sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)

### Tool Event Mappings for supporting docs

The following table shows how tool names in the stream events map to their corresponding MCP functions. This helps the frontend understand which tools are being called during agent execution:

#### Atlassian (Confluence & Jira) Tools
- `accessible_resources` → `mcp__atlassian__getAccessibleAtlassianResources`
- `jira_projects` → `mcp__atlassian__getVisibleJiraProjects`
- `jira_search` → `mcp__atlassian__searchJiraIssuesUsingJql`
- `jira_issue` → `mcp__atlassian__getJiraIssue`
- `jira_create` → `mcp__atlassian__createJiraIssue`
- `confluence_spaces` → `mcp__atlassian__getConfluenceSpaces`
- `confluence_pages_in_space` → `mcp__atlassian__getPagesInConfluenceSpace`
- `confluence_search` → `mcp__atlassian__searchConfluenceUsingCql`
- `confluence_page` → `mcp__atlassian__getConfluencePage`

#### Notion Tools
- `notion_page_retrieve` → `mcp__notion__API-retrieve-a-page`
- `notion_page_block` → `mcp__notion__API-get-block-children`


### Code Analysis Agent Specification (custom_properties)

When `agent_type = code_analysis`, `custom_properties` supports the following keys:

- `github_repos` (required):
  - Array of repositories to analyze.
  - Example: `[{"url": "https://github.com/acme/webapp", "branch": "main"}]`

- `docs` (optional):
  - Array of provider-scoped document references.
  - Example: `[{"provider": "confluence", "id": "SPACE-123"}, {"provider": "Notion", "urls": ["https://notion.so/page-id1","https://notion.so/page-id2"]]`

- `contents_to_include` (optional):
  - Array of high-level sections to include in output.
  - Example: `["findings", "architecture", "readme", "api_docs"]`

- `analysis_type` (optional):
  - String enum: `"deep" | "basic"`
  - Default: `"basic"`

These keys are advisory for v1 and will be validated more strictly as the workflow implementations land. See `apps/api/seeds/data/agents.json` for broader agent metadata.

### Code Reviewer Agent Specification (custom_properties)

When `agent_type = code_reviewer`, `custom_properties` supports the following keys:

- `inputs` (required):
  - Array of pull request sources to review.
  - Items:
    - Pull Request input:
      - `{ "type": "pr", "provider": "github", "urls": ["https://github.com/owner/repo/pull/123"] }`

- `docs` (optional):
  - Array of provider-scoped document references for additional context during review.
  - Example: `[{"provider": "Confluence", "ids": ["SPACE-123"]}, {"provider": "Notion", "urls": ["https://notion.so/page-id1"]}]`

- `analysis_level` (optional):
  - String enum: `"deep" | "basic"`
  - Default: `"basic"`
  - Controls the depth of code analysis performed

- `custom_instructions` (optional):
  - Free-text instructions to customize the review focus.
  - Example: `"Focus on security vulnerabilities and performance issues"`

Notes:
- The workflow retrieves PR content from GitHub and analyzes changes proportionally
- Simple changes (docs, config) receive minimal review focusing on accuracy
- Code changes are checked for bugs, security, and performance issues
- Complex changes receive deep analysis of architecture and risks
- Include `"github"` in the request `mcps` to enable GitHub tools

### Test Case Generation Agent Specification (custom_properties)

When `agent_type = test_case_generation`, `custom_properties` supports the following keys:

- `inputs` (required):
  - Array of input sources to generate test cases for. Each source is processed independently and a separate JSON object is streamed for each.
  - Items:
    - Issue input:
      - `{ "type": "issue", "provider": "Jira", "key": "OAI-23" }`
      - Use `key` as a single Jira issue key.
    - Document input (Notion by URL):
      - `{ "type": "document", "provider": "Notion", "urls": ["https://www.notion.so/workspace/page-id"] }`
    - Document input (Confluence by page IDs):
      - `{ "type": "document", "provider": "Confluence", "ids": ["425986"] }`

- `docs` (optional):
  - Additional provider-scoped documents to consult while generating cases.
  - Example:
    - `[{"provider":"Notion","urls":["https://www.notion.so/workspace/page-id"]},{"provider":"Confluence","ids":["425986"]},{"provider":"File","file_names":["README.md","API.md","example.pdf,"]}]`

- `output_config` (required):
  - Configuration for types and content sections to include in each test case.
  - Example:
    - `{"type":["functional","edge","negative","regression"],"contents":["general_info","preconditions_setup","steps","expected_results"]}`

- `custom_instructions` (optional):
  - Free-text instructions to refine generation.
  - Example: `"Create very high level test cases for the given issues and docs"`

Notes:
- The workflow renders prompts from templates and uses both `mcps` and `custom_properties` directly as context.
- Include the relevant MCPs in the request `mcps` (e.g., `"atlassian"`, `"notion"`) to enable provider tools.

#### Streaming Events (Artifacts)

During generation, the server emits artifact events after file operations complete. These events are emitted only after the underlying file tool has returned its `tool_result` (i.e., after the write/edit is finished):

- `data-source`: Emitted when a `tests/.../source.json` file is created/updated
- `data-testcase`: Emitted when a `tests/.../TC-*.json` test case file is created/updated

Each event includes the following payload schema:

```
{
  "artifact_type": "source" | "testcase",
  "actual_file_path": "<absolute-or-relative-path-as-reported-by-tool>",
  "file_path": "<path relative to workspace, POSIX, e.g. tests/issue-jira-OD-8/source.json>",
  "filename": "<basename>",
  "content_type": "json" | "md",
  "artifact_id": "<source-key or test-case id>",
  "content": { /* parsed JSON content of the file */ }
}
```

Examples (SSE named events):

```
event: data-source
data: {"artifact_type":"source","file_path":"tests/issue-jira-OD-8/source.json", ...}

event: data-testcase
data: {"artifact_type":"testcase","file_path":"tests/issue-jira-OD-8/TC-AUTH-001.json", ...}
```

Notes:
- Events are emitted after the corresponding `tool_result` to ensure the file content reflects the final state.
- `file_path` is always normalized relative to the workspace and starts with `tests/` when applicable.
- For edit operations, the backend reads the file from disk after the edit completes before emitting the event.

#### Artifacts: Structure and UI consumption

This section describes how the UI should interpret `source.json` and `TC-*.json` files and render them like the mockups.

##### Source key (folder name)

- Convention: `type-provider-identifier` (lowercase)
  - Issue: `issue-jira-OD-8`
  - Document (Notion URL or ID): `document-notion-250cd90c...` (URL slug or `id`)
- The source key equals the folder name under `tests/` and is used as the artifact ID for `data-source` events.

##### Sample `source.json`

```json
{
  "type": "issue",
  "provider": "jira",
  "properties": {
    "key": "OD-8",
    "title": "Implement user authentication system"
  },
  "test_case_index": [
    { "id": "TC-AUTH-001", "title": "Verify user login with valid credentials", "type": "functional", "file": "TC-AUTH-001.json" },
    { "id": "TC-AUTH-002", "title": "Boundary condition on password length", "type": "edge", "file": "TC-AUTH-002.json" },
    { "id": "TC-AUTH-003", "title": "Invalid password handling", "type": "negative", "file": "TC-AUTH-003.json" }
  ]
}
```

UI usage:
- Render one “suite card” per `data-source` (per folder under `tests/`).
- Header/title: prefer `content.properties.title`; if missing, fall back to:
  - Issue → `properties.key` (e.g., `OD-8`)
  - Document → `properties.title` or a shortened URL/ID
- Use `test_case_index` to pre-populate a list and order of test cases (by `id`). Actual details arrive via `data-testcase` events.
- Group by `type` into sections: Functional, Edge, Negative, Regression.

##### Sample test case file `TC-AUTH-001.json`

```json
{
  "id": "TC-AUTH-001",
  "title": "Verify user login with valid credentials",
  "type": "functional",
  "description": "Ensure that a registered user can log in using a valid username and password.",
  "priority": "high",
  "environment": "Chrome 120, Windows 11",
  "module": "User Authentication",
  "preconditions": [
    "User account exists with username testuser and password Pass@123",
    "Application is accessible at https://app.example.com"
  ],
  "steps": [
    { "step": 1, "action": "Navigate to login page", "test_data": "URL: https://app.example.com/login", "expected": "Login page loads successfully" },
    { "step": 2, "action": "Enter valid username", "test_data": "testuser", "expected": "Username is accepted" },
    { "step": 3, "action": "Enter valid password", "test_data": "Pass@123", "expected": "Password is accepted" },
    { "step": 4, "action": "Click on Login button", "test_data": null, "expected": "User is redirected to the dashboard" },
    { "step": 5, "action": "Verify session", "test_data": null, "expected": "A valid session token/cookie is created" }
  ],
  "expected_results": [
    "User is redirected to dashboard and session is established."
  ]
}
```

UI usage:
- Place the test in the section matching its `type`.
- Display required fields (7) always; show optional sections only when present (per `output_config`).
- Render `steps` as a table with columns: Step # (`step`), Action (`action`), Test Data (`test_data`), Expected (`expected`).

##### Realtime updates from artifact events

- On `data-source`:
  - Upsert suite by `artifact_id` (the source key)
  - Store `content` as the canonical source metadata and `test_case_index`
  - Prepare display groups by `type`
- On `data-testcase`:
  - Upsert the test case within the suite keyed by `content.id`
  - Ensure ordering follows `source.json.test_case_index`; if absent, order by `id`
  - Re-render the corresponding section (functional/edge/negative/regression)

Ignore events whose `file_path` does not start with `tests/`.

### MCP Selection

- If `mcps` is provided in the request, the backend renders only those providers.
- Otherwise, the backend renders all connected active integrations for the current user.

### Examples

#### Create Session

```
POST /api/v1/agents/code_analysis/sessions
{
  "project_name": "acme-docs",
  "mcps": ["confluence"],
  "custom_properties": {
    "github_repos": [{"url": "https://github.com/acme/webapp", "branch": "main"}],
    "docs": [
      {"provider": "Confluence", "ids": ["SPACE-123"]},
      {"provider": "Notion", "urls": ["https://notion.so/page-id1","https://notion.so/page-id2"]}
    ],
    "contents_to_include": ["findings", "readme"],
    "analysis_type": "deep"
  }
}

Response:
{
  "session_id": 123,
  "project_id": 456,
  "agent_id": 789,
  "is_active": true,
  "mcps": ["confluence"],
  "custom_properties": { /* ... */ },
  "created_at": "2025-08-20T07:18:59.453Z"
}
```

#### Run Session (Start)

```
POST /api/v1/agents/code_analysis/run?session_id=123
{
  "messages": [{"role": "user", "content": "Generate docs for the repo."}]
}
```

#### Create Session (test_case_generation)

```
POST /api/v1/agents/test_case_generation/sessions
{
  "mcps": ["atlassian", "notion"],
  "custom_properties": {
    "inputs": [
      {"type": "issue", "provider": "Jira", "key": "OAI-23"},
      {"type": "document", "provider": "Notion", "url": "https://www.notion.so/velotio/425986"},
      {"type": "document", "provider": "Confluence", "id": "425986"}
    ],
    "docs": [
      {"provider": "Notion", "urls": ["https://www.notion.so/velotio/425986"]},
      {"provider": "Confluence", "ids": ["425986"]}
    ],
    "output_config": {
      "type": ["functional", "edge", "negative", "regression"],
      "contents": ["general_info", "preconditions_setup", "steps", "expected_results"]
    },
    "custom_instructions": "Create very high level test cases for the given issues and docs"
  }
}
```

#### Run Session (test_case_generation)

```
POST /api/v1/agents/test_case_generation/run?session_id=124
{
  "messages": [{"role": "user", "content": "Generate high-level test cases."}]
}
```

#### Full Example (test_case_generation)

Step 1: Create Session
```
POST /api/v1/agents/test_case_generation/sessions
{
  "mcps": ["atlassian", "notion"],
  "custom_properties": {
    "inputs": [
      { "type": "issue", "provider": "Jira", "key": "OD-8" },
      { "type": "issue", "provider": "Jira", "key": "OD-9" },
      {
        "type": "document",
        "provider": "Notion",
        "id": "250cd90c-d2cd-806f-8b2f-d626a819d271",
        "url": "https://www.notion.so/SDLC-Agents-QA-Module-TestGen-AI-Agent-250cd90cd2cd806f8b2fd626a819d271"
      }
    ],
    "docs": [
      { "provider": "Notion", "id": "425986", "url": "https://www.notion.so/velotio/425986" },
      { "provider": "Confluence", "ids": ["425986"] },
      { "provider": "File", "file_names": ["README.md", "API.md"] }
    ],
    "output_config": {
      "type": ["functional", "negative"],
      "contents": ["general_info", "preconditions_setup", "steps", "expected_results"]
    },
    "custom_instructions": "Only generate 2-3 tests per type"
  }
}

Response:
{
  "session_id": 125,
  "project_id": 457,
  "agent_id": 790,
  "is_active": true,
  "mcps": ["atlassian", "notion"],
  "custom_properties": { /* ... */ },
  "created_at": "2025-08-20T07:18:59.453Z"
}
```

Step 2: Run Session
```
POST /api/v1/agents/test_case_generation/run?session_id=125
{
  "messages": [
    { "role": "user", "content": "Generate high-level test cases." }
  ]
}
```

#### Example (Run with SSE, data‑only)

```
POST /api/v1/agents/code_analysis/run?session_id=123&protocol=sse&include_event_names=false
{
  "messages": [{"role": "user", "content": "Generate docs for the repo."}]
}
```

#### Example (Run with v5 UI message stream)

```
POST /api/v1/agents/code_analysis/run?session_id=123&protocol=v5
{
  "messages": [{"role": "user", "content": "Generate docs for the repo."}]
}
```

#### Example (Continue conversation)

```
POST /api/v1/agents/code_analysis/run?session_id=123
{
  "messages": [{"role": "user", "content": "Also include API docs."}]
}
```

#### Example (Continue - test_case_generation)

```
POST /api/v1/agents/test_case_generation/run?session_id=124
{
  "messages": [{"role": "user", "content": "Refine the negative test cases and add more edge cases."}]
}
```

#### Create Session (code_reviewer)

```
POST /api/v1/agents/code_reviewer/sessions
{
  "project_name": "new-project-code-f",
  "mcps": ["github","atlassian","notion"],
  "custom_properties": {
    "custom_instructions": "start analyzing",
    "inputs": [
      {
        "provider": "github",
        "type": "pr",
        "urls": [
          "https://github.com/wegowise/importers/pull/14602"
        ]
      }
    ],
    "docs": [
      {"provider": "Confluence", "ids": ["SPACE-123"]},
      {"provider": "Notion", "urls": ["https://notion.so/style-guide"]}
    ],
    "analysis_level": "basic"
  }
}

Response:
{
  "session_id": 225,
  "project_id": 225,
  "agent_id": 148,
  "is_active": true,
  "mcps": ["github"],
  "custom_properties": {
    "custom_instructions": "start analyzing",
    "inputs": [
      {
        "provider": "github",
        "type": "pr",
        "urls": [
          "https://github.com/wegowise/importers/pull/14602"
        ]
      }
    ],
    "analysis_level": "basic"
  },
  "created_at": "2025-09-08T06:22:51.756676"
}
```

#### Run Session (code_reviewer - Initial Review)

```
POST /api/v1/agents/code_reviewer/run?protocol=sse&session_id=225
{
  "id": "JhBGF8qVmuPNV4bs",
  "messages": [
    {
      "role": "user",
      "content": "start analyzing"
    }
  ]
}
```

#### Follow-up Sessions (code_reviewer)

1. **Ad-hoc Q&A:**
```
POST /api/v1/agents/code_reviewer/run?protocol=sse&session_id=225
{
  "id": "JhBGF8qVmuPNV4bs",
  "messages": [
    {
      "role": "user",
      "content": "briefly explain comment-1"
    }
  ]
}
```

2. **Modify Review:**
```
POST /api/v1/agents/code_reviewer/run?protocol=sse&session_id=225
{
  "id": "JhBGF8qVmuPNV4bs",
  "messages": [
    {
      "role": "user",
      "content": "Modify Review: Update/delete/add comment..."
    }
  ]
}
```

3. **Publish Review to GitHub:**
```
POST /api/v1/agents/code_reviewer/run?protocol=sse&session_id=225
{
  "id": "JhBGF8qVmuPNV4bs",
  "messages": [
    {
      "role": "user",
      "content": "Publish pending review"
    }
  ]
}
```

---

## API Testing Suite Agent

### Create Session (api_testing_suite)

```
POST /api/v1/agents/api_testing_suite/sessions
{
  "project_name": "E-commerce API Testing",
  "mcps": [
    "playwright",
    "atlassian",
    "github"
  ],
  "custom_properties": {
    "framework": "playwright",
    "custom_instructions": "start analyzing",
    "api_specs": [
      {
        "provider": "openapi",
        "urls": ["https://api.example.com/openapi.json"]
      }
    ],
    "testcase_sources": [
      {
        "provider": "jira",
        "keys": ["API-123", "API-124"],
        "urls": ["https://company.atlassian.net/browse/API-123"]
      }
    ],
    "docs": [
      {"provider": "Confluence", "ids": ["SPACE-123"]},
      {"provider": "Notion", "urls": ["https://notion.so/style-guide"]}
    ],
    "repo": {
      "url": "https://github.com/company/api-tests",
      "branch": "develop"
    },
    "analysis_level": "basic"
  }
}
```

**Response:**
```json
{
  "session_id": 225,
  "project_id": 225,
  "agent_id": 150,
  "is_active": true,
  "mcps": [
    "playwright",
    "atlassian",
    "github"
  ],
  "custom_properties": {
    "framework": "playwright",
    "custom_instructions": "start analyzing",
    "api_specs": [
      {
        "provider": "openapi",
        "urls": ["https://api.example.com/openapi.json"]
      }
    ],
    "testcase_sources": [
      {
        "provider": "jira",
        "keys": ["API-123", "API-124"],
        "urls": ["https://company.atlassian.net/browse/API-123"]
      }
    ],
    "docs": [
      {"provider": "Confluence", "ids": ["SPACE-123"]},
      {"provider": "Notion", "urls": ["https://notion.so/style-guide"]}
    ],
    "repo": {
      "url": "https://github.com/company/api-tests",
      "branch": "develop"
    },
    "analysis_level": "basic"
  },
  "created_at": "2025-09-08T06:22:51.756676"
}
```

#### Run Session (api_testing_suite - Initial Test Suite Generation)

```
POST /api/v1/agents/api_testing_suite/run?protocol=sse&session_id=225
{
  "id": "ApiTest123xyz",
  "messages": [
    {
      "role": "user",
      "content": "Generate comprehensive API test suite for user authentication endpoints"
    }
  ]
}
```

#### Follow-up Sessions (api_testing_suite)

1. **Add Specific Test Cases:**
```
POST /api/v1/agents/api_testing_suite/run?protocol=sse&session_id=225
{
  "id": "ApiTest123xyz",
  "messages": [
    {
      "role": "user",
      "content": "Add new test case tests for password validation with special characters"
    }
  ]
}
```

2. **Modify Test Case:**
```
POST /api/v1/agents/api_testing_suite/run?protocol=sse&session_id=225
{
  "id": "ApiTest123xyz",
  "messages": [
    {
      "role": "user",
      "content": "modify test: User Login API - Invalid Credentials"
    }
  ]
}
```

3. **Delete Test Case:**
```
POST /api/v1/agents/api_testing_suite/run?protocol=sse&session_id=225
{
  "id": "ApiTest123xyz",
  "messages": [
    {
      "role": "user",
      "content": "delete test: Duplicate Password Validation Test"
    }
  ]
}
```

4. **Ad-hoc Q&A:**
```
POST /api/v1/agents/api_testing_suite/run?protocol=sse&session_id=225
{
  "id": "ApiTest123xyz",
  "messages": [
    {
      "role": "user",
      "content": "What test frameworks are supported for API testing?"
    }
  ]
}
```

**Note:** For detailed test case scenarios and follow-up patterns, refer to the API testing suite user follow-up prompt templates.

---

### Follow‑up Sessions for Test Case Generation

Use the `session_id` query parameter to continue a session. For follow‑ups, format the last user message to explicitly target a source and provide the feedback. The system uses this exact structure to locate the right source folder (see `apps/api/app/agents/templates/test_case_generation/user_followup.md`):

```
For Jira Issue: OD-8, please make following improvements:
<your feedback here>
```

Example:

```
POST /api/v1/agents/test_case_generation/run?session_id=126
{
  "messages": [
    ...,
    {
      "role": "user",
      "content": "For Jira Issue: OD-8, please make following improvements: \n Update TC-AUTH-001 to have more detailed steps."
    }
  ]
}
```

Behavior:
- The backend renders a follow‑up prompt from the template and applies your feedback to the identified source.
- As files are created or edited, the server emits `data-source` and `data-testcase` events after the corresponding `tool_result`, reflecting the updated file contents (implementation in `app/agents/workflows/test_case_generation.py` and helpers in `app/agents/workflows/base.py`).



```
POST /api/v1/agents/code_analysis/42/run
{
  "session_id": 42,
  "messages": [{"role": "user", "content": "Also include API docs."}]
}
```
