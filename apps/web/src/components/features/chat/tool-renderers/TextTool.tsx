import React from 'react';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';

interface TextToolProps {
  toolInvocation: any;
  state: string;
  index: string;
}

export const TextTool: React.FC<TextToolProps> = ({
  toolInvocation,
  index,
}) => {
  const args = 'args' in toolInvocation ? toolInvocation.args : undefined;
  const text = args?.text || '';

  return (
    <div key={index}>
      <MarkdownRenderer content={text} />
    </div>
  );
};
