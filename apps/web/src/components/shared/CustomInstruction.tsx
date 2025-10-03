'use client';

import React from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { TerminalIcon } from '@/components/icons';
import { useProject } from '@/hooks/useProject';

interface CustomInstructionProps {
  className?: string;
}

export function CustomInstruction({ className }: CustomInstructionProps) {
  const { userPrompt, setUserPrompt } = useProject();

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(userPrompt);
  };

  return (
    <Accordion
      type='single'
      defaultValue={[]}
      className={className || 'space-y-0'}
    >
      <AccordionItem
        value='prompt'
        className='rounded-lg border border-gray-200 bg-white'
      >
        <AccordionTrigger className='px-4 py-4 hover:bg-transparent'>
          <div className='flex items-center gap-2'>
            <div className='rounded-full border border-gray-200 p-2'>
              <TerminalIcon className='h-4 w-4' />
            </div>
            <h3 className='font-semibold'>Custom Instructions</h3>
          </div>
        </AccordionTrigger>
        <AccordionContent className='border-t'>
          <div className='relative'>
            <Textarea
              value={userPrompt}
              onChange={e => setUserPrompt(e.target.value)}
              className='min-h-[150px] resize-none rounded-none border-none px-4 py-2 font-mono text-sm'
              placeholder='Enter your custom instructions...'
            />
            <div className='flex justify-end gap-2 rounded-b-md border-0 bg-gray-50 p-2'>
              <Button variant='ghost' size='sm' onClick={handleCopyPrompt}>
                <Copy className='mr-2 h-4 w-4' />
                Copy
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
