// ========================================
// CHAT MESSAGE TYPES
// ========================================

export type MessagePart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'tool-call';
      toolCallId: string;
      toolName: string;
      args: any;
    }
  | {
      type: 'tool-result';
      toolCallId: string;
      result: any;
    };

export interface MessageWithParts {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parts?: MessagePart[];
}
