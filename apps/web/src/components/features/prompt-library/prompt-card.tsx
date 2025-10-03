'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Play } from 'lucide-react';
import { PromptData } from '@/lib/constants/prompt-library';

interface PromptCardProps {
  prompt: PromptData;
  onCopy?: (promptId: string, content: string) => void;
  onRun?: (promptId: string, content: string) => void;
}

export const PromptCard = ({ prompt, onCopy, onRun }: PromptCardProps) => {
  const IconComponent = prompt.icon;

  const handleCopyClick = () => {
    if (onCopy) {
      onCopy(prompt.id, prompt.content);
    }
  };

  const handleRunClick = () => {
    if (onRun) {
      onRun(prompt.id, prompt.content);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  return (
    <Card className='h-full transition-all duration-200 hover:shadow-md'>
      <CardHeader className='pb-4'>
        <div className='flex items-start gap-3'>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${prompt.iconBgColor} flex-shrink-0`}
          >
            <IconComponent className={`h-4 w-4 ${prompt.iconColor}`} />
          </div>
          <div className='min-w-0 flex-1'>
            <h3 className='text-foreground mb-1 font-semibold'>
              {prompt.title}
            </h3>
            <Badge variant='secondary' className='mb-2 text-xs'>
              {prompt.category}
            </Badge>
            <p className='text-muted-foreground text-sm leading-relaxed'>
              {prompt.description}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4 pt-0'>
        {/* Code Preview */}
        <div className='bg-muted text-muted-foreground relative max-h-24 overflow-hidden rounded-lg p-3 font-mono text-xs'>
          <div className='line-clamp-4'>{prompt.content}</div>
          <div className='from-muted absolute right-0 bottom-0 left-0 h-6 bg-gradient-to-t to-transparent' />
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCopyClick}
            onKeyDown={e => handleKeyDown(e, handleCopyClick)}
            tabIndex={0}
            aria-label={`Copy ${prompt.title} prompt`}
            className='flex flex-1 cursor-pointer items-center gap-2'
          >
            <Copy className='h-4 w-4' />
            Copy
          </Button>

          <Button
            variant='ghost'
            size='sm'
            onClick={handleRunClick}
            onKeyDown={e => handleKeyDown(e, handleRunClick)}
            tabIndex={0}
            aria-label={`Run ${prompt.title} prompt`}
            className='flex flex-1 cursor-pointer items-center gap-2'
          >
            <Play className='h-4 w-4' />
            Run
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
