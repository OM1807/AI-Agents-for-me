'use client';

import { FileText, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApiSpecCardProps } from '@/types/agent-api-suite';

export function ApiSpecCard({
  spec,
  isSelected,
  onToggle,
  onRemove,
}: ApiSpecCardProps) {
  const getSpecIcon = (type: 'file' | 'url') => {
    return type === 'url' ? (
      <Link2 className='h-5 w-5 text-blue-500' />
    ) : (
      <FileText className='h-5 w-5 text-purple-600' />
    );
  };

  return (
    <div
      className={`relative flex cursor-pointer items-start justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'bg-white'
      }`}
      onClick={onToggle}
    >
      <div className='flex flex-1 items-start space-x-3'>
        {/* Icon */}
        <div className='mt-0.5 flex-shrink-0'>{getSpecIcon(spec.type)}</div>

        {/* Spec Details */}
        <div className='min-w-0 flex-1'>
          {/* Title and Version Badges */}
          <div className='mb-1 flex items-center gap-2'>
            <h4 className='text-base font-medium text-gray-900'>{spec.name}</h4>
            {spec.version && (
              <Badge
                variant='outline'
                className='border-purple-200 bg-purple-50 text-xs text-purple-700'
              >
                {spec.version}
              </Badge>
            )}
            {spec.specType && (
              <Badge
                variant='outline'
                className='border-orange-200 bg-orange-50 text-xs text-orange-700'
              >
                {spec.specType}
              </Badge>
            )}
          </div>

          {/* Path */}
          {spec.path && (
            <div className='mb-1 text-sm text-gray-600'>{spec.path}</div>
          )}

          {/* Description */}
          {spec.description && (
            <div className='text-sm text-gray-500'>{spec.description}</div>
          )}
        </div>
      </div>

      {/* Selection indicator and Actions */}
      <div className='ml-4 flex items-center gap-2'>
        {isSelected && (
          <Badge variant='default' className='bg-blue-600 text-white'>
            Selected
          </Badge>
        )}
        <Button
          variant='outline'
          size='sm'
          onClick={e => {
            e.stopPropagation(); // Prevent triggering the card click
            onRemove();
          }}
          className='text-gray-600 hover:border-red-200 hover:text-red-600'
        >
          <Trash2 className='mr-1 h-4 w-4' />
          Remove
        </Button>
      </div>
    </div>
  );
}
