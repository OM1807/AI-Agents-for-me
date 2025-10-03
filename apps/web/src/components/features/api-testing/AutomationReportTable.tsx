'use client';

import React, { useState } from 'react';
import { Check, X, Send } from 'lucide-react';
import { SparkleIcon } from '@/components/icons';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { AutomationReportItem } from '@/lib/utils/api-testing-formatter';
import { AutomationReportTableProps } from '@/types/agent-api-suite';

export function AutomationReportTable({
  data,
  append,
}: AutomationReportTableProps) {
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Handle AI Agent interaction
  const handleSendMessage = (context?: string) => {
    if (inputValue.trim()) {
      const contextMessage = context
        ? `For automation report context - ${context}: ${inputValue.trim()}`
        : `For API Test Cases Automation Report: ${inputValue.trim()}`;

      append({
        role: 'user',
        content: contextMessage,
      });
      setInputValue('');
      setOpenPopover(null);
    }
  };

  // Get status badge with proper styling and icons
  const getStatusBadge = (item: AutomationReportItem) => {
    if (item.status === 'success') {
      return (
        <Badge
          variant='secondary'
          className='flex max-w-fit items-center gap-1 bg-green-100 text-green-800'
        >
          <Check className='h-3 w-3' />
          {item.successCount} Created Successfully
        </Badge>
      );
    } else if (item.status === 'failed') {
      return (
        <Badge
          variant='destructive'
          className='flex max-w-fit items-center gap-1'
        >
          <X className='h-3 w-3' />
          All Failed (API error)
        </Badge>
      );
    } else {
      return (
        <div className='flex gap-2'>
          <Badge
            variant='secondary'
            className='flex max-w-fit items-center gap-1 bg-green-100 text-green-800'
          >
            <Check className='h-3 w-3' />
            {item.successCount} Created Successfully
          </Badge>
          <Badge
            variant='destructive'
            className='flex max-w-fit items-center gap-1'
          >
            <X className='h-3 w-3' />
            {item.failedCount} Failed
          </Badge>
        </div>
      );
    }
  };

  return (
    <div className='rounded-2xl border border-gray-300 bg-white'>
      {/* Header with AI Integration */}
      <div className='flex items-center justify-between border-b border-gray-300 p-4'>
        <h2 className='text-xl font-semibold'>
          API Test Cases Automation Report
        </h2>

        <Popover
          open={openPopover === 'report'}
          onOpenChange={open => {
            setOpenPopover(open ? 'report' : null);
            if (!open) setInputValue('');
          }}
        >
          <PopoverTrigger asChild>
            <button
              className='group rounded-lg p-1.5 transition-colors hover:bg-gray-100'
              aria-label='AI Agent for automation report'
              title='Ask AI about this automation report'
            >
              <SparkleIcon
                className={`h-4 w-4 transition-colors ${
                  openPopover === 'report'
                    ? 'fill-blue-600 text-blue-600'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent side='left' align='start' className='w-80 p-2'>
            <div className='relative flex items-end'>
              <Textarea
                placeholder='Ask anything about this automation report or request analysis'
                className='min-h-[50px] resize-none overflow-y-auto bg-gray-50 pr-12 focus:bg-white'
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                  if (e.key === 'Escape') {
                    setOpenPopover(null);
                    setInputValue('');
                  }
                }}
              />
              <button
                type='button'
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className='absolute right-1 bottom-1 p-1.5 text-blue-600 transition-colors hover:text-blue-700 disabled:text-gray-300'
                title='Send message'
              >
                <div className='flex items-center justify-center rounded-full bg-gray-100 p-1.5'>
                  <Send className='h-3 w-3' />
                </div>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Table matching reference image */}
      <div className='rounded-2xl bg-white p-4'>
        <Table>
          <TableHeader>
            <TableRow className='border-b border-gray-300 bg-gray-50'>
              <TableHead className='font-semibold'>Project</TableHead>
              <TableHead className='font-semibold'>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
              >
                <TableCell className='font-medium'>{item.project}</TableCell>
                <TableCell>{getStatusBadge(item)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
