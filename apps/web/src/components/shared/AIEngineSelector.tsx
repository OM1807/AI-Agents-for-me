'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ClaudeIcon, OpenAIIcon, GeminiIcon } from '@/components/icons';
import { useProject } from '@/hooks/useProject';

const AI_ENGINES = [
  // Claude Models
  { id: 'claude-4-sonnet', name: 'Claude 4 Sonnet', icon: <ClaudeIcon /> },
  { id: 'claude-4.1-opus', name: 'Claude 4.1 Opus', icon: <ClaudeIcon /> },

  // OpenAI Models
  { id: 'gpt-o3', name: 'GPT-o3', icon: <OpenAIIcon /> },
  { id: 'gpt-o3-pro', name: 'GPT-o3 Pro', icon: <OpenAIIcon /> },
  { id: 'gpt-4.1', name: 'GPT-4.1', icon: <OpenAIIcon /> },

  // Google Gemini Models
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', icon: <GeminiIcon /> },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', icon: <GeminiIcon /> },
];

export function AIEngineSelector({ className }: { className?: string }) {
  const { aiEngine, setAiEngine } = useProject();

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            className='h-12 w-full justify-between text-left md:w-1/2'
          >
            <div className='flex items-center gap-3'>
              <span className='text-lg'>
                {AI_ENGINES.find(engine => engine.id === aiEngine)?.icon}
              </span>
              <span className='font-medium'>
                {AI_ENGINES.find(engine => engine.id === aiEngine)?.name}
              </span>
            </div>
            <ChevronDown className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-[var(--radix-dropdown-menu-trigger-width)]'
          align='start'
          sideOffset={8}
        >
          {AI_ENGINES.map(engine => (
            <DropdownMenuItem
              key={engine.id}
              className='flex items-center gap-3 px-4 py-3'
              onClick={() => setAiEngine(engine.id)}
            >
              <span className='text-lg'>{engine.icon}</span>
              <span className='font-medium'>{engine.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
