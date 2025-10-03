'use client';

import { useState } from 'react';
import { Trash2, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TestCasesCardProps } from '@/types/agent-api-suite';
import { formatFileSize } from '@/lib/utils';

export function TestCasesCard({
  testCase,
  isSelected,
  onToggle,
  onRemove,
}: TestCasesCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
    }
  };

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE';
  };

  const getFileTypeColor = (extension: string): string => {
    switch (extension.toLowerCase()) {
      case 'csv':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'xlsx':
      case 'xls':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'docx':
      case 'doc':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'json':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'txt':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const extension = getFileExtension(testCase.name);

  return (
    <div
      className={`group relative rounded-lg border transition-all ${
        isSelected
          ? 'border-purple-200 bg-purple-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className='flex items-center gap-4 p-4'>
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggle}
          className='h-4 w-4'
        />

        {/* File Icon */}
        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50'>
          <FileText className='h-5 w-5 text-gray-600' />
        </div>

        {/* File Info */}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h4 className='truncate font-medium text-gray-900'>
              {testCase.name}
            </h4>
            <Badge
              variant='outline'
              className={`text-xs font-medium ${getFileTypeColor(extension)}`}
            >
              {extension}
            </Badge>
          </div>
          <div className='mt-1 flex items-center gap-2'>
            <p className='text-sm text-gray-500'>
              {testCase.type === 'file' ? 'Uploaded File' : 'URL Source'}
            </p>
            {testCase.size && (
              <>
                <span className='text-gray-300'>•</span>
                <p className='text-sm text-gray-500'>
                  {formatFileSize(testCase.size)}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className='flex h-6 w-6 items-center justify-center rounded-full bg-purple-600'>
            <Check className='h-3 w-3 text-white' />
          </div>
        )}

        {/* Remove Button */}
        <Button
          variant='ghost'
          size='sm'
          onClick={handleRemove}
          disabled={isRemoving}
          className='opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600'
        >
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
