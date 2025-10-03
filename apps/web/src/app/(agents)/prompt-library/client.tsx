'use client';

import { useState } from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PromptCard, FilterTabs } from '@/components/features/prompt-library';
import {
  PROMPT_LIBRARY,
  PROMPT_CATEGORIES,
  PromptCategory,
} from '@/lib/constants/prompt-library';
import { toast } from 'sonner';

export default function PromptLibraryClient() {
  const [activeCategory, setActiveCategory] = useState<PromptCategory>('All');

  const handleCategoryChange = (category: PromptCategory) => {
    setActiveCategory(category);
  };

  const handlePromptCopy = async (promptId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Prompt copied to clipboard');
    } catch (error) {
      console.error('Failed to copy prompt:', error);
    }
  };

  const handlePromptRun = (promptId: string, content: string) => {
    console.log(`Running prompt: ${promptId}`, content);
    // This would integrate with your AI chat system
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Filter prompts based on active category
  const filteredPrompts =
    activeCategory === 'All'
      ? PROMPT_LIBRARY
      : PROMPT_LIBRARY.filter(prompt => prompt.category === activeCategory);

  return (
    <div className='space-y-8'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20'>
            <BookOpen className='h-5 w-5 text-blue-600 dark:text-blue-400' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-3xl font-bold tracking-tight'>
                Prompt Library
              </h1>
              <Button
                variant='ghost'
                size='icon'
                className='h-6 w-6'
                tabIndex={0}
                aria-label='Help about prompt library'
              >
                <HelpCircle className='text-muted-foreground h-4 w-4' />
              </Button>
            </div>
            <p className='text-muted-foreground'>
              Use these prebuilt prompts to get the most out of your SDLC Agents
              development tools.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterTabs
        categories={PROMPT_CATEGORIES}
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {/* Prompts Grid */}
      <div className='grid gap-6 md:grid-cols-2 xl:grid-cols-3'>
        {filteredPrompts.map(prompt => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onCopy={handlePromptCopy}
            onRun={handlePromptRun}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredPrompts.length === 0 && (
        <div className='flex flex-col items-center justify-center py-12'>
          <div className='text-muted-foreground mb-2'>
            No prompts found for this category
          </div>
          <Button
            variant='ghost'
            onClick={() => setActiveCategory('All')}
            onKeyDown={e => handleKeyDown(e, () => setActiveCategory('All'))}
            tabIndex={0}
            aria-label='Show all prompts'
          >
            Show All Prompts
          </Button>
        </div>
      )}
    </div>
  );
}
