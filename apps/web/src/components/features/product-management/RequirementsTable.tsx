'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SparkleIcon } from '@/components/icons';
import { Copy, Send, Paperclip, Zap } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  FileIcon,
  TickIcon,
  BookmarkIcon,
  MagicWandIcon,
} from '@/components/icons/ProductManagement';
import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  formatRequirementsData,
  getRelatedTasks,
  type DataItem,
  type RequirementItem,
} from '@/lib/utils/requirements-formatter';
import { toast } from 'sonner';

interface RequirementsTableProps {
  data: DataItem[];
  append: (message: any) => void;
  isStreaming: boolean;
}

export function RequirementsTable({
  data,
  append,
  isStreaming,
}: RequirementsTableProps) {
  const [expandedEpics, setExpandedEpics] = useState<string[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Record<string, boolean>>({});
  const [openPopover, setOpenPopover] = useState<string | null>(null);

  // Transform the incoming data stream into the requirements structure
  const requirements = useMemo(() => {
    return formatRequirementsData(data);
  }, [data]);

  // Set the first epic as expanded by default when requirements change
  const hasInitialized = React.useRef(false);
  React.useEffect(() => {
    if (requirements.length > 0 && !hasInitialized.current) {
      setExpandedEpics([requirements[0].id]);
      hasInitialized.current = true;
    }
  }, [requirements]);

  const handleCopy = async (title: string, description?: string) => {
    try {
      const cleanDescription = description ? description.replace(/#/g, '') : '';
      await navigator.clipboard.writeText(
        title + (cleanDescription ? `\n\n${cleanDescription}` : '')
      );
      toast.success('Requirement copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleAskQuestion = async (itemId: string, itemType: string) => {
    if (userQuestion.trim()) {
      append({
        role: 'user',
        content: `For ${itemType}: ${itemId}, please make following improvements: ${userQuestion}`,
      });
      setUserQuestion('');
      setOpenPopover(null);
    }
  };

  const handleItemClick = (item: RequirementItem) => {
    // Get related tasks if it's a story
    const relatedTasks =
      item.type === 'story' ? getRelatedTasks(requirements, item.id) : [];

    setSelectedItem({
      ...item,
      relatedTasks,
    });
    setShowDetailModal(true);
  };

  const getTypeIcon = (type: string, isSmall = false) => {
    const size = isSmall ? 'h-5 w-5' : 'h-6 w-6';

    switch (type) {
      case 'epic':
        return (
          <div
            className={`flex ${size} items-center justify-center rounded-sm bg-purple-500`}
          >
            <Zap className='h-3.5 w-3.5 text-white' />
          </div>
        );
      case 'story':
        return (
          <div
            className={`flex ${size} items-center justify-center rounded-sm bg-green-500`}
          >
            <BookmarkIcon className='h-3.5 w-3.5 text-white' />
          </div>
        );
      case 'task':
        return (
          <div
            className={`flex ${size} items-center justify-center rounded-sm bg-blue-500`}
          >
            <TickIcon className='h-3.5 w-3.5 text-white' />
          </div>
        );
      default:
        return null;
    }
  };

  const getTagColor = () => {
    // Uniform purple color for all tags
    return 'bg-purple-100 text-purple-700';
  };

  const toggleTagExpansion = (itemId: string) => {
    setExpandedTags(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const renderTags = (tags: string[], itemId: string) => {
    if (!tags || tags.length === 0) return null;

    const isExpanded = expandedTags[itemId];
    const displayTags = isExpanded ? tags : tags.slice(0, 2);
    const remainingCount = tags.length - 2;

    return (
      <div className='flex flex-wrap items-center gap-1'>
        {displayTags.map((tag: string) => (
          <Badge
            key={tag}
            className={`rounded-full px-2 py-0.5 text-xs ${getTagColor()}`}
          >
            {tag}
          </Badge>
        ))}
        {!isExpanded && remainingCount > 0 && (
          <button
            onClick={e => {
              e.stopPropagation();
              toggleTagExpansion(itemId);
            }}
            className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 transition-colors hover:bg-gray-200'
          >
            +{remainingCount} more
          </button>
        )}
        {isExpanded && tags.length > 2 && (
          <button
            onClick={e => {
              e.stopPropagation();
              toggleTagExpansion(itemId);
            }}
            className='rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 transition-colors hover:bg-gray-200'
          >
            Show less
          </button>
        )}
      </div>
    );
  };

  return (
    <div className='h-full w-full'>
      <div className='custom-scrollbar h-full overflow-y-auto'>
        {requirements.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-gray-500'>
            <div className='mb-4'>
              <FileIcon className='h-12 w-12 text-gray-300' />
            </div>
            <p className='text-sm'>
              {isStreaming
                ? 'Loading requirements data...'
                : 'No requirements data available'}
            </p>
            {!isStreaming && (
              <p className='mt-1 text-xs text-gray-400'>
                Please check your data source or try again later
              </p>
            )}
          </div>
        ) : (
          <Accordion
            type='multiple'
            value={expandedEpics}
            onValueChange={setExpandedEpics}
            className='space-y-4'
          >
            {requirements.map((epic: RequirementItem) => (
              <AccordionItem
                key={epic.id}
                value={epic.id}
                className='bg-gray-50'
              >
                <AccordionTrigger className='hover:bg-gray-100'>
                  <div className='flex w-full items-center justify-between pr-4'>
                    <div className='flex items-center gap-3'>
                      {getTypeIcon(epic.type)}
                      <h3 className='text-base font-semibold text-gray-900'>
                        {epic.id}: {epic.title}
                      </h3>
                    </div>
                    <div className='flex items-center gap-3'>
                      {epic.tags &&
                        epic.tags.length > 0 &&
                        renderTags(epic.tags, epic.id)}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <div className='bg-white'>
                    {epic.children && epic.children.length > 0 && (
                      <div className='divide-y divide-gray-100'>
                        {epic.children.map((item: RequirementItem) => (
                          <div
                            key={item.id}
                            className='relative flex items-center gap-3 px-4 py-3 hover:bg-gray-50'
                          >
                            {getTypeIcon(item.type, true)}

                            <span
                              className='flex-1 cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline'
                              onClick={() => handleItemClick(item)}
                            >
                              {item.id}: {item.title}
                            </span>

                            {renderTags(item.tags, item.id)}

                            <div className='flex items-center gap-1'>
                              <Popover
                                open={openPopover === item.id}
                                onOpenChange={open => {
                                  setOpenPopover(open ? item.id : null);
                                  if (!open) setUserQuestion('');
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    className='p-1 hover:bg-gray-100'
                                    title='Ask AI about this requirement'
                                    disabled={isStreaming}
                                  >
                                    <SparkleIcon className='h-4 w-4 text-purple-500' />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className='w-80 p-3'
                                  align='end'
                                  side='top'
                                >
                                  <div className='flex items-center justify-center gap-2'>
                                    <Textarea
                                      value={userQuestion}
                                      onChange={e =>
                                        setUserQuestion(e.target.value)
                                      }
                                      placeholder='Ask about this requirement...'
                                      className='max-h-[60px] min-h-[60px] flex-1 resize-none rounded-lg border-0 bg-gray-50 p-2 text-xs focus:ring-0 focus:outline-none'
                                      rows={2}
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                          e.preventDefault();
                                          handleAskQuestion(item.id, item.type);
                                        }
                                      }}
                                    />
                                    <Button
                                      onClick={() =>
                                        handleAskQuestion(item.id, item.type)
                                      }
                                      className='h-8 w-8 min-w-0 flex-shrink-0 rounded-full border border-gray-200 bg-gray-50 p-2 hover:bg-gray-100'
                                      disabled={!userQuestion.trim()}
                                    >
                                      <Send className='h-3 w-3 text-purple-600' />
                                    </Button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='p-1 hover:bg-gray-100'
                                onClick={() =>
                                  handleCopy(
                                    `${item.id}: ${item.title}`,
                                    item.description
                                  )
                                }
                                title='Copy requirement text'
                              >
                                <Copy className='h-4 w-4 text-gray-500' />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className='flex max-h-[90vh] max-w-2xl flex-col overflow-hidden'>
          <DialogHeader className='flex-shrink-0 border-b p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                {getTypeIcon(selectedItem?.type || 'epic')}
                <DialogTitle className='text-xl font-bold'>
                  {selectedItem?.id}: {selectedItem?.title}
                </DialogTitle>
              </div>
              <DialogClose onClose={() => setShowDetailModal(false)} />
            </div>
          </DialogHeader>

          {/* Modal Content - Scrollable */}
          <div className='flex-1 overflow-y-auto'>
            <div className='p-6'>
              {selectedItem && (
                <div className='space-y-6'>
                  {/* Details Section */}
                  <div>
                    <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                      Details
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>
                        <MagicWandIcon className='mr-1.5 h-3.5 w-3.5' />
                        Type:{' '}
                        {selectedItem.type.charAt(0).toUpperCase() +
                          selectedItem.type.slice(1)}
                      </Badge>

                      <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>
                        <Paperclip className='mr-1.5 h-3.5 w-3.5' />
                        Attachments: 0
                      </Badge>

                      {selectedItem.priority && (
                        <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>
                          <MagicWandIcon className='mr-1.5 h-3.5 w-3.5' />
                          Priority:{' '}
                          {selectedItem.priority.charAt(0).toUpperCase() +
                            selectedItem.priority.slice(1)}
                        </Badge>
                      )}

                      <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>
                        <MagicWandIcon className='mr-1.5 h-3.5 w-3.5' />
                        Labels/Tags: {selectedItem.tags?.length || 0}
                      </Badge>

                      {selectedItem.estimation && (
                        <Badge className='bg-gray-100 text-gray-700 hover:bg-gray-100'>
                          <MagicWandIcon className='mr-1.5 h-3.5 w-3.5' />
                          Estimation: {selectedItem.estimation}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Tags Section */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                        Tags
                      </h3>
                      {renderTags(
                        selectedItem.tags,
                        `modal-${selectedItem.id}`
                      )}
                    </div>
                  )}

                  {/* Description Section */}
                  {selectedItem.description && (
                    <div>
                      <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                        Description
                      </h3>
                      <div className='text-sm leading-relaxed'>
                        <MarkdownRenderer content={selectedItem.description} />
                      </div>
                    </div>
                  )}

                  {/* Tasks Section - Only show for stories that have related tasks */}
                  {selectedItem.type === 'story' &&
                    selectedItem.relatedTasks &&
                    selectedItem.relatedTasks.length > 0 && (
                      <div>
                        <h3 className='mb-4 text-lg font-semibold text-gray-900'>
                          Tasks
                        </h3>
                        <div className='space-y-3'>
                          {selectedItem.relatedTasks.map(
                            (task: RequirementItem) => (
                              <div
                                key={task.id}
                                className='rounded-lg border border-gray-200 bg-gray-50 p-4'
                              >
                                <div className='flex items-center gap-3'>
                                  {getTypeIcon('task', true)}
                                  <div className='flex-1'>
                                    <span className='block text-sm font-medium text-blue-600'>
                                      {task.id}: {task.title}
                                    </span>
                                    {task.tags &&
                                      task.tags.length > 0 &&
                                      renderTags(task.tags, task.id)}
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
