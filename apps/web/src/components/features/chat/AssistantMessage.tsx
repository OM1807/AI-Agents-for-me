import React from 'react';
import { Message } from 'ai';
import type {
  TextUIPart,
  ReasoningUIPart,
  ToolInvocationUIPart,
  SourceUIPart,
  FileUIPart,
  StepStartUIPart,
} from '@ai-sdk/ui-utils';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import {
  TextTool,
  TodoTool,
  FetchServicesTool,
} from '@/components/features/chat/tool-renderers';
import { SpinnerIcon } from '@/components/icons';
// import { useProject } from '@/hooks/useProject';

// Use the actual types from AI SDK
type MessagePart =
  | TextUIPart
  | ReasoningUIPart
  | ToolInvocationUIPart
  | SourceUIPart
  | FileUIPart
  | StepStartUIPart;

// Extended message type that may include parts
interface MessageWithParts extends Message {
  parts?: MessagePart[];
}

interface AssistantMessageProps {
  message: Message;
  isStreaming?: boolean;
  isLastMessage?: boolean;
}

// Unified dedupe helpers (module scope)
const getToolArgs = (toolInvocation: any) =>
  'args' in toolInvocation ? (toolInvocation as any).args : undefined;

const getDedupKey = (toolInvocation: any): string | null => {
  const toolName: string = toolInvocation.toolName;
  const args = getToolArgs(toolInvocation) || {};

  switch (toolName) {
    // Show only the latest occurrence regardless of args
    case 'todo':
      return 'todo';

    // Group by URL
    case 'web_search':
    case 'web_fetch': {
      const url = args?.url ?? 'unknown';
      return `${toolName}:${url}`;
    }

    // Group by path
    case 'list_directory': {
      const path = args?.path ?? './';
      return `${toolName}:${path}`;
    }

    // Group by search path
    case 'search_files':
    case 'search_file': {
      const path = args?.path ?? '';
      return `${toolName}:${path}`;
    }

    // Group by command
    case 'execute_command': {
      const command = args?.command ?? '';
      return `${toolName}:${command}`;
    }

    // Group by file path-like argument
    case 'edit_file':
    case 'write_file':
    case 'create_file':
    case 'search_replace':
    case 'read_file': {
      const fileKey =
        args?.file_path || args?.target_file || args?.path || 'Untitled';
      return `${toolName}:${fileKey}`;
    }

    // Group by description (task manager processing specific issues)
    case 'task_manager': {
      const description = args?.description ?? '';
      return `${toolName}:${description}`;
    }

    default:
      return null;
  }
};

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  isStreaming = false,
  isLastMessage = false,
}) => {
  const content = message.content;
  // const { setSessionId } = useProject();
  // Handle parts - they might be in experimental_attachments or need to be parsed
  const rawParts = (message as MessageWithParts).parts;
  const parts = React.useMemo(() => rawParts || [], [rawParts]);

  const latestIndexByKey = React.useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i] as any;
      if (part?.type !== 'tool-invocation') continue;
      const key = getDedupKey(part.toolInvocation);
      if (key) map.set(key, i);
    }
    return map;
  }, [parts]);

  const renderPart = (part: MessagePart, index: number) => {
    switch (part.type) {
      case 'tool-invocation': {
        const toolInvocation = part.toolInvocation;
        const { state, toolName, toolCallId } = toolInvocation;

        // Handle TodoWrite tool
        if (toolName === 'todo') {
          return (
            <TodoTool
              key={index}
              toolInvocation={toolInvocation}
              state={state}
              index={toolCallId}
            />
          );
        }
        if (
          toolName === 'git_clone' ||
          toolName === 'mcp__atlassian__getConfluencePage' ||
          toolName === 'mcp__atlassian__getJiraIssue' ||
          toolName === 'mcp__atlassian__createJiraIssue' ||
          toolName === 'mcp__notion__API-retrieve-a-page' ||
          toolName === 'mcp__notion__API-post-search' ||
          toolName === 'mcp__datadog__get-monitor' ||
          toolName === 'mcp__datadog__search-logs' ||
          toolName === 'mcp__sentry__get_issue_details' ||
          toolName === 'mcp__sentry__find_organizations' ||
          toolName === 'mcp__sentry__search_events' ||
          toolName === 'glob_files' ||
          toolName === 'execute_command' ||
          toolName === 'list_directory' ||
          toolName === 'search_files' ||
          toolName === 'search_file' ||
          toolName === 'write_file' ||
          toolName === 'read_file' ||
          toolName === 'create_file' ||
          toolName === 'edit_file' ||
          toolName === 'web_fetch' ||
          toolName === 'web_search' ||
          toolName === 'task_manager'
        ) {
          return (
            <FetchServicesTool
              key={index}
              toolInvocation={toolInvocation}
              state={state}
              index={toolCallId}
            />
          );
        }
        // Handle Text tool
        if (toolName === 'text') {
          return (
            <TextTool
              key={index}
              toolInvocation={toolInvocation}
              state={state}
              index={toolCallId}
            />
          );
        }
      }

      default:
        return null;
    }
  };

  return (
    <div className='space-y-1'>
      <div className='max-w-[100%] pb-2 dark:border-stone-600'>
        {parts?.length ? (
          <div className='space-y-4'>
            {parts.map((part: MessagePart, index: number) => {
              // If this is a tool invocation, handle unified dedupe
              if (part.type === 'tool-invocation') {
                const toolInvocation = part.toolInvocation;
                const dedupKey = getDedupKey(toolInvocation as any);
                if (dedupKey && latestIndexByKey.get(dedupKey) !== index) {
                  return null;
                }
              }

              return renderPart(part, index);
            })}
          </div>
        ) : (
          <div className='text-sm leading-relaxed'>
            <MarkdownRenderer content={content} isStreaming={isStreaming} />
          </div>
        )}

        {isStreaming && isLastMessage && (
          <div className='mt-3 flex items-center gap-1 text-stone-400'>
            <SpinnerIcon className='h-4 w-4 animate-spin' />
            &nbsp;Processing...
          </div>
        )}
      </div>
    </div>
  );
};
