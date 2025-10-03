import { Message } from '@ai-sdk/react';
import { UserMessage } from '@/components/features/chat/UserMessage';
import { AssistantMessage } from '@/components/features/chat/AssistantMessage';

interface ChatMessageProps {
  message: Message;
  index: number;
  totalMessages: number;
  isStreaming: boolean;
}

export const ChatMessage = ({
  message,
  index,
  totalMessages,
  isStreaming,
}: ChatMessageProps) => {
  const isLastMessage = index === totalMessages - 1;

  if (message.role === 'user') {
    return <UserMessage content={message.content} />;
  }

  if (message.role === 'assistant') {
    return (
      <AssistantMessage
        message={message}
        isStreaming={isStreaming}
        isLastMessage={isLastMessage}
      />
    );
  }

  return null;
};
