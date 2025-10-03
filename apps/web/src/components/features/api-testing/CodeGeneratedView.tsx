'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Send, Check } from 'lucide-react';
import { SparkleIcon } from '@/components/icons';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import type { Message } from 'ai';
import { getPostmanEventLabel } from '@/lib/utils/api-testing-formatter';
import {
  AIPopoverProps,
  CodeGeneratedViewProps,
  Project,
  TestCase,
  PostmanEvent,
  PostmanHierarchyNode,
} from '@/types/agent-api-suite';

const AIPopover: React.FC<AIPopoverProps> = ({
  itemId,
  placeholder,
  onSendMessage,
  openPopover,
  setOpenPopover,
  inputValue,
  setInputValue,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSendMessage(itemId);
      }
    },
    [onSendMessage, itemId]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setOpenPopover(open ? itemId : null);
      if (!open) setInputValue('');
    },
    [itemId, setOpenPopover, setInputValue]
  );

  return (
    <Popover open={openPopover === itemId} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          onClick={e => e.stopPropagation()}
          className='group rounded-lg p-1.5 transition-colors hover:bg-gray-100'
          aria-label='AI Agent'
        >
          <SparkleIcon
            className={`h-4 w-4 transition-colors ${
              openPopover === itemId
                ? 'fill-blue-600 text-blue-600'
                : 'text-gray-500 group-hover:text-gray-700'
            }`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent side='right' align='start' className='w-80 p-2'>
        <div className='relative flex items-end'>
          <Textarea
            placeholder={placeholder}
            className='resize-none bg-gray-50 pr-12 focus:bg-white'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            onKeyUp={e => e.stopPropagation()}
            style={{ minHeight: '50px', overflowY: 'auto' }}
          />
          <button
            type='button'
            onClick={() => onSendMessage(itemId)}
            disabled={!inputValue.trim()}
            className='absolute right-1 bottom-1 p-1.5 text-blue-600 transition-colors hover:text-blue-700 disabled:text-gray-300'
          >
            <div className='flex items-center justify-center rounded-full bg-gray-100 p-1.5'>
              <Send className='h-3 w-3' />
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function CodeGeneratedView({
  projects,
  append,
}: CodeGeneratedViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [copiedProject, setCopiedProject] = useState<string | null>(null);
  const [activeEventTabs, setActiveEventTabs] = useState<
    Map<string, 'prerequest' | 'test'>
  >(new Map());

  // Handle AI Agent interaction
  const handleSendMessage = useCallback(
    (project: Project, testCaseTitle?: string) => {
      if (!inputValue.trim()) return;

      const content = testCaseTitle
        ? `${inputValue.trim()} : ${testCaseTitle}`
        : `${inputValue.trim()} : ${project.title}`;

      append({ role: 'user', content } as Message);
      setInputValue('');
      setOpenPopover(null);
    },
    [inputValue, append]
  );

  // Copy entire project with all test cases to clipboard
  const handleCopyProject = useCallback(
    async (project: Project, e: React.MouseEvent) => {
      e.stopPropagation();
      const projectData = {
        id: project.id,
        title: project.title,
        subtitle: project.subtitle,
        testCases: project.testCases.map(testCase => ({
          id: testCase.id,
          title: testCase.title,
          generatedCode: testCase.generatedCode,
        })),
      };

      await navigator.clipboard.writeText(JSON.stringify(projectData, null, 2));
      setCopiedProject(project.id);
      setTimeout(() => setCopiedProject(null), 2000);
    },
    []
  );

  // Tab management for Postman events
  const getActiveEventTab = useCallback(
    (nodeId: string, events: PostmanEvent[]): 'prerequest' | 'test' => {
      const stored = activeEventTabs.get(nodeId);
      if (stored && events.some(e => e.listen === stored)) {
        return stored;
      }
      return events.some(e => e.listen === 'prerequest')
        ? 'prerequest'
        : 'test';
    },
    [activeEventTabs]
  );

  const setActiveEventTab = useCallback(
    (nodeId: string, tabValue: 'prerequest' | 'test') => {
      setActiveEventTabs(prev => new Map(prev.set(nodeId, tabValue)));
    },
    []
  );

  // Render Playwright test case
  const renderPlaywrightTestCase = useCallback(
    (testCase: TestCase, project: Project) => (
      <AccordionItem
        key={testCase.id}
        value={testCase.id}
        className='border bg-slate-50'
      >
        <AccordionTrigger className='flex items-center px-4 py-3 hover:bg-gray-50/70'>
          <div className='flex w-full items-center justify-between'>
            <span className='flex-1 text-left font-medium'>
              {testCase.id} - {testCase.title}
            </span>
            <div className='mr-4 flex items-center gap-2'>
              <AIPopover
                itemId={testCase.id}
                placeholder='Ask anything about this test case or request clarification'
                onSendMessage={() => handleSendMessage(project, testCase.title)}
                openPopover={openPopover}
                setOpenPopover={setOpenPopover}
                inputValue={inputValue}
                setInputValue={setInputValue}
              />
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className='px-4 pb-4'>
          <div className='space-y-4'>
            <h4 className='mb-3 bg-slate-50 font-medium'>Generated Code</h4>
            <div className='rounded-lg bg-slate-50 p-1'>
              <MarkdownRenderer
                content={`\`\`\`javascript\n${testCase.generatedCode}\n\`\`\``}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    ),
    [handleSendMessage, openPopover, inputValue]
  );

  // Render Postman hierarchy with unified approach
  const renderPostmanHierarchy = useCallback(
    (
      nodes: PostmanHierarchyNode[],
      project: Project,
      level = 0
    ): React.ReactNode => {
      return nodes.map(node => (
        <AccordionItem
          key={node.id}
          value={node.id}
          className='border bg-slate-100'
        >
          <AccordionTrigger className='flex items-center px-4 py-3 hover:bg-gray-50/70'>
            <div className='flex w-full items-center justify-between'>
              <span className='flex-1 text-left font-medium'>{node.name}</span>
              <div className='mr-4 flex items-center gap-2'>
                {node.type === 'request' && node.events && (
                  <span className='text-xs text-gray-500'>
                    {node.events.length} events
                  </span>
                )}
                <AIPopover
                  itemId={node.id}
                  placeholder={`Ask anything about ${node.type === 'folder' ? 'this folder' : 'this request'}`}
                  onSendMessage={() => handleSendMessage(project, node.name)}
                  openPopover={openPopover}
                  setOpenPopover={setOpenPopover}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                />
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className='px-4 pb-4'>
            {node.type === 'folder' && node.children ? (
              <div className='h-full space-y-2'>
                <Accordion type='multiple' className='space-y-2'>
                  {renderPostmanHierarchy(node.children, project, level + 1)}
                </Accordion>
              </div>
            ) : node.type === 'request' && node.events ? (
              <div className='space-y-4'>
                <Tabs className='w-full'>
                  <TabsList
                    className={`grid w-full ${
                      node.events.some(e => e.listen === 'prerequest') &&
                      node.events.some(e => e.listen === 'test')
                        ? 'grid-cols-2'
                        : 'grid-cols-1'
                    }`}
                  >
                    {node.events.some(e => e.listen === 'prerequest') && (
                      <TabsTrigger
                        value='prerequest'
                        isActive={
                          getActiveEventTab(node.id, node.events) ===
                          'prerequest'
                        }
                        onClick={() => setActiveEventTab(node.id, 'prerequest')}
                        className='flex items-center gap-2'
                      >
                        <span className='inline-block h-2 w-2 rounded-full bg-blue-500'></span>
                        {getPostmanEventLabel('prerequest')}
                      </TabsTrigger>
                    )}
                    {node.events.some(e => e.listen === 'test') && (
                      <TabsTrigger
                        value='test'
                        isActive={
                          getActiveEventTab(node.id, node.events) === 'test'
                        }
                        onClick={() => setActiveEventTab(node.id, 'test')}
                        className='flex items-center gap-2'
                      >
                        <span className='inline-block h-2 w-2 rounded-full bg-green-500'></span>
                        {getPostmanEventLabel('test')}
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {/* Pre Request Script Content */}
                  {node.events.some(e => e.listen === 'prerequest') && (
                    <TabsContent
                      value='prerequest'
                      isActive={
                        getActiveEventTab(node.id, node.events) === 'prerequest'
                      }
                      className='mt-4'
                    >
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <MarkdownRenderer
                          content={`\`\`\`javascript\n${node.events
                            .filter(e => e.listen === 'prerequest')
                            .map(e => e.script.exec.join('\n'))
                            .join('\n\n')}\n\`\`\``}
                        />
                      </div>
                    </TabsContent>
                  )}

                  {/* Post Request Script Content */}
                  {node.events.some(e => e.listen === 'test') && (
                    <TabsContent
                      value='test'
                      isActive={
                        getActiveEventTab(node.id, node.events) === 'test'
                      }
                      className='mt-4'
                    >
                      <div className='rounded-lg bg-gray-50 p-3'>
                        <MarkdownRenderer
                          content={`\`\`\`javascript\n${node.events
                            .filter(e => e.listen === 'test')
                            .map(e => e.script.exec.join('\n'))
                            .join('\n\n')}\n\`\`\``}
                        />
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            ) : null}
          </AccordionContent>
        </AccordionItem>
      ));
    },
    [
      handleSendMessage,
      openPopover,
      inputValue,
      getActiveEventTab,
      setActiveEventTab,
    ]
  );

  // Unified project rendering
  const renderProject = useCallback(
    (project: Project) => {
      const isPostman = project.framework === 'postman';
      const hasCollectionStructure = isPostman && project.collectionStructure;

      return (
        <AccordionItem
          key={project.id}
          value={project.id}
          className='bg-slate-100'
        >
          <AccordionTrigger className='px-4 py-3 hover:bg-gray-50 [&>svg]:ml-auto'>
            <div className='flex w-full items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div>
                  <h3 className='text-left font-semibold text-gray-900'>
                    {project.title}
                  </h3>
                  <p className='text-left text-sm text-gray-600'>
                    {project.subtitle}
                  </p>
                </div>
              </div>
              <div className='mr-4 flex items-center gap-2'>
                <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600'>
                  {isPostman ? 'Postman' : 'Playwright'}
                </span>
                <span className='text-sm text-gray-500'>
                  {project.testCases.length}{' '}
                  {isPostman ? 'requests' : 'test cases'}
                </span>
                <AIPopover
                  itemId={project.id}
                  placeholder={`Ask anything about this ${isPostman ? 'collection' : 'analysis'} or request clarification`}
                  onSendMessage={() => handleSendMessage(project)}
                  openPopover={openPopover}
                  setOpenPopover={setOpenPopover}
                  inputValue={inputValue}
                  setInputValue={setInputValue}
                />
                <button
                  onClick={e => handleCopyProject(project, e)}
                  className={`rounded-lg p-1.5 transition-all ${
                    copiedProject === project.id
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                  title={
                    copiedProject === project.id
                      ? 'Copied!'
                      : `Copy ${isPostman ? 'collection' : 'project'} as JSON`
                  }
                  aria-label={`Copy project ${project.title}`}
                >
                  {copiedProject === project.id ? (
                    <Check className='h-4 w-4' />
                  ) : (
                    <Copy className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className='bg-gray-50/50'>
            <div className='space-y-4 px-4 py-4'>
              <Accordion type='multiple' className='space-y-2'>
                {hasCollectionStructure
                  ? renderPostmanHierarchy(
                      project.collectionStructure!,
                      project
                    )
                  : project.testCases.map(testCase =>
                      renderPlaywrightTestCase(testCase, project)
                    )}
              </Accordion>
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    },
    [
      handleSendMessage,
      handleCopyProject,
      renderPostmanHierarchy,
      renderPlaywrightTestCase,
      openPopover,
      inputValue,
      copiedProject,
    ]
  );

  // Memoize project list for performance
  const projectList = useMemo(
    () => projects.map(project => project.id),
    [projects]
  );

  return (
    <div
      className='space-y-4 overflow-y-auto'
      style={{ maxHeight: 'calc(100vh - 300px)' }}
    >
      <Accordion
        type='multiple'
        defaultValue={projectList}
        className='w-full space-y-4'
      >
        {projects.map(project => renderProject(project))}
      </Accordion>
    </div>
  );
}
